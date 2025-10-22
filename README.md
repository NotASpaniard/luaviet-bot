# Discord Bot - Hệ thống BASIC, TENT, CAMPING, và Quản trị

Một Discord bot đa chức năng với hệ thống kinh tế, cắm trại, quản lý lều và các tính năng quản trị.

## ✨ Tính năng chính

### 🏦 Hệ thống kinh tế (BASIC)
- **Điểm danh hàng ngày** với streak bonus (100-1999 LVC)
- **Chuyển tiền** giữa người dùng
- **Bảng xếp hạng** theo số dư
- **Nhiệm vụ hàng ngày** với 3 quest ngẫu nhiên
- **Làm mới nhiệm vụ** (trừ 2000 LVC)

### 🏕️ Hệ thống cắm trại (CAMPING)
- **Thu thập gỗ** với 5 loại khác nhau (01-05)
- **Quản lý túi đồ** cá nhân
- **Tạo và duy trì lửa trại** (cần 3 Gỗ Tươi + 2 Gỗ Khô + 300 LVC)
- **Thêm gỗ vào lửa** để kéo dài thời gian cháy
- **Tặng gỗ** cho người khác

### ⛺ Hệ thống lều (TENT)
- **Quản lý lều** với chủ sở hữu và thành viên
- **Kho lều chung** để lưu trữ gỗ
- **Điểm danh lều** với thưởng 300 LVC/người khi tất cả thành viên hoàn thành
- **Bảng xếp hạng lều** theo tổng gỗ và thời gian lửa
- **Nhiệm vụ lều** riêng biệt

### 🛠️ Hệ thống quản trị
- **Quản lý tiền** (thêm/trừ/reset) với xác nhận
- **Đổi tên kênh** nhanh
- **Gửi feedback/legit** đơn hàng
- **Điều khiển bot** (tắt/khởi động lại/trạng thái)

## 🚀 Yêu cầu hệ thống
- Node.js >= 18.17
- Discord Bot Token
- Discord Application ID

## 📦 Cài đặt

1. **Clone repository:**
```bash
git clone <repository-url>
cd discord-bot-main
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình biến môi trường:**
Tạo file `.env` trong thư mục gốc với nội dung:
```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
DISCORD_CLIENT_ID=YOUR_CLIENT_ID_HERE
DISCORD_GUILD_ID=YOUR_GUILD_ID_HERE
PREFIX=lv 
```

4. **Cập nhật Role IDs trong `modules/manager.ts`:**
```typescript
const MANAGER_ROLES = ['YOUR_MANAGER_ROLE_ID_1', 'YOUR_MANAGER_ROLE_ID_2', 'YOUR_MANAGER_ROLE_ID_3', 'YOUR_MANAGER_USER_ID'];
```

## 🏃‍♂️ Cách chạy

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

### Đăng ký slash commands:
```bash
# Đăng ký toàn cầu (cẩn thận vì cache của Discord)
npm run register

# Xóa tất cả commands
npm run clear
```

### Điều khiển bot:
```bash
# Khởi động bot
npm run bot:start

# Dừng bot
npm run bot:stop

