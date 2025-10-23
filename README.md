# Discord Bot "Lửa Việt" - Hệ Thống Kinh Tế & Gameplay

Một Discord bot đa chức năng với hệ thống kinh tế LVC, nông trại, săn bắn, câu cá và cửa hàng đa dạng.

## ✨ Tính Năng Chính

### 💰 Hệ Thống Kinh Tế (ECONOMY)
- **Làm việc** kiếm tiền với cooldown 1 giờ (100-999 LVC + level bonus)
- **Quà hàng ngày** với streak bonus (100 LVC + streak bonus)
- **Quà hàng tuần** với phần thưởng lớn
- **Chuyển tiền** giữa người dùng
- **Bảng xếp hạng** top 10 người giàu nhất
- **Hệ thống level** dựa trên XP từ các hoạt động

### 🌾 Hệ Thống Nông Trại (FARM)
- Trồng 5 loại cây với thời gian và lợi nhuận khác nhau
- Mua hạt giống từ cửa hàng với giá mới
- Thu hoạch với bonus ngẫu nhiên 10-30% và random KG từ 0.1-100 KG
- Nâng cấp nông trại để trồng cây level cao hơn
- Mỗi nông trại có 3 mảnh đất, mỗi mảnh đất có 5 miếng để trồng từng cây

### 🏹 Hệ Thống Săn Bắn (HUNT)
- Săn 6 loại sinh vật với tỷ lệ thành công khác nhau
- Cooldown ngắn 2 phút cho mỗi lần săn
- Khi săn sẽ random số KG của động vật từ 1-100 KG
- Trang bị vũ khí để tăng tỷ lệ săn thành công
- Nhận vật phẩm đặc biệt từ săn bắn
- Sử dụng bùa phép để tăng cơ hội

### 🎣 Hệ Thống Câu Cá (FISHING)
- Câu 7 loại cá với giá trị khác nhau: Cá Bống (25%), Cá Kim (25%), Cá Ngừ (20%), Rác (10%), Cá Hồi (10%), Cá Mập (8%), Rương (2%)
- Cooldown ngắn 5 phút cho mỗi lần câu
- Đối với các loại cá khi câu random số KG từ 0.1-100 KG
- Trang bị cần câu và mồi câu

### 🛒 Hệ Thống Cửa Hàng (SHOP)
- 4 cửa hàng chính: Hạt giống, Vũ khí, Câu cá, Role
- Mua bán vật phẩm với giá cố định
- Mua Role đặc biệt bằng LVC
- Bán vật phẩm thu thập được

### 📊 Quản Lý Cá Nhân
- Xem profile với thống kê chi tiết
- Quản lý túi đồ phân loại theo nhóm
- Xem leaderboard top người chơi
- Hệ thống inventory thông minh

## 🚀 Yêu Cầu Hệ Thống

- **Node.js** 18.17+
- **npm** hoặc **yarn**
- **Discord Bot Token**

## 📦 Cài Đặt

### Bước 1: Clone Repository
```bash
git clone <repository-url>
cd luaviet-bot
```

### Bước 2: Cài Đặt Dependencies
```bash
npm install
```

### Bước 3: Cấu Hình Environment
```bash
# Copy file mẫu
cp .env.example .env

# Chỉnh sửa file .env với thông tin của bạn
# DISCORD_TOKEN=your_bot_token_here
# PREFIX=lv
```

### Bước 4: Chạy Bot
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## ⚠️ Troubleshooting

### Lỗi "ERR_MODULE_NOT_FOUND"
Nếu gặp lỗi này, hãy kiểm tra:

1. **Đã cài đặt dependencies chưa:**
   ```bash
   npm install
   ```

2. **File .env đã tồn tại chưa:**
   ```bash
   cp .env.example .env
   # Sau đó chỉnh sửa file .env với token của bạn
   ```

3. **Node.js version:**
   ```bash
   node --version
   # Phải >= 18.17
   ```

4. **Clear cache và reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

