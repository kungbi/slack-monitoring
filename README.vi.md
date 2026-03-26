[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [Español](README.es.md) | Tiếng Việt | [Português](README.pt.md)

# slack-monitoring

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-blueviolet)](https://docs.anthropic.com/en/docs/claude-code)
[![Slack MCP](https://img.shields.io/badge/Slack-MCP_Server-4A154B?logo=slack&logoColor=white)](https://modelcontextprotocol.io/integrations/slack)

**Giám sát đề cập Slack cho Claude Code. Không bao giờ bỏ lỡ @mention nữa.**

_Đừng kiểm tra Slack thủ công. Hãy để Claude theo dõi cho bạn._

[Bắt Đầu Nhanh](#bắt-đầu-nhanh) • [Lệnh](#lệnh) • [Cách Hoạt Động](#cách-hoạt-động) • [Cấu Hình](#cấu-hình)

---

## Bắt Đầu Nhanh

**Bước 1: Cài đặt**

```bash
# Cách A: Plugin Marketplace (Khuyến nghị)
/plugin marketplace add https://github.com/kungbi/slack-monitoring.git
/plugin install slack-monitoring

# Cách B: Cài đặt thủ công
git clone https://github.com/kungbi/slack-monitoring.git
cd slack-monitoring && chmod +x install.sh && ./install.sh
```

**Bước 2: Thiết lập**

```
/slack-monitoring:setup
```

**Bước 3: Bắt đầu giám sát**

```
/slack-monitoring:start
```

Vậy là xong. Claude kiểm tra đề cập của bạn mỗi 15 phút và gửi tóm tắt.

---

## Tại sao chọn slack-monitoring?

- **Không tốn công sức** — Thiết lập rồi quên đi. Chạy nền trong khi bạn code
- **Nhận biết thread** — Theo dõi từng đề cập dưới dạng thread, không phải tin nhắn đơn lẻ
- **Tự động hoàn thành** — Đã trả lời? Tự động đánh dấu hoàn thành
- **Tóm tắt ngữ cảnh** — Toàn bộ ngữ cảnh thread + gợi ý trả lời
- **Thông báo thông minh** — Chỉ cảnh báo đề cập mới. Không có nhiễu trùng lặp
- **Lọc kênh** — Bỏ qua kênh ồn ào, ưu tiên kênh quan trọng, thiết lập người gửi VIP
- **Báo cáo tuần** — Tỷ lệ phản hồi, thời gian phản hồi trung bình, top kênh & người gửi
- **Tùy chỉnh** — Ngôn ngữ, giọng điệu, khoảng thời gian, kiểu tóm tắt — tất cả có thể cấu hình

---

## Lệnh

| Lệnh | Chức năng |
|------|-----------|
| `/slack-monitoring:start` | Bắt đầu giám sát (mặc định 15 phút) |
| `/slack-monitoring:start 5m` | Bắt đầu với khoảng thời gian tùy chỉnh |
| `/slack-monitoring:list` | Hiển thị đề cập chưa trả lời |
| `/slack-monitoring:show 1` | Xem chi tiết đề cập #1 (tóm tắt, gợi ý trả lời) |
| `/slack-monitoring:complete 2` | Đánh dấu đề cập #2 hoàn thành |
| `/slack-monitoring:complete all` | Đánh dấu tất cả hoàn thành |
| `/slack-monitoring:digest` | Báo cáo tuần (7 ngày gần nhất) |
| `/slack-monitoring:setup` | Trợ lý cấu hình |
| `/slack-monitoring:help` | Hiển thị trợ giúp |
| `/slack-monitoring:status` | Hiển thị cấu hình và thống kê đề cập hôm nay |
| `/slack-monitoring:stop` | Dừng giám sát |

---

## Cách Hoạt Động

```
Mỗi chu kỳ kiểm tra:

  ┌─────────────────────────────────────────────────┐
  │  1. Tìm @đề cập hôm nay trên Slack             │
  │  2. Áp dụng bộ lọc kênh (bỏ qua/ưu tiên)      │
  │  3. Với mỗi đề cập mới:                        │
  │     → Đọc toàn bộ thread                        │
  │     → Đã trả lời? → auto_completed              │
  │     → Chưa trả lời? → pending + cảnh báo        │
  │     → VIP/kênh ưu tiên? → đánh dấu 🔴           │
  │  4. Kiểm tra lại thread pending hiện có          │
  │     → Tìm thấy trả lời? → auto_completed        │
  │  5. Lưu bản ghi hàng ngày                       │
  └─────────────────────────────────────────────────┘
```

### Loại Trạng Thái

| Trạng thái | Mô tả |
|-----------|-------|
| `pending` | Chưa trả lời — cần sự chú ý |
| `auto_completed` | Đã trả lời trong thread — tự động hoàn thành |
| `completed` | Đánh dấu thủ công bằng lệnh `complete` |

---

## Báo Cáo Tuần

Chạy `/slack-monitoring:digest` để xem tóm tắt 7 ngày:

```
📊 Weekly Digest (03/18 ~ 03/24)

📈 Tổng quan
- Tổng đề cập: 28
- Đã phản hồi: 25 (89%)
- Tự động: 18 / Thủ công: 7
- Đang chờ: 3

⏱️ Thời gian phản hồi
- Trung bình: 1h 23m
- Nhanh nhất: 5m (#incidents)
- Chậm nhất: 6h (#general)
```

---

## Cấu Hình

Chạy `/slack-monitoring:setup` để cấu hình:

| Thiết lập | Tùy chọn | Mặc định |
|-----------|----------|----------|
| **Kết nối Slack** | Tự động phát hiện | — |
| **Ngôn ngữ** | Tiếng Hàn, Tiếng Anh | Tiếng Hàn |
| **Giọng điệu** | Trang trọng, Thân mật, Học từ tin nhắn | Trang trọng |
| **Khoảng thời gian** | 1m, 5m, 10m, 15m, 30m, 1h, tùy chỉnh | 15m |
| **Kiểu tóm tắt** | Ngắn gọn, Chi tiết, Đầy đủ ngữ cảnh | Chi tiết |
| **Kênh bỏ qua** | Kênh cần bỏ qua | Không |
| **Kênh ưu tiên** | Kênh hiển thị trước | Không |
| **Người gửi VIP** | Luôn ưu tiên cao | Không |

---

## Yêu Cầu

| Yêu cầu | Mô tả |
|----------|-------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Công cụ CLI (cần phiên hoạt động) |
| Slack User Token | Token `xoxp-` với các phạm vi cần thiết (trình hướng dẫn cài đặt sẽ hướng dẫn) |

### Các phạm vi token Slack cần thiết

| Phạm vi | Mục đích |
|---------|----------|
| `search:read` | Tìm kiếm @đề cập |
| `channels:history` | Đọc thread kênh công khai |
| `groups:history` | Đọc thread kênh riêng tư |
| `im:history` | Đọc thread tin nhắn trực tiếp |
| `usergroups:read` | Tự động phát hiện nhóm Slack của bạn |
| `users:read` | Xác định hồ sơ người dùng của bạn |

> **Cách lấy token:** Tạo ứng dụng Slack tại [api.slack.com/apps](https://api.slack.com/apps), thêm các phạm vi trên vào **OAuth & Permissions → User Token Scopes**, cài đặt vào workspace của bạn và sao chép **User OAuth Token** (bắt đầu bằng `xoxp-`). Chạy `/slack-monitoring:setup` và dán vào khi được nhắc.

> **Lưu ý:** Giám sát chỉ hoạt động khi phiên Claude Code đang hoạt động. Khi phiên kết thúc, giám sát cũng dừng lại.

---

## License

MIT — xem [LICENSE](LICENSE) để biết chi tiết.

---

<div align="center">

**Ngừng chuyển đổi ngữ cảnh. Tập trung vào code.**

</div>