# Kiểm tra trạng thái
npm run bot:status
```

### Docker (Tùy chọn):
```bash
# Build và chạy với Docker
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng bot
docker-compose down
```

## 📋 Danh sách lệnh

### 🏦 Lệnh BASIC (prefix `lv `)
| Lệnh | Mô tả | Ví dụ |
|------|-------|-------|
| `lv daily` | Điểm danh hàng ngày với streak bonus | `lv daily` |
| `lv cash` | Xem số dư tài khoản | `lv cash` |
| `lv info` | Thông tin server hiện tại | `lv info` |
| `lv give <@user> <số tiền>` | Chuyển LVC cho người khác | `lv give @user 1000` |
| `lv bxh` | Bảng xếp hạng theo số dư | `lv bxh` |
| `lv quest` | Xem nhiệm vụ hàng ngày | `lv quest` |

### 🏕️ Lệnh CAMPING (prefix `lv `)
| Lệnh | Mô tả | Ví dụ |
|------|-------|-------|
| `lv pickup` | Thu thập gỗ ngẫu nhiên | `lv pickup` |
| `lv inv` | Xem túi đồ cá nhân | `lv inv` |
| `lv firecheck` | Kiểm tra thời gian lửa lều | `lv firecheck` |
| `lv firemake` | Tạo lửa cho lều | `lv firemake` |
| `lv addwood <mã> <kg>` | Thêm gỗ vào kho lều | `lv addwood 03 5` |
| `lv givewood <@user> <mã> <kg>` | Tặng gỗ cho người khác | `lv givewood @user 01 10` |
| `lv usewood <mã> <kg>` | Dùng gỗ để kéo dài lửa | `lv usewood 02 3` |

### ⛺ Lệnh TENT
| Lệnh | Mô tả | Ví dụ |
|------|-------|-------|
| `/tentowner <@user> <tên lều> <role>` | Gán chủ lều (chỉ admin) | `/tentowner @user Tent1 123456` |
| `lv tent add <@user>` | Thêm thành viên lều | `lv tent add @user` |
| `lv tent remove <@user>` | Xóa thành viên lều | `lv tent remove @user` |
| `lv tent list` | Danh sách thành viên lều | `lv tent list` |
| `lv tent inv` | Kho gỗ của lều | `lv tent inv` |
| `lv tent daily` | Điểm danh lều | `lv tent daily` |
| `lv tent bxh` | Bảng xếp hạng lều | `lv tent bxh` |
| `lv tent quest` | Nhiệm vụ lều | `lv tent quest` |

### 🛠️ Lệnh Quản trị
| Lệnh | Mô tả | Ví dụ |
|------|-------|-------|
| `lv!name <content>` | Đổi tên kênh | `lv!name New Channel` |
| `lv!legit <content>` | Gửi feedback/legit | `lv!legit Order completed` |
| `/add <@user> <số tiền>` | Thêm tiền (có xác nhận) | `/add @user 1000` |
| `/remove <@user> <số tiền>` | Trừ tiền (có xác nhận) | `/remove @user 500` |
| `/resetmoney <@user>` | Reset tiền (có xác nhận) | `/resetmoney @user` |
| `/balance <@user?>` | Xem số dư | `/balance @user` |
| `/help` | Hướng dẫn sử dụng | `/help` |
| `/status` | Trạng thái bot | `/status` |
| `/turnoff` | Tắt bot (chỉ admin) | `/turnoff` |
| `/reset` | Khởi động lại bot (chỉ admin) | `/reset` |

## 🏗️ Cấu trúc dự án

```
discord-bot-main/
├── index.ts              # Entry point chính
├── lib/
│   ├── env.ts           # Quản lý biến môi trường
│   └── loader.ts        # Loader commands
├── modules/             # Các module lệnh
│   ├── basic.ts         # Lệnh cơ bản
│   ├── camping.ts       # Lệnh cắm trại
│   ├── tent.ts          # Lệnh lều
│   ├── control.ts       # Điều khiển bot
│   └── manager.ts       # Quản trị
├── store/
│   └── store.ts         # Quản lý dữ liệu JSON
├── tools/               # Công cụ hỗ trợ
│   ├── registerSlash.ts # Đăng ký slash commands
│   └── clearCommands.ts # Xóa commands
├── scripts/             # Scripts điều khiển
│   ├── bot-control.ps1  # PowerShell control
│   └── bot-control.bat  # Batch control
└── data/
    └── db.json         # Dữ liệu JSON
```

## ⚙️ Cấu hình nâng cao

### Thời gian và múi giờ
- Hệ thống sử dụng múi giờ Việt Nam (GMT+7)
- Daily reset lúc 00:00 VN time
- Streak được tính theo ngày VN

### Dữ liệu
- Lưu trữ dạng JSON trong `./data/db.json`
- Hỗ trợ migration sang database thực tế
- Backup tự động khi thay đổi dữ liệu

### Bảo mật
- Role-based permissions cho admin commands
- Xác nhận 2 bước cho các thao tác quan trọng
- Validation input với Zod schema

## 🚀 Phát triển

### Thêm module mới
1. Tạo file trong `modules/`
2. Export `slash`, `prefix` hoặc arrays `slashes`, `prefixes`
3. Bot sẽ tự động load khi khởi động

### Scripts có sẵn
```bash
npm run dev          # Development với watch mode
npm run build        # Build TypeScript
npm run start        # Chạy production
npm run register     # Đăng ký slash commands
npm run clear        # Xóa tất cả commands
npm run control      # Điều khiển bot
```

## 📝 Lưu ý
- Bot hỗ trợ cả prefix commands (`lv `, `lv!`) và slash commands
- Dữ liệu được lưu local, phù hợp cho testing
- Có thể scale lên database thực tế khi cần
- Tất cả commands đều có error handling
