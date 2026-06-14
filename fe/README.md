# Frontend Architecture Overview

## Technology Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Architecture: Modular Architecture
- Purpose: Tách biệt rõ ràng giữa giao diện (UI), xử lý nghiệp vụ (Business Logic) và cấu hình hệ thống.

---

# Project Structure

```text
fe/
├── app/
├── libs/
│   ├── core/
│   ├── tts/
│   └── shared/
├── public/
├── middleware.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

# 1. app/ (Routing & Layout)

Đây là trung tâm của Next.js App Router, quản lý routing và layout của ứng dụng.

## Structure

```text
app/
├── (auth)/
│   ├── login/
│   └── forgot-password/
├── account/
├── layout.tsx
├── page.tsx
├── error.tsx
└── not-found.tsx
```

## Responsibilities

### (auth)/

Route Group của Next.js.

> Thư mục nằm trong dấu ngoặc đơn `( )` không xuất hiện trên URL.

Ví dụ:

```text
app/(auth)/login/page.tsx
```

URL:

```text
/login
```

Chứa các trang xác thực:

- Login
- Forgot Password
- Reset Password (nếu có)

---

### account/

Quản lý các chức năng liên quan đến tài khoản người dùng:

- Thông tin cá nhân
- Cài đặt tài khoản
- Đổi mật khẩu
- Quản lý hồ sơ

---

### layout.tsx

Layout gốc của toàn bộ ứng dụng.

Chịu trách nhiệm:

- Header
- Footer
- Navigation
- Global Providers
- Font Configuration
- SEO Metadata

Ví dụ:

```tsx
<html>
  <body>
    <Header />
    {children}
    <Footer />
  </body>
