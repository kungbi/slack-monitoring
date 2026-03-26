#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.claude', 'slack-monitoring');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const PID_FILE = path.join(DATA_DIR, 'monitor.pid');

// --- Helpers ---

function parseInterval(str) {
  if (!str) return 15 * 60 * 1000;
  const match = str.match(/^(\d+)(s|m|h)?$/);
  if (!match) return 15 * 60 * 1000;
  const val = parseInt(match[1]);
  const unit = match[2] || 'm';
  if (unit === 's') return val * 1000;
  if (unit === 'h') return val * 60 * 60 * 1000;
  return val * 60 * 1000;
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('Config not found. Run /slack-monitoring:setup first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function getTodayFile() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(DATA_DIR, `${today}.json`);
}

function loadTodayData() {
  const file = getTodayFile();
  if (!fs.existsSync(file)) {
    return { date: new Date().toISOString().split('T')[0], threads: [] };
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveTodayData(data) {
  fs.writeFileSync(getTodayFile(), JSON.stringify(data, null, 2));
}

// --- Slack API ---

async function slackApi(token, endpoint, params = {}) {
  const url = new URL(`https://slack.com/api/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function searchMentions(token, userId, groupMentions = []) {
  const queries = [
    `<@${userId}> on:today`,
    ...groupMentions.map(g => `${g} on:today`),
  ];
  const seen = new Set();
  const results = [];

  for (const query of queries) {
    const data = await slackApi(token, 'search.messages', {
      query,
      sort: 'timestamp',
      sort_dir: 'desc',
      count: 100,
    });
    if (data.ok && data.messages?.matches) {
      for (const m of data.messages.matches) {
        if (!seen.has(m.ts)) {
          seen.add(m.ts);
          results.push(m);
        }
      }
    }
  }
  return results;
}

async function getThread(token, channelId, threadTs) {
  const data = await slackApi(token, 'conversations.replies', {
    channel: channelId,
    ts: threadTs,
  });
  return data.ok ? (data.messages || []) : [];
}

function hasMyReply(messages, userId) {
  return messages.slice(1).some(m => m.user === userId && !m.bot_id);
}

// --- Claude (Haiku) for summaries ---

async function generateSummary(messages, config) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { summary: '(API key not found)', suggested_reply: '' };
  }

  const lang = config.language === 'ko' ? 'Korean' : 'English';
  const tone = config.tone || 'formal';
  const style = config.summary_style || 'detailed';

  const threadText = messages
    .map(m => `[${m.username || m.user || 'bot'}]: ${m.text}`)
    .join('\n');

  const prompt = `Analyze this Slack thread where I was mentioned.
Language: ${lang}, Summary style: ${style}, Reply tone: ${tone}

Thread:
${threadText}

Respond ONLY with JSON:
{"summary":"...","suggested_reply":"..."}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  try {
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (_) {}
  return { summary: data.content?.[0]?.text || '(parse error)', suggested_reply: '' };
}

// --- Terminal output ---

function printSummary(newPending, autoCompleted, config) {
  const ko = config.language === 'ko';

  if (newPending.length === 0 && autoCompleted.length === 0) {
    process.stdout.write('.');
    return;
  }

  const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  console.log('');
  console.log(ko ? `🔔 새 Slack 멘션 (${time} 기준)\n` : `🔔 New Slack Mentions (as of ${time})\n`);

  const byChannel = {};
  for (const m of newPending) {
    const ch = m.channel_name || m.channel_id;
    (byChannel[ch] = byChannel[ch] || []).push(m);
  }
  for (const [ch, items] of Object.entries(byChannel)) {
    console.log(`#${ch}`);
    for (const m of items) {
      const snippet = (m.summary || '').split('\n')[0].slice(0, 60);
      console.log(`- [#${m.id}] @${m.from}: ${snippet}... (${m.permalink})`);
    }
    console.log('');
  }

  if (autoCompleted.length > 0) {
    console.log(ko
      ? `✅ 자동완료 (${autoCompleted.length}건) - 이미 답장됨`
      : `✅ Auto-completed (${autoCompleted.length}) - already replied`);
  }
  if (newPending.length > 0) {
    console.log(ko
      ? `⏳ 미답변 (${newPending.length}건) - /slack-monitoring:list 로 확인`
      : `⏳ Pending (${newPending.length}) - check with /slack-monitoring:list`);
  }
}

// --- Main check ---

async function check(config) {
  const today = loadTodayData();
  const existingTs = new Set(today.threads.map(t => t.message_ts));

  const mentions = await searchMentions(config.slack_token, config.user_id, config.group_mentions);
  const filtered = mentions.filter(m => m.user !== config.user_id && !m.bot_id);

  const newPending = [];
  const autoCompleted = [];

  for (const mention of filtered) {
    const threadTs = mention.previous?.thread_ts || mention.ts;
    const channelId = mention.channel?.id || mention.channel;
    const channelName = mention.channel?.name || mention.channel;

    if (existingTs.has(mention.ts)) {
      // Auto-complete check for existing pending
      const existing = today.threads.find(t => t.message_ts === mention.ts);
      if (existing?.status === 'pending') {
        const messages = await getThread(config.slack_token, channelId, threadTs);
        if (hasMyReply(messages, config.user_id)) {
          existing.status = 'auto_completed';
          existing.completed_at = new Date().toISOString();
          autoCompleted.push(existing);
        }
      }
      continue;
    }

    // New mention
    const messages = await getThread(config.slack_token, channelId, threadTs);
    const alreadyReplied = hasMyReply(messages, config.user_id);
    const status = alreadyReplied ? 'auto_completed' : 'pending';

    let summary = '';
    let suggested_reply = '';
    if (!alreadyReplied) {
      const result = await generateSummary(messages, config);
      summary = result.summary;
      suggested_reply = result.suggested_reply;
    }

    const thread = {
      id: today.threads.length + 1,
      channel_id: channelId,
      channel_name: channelName,
      thread_ts: threadTs,
      message_ts: mention.ts,
      from: mention.username || mention.user,
      from_id: mention.user,
      summary,
      suggested_reply,
      permalink: mention.permalink,
      status,
      first_seen: new Date().toISOString(),
      completed_at: alreadyReplied ? new Date().toISOString() : null,
    };

    today.threads.push(thread);
    if (status === 'pending') newPending.push(thread);
    else autoCompleted.push(thread);
  }

  saveTodayData(today);
  printSummary(newPending, autoCompleted, config);
}

// --- Entry point ---

async function main() {
  const args = process.argv.slice(2);
  const isOnce = args.includes('--once');
  const intervalArg = args.find(a => !a.startsWith('-'));

  const config = loadConfig();
  const intervalMs = parseInterval(intervalArg || config.default_interval);
  const ko = config.language === 'ko';

  // Save PID for stop command
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PID_FILE, String(process.pid));

  const cleanup = () => {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  });

  const intervalLabel = intervalArg || config.default_interval || '15m';
  console.log(ko
    ? `📡 Slack 모니터링 시작 (간격: ${intervalLabel})\n중지: /slack-monitoring:stop`
    : `📡 Slack monitoring started (interval: ${intervalLabel})\nTo stop: /slack-monitoring:stop`);

  // First run immediately
  try {
    await check(config);
  } catch (e) {
    console.error('Check error:', e.message);
  }

  if (isOnce) return;

  setInterval(async () => {
    try {
      await check(loadConfig()); // reload config each cycle
    } catch (e) {
      console.error('Check error:', e.message);
    }
  }, intervalMs);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
