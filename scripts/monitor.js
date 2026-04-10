#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// --- Constants ---

const DATA_DIR = path.join(os.homedir(), '.claude', 'slack-monitoring');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const DEFAULTS = {
  API_TIMEOUT_MS: 30000,
  RETRY_DELAY_MS: 3000,
  RATE_LIMIT_WAIT_S: 30,
  PAGE_SIZE: 100,
  MAX_PAGES: 5,
};

const MESSAGES = {
  noNewMentions: { ko: '새 멘션 없음', en: 'No new mentions' },
  newMentions: { ko: '새 Slack 멘션', en: 'New Slack Mentions' },
  autoCompleted: { ko: '자동완료', en: 'Auto-completed' },
  alreadyReplied: { ko: '이미 답장됨', en: 'already replied' },
  pending: { ko: '미답변', en: 'Pending' },
  checkWith: { ko: '/slack-monitoring:list 로 확인', en: 'check with /slack-monitoring:list' },
};

// --- Helpers ---

function t(key, ko) {
  return MESSAGES[key][ko ? 'ko' : 'en'];
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
      signal: AbortSignal.timeout(DEFAULTS.API_TIMEOUT_MS),
    });
  } catch (e) {
    if (retries > 0) {
      console.error(`⚠️ Network error (${endpoint}): ${e.message}. Retrying...`);
      await new Promise(r => setTimeout(r, DEFAULTS.RETRY_DELAY_MS));
      return slackApi(token, endpoint, params, retries - 1);
    }
    console.error(`⚠️ Network error (${endpoint}): ${e.message}. Skipping.`);
    return { ok: false, error: e.message };
  }
  const data = await res.json();
  if (!data.ok && data.error === 'ratelimited' && retries > 0) {
    const wait = parseInt(res.headers.get('Retry-After') || String(DEFAULTS.RATE_LIMIT_WAIT_S), 10);
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
    while (page <= DEFAULTS.MAX_PAGES) {
      const data = await slackApi(token, 'search.messages', {
        query,
        sort: 'timestamp',
        sort_dir: 'desc',
        count: DEFAULTS.PAGE_SIZE,
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

function getRootTs(threadTs, permalink) {
  try {
    const ts = new URL(permalink).searchParams.get('thread_ts');
    if (ts) return ts;
  } catch {}
  return threadTs;
}

async function getThread(token, channelId, threadTs, permalink) {
  const rootTs = getRootTs(threadTs, permalink || '');
  const data = await slackApi(token, 'conversations.replies', {
    channel: channelId,
    ts: rootTs,
  });
  return data.ok ? (data.messages || []) : [];
}

function hasMyReply(messages, userId) {
  return messages.slice(1).some(m => m.user === userId && !m.bot_id);
}

function extractThreadText(messages) {
  return messages
    .map(m => `[${m.username || m.user || 'bot'}]: ${m.text}`)
    .join('\n');
}

async function getUserRealName(token, userId) {
  if (!userId || userId === 'USLACKBOT') return null;
  const data = await slackApi(token, 'users.info', { user: userId }, 0);
  if (!data.ok) return null;
  return data.user?.profile?.real_name || data.user?.real_name || null;
}

// --- Thread processing ---

async function updateExistingThread(config, existing, channelId, threadTs) {
  const messages = await getThread(config.slack_token, channelId, threadTs, existing.permalink);
  if (hasMyReply(messages, config.user_id)) {
    existing.status = 'auto_completed';
    existing.completed_at = new Date().toISOString();
    existing.completion_reason = 'user_replied';
    return true;
  }
  return false;
}

async function buildThread(mention, messages, config, nextId) {
  const threadTs = mention.previous?.thread_ts || mention.ts;
  const channelId = mention.channel?.id || mention.channel;
  const channelName = mention.channel?.name || mention.channel;
  const isSlackbot = mention.user === 'USLACKBOT';
  const alreadyReplied = hasMyReply(messages, config.user_id);
  const status = (alreadyReplied || isSlackbot) ? 'auto_completed' : 'pending';
  const completionReason = alreadyReplied ? 'user_replied' : isSlackbot ? 'no_action_needed' : null;
  const fromName = await getUserRealName(config.slack_token, mention.user);

  return {
    id: nextId,
    channel_id: channelId,
    channel_name: channelName,
    thread_ts: threadTs,
    message_ts: mention.ts,
    from: mention.username || mention.user,
    from_name: fromName,
    from_id: mention.user,
    thread_text: extractThreadText(messages),
    permalink: mention.permalink,
    status,
    first_seen: new Date().toISOString(),
    completed_at: alreadyReplied ? new Date().toISOString() : null,
    completion_reason: completionReason,
  };
}

async function check(config) {
  const dateStr = new Date().toISOString().split('T')[0];
  const today = loadDateData(dateStr);
  const existingThreadKey = new Set(today.threads.map(t => `${t.channel_id}:${t.thread_ts}`));

  const mentions = await searchMentions(config.slack_token, config.user_id, config.group_mentions);
  const filtered = mentions.filter(m => m.user !== config.user_id && !m.bot_id);

  const newPending = [];
  const autoCompleted = [];

  for (const mention of filtered) {
    const threadTs = mention.previous?.thread_ts || mention.ts;
    const channelId = mention.channel?.id || mention.channel;
    const threadKey = `${channelId}:${threadTs}`;

    if (existingThreadKey.has(threadKey)) {
      const existing = today.threads.find(t => t.channel_id === channelId && t.thread_ts === threadTs);
      if (existing?.status === 'pending') {
        const messages = await getThread(config.slack_token, channelId, threadTs, existing.permalink);
        existing.thread_text = extractThreadText(messages);
        const completed = await updateExistingThread(config, existing, channelId, threadTs);
        if (completed) autoCompleted.push(existing);
      }
      continue;
    }

    const messages = await getThread(config.slack_token, channelId, threadTs, mention.permalink);
    const thread = await buildThread(mention, messages, config, today.threads.length + 1);

    today.threads.push(thread);
    existingThreadKey.add(threadKey);
    if (thread.status === 'pending') newPending.push(thread);
    else autoCompleted.push(thread);
  }

  saveDateData(dateStr, today);
  printSummary(newPending, autoCompleted, config);
}

// --- Terminal output ---

function printSummary(newPending, autoCompleted, config) {
  const ko = config.language === 'ko';
  const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  if (newPending.length === 0 && autoCompleted.length === 0) {
    process.stdout.write(`[${time}] ${t('noNewMentions', ko)} `);
    return;
  }

  console.log('');
  console.log(`🔔 ${t('newMentions', ko)} (${ko ? `${time} 기준` : `as of ${time}`})\n`);

  const byChannel = {};
  for (const m of newPending) {
    const ch = m.channel_name || m.channel_id;
    (byChannel[ch] = byChannel[ch] || []).push(m);
  }
  for (const [ch, items] of Object.entries(byChannel)) {
    console.log(`#${ch}`);
    for (const m of items) {
      const snippet = (m.thread_text || '').split('\n')[0].slice(0, 60);
      const displayName = m.from_name ? `${m.from} (${m.from_name})` : m.from;
      console.log(`- [#${m.id}] @${displayName}: ${snippet}... (${m.permalink})`);
    }
    console.log('');
  }

  if (autoCompleted.length > 0) {
    console.log(`✅ ${t('autoCompleted', ko)} (${autoCompleted.length}${ko ? '건' : ''}) - ${t('alreadyReplied', ko)}`);
  }
  if (newPending.length > 0) {
    console.log(`⏳ ${t('pending', ko)} (${newPending.length}${ko ? '건' : ''}) - ${t('checkWith', ko)}`);
  }
}

// --- Entry ---

function parseInterval(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)(m|h|s)?$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || 'm').toLowerCase();
  if (unit === 'h') return num * 3600000;
  if (unit === 's') return num * 1000;
  return num * 60000;
}

async function main() {
  const config = loadConfig();
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const intervalArg = process.argv[2];
  const intervalMs = parseInterval(intervalArg) || parseInterval(config.default_interval) || 15 * 60000;

  // Save PID for daemon management
  const pidFile = path.join(DATA_DIR, 'monitor.pid');
  fs.writeFileSync(pidFile, String(process.pid));

  const cleanup = () => {
    try { fs.unlinkSync(pidFile); } catch {}
    process.exit(0);
  };
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  // Run immediately, then loop
  await check(config);
  setInterval(() => check(config).catch(e => console.error('Check error:', e.message)), intervalMs);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