1. **Clone repository:**
```bash
git clone <repository-url>
cd luaviet-bot
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình biến môi trường:**
Tạo file `.env` trong thư mục gốc với nội dung:
```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
ADMIN_ROLE_NAME=Admin
USER_ROLE_NAME=User
PREFIX=lv
```

4. **Tạo thư mục dữ liệu:**
```bash
mkdir data
```

## 🏃‍♂️ Cách Chạy

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

**Register slash commands:**
```bash
npm run register
```

## 📋 Danh Sách Lệnh Đầy Đủ

### 🆘 LỆNH TRỢ GIÚP
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `lv help` | Hiển thị tất cả nhóm lệnh | `lv help` |

### 💰 LỆNH KINH TẾ
| Lệnh | Chức năng | Cooldown | Ví dụ |
|------|-----------|----------|-------|
| `lv work` | Làm việc kiếm LVC | 1 giờ | `lv work` |
| `lv daily` | Nhận quà hàng ngày | 24 giờ | `lv daily` |
| `lv weekly` | Nhận quà hàng tuần | 7 ngày | `lv weekly` |
| `lv profile` / `lv cash` | Xem số dư & profile | - | `lv cash` |
| `lv give @user số_tiền` | Chuyển tiền cho user | - | `lv give @John 100` |
| `lv leaderboard` / `lv top` | Xem top 10 giàu nhất | - | `lv top` |
| `lv bet số_tiền` | Đặt cược may rủi (50/50) | - | `lv bet 100` |
| `lv inventory` / `lv inv` | Xem túi đồ chi tiết | - | `lv inv` |

### 🌾 LỆNH NÔNG TRẠI
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `lv farm` | Xem trạng thái nông trại | `lv farm` |
| `lv farm plant tên_cây` | Gieo trồng cây | `lv farm plant ngo` |
| `lv farm harvest` | Thu hoạch nông sản | `lv farm harvest` |
| `lv farm upgrade` | Nâng cấp nông trại | `lv farm upgrade` |

**Cây trồng có sẵn:**
- **lua** (Lúa) - 5 phút - 50 LVC - Level 1
- **ngo** (Ngô) - 30 phút - 80 LVC - Level 2
- **carot** (Cà rốt) - 1 giờ - 120 LVC - Level 3
- **mia** (Mía) - 2 giờ - 200 LVC - Level 4
- **cachua** (Cà chua) - 5 giờ - 300 LVC - Level 5

### 🏹 LỆNH SĂN BẮN
| Lệnh | Chức năng | Cooldown | Ví dụ |
|------|-----------|----------|-------|
| `lv hunt` | Đi săn một lượt | 2 phút | `lv hunt` |
| `lv hunt equip tên_vũ_khí` | Trang bị vũ khí | - | `lv hunt equip cung` |
| `lv hunt inventory` | Xem đồ săn bắn | - | `lv hunt inv` |
| `lv hunt use tên_bùa` | Dùng bùa phép | - | `lv hunt use lucky_charm` |

**Sinh vật có thể săn:**
- 🐰 **Thỏ** (80%) - 30-50 LVC
- 🐔 **Gà rừng** (75%) - 40-60 LVC
- 🐗 **Heo rừng** (60%) - 80-120 LVC
- 🦌 **Nai** (50%) - 100-150 LVC
- 🐅 **Hổ** (30%) - 200-300 LVC
- 🐻 **Gấu** (25%) - 250-350 LVC

### 🎣 LỆNH CÂU CÁ
| Lệnh | Chức năng | Cooldown | Ví dụ |
|------|-----------|----------|-------|
| `lv fish` | Câu cá một lượt | 5 phút | `lv fish` |
| `lv fish equip tên_cần` | Trang bị cần câu | - | `lv fish equip can_cau_sat` |
| `lv fish use tên_mồi` | Dùng mồi câu | - | `lv fish use moi_cau` |
| `lv fish inventory` | Xem đồ câu cá | - | `lv fish inv` |

**Cá có thể bắt:**
- 🐟 **Cá Mè** (50%) - 20-40 LVC
- 🐠 **Cá Rô** (30%) - 25-45 LVC
- 🐡 **Cá Chép** (15%) - 50-80 LVC
- 🐋 **Cá Trê** (10%) - 60-90 LVC
- 🦈 **Cá Lóc** (4%) - 100-150 LVC
- 🐬 **Cá Anh Vũ** (1%) - 200-300 LVC

### 🛒 LỆNH CỬA HÀNG
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `lv shop` | Xem tất cả cửa hàng | `lv shop` |
| `lv shop seeds` | Cửa hàng hạt giống | `lv shop seeds` |
| `lv shop weapons` | Cửa hàng vũ khí | `lv shop weapons` |
| `lv shop fishing` | Cửa hàng câu cá | `lv shop fishing` |
| `lv shop roles` | Mua role bằng LVC | `lv shop roles` |
| `lv buy tên_vật_phẩm` | Mua vật phẩm | `lv buy lua_seed` |
| `lv sell tên_vật_phẩm` | Bán vật phẩm | `lv sell thit_tho` |

**Vật phẩm cửa hàng:**

🌾 **Hạt giống:** lua_seed (10 LVC), ngo_seed (50 LVC), carot_seed (150 LVC), mia_seed (200 LVC), cachua_seed (250 LVC)

⚔️ **Vũ khí:** cung_go (0 LVC), cung_sat (800 LVC), cung_bac (2,500 LVC), cung_vang (6,000 LVC), cung_than (15,000 LVC)

🎣 **Đồ câu cá:** can_cau_tre (200 LVC), can_cau_sat (500 LVC), can_cau_bac (1,200 LVC), can_cau_vang (3,000 LVC), can_cau_kim_cuong (8,000 LVC)

🪱 **Mồi câu:** moi_cau_com (10 LVC), moi_cau_giun (50 LVC), moi_cau_tom (150 LVC), moi_cau_ca_chien (400 LVC), moi_cau_linh (1,000 LVC)

🎭 **Role:** nong_dan (5000 LVC), tho_san (8000 LVC), danh_ca (6000 LVC)

### 📦 LỆNH QUẢN LÝ CÁ NHÂN
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `lv inventory` / `lv inv` | Xem túi đồ chi tiết | `lv inv` |
| `lv profile @user` | Xem profile user khác | `lv profile @John` |

### ⚡ LỆNH ADMIN (Chỉ Admin)
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `/ping` | Kiểm tra độ trễ của bot | `/ping` |
| `/add @user số_tiền` | Thêm tiền cho user | `/add @John 1000` |
| `/remove @user số_tiền` | Trừ tiền user | `/remove @John 500` |
| `/resetmoney @user` | Reset tiền user | `/resetmoney @John` |
| `/turnoff` | Tắt bot | `/turnoff` |
| `/reset` | Khởi động lại bot | `/reset` |
| `/status` | Kiểm tra trạng thái bot | `/status` |

### 🎉 LỆNH GIVEAWAY (Chỉ Role Giveaway / Admin)
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `lv ga <số giờ> <số người win> <nội dung>` | Tạo một giveaway mới | `lv ga 10h 1 100k OwO` |
| `lv ga <số giờ> <số người win> <role yêu cầu> <nội dung>` | Tạo một giveaway mới theo role yêu cầu | `lv ga 10h 1 @cư_dân 100k OwO` |
| `lv reroll <id_message>` | Chọn lại người thắng cuộc | `lv reroll 01234567890123` |
| `lv end <id_message>` | Kết thúc một giveaway sớm | `lv end 01234567890123` |
| `lv glist` | Xem các giveaway đang diễn ra | `lv glist` |

### ⚡ LỆNH FLASH (Chỉ Admin)
| Lệnh | Chức năng | Ví dụ |
|------|-----------|-------|
| `lv rn <nội dung>` | Đổi tên kênh một cách nhanh chóng | `lv rn done` |
| `lv lock` | Khóa quyền gửi tin nhắn tại channel đó | `lv lock` |
| `lv unlock` | Mở khóa quyền gửi tin nhắn tại channel đó | `lv unlock` |
| `lv clear <số_lượng>` | Xóa số lượng tin nhắn | `lv clear 10` |

## 🏗️ Cấu Trúc Dự Án

```
luaviet-bot/
├── index.ts                 # Entry point chính
├── modules/                 # Các module chức năng
│   ├── basic.ts            # Lệnh cơ bản & help
│   ├── economy.ts          # Hệ thống kinh tế
│   ├── farm.ts             # Hệ thống nông trại
│   ├── hunt.ts             # Hệ thống săn bắn
│   ├── fishing.ts          # Hệ thống câu cá
│   ├── shop.ts             # Hệ thống cửa hàng
│   ├── entertainment.ts    # Game giải trí
│   ├── club.ts             # Hệ thống club
│   ├── manager.ts          # Quản trị
│   └── control.ts          # Điều khiển bot
├── data/                   # Lưu trữ dữ liệu
│   ├── db.json             # Dữ liệu người dùng
│   ├── shop_config.json    # Cấu hình cửa hàng
│   └── game_config.json    # Cấu hình game
├── store/                   # Quản lý dữ liệu
│   └── store.ts            # Store class chính
├── lib/                    # Utilities
│   ├── env.ts              # Environment config
│   └── loader.ts           # Command loader
├── tools/                  # Scripts tiện ích
│   ├── registerSlash.ts    # Đăng ký slash commands
│   └── clearCommands.ts    # Xóa commands
├── scripts/                # Scripts quản lý
│   ├── bot-control.ps1     # PowerShell control
│   └── bot-control.bat     # Batch control
├── types/                  # TypeScript types
│   └── command.ts          # Command interfaces
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── Dockerfile              # Docker config
├── docker-compose.yml      # Docker compose
└── README.md              # Tài liệu
```

## 🎯 Hệ Thống Level & Tiến Trình

### Cách tăng Level:
- ✅ **Làm việc** (work): +10 XP
- ✅ **Nhận quà** (daily): +25 XP
- ✅ **Đi săn** (hunt): +15 XP
- ✅ **Câu cá** (fish): +12 XP
- ✅ **Thu hoạch** (farm harvest): +20 XP

### Công thức Level:
```
Level = max(1, int((XP / 100) ** 0.5))
```

### Lợi ích khi Level cao:
- 🎯 Mở khóa cây trồng mới
- ⚔️ Săn được quái vật hiếm
- 🎣 Câu được cá quý hiếm
- 💰 Bonus thu nhập từ công việc

## 🔄 Vòng Lặp Gameplay Chính

1. **💼 Kiếm tiền cơ bản** → `lv work`, `lv daily`
2. **🛒 Mua công cụ** → `lv shop weapons`, `lv shop seeds`
3. **🎮 Sử dụng công cụ** → `lv hunt`, `lv fish`, `lv farm`
4. **📈 Kiếm nhiều hơn** + Vật phẩm quý
5. **🎯 Level up** → Mở khóa nội dung mới
6. **🔄 Lặp lại** với hiệu suất cao hơn

## 🏆 Mục Tiêu Cuối Cùng

- ✅ **Top Leaderboard** - Trở thành người giàu nhất server
- 🎭 **Mua Role đặc biệt** - Thể hiện đẳng cấp
- ⚔️ **Sở hữu vũ khí hiếm** - Săn quái vật mạnh
- 🌾 **Nông trại cấp cao** - Thu hoạch siêu lợi nhuận
- 🎣 **Câu cá huyền thoại** - Rương báu giá trị cao

## ⚙️ Cấu Hình Nâng Cao

### Thời gian và Cooldown:
- **Work:** 1 giờ
- **Hunt:** 2 phút
- **Fish:** 5 phút
- **Daily:** 24 giờ
- **Weekly:** 7 ngày

### Giới hạn hệ thống:
- **Số dư tối đa:** 10,000,000 LVC
- **Level tối đa:** 100
- **Streak bonus tối đa:** 100 LVC

## 🐛 Xử Lý Lỗi

Bot được trang bị hệ thống xử lý lỗi toàn diện:

- ✅ Validation input nghiêm ngặt
- ✅ Cooldown hệ thống chống spam
- ✅ Backup dữ liệu tự động
- ✅ Log lỗi chi tiết

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra file logs trong thư mục logs/
2. Đảm bảo bot có đủ permissions
3. Kiểm tra cấu hình file .env
4. Liên hệ quản trị viên server

---

**Lửa Việt Bot** - Siêu cháy! 🔥