</html>
```

---

### page.tsx

Trang chủ của hệ thống.

Route:

```text
/
```

---

### error.tsx

Trang hiển thị khi xảy ra lỗi runtime.

Ví dụ:

- API lỗi
- Component crash
- Unexpected Exception

---

### not-found.tsx

Trang 404.

Hiển thị khi người dùng truy cập route không tồn tại.

---

# 2. libs/ (Core Logic & Feature Modules)

Thư mục chứa toàn bộ logic nghiệp vụ của Frontend.

```text
libs/
├── core/
├── tts/
└── shared/
```

---

# 2A. libs/core/ (System Foundation)

Các thành phần nền tảng dùng chung cho toàn hệ thống.

```text
libs/core/
├── components/
├── services/
├── hooks/
├── contexts/
├── locales/
├── theme/
└── utils/
```

---

## components/

Chứa các UI Components tái sử dụng.

Ví dụ:

```text
Button
Input
Select
Modal
Table
Pagination
Card
Loader
```

Mục tiêu:

- Reusable
- Maintainable
- Consistent UI

---

## services/

Xử lý giao tiếp với Backend.

Ví dụ:

```text
Axios Client
Authentication API
User API
TTS API
```

Mẫu cấu trúc:

```text
services/
├── api.ts
├── auth.service.ts
├── user.service.ts
└── tts.service.ts
```

Nhiệm vụ:

- HTTP Requests
- API Integration
- Error Handling
- Response Mapping

---

## hooks/

Custom React Hooks.

Ví dụ:

```text
useAuth
useDebounce
useFetch
usePagination
useTheme
```

Mục đích:

- Tái sử dụng logic React
- Giảm lặp code

---

## contexts/

Quản lý Global State.

Ví dụ:

```text
AuthContext
ThemeContext
LanguageContext
```

Dùng để lưu:

- User Login State
- Theme
- Language
- Global Configurations

---

## locales/

Đa ngôn ngữ (i18n).

Ví dụ:

```text
locales/
├── en.json
└── vi.json
```

Hỗ trợ:

- Vietnamese
- English
- Các ngôn ngữ khác trong tương lai

---

## theme/

Định nghĩa giao diện hệ thống.

Bao gồm:

- Colors
- Typography
- Spacing
- Design Tokens

Ví dụ:

```text
theme/
├── colors.ts
├── typography.ts
└── index.ts
```

---

## utils/

Các hàm tiện ích.

Ví dụ:

```text
formatDate()
formatCurrency()
validateEmail()
generateUUID()
```

Nguyên tắc:

- Stateless
- Reusable
- Framework-independent

---

# 2B. libs/tts/ (Business Feature Module)

Module nghiệp vụ chính của hệ thống.

Tên module cho thấy đây là:

**Text-to-Speech (TTS)**

Chức năng:

- Chuyển văn bản thành giọng nói
- Quản lý audio
- Xử lý voice generation

```text
libs/tts/
├── pages/
├── logic/
├── hooks/
└── services/
```

---

## pages/

Các giao diện riêng của module TTS.

Ví dụ:

```text
Text Input Page
Audio Preview Page
History Page
Voice Selection Page
```

---

## logic/

Chứa nghiệp vụ chuyên biệt.

Ví dụ:

```text
Text Processing
Audio Processing
Voice Generation Workflow
Speech Configuration
```

Không nên đặt logic phức tạp trực tiếp trong component.

---

## hooks/

Custom hooks dành riêng cho TTS.

Ví dụ:

```text
useTTS()
useAudioPlayer()
useVoiceSelection()
```

---

## services/

API và service riêng của TTS.

Ví dụ:

```text
generateSpeech()
downloadAudio()
getVoiceList()
```

---

# 2C. libs/shared/ (Shared Resources)

Các thành phần dùng chung giữa nhiều module.

```text
libs/shared/
├── components/
├── hooks/
├── constants/
└── types/
```

Mục tiêu:

- Tránh duplicate code
- Tăng khả năng tái sử dụng
- Tuân thủ nguyên tắc DRY (Don't Repeat Yourself)

Ví dụ:

```text
Shared Button
Shared Modal
Common Types
Global Constants
```

---

# 3. public/ (Static Assets)

Chứa tài nguyên tĩnh.

```text
public/
├── favicon.ico
├── logo.svg
├── static/
│   └── mock-images/
└── documents/
```

Ví dụ:

- Logo
- Banner
- Favicon
- Mock Images
- Downloadable Documents

Các file trong `public/` có thể truy cập trực tiếp qua URL.

Ví dụ:

```text
/logo.svg
/favicon.ico
```

---

# 4. Important Configuration Files

## middleware.ts

Middleware chạy trước khi request được xử lý.

Chức năng:

- Authentication
- Authorization
- Redirect
- Route Protection

Ví dụ:

```text
Nếu chưa đăng nhập:
→ Redirect tới /login
```

---

## next.config.mjs

Cấu hình Next.js.

Ví dụ:

- Image Domains
- Redirect Rules
- Rewrites
- Build Configuration

---

## tsconfig.json

Cấu hình TypeScript.

Bao gồm:

- Path Alias
- Strict Mode
- Compiler Options

Ví dụ:

```json
{
  "paths": {
    "@core/*": ["libs/core/*"],
    "@tts/*": ["libs/tts/*"]
  }
}
```

---

## package.json

Quản lý:

- Dependencies
- DevDependencies
- Scripts

Ví dụ:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

# Architectural Principles

## Modular Architecture

Mỗi module chịu trách nhiệm cho một domain riêng.

Ví dụ:

```text
core  → Foundation
tts   → Business Feature
shared → Shared Resources
```

---

## Separation of Concerns

Tách biệt rõ:

```text
UI
Business Logic
State Management
API Communication
Configuration
```

---

## Reusability

Ưu tiên:

- Shared Components
- Shared Hooks
- Shared Utilities

---

## Scalability

Cho phép mở rộng thêm module mới dễ dàng:

```text
libs/
├── core/
├── tts/
├── analytics/
├── dashboard/
├── notification/
└── shared/
```

Mà không ảnh hưởng đến các module hiện có.