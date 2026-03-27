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

function getDateFile(dateStr) {
  return path.join(DATA_DIR, `${dateStr}.json`);
}

function loadDateData(dateStr) {
  const file = getDateFile(dateStr);
  if (!fs.existsSync(file)) {
    return { date: dateStr, threads: [] };
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveDateData(dateStr, data) {
  fs.writeFileSync(getDateFile(dateStr), JSON.stringify(data, null, 2));
}

// --- Slack API ---

async function slackApi(token, endpoint, params = {}, retries = 1) {
  const url = new URL(`https://slack.com/api/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  let res;
  try {
    res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    if (retries > 0) {
      console.error(`⚠️ Network error (${endpoint}): ${e.message}. Retrying...`);
      await new Promise(r => setTimeout(r, 3000));
      return slackApi(token, endpoint, params, retries - 1);
    }
    console.error(`⚠️ Network error (${endpoint}): ${e.message}. Skipping.`);
    return { ok: false, error: e.message };
  }
  const data = await res.json();
  if (!data.ok && data.error === 'ratelimited' && retries > 0) {
    const wait = parseInt(res.headers.get('Retry-After') || '30', 10);
    console.error(`⏳ Rate limited. Retrying in ${wait}s...`);
    await new Promise(r => setTimeout(r, wait * 1000));
    return slackApi(token, endpoint, params, retries - 1);
  }
  if (!data.ok) {
    console.error(`⚠️ Slack API error (${endpoint}): ${data.error}`);
  }
  return data;
}

async function searchMentions(token, userId, groupMentions = []) {
  const queries = [
    `<@${userId}> on:today`,
    ...groupMentions.map(g => `${g} on:today`),
  ];
  const seen = new Set();
  const results = [];

  for (const query of queries) {
    let page = 1;
    const maxPages = 5;
    while (page <= maxPages) {
      const data = await slackApi(token, 'search.messages', {
        query,
        sort: 'timestamp',
        sort_dir: 'desc',
        count: 100,
        page: String(page),
      });
      if (data.ok && data.messages?.matches) {
        for (const m of data.messages.matches) {
          if (!seen.has(m.ts)) {
            seen.add(m.ts);
            results.push(m);
          }
        }
        const paging = data.messages.paging || data.messages.pagination;
        if (!paging || page >= (paging.pages || paging.page_count || 1)) break;
        page++;
      } else {
        break;
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

// --- Thread text extraction (for session-based summarization) ---

function extractThreadText(messages) {
  return messages
    .map(m => `[${m.username || m.user || 'bot'}]: ${m.text}`)
    .join('\n');
}

// --- Terminal output ---

function printSummary(newPending, autoCompleted, config) {
  const ko = config.language === 'ko';

  const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  if (newPending.length === 0 && autoCompleted.length === 0) {
    process.stdout.write(ko ? `[${time}] 새 멘션 없음 ` : `[${time}] No new mentions `);
    return;
  }
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
      const snippet = (m.thread_text || '').split('\n')[0].slice(0, 60);
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
  const dateStr = new Date().toISOString().split('T')[0];
  const today = loadDateData(dateStr);
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
    const isSlackbot = mention.user === 'USLACKBOT';
    const alreadyReplied = hasMyReply(messages, config.user_id);
    const status = (alreadyReplied || isSlackbot) ? 'auto_completed' : 'pending';

    const threadText = extractThreadText(messages);

    const thread = {
      id: today.threads.length + 1,
      channel_id: channelId,
      channel_name: channelName,
      thread_ts: threadTs,
      message_ts: mention.ts,
      from: mention.username || mention.user,
      from_id: mention.user,
      thread_text: threadText,
      permalink: mention.permalink,
      status,
      first_seen: new Date().toISOString(),
      completed_at: alreadyReplied ? new Date().toISOString() : null,
    };

    today.threads.push(thread);
    if (status === 'pending') newPending.push(thread);
    else autoCompleted.push(thread);
  }

  saveDateData(dateStr, today);
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

  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Only save PID for daemon mode (not --once)
  if (!isOnce) {
    if (fs.existsSync(PID_FILE)) {
      const existingPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
      try {
        process.kill(existingPid, 0);
        console.error(ko
          ? `⚠️ 모니터링이 이미 실행 중입니다 (PID ${existingPid}). 중지하려면 /slack-monitoring:stop`
          : `⚠️ Monitor already running (PID ${existingPid}). To stop: /slack-monitoring:stop`);
        process.exit(1);
      } catch (e) {
        if (e.code === 'ESRCH') {
          fs.unlinkSync(PID_FILE);
        } else {
          throw e;
        }
      }
    }
    fs.writeFileSync(PID_FILE, String(process.pid));
  }

  const cleanup = () => {
    if (!isOnce && fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    if (!isOnce && fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  });

  const intervalLabel = intervalArg || config.default_interval || '15m';
  console.log(ko
    ? `📡 Slack 모니터링 시작 (간격: ${intervalLabel})\n중지하려면 /slack-monitoring:stop 을 입력하세요.`
    : `📡 Slack monitoring started (interval: ${intervalLabel})\nTo stop, type: /slack-monitoring:stop`);

  // First run immediately
  try {
    await check(config);
  } catch (e) {
    console.error('Check error:', e.message);
  }

  if (isOnce) return;

  let consecutiveFailures = 0;
  const MAX_FAILURES = 5;

  async function loop() {
    try {
      await check(loadConfig()); // reload config each cycle
      consecutiveFailures = 0;
    } catch (e) {
      consecutiveFailures++;
      console.error('Check error:', e.message);
      if (consecutiveFailures >= MAX_FAILURES) {
        console.error(ko
          ? `⚠️ ${MAX_FAILURES}회 연속 실패. 프로세스를 종료합니다.`
          : `⚠️ ${MAX_FAILURES} consecutive failures. Exiting.`);
        process.exit(1);
      }
    }
    setTimeout(loop, intervalMs);
  }
  setTimeout(loop, intervalMs);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
