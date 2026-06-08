# VNA Group Intern - Nhóm 2

Dự án quản lý và tạo lập cơ sở dữ liệu an toàn vệ sinh lao động.

## Hướng dẫn cài đặt nhanh (Setup & Run)

Người khác khi tải (pull) dự án này về chỉ cần chạy **2 lệnh duy nhất** sau để khởi chạy cả Frontend và Backend:

### Bước 1: Khởi tạo cấu hình và cài đặt thư viện
```bash
npm run setup
```
Lệnh này sẽ tự động:
1. Tạo các file cấu hình môi trường `.env` cho Backend và `.env.local` cho Frontend từ các file template `.env.example`.
2. Tạo file cấu hình cơ sở dữ liệu `ormconfig.json` cho Backend.
3. Tự động chạy `npm install` để cài đặt đầy đủ tất cả thư viện (dependencies) cho cả 2 thư mục `BE/` và `fe/`.

*(Lưu ý: Sau khi chạy setup, hãy mở file `BE/.env` và `BE/ormconfig.json` để điền đúng mật khẩu Database PostgreSQL của máy bạn).*

### Bước 2: Khởi chạy dự án (FE & BE chạy đồng thời)
```bash
npm run dev
```
Lệnh này sẽ tự động chạy song song cả server frontend (port `5800`) và backend (port `3800`).

---

## Bảo mật API Key & thông tin nhạy cảm
Dự án đã được thiết lập tự động bỏ qua (ignore) các file cấu hình nhạy cảm chứa API Key hoặc thông tin tài khoản Database để tránh bị rò rỉ khi đẩy lên GitHub:
- `BE/.env` (Chứa key SendGrid, mật khẩu mail Gmail SMTP, JWT secret key,...) - Đã được thêm vào `.gitignore`.
- `BE/ormconfig.json` (Chứa thông tin đăng nhập PostgreSQL) - Đã được thêm vào `.gitignore`.
- `fe/.env.local` (Chứa cấu hình URL kết nối API) - Đã được thêm vào `.gitignore`.
- `BE/reset_link.txt` (File ghi tạm mã OTP) - Đã được xóa bỏ và thêm vào `.gitignore`.