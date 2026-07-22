---
title: "Hướng dẫn WPORT CLI: Để AI Agent tìm việc và lấy dữ liệu ngay trong terminal"
description: "Cài @wport/cli, tìm việc WPORT bằng một lệnh và xuất JSON để Cursor cùng các AI Agent khác tiếp tục xử lý. Gồm bước cài đặt, lệnh thường dùng, tham số thân thiện Agent và ví dụ thực chiến."
publishDate: 2026-07-07
tags: ["WPORT 功能", "AI 實作", "求職面試"]
featured: false
cover: "https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/v1783409274/wport-blog/wport-cli-cover.jpg"
---

<figure>
  <img src="https://res.cloudinary.com/dyebbsckc/image/upload/f_auto,q_auto:good,w_1200,c_limit/v1783409274/wport-blog/wport-cli-cover.jpg" alt="Demo tìm việc WPORT CLI trên terminal" />
  <figcaption>WPORT CLI giúp AI Agent tìm việc trong terminal và xuất dữ liệu có cấu trúc.</figcaption>
</figure>

Khi bạn bảo AI trong Cursor “tìm giúp mình việc PM ở Đào Viên,” thường nó chỉ search web hoặc nhờ bạn copy-paste thủ công.

Nếu chúng ta biến **tìm việc thành CLI**, AI Agent có thể chạy lệnh trong terminal, nhận JSON có cấu trúc, rồi tiếp tục tùy chỉnh CV, so khớp JD, thậm chí ghi vào ghi chú Obsidian. Đó là lý do [WPORT CLI](https://www.npmjs.com/package/@wport/cli) (`@wport/cli`) tồn tại.

---

## Vì sao là CLI, không phải webpage?

Giao diện web hợp cho người bấm. **Command-line interface (CLI) hợp cho chương trình và AI Agent.**

| Tình huống | Web GUI | WPORT CLI |
|------|----------|-----------|
| Người duyệt việc | Trực quan, đẹp | Được, nhưng không phải trọng tâm |
| AI Agent tự tìm | Phải giả lập click, không ổn định | Một lệnh, ổn định |
| Xuất cho Skill tiếp theo | Phải scrape HTML | JSON / NDJSON gốc |
| Đưa vào script hoặc CI | Khó | `pipe` sang `jq` |

WPORT CLI là giao diện terminal của public API W101 Talent Search Center. Tìm và xem việc công khai **không cần đăng nhập**. Quản lý việc phía doanh nghiệp có subcommand `enterprise` riêng (cần API Key; nói ngắn ở cuối).

> **Ghi chú phiên bản**: Bản npm mới nhất hiện là `0.5.0`, vẫn ở giai đoạn tiền phát hành `0.x`. Domain API và lệnh có thể đổi. Hãy khóa số phiên bản trong script tự động.

---

## Cài đặt

Cần **Node.js >= 18.17**.

```bash
npm install -g @wport/cli
```

Sau khi cài, gõ `wport` trong terminal. Nếu AI Agent (như Cursor Agent) có quyền terminal, cũng có thể chạy các lệnh này giúp bạn.

Kiểm tra môi trường:

```bash
wport doctor
```

`doctor` hiển thị API base đã cấu hình, locale, trạng thái kết nối, và hành vi API mà Agent cần chú ý (ví dụ trường sắp xếp do server quyết định, client không ghi đè được).

---

## Bắt đầu nhanh ba bước

### 1. Tìm việc

```bash
wport jobs search --keyword "產品經理"
```

Thêm mã khu vực để thu hẹp kết quả (mã khu vực có thể lặp với `-l`):

```bash
wport jobs search --keyword "PM" -l 6001001000
```

Mặc định terminal hiện **bảng**. Nếu output bị pipe, tự chuyển sang **JSON** để xử lý tiếp.

### 2. Xem chi tiết một việc

Copy `enc_id` từ kết quả tìm kiếm, rồi chạy:

```bash
wport jobs view <enc_id>
```

Cũng có thể chỉ lấy một trường để giảm token AI đọc:

```bash
wport jobs view <enc_id> --field job_info.job_title
```

### 3. Xuất JSON cho Agent hoặc jq

```bash
wport jobs search --keyword backend --output json
```

Nếu chỉ cần trường Agent cần, dùng `--minimal` (bộ trường rút gọn):

```bash
wport jobs search --keyword backend --minimal --output json
```

Hoặc tự chọn trường:

```bash
wport jobs search --keyword backend --fields enc_id,title --output json
```

`--minimal` và `--fields` cắt JSON ở phía **client**, để LLM đọc ít trường thừa hơn. Lượng truyền mạng không đổi. Đây được thiết kế riêng cho workflow Agent.

---

## Ví dụ thực chiến cho AI Agent

### Ví dụ A: Search → trích enc_id → đọc tiêu đề theo batch

```bash
wport jobs search --keyword backend --fields enc_id --output json \
  | jq -r '.data[].enc_id' \
  | wport jobs view - --batch --field job_info.job_title
```

Chế độ `--batch` đọc nhiều `enc_id` từ stdin và xuất NDJSON từng dòng. Một bản lỗi không dừng cả batch. Hợp cho Agent xử lý nhiều JD cùng lúc.

### Ví dụ B: Nhờ Agent chạy trong Cursor

Trong chế độ Agent của Cursor, bạn có thể nói:

> Hãy chạy `wport jobs search --keyword "桃園 產品經理" --minimal --output json` trong terminal, gom kết quả thành bảng Markdown, và đánh dấu 3 tin phù hợp nhất cho sinh viên mới ra trường.

Agent sẽ gọi CLI, nhận JSON, rồi tiếp tục đưa gợi ý CV theo Skill hoặc hội thoại của bạn. Đáng tin hơn nhiều so với nhờ nó “lên website tìm việc.”

### Ví dụ C: Truy vấn nâng cao (`--json-query`)

Một số bộ lọc (năm kinh nghiệm, chế độ remote, khoảng lương, v.v.) chưa lộ thành flag ngắn. Viết thành file JSON rồi truyền vào:

```bash
wport jobs search --json-query ./my-search.json --output json
```

Cấu trúc JSON khớp `JobSearchDto` phía server, hợp cho script nâng cao hoặc Agent sinh file truy vấn động.

---

## Locale và cài đặt cá nhân

Chuỗi giao diện CLI cố định. `--lang` ảnh hưởng **ngôn ngữ nội dung API trả về** (mô tả việc, v.v.):

```bash
wport jobs search --keyword backend --lang en-US
```

Lưu preference bền vững:

```bash
wport config set locale zh-TW
wport config get
```

Mục có thể đặt: `locale`, `output`, `timeout_ms`. Địa chỉ API dùng biến môi trường hoặc flag, đừng ghi vào config (vì lý do an toàn):

```bash
WPORT_API_BASE=https://api.wport.me wport jobs search --keyword backend
# hoặc chỉ định một lần
wport jobs search --keyword backend --api https://api.wport.me
```

---

## Lệnh enterprise (phía tuyển dụng)

Nếu bạn quản lý việc WPORT cho công ty, dùng subcommand `wport enterprise` (cần API Key doanh nghiệp `wpk_live_...`; liên hệ đội BD để nhận):

```bash
wport enterprise login          # lưu khóa an toàn (không hiện trong shell history)
wport enterprise jobs list --status published
wport enterprise jobs create --file new-job.json
wport enterprise talents list --tab applied
```

Lệnh enterprise **hoàn toàn tách** khỏi `wport jobs` công khai. Chưa đăng nhập thì không chạm API phía employer. CI / Agent cũng có thể truyền khóa qua biến môi trường:

```bash
WPORT_API_KEY=wpk_live_... wport enterprise jobs list --minimal --output json
```

---

## Exit code và rate limit

Khi Agent viết script, dùng exit code để đánh giá kết quả:

| Code | Ý nghĩa |
|------|------|
| `0` | Thành công |
| `2` | Tham số sai |
| `3` | Server 4xx |
| `4` | Server 5xx / lỗi mạng |
| `5` | Config hỏng |

Endpoint tìm việc công khai giới hạn khoảng **1200 request / phút / IP**, đủ cho tương tác thường và Agent single-thread. Đừng dùng crawler đa tiến trình request ồ ạt.

---

## Vì sao chúng tôi thiết kế vậy?

1. **Agent first**: `--minimal`, `--fields`, `--batch` và mặc định JSON thân thiện pipe giúp AI đọc ít nhiễu hơn, làm nhiều việc hơn.
2. **Công khai và enterprise tách biệt**: Người tìm việc dùng `wport jobs` không cần tài khoản. Tính năng công ty nằm trong `enterprise`, quyền khóa rõ ràng.
3. **Script được**: Nối với `jq`, Skill và toolchain MCP để “tìm việc” trở thành một mắt xích trong pipeline tùy chỉnh CV và theo dõi ứng tuyển.

Đây cũng là lõi demo tại Charging Station Vol.3: một `wport jobs search`, việc PM Đào Viên lập tức vào workflow Agent. Nếu bạn bỏ lỡ lớp, bài này là sổ bù bài.

---

## Bước tiếp theo

- **Cài package**: [npmjs.com/package/@wport/cli](https://www.npmjs.com/package/@wport/cli)
- **Gặp vấn đề**: Chạy `wport doctor` trước. Ở giai đoạn `0.x`, email [yao@wport.me](mailto:yao@wport.me)
- **Tìm việc trên web**: [wport.me](https://wport.me/)

Chúng tôi sẽ tiếp tục cập nhật khu vực “WPORT features” với lệnh mới, ví dụ nối Agent và các lựa chọn thiết kế sản phẩm. Hãy lưu bài này, lần sau mở Cursor cứ gọi Agent chạy `wport` là được.
