[English](README.md) | [한국어](README.ko.md) | 中文 | [日本語](README.ja.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md) | [Português](README.pt.md)

# slack-monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://docs.anthropic.com/en/docs/claude-code)
[![Slack MCP](https://img.shields.io/badge/Slack-MCP_Server-4A154B?logo=slack&logoColor=white)](https://modelcontextprotocol.io/integrations/slack)

**Claude Code 的 Slack 提及监控。再也不会错过 @提及。**

_不要手动检查 Slack。让 Claude 替你监控。_

[快速开始](#快速开始) • [命令](#命令) • [工作原理](#工作原理) • [配置](#配置)

---

## 快速开始

**第一步：安装**

```bash
# 方式 A：插件市场（推荐）
/plugin marketplace add https://github.com/kungbi/slack-monitoring.git
/plugin install slack-monitoring

# 方式 B：手动安装
git clone https://github.com/kungbi/slack-monitoring.git
cd slack-monitoring && chmod +x install.sh && ./install.sh
```

**第二步：设置**

```
/slack-monitoring:setup
```

**第三步：开始监控**

```
/slack-monitoring:start
```

就这样。Claude 每 15 分钟检查一次你的提及并发送摘要。

---

## 为什么选择 slack-monitoring？

- **零开销** — 设置后即可忘记。在你编码时后台运行
- **线程感知** — 以线程为单位追踪，而非单条消息
- **自动完成** — 已经回复了？自动标记为完成
- **上下文摘要** — 完整的线程上下文 + 建议回复，不只是"有人提到了你"
- **智能通知** — 仅提醒新提及。无重复噪音
- **频道过滤** — 忽略嘈杂频道，优先关键频道，设置 VIP 发送者
- **周报** — 响应率、平均响应时间、热门频道和发送者
- **可定制** — 语言、语气、间隔、摘要风格——全部可配置

---

## 命令

| 命令 | 功能 |
|------|------|
| `/slack-monitoring:start` | 开始监控（默认 15 分钟间隔） |
| `/slack-monitoring:start 5m` | 自定义间隔启动 |
| `/slack-monitoring:list` | 显示待处理（未回复）提及 |
| `/slack-monitoring:show 1` | 查看提及 #1 详情（摘要、建议回复） |
| `/slack-monitoring:complete 2` | 将提及 #2 标记为完成 |
| `/slack-monitoring:complete all` | 批量标记所有待处理为完成 |
| `/slack-monitoring:digest` | 周报（最近 7 天统计） |
| `/slack-monitoring:setup` | 配置向导 |
| `/slack-monitoring:help` | 显示帮助 |
| `/slack-monitoring:status` | 显示配置和今日提及统计 |

---

## 工作原理

```
每个检查周期：

  ┌─────────────────────────────────────────────────┐
  │  1. 搜索今天的 Slack @提及                        │
  │  2. 应用频道过滤规则（忽略/优先）                    │
  │  3. 对每个新提及：                                 │
  │     → 读取完整线程                                │
  │     → 已回复？→ auto_completed                    │
  │     → 未回复？→ pending + 发送提醒                 │
  │     → VIP/优先频道？→ 标记为 🔴                    │
  │  4. 重新检查现有 pending 线程                      │
  │     → 发现回复？→ auto_completed                  │
  │  5. 保存每日记录                                  │
  └─────────────────────────────────────────────────┘
```

### 状态类型

| 状态 | 说明 |
|------|------|
| `pending` | 未回复 — 需要你的关注 |
| `auto_completed` | 你已在线程中回复 — 自动完成 |
| `completed` | 通过 `complete` 命令手动完成 |

---

## 周报

运行 `/slack-monitoring:digest` 查看 7 天摘要：

```
📊 Weekly Digest (03/18 ~ 03/24)

📈 概览
- 总提及：28 条
- 已响应：25 条（89%）
- 自动完成：18 条 / 手动完成：7 条
- 待处理：3 条

⏱️ 响应时间
- 平均：1小时23分
- 最快：5分钟（#incidents）
- 最慢：6小时（#general）

📢 热门频道
| 频道 | 提及数 | 响应率 |
|------|--------|--------|
| #dev | 12 | 92% |
| #general | 8 | 100% |
```

---

## 配置

运行 `/slack-monitoring:setup` 进行配置：

| 设置项 | 选项 | 默认值 |
|--------|------|--------|
| **Slack 连接** | 自动检测 | — |
| **语言** | 韩语、英语 | 韩语 |
| **语气** | 正式、随意、从消息中学习 | 正式 |
| **间隔** | 1m, 5m, 10m, 15m, 30m, 1h, 自定义 | 15m |
| **摘要风格** | 简略、详细、完整上下文 | 详细 |
| **忽略频道** | 跳过的频道 | 无 |
| **优先频道** | 优先显示的频道 | 无 |
| **VIP 发送者** | 始终高优先级的人 | 无 |

---

## 要求

| 要求 | 说明 |
|------|------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | CLI 工具（需要活跃会话） |
| Slack 用户令牌 | 带有必要权限范围的 `xoxp-` 令牌（设置向导将引导您） |

### 所需 Slack 令牌权限范围

| 权限范围 | 用途 |
|---------|------|
| `search:read` | 搜索 @提及 |
| `channels:history` | 读取公开频道线程 |
| `groups:history` | 读取私有频道线程 |
| `im:history` | 读取私信线程 |
| `usergroups:read` | 自动检测您的 Slack 群组 |
| `users:read` | 识别您的用户资料 |

> **如何获取令牌：** 在 [api.slack.com/apps](https://api.slack.com/apps) 创建 Slack 应用，在 **OAuth & Permissions → User Token Scopes** 下添加上述权限范围，安装到您的工作区，然后复制 **User OAuth Token**（以 `xoxp-` 开头）。运行 `/slack-monitoring:setup` 并在提示时粘贴。

> **注意：** 监控仅在 Claude Code 会话活跃时运行。会话结束时，监控停止。

---

## License

MIT — 详见 [LICENSE](LICENSE)。

---

<div align="center">

**停止上下文切换。专注编码。**

</div>
