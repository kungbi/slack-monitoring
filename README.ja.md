[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md) | 日本語 | [Español](README.es.md) | [Tiếng Việt](README.vi.md) | [Português](README.pt.md)

# slack-monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://docs.anthropic.com/en/docs/claude-code)
[![Slack MCP](https://img.shields.io/badge/Slack-MCP_Server-4A154B?logo=slack&logoColor=white)](https://modelcontextprotocol.io/integrations/slack)

**Claude Code 用 Slack メンション監視。@メンションを二度と見逃しません。**

_Slack を手動で確認するのはやめましょう。Claude に任せてください。_

[クイックスタート](#クイックスタート) • [コマンド](#コマンド) • [仕組み](#仕組み) • [設定](#設定)

---

## クイックスタート

**ステップ 1：インストール**

```bash
# 方法 A：プラグインマーケットプレイス（推奨）
/plugin marketplace add https://github.com/kungbi/slack-monitoring.git
/plugin install slack-monitoring

# 方法 B：手動インストール
git clone https://github.com/kungbi/slack-monitoring.git
cd slack-monitoring && chmod +x install.sh && ./install.sh
```

**ステップ 2：セットアップ**

```
/slack-monitoring:setup
```

**ステップ 3：監視開始**

```
/slack-monitoring:start
```

以上です。Claude が 15 分ごとにメンションを確認し、サマリーを送信します。

---

## なぜ slack-monitoring？

- **ゼロオーバーヘッド** — 設定したら忘れるだけ。コーディング中にバックグラウンドで動作
- **スレッド対応** — メッセージ単位ではなくスレッド単位で追跡
- **自動完了** — 既に返信済み？自動的に完了マーク
- **コンテキスト要約** — 「誰かがメンションしました」ではなく、スレッド全体のコンテキスト + 返信提案
- **スマート通知** — 新しいメンションのみ通知。重複なし
- **チャンネルフィルタリング** — ノイズの多いチャンネルを無視、重要チャンネルを優先、VIP 送信者を設定
- **週次ダイジェスト** — 応答率、平均応答時間、トップチャンネル＆送信者
- **カスタマイズ可能** — 言語、トーン、間隔、要約スタイル——すべて設定可能

---

## コマンド

| コマンド | 機能 |
|----------|------|
| `/slack-monitoring:start` | 監視開始（デフォルト 15 分間隔） |
| `/slack-monitoring:start 5m` | カスタム間隔で開始 |
| `/slack-monitoring:list` | 未返信メンション一覧 |
| `/slack-monitoring:show 1` | メンション #1 の詳細表示（要約、返信提案） |
| `/slack-monitoring:complete 2` | メンション #2 を完了 |
| `/slack-monitoring:complete all` | 全未返信を一括完了 |
| `/slack-monitoring:digest` | 週次ダイジェスト（過去 7 日間） |
| `/slack-monitoring:setup` | 設定ウィザード |
| `/slack-monitoring:help` | ヘルプ表示 |
| `/slack-monitoring:status` | 設定と本日のメンション状況を表示 |
| `/slack-monitoring:stop` | モニタリングを停止 |

---

## 仕組み

```
各チェックサイクル：

  ┌─────────────────────────────────────────────────┐
  │  1. 今日の Slack @メンションを検索                  │
  │  2. チャンネルフィルター適用（無視/優先）             │
  │  3. 新しいメンションごとに：                        │
  │     → スレッド全体を読み取り                        │
  │     → 既に返信？→ auto_completed                   │
  │     → 未返信？→ pending + アラート                  │
  │     → VIP/優先チャンネル？→ 🔴 タグ付け              │
  │  4. 既存 pending スレッドを再確認                    │
  │     → 返信発見？→ auto_completed                   │
  │  5. 日次記録を保存                                 │
  └─────────────────────────────────────────────────┘
```

### ステータス

| ステータス | 説明 |
|-----------|------|
| `pending` | 未返信 — 対応が必要 |
| `auto_completed` | スレッドで返信済み — 自動完了 |
| `completed` | `complete` コマンドで手動完了 |

---

## 週次ダイジェスト

`/slack-monitoring:digest` で 7 日間のサマリー：

```
📊 Weekly Digest (03/18 ~ 03/24)

📈 概要
- 総メンション：28 件
- 応答完了：25 件（89%）
- 自動完了：18 件 / 手動完了：7 件
- 未応答：3 件

⏱️ 応答時間
- 平均：1 時間 23 分
- 最速：5 分（#incidents）
- 最遅：6 時間（#general）

📢 トップチャンネル
| チャンネル | メンション数 | 応答率 |
|-----------|------------|--------|
| #dev | 12 | 92% |
| #general | 8 | 100% |
```

---

## 設定

`/slack-monitoring:setup` で設定：

| 設定項目 | オプション | デフォルト |
|---------|----------|----------|
| **Slack 接続** | 自動検出 | — |
| **言語** | 韓国語、英語 | 韓国語 |
| **トーン** | フォーマル、カジュアル、メッセージから学習 | フォーマル |
| **間隔** | 1m, 5m, 10m, 15m, 30m, 1h, カスタム | 15m |
| **要約スタイル** | 簡潔、詳細、フルコンテキスト | 詳細 |
| **無視チャンネル** | スキップするチャンネル | なし |
| **優先チャンネル** | 上位表示するチャンネル | なし |
| **VIP 送信者** | 常に高優先度の人 | なし |

---

## 要件

| 要件 | 説明 |
|------|------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | CLI ツール（アクティブセッション必要） |
| Slack ユーザートークン | `xoxp-` トークン（必要なスコープ含む、設定ウィザードが案内） |

### 必要な Slack トークンスコープ

| スコープ | 目的 |
|---------|------|
| `search:read` | 今日の@メンション検索 |
| `channels:history` | パブリックチャンネルのスレッド読み取り |
| `groups:history` | プライベートチャンネルのスレッド読み取り |
| `im:history` | DMスレッド読み取り |
| `usergroups:read` | 所属グループの自動検出 |
| `users:read` | ユーザープロフィール確認 |

> **トークンの取得方法：** [api.slack.com/apps](https://api.slack.com/apps) で Slack アプリを作成し、**OAuth & Permissions → User Token Scopes** に上記のスコープを追加してワークスペースにインストールしてください。**User OAuth Token**（`xoxp-` で始まる）をコピーして、`/slack-monitoring:setup` 実行時に貼り付けてください。

> **注意：** Claude Code セッションがアクティブな間のみ監視が動作します。セッション終了時に監視も停止します。

---

## License

MIT — [LICENSE](LICENSE) を参照。

---

<div align="center">

**コンテキストスイッチをやめて、コーディングに集中しよう。**

</div>
