# 🎨 InstantSketch

> **Ứng dụng vẽ & viết ghi chú trực tiếp lên Widget màn hình điện thoại của bạn bè!**  
> Lấy cảm hứng từ Noteit và Locket: bạn vẽ điều gì, Widget trên màn hình điện thoại của bạn bè sẽ tự động cập nhật ngay lập tức.

---

## ✨ Tính Năng Nổi Bật

1. **Bộ Công Cụ Vẽ & Viết Hoàn Chỉnh:**
   - **Bút nét mảnh (Pen):** Nét vẽ trơn mịn, nhạy lực nhấn.
   - **Cọ vẽ mềm mại (Brush):** Tạo bóng và độ loang màu sắc tự nhiên.
   - **Dạ quang (Highlighter):** Nét trong suốt, phát sáng nhẹ.
   - **Cục tẩy (Eraser):** Tẩy chính xác từng nét.
   - **Hình khối & Biểu tượng:** Đường thẳng, Hình chữ nhật, Hình tròn, Trái tim.
   - **Viết chữ (Text Tool):** Gõ chữ với phông viết tay xinh xắn, phóng to/thu nhỏ/xoay và dán lên tranh.
   - **Chèn ảnh (Photo Insertion):** Chọn ảnh từ thư viện điện thoại/máy tính, căn chỉnh kích thước rồi dán trực tiếp lên bảng vẽ.
   - **Kho Sticker:** Bộ sticker cảm xúc dễ thương (❤️, ⭐, 🐱, 🌸, ☕, 🍕, ...).
   - **Bảng màu & Cỡ cọ:** 12 màu tuyển chọn + Bảng mã Hex RGB tùy ý + thanh trượt kích thước nét vẽ.
   - **Kiểu giấy nền:** Trắng tinh khôi, Đen sang trọng, Giấy ô ly học sinh, Chấm chấm Bullet Journal, Giấy cổ điển Vintage, Hồng phấn Pastel.
   - **Hoàn tác / Làm lại (Undo / Redo):** Lưu lại lịch sử từng nét vẽ.

2. **Ghép Đôi & Đồng Bộ Widget Bạn Bè (Social Sync):**
   - **Mã kết nối riêng biệt:** Mỗi người dùng sở hữu một mã Pair Code (VD: `SK-7842`).
   - **Gửi và Cập nhật tức thì:** Bấm "Gửi Ngay!" sẽ bắn pháo hoa ăn mừng và đồng bộ hình vẽ mới nhất lên Widget của người bạn được ghép đôi.
   - **Kỷ niệm các bức vẽ:** Lưu trữ toàn bộ các bức tranh đã trao đổi, thả tim (❤️, 🔥, 🥰, 😂) và tải ảnh PNG về máy.

3. **Mô Phỏng Widget Trên Điện Thoại:**
   - Tích hợp sẵn bộ giả lập Widget iPhone / Android ngay trong web (kích thước Vuông 2x2 và Ngang 4x2) giúp người dùng thấy ngay thành phẩm hiển thị ra sao trên màn hình chính trước khi cài đặt.

---

## 🚀 1. Chạy Thử Trên Máy (Local Development)

```bash
# Cài đặt thư viện (nếu chưa cài)
npm install

# Khởi động máy chủ phát triển
npm run dev
```

Mở trình duyệt tại đường dẫn hiển thị (mặc định: `http://localhost:5173`).  
*Mẹo:* Bạn có thể mở 2 tab trình duyệt cùng lúc để kiểm tra tính năng gửi và nhận tranh vẽ tức thì qua BroadcastChannel!

---

## 🌐 2. Hướng Dẫn Deploy Lên Vercel

Dự án đã được cấu hình sẵn file `vercel.json` hỗ trợ Single Page Application (SPA).

### Cách 1: Sử dụng Vercel CLI (Nhanh nhất)
```bash
# Chạy lệnh triển khai trực tiếp
npx vercel
```
- Chọn **Yes** để thiết lập dự án.
- Vercel sẽ tự động phát hiện cấu hình Vite và cung cấp cho bạn một đường link miễn phí (ví dụ: `https://instantsketch.vercel.app`).

### Cách 2: Đưa lên GitHub rồi kết nối Vercel
1. Đẩy mã nguồn dự án lên một kho lưu trữ GitHub của bạn.
2. Đăng nhập vào [vercel.com](https://vercel.com).
3. Bấm **Add New** > **Project** > Chọn repository `InstantSketch`.
4. Bấm **Deploy**. Vercel sẽ tự động build và cấp domain HTTPS miễn phí.

---

## 📱 3. Hướng Dẫn Xuất Ra File APK Cho Android

Dự án đã được tích hợp sẵn **Capacitor** và cấu hình sẵn thư mục gốc `android/` với App ID: `com.instantsketch.app`.

### Các bước thực hiện:

1. **Build mã nguồn Web và đồng bộ sang Android:**
   ```bash
   npm run cap:sync
   ```

2. **Mở dự án trong Android Studio:**
   ```bash
   npm run cap:open:android
   ```
   *(Hoặc mở thủ công thư mục `InstantSketch/android` bằng Android Studio)*

3. **Xuất file APK:**
   - Trong giao diện Android Studio:
   - Vào menu trên cùng: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   - Đợi Gradle biên dịch hoàn tất, một thông báo sẽ xuất hiện ở góc phải màn hình: *"APK(s) generated successfully"*.
   - Bấm vào chữ **locate** để mở thư mục chứa file `app-debug.apk`.
   - Chép file `.apk` này vào điện thoại Android của bạn hoặc gửi cho bạn bè để cài đặt!

### Hoặc xuất APK nhanh bằng dòng lệnh Gradle (nếu máy đã cài JDK & Android SDK):
```bash
npm run build:apk
```
File APK sẽ nằm tại đường dẫn: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 📲 4. Cách Ghim Widget Lên Màn Hình Điện Thoại

Sau khi cài đặt file APK lên điện thoại:
1. Trở về màn hình chính (Home Screen) của điện thoại Android.
2. Nhấn và giữ ngón tay vào một khoảng trống trên màn hình trong 1-2 giây.
3. Chọn mục **Widgets** (Tiện ích).
4. Cuộn tìm ứng dụng **InstantSketch**.
5. Chọn Widget mong muốn (cỡ Vuông hoặc Ngang) và kéo thả ra màn hình chính.
6. Xong! Bất cứ khi nào bạn hoặc bạn bè gửi một bức vẽ mới, Widget trên màn hình sẽ cập nhật hình ảnh đó.

---

## 🛠️ Cấu Trúc Dự Án

```
InstantSketch/
├── android/                         # Cấu hình dự án Android & Widget Provider gốc
│   └── app/src/main/
│       ├── java/com/instantsketch/app/
│       │   ├── MainActivity.java
│       │   └── InstantSketchWidget.java   # AppWidgetProvider cho Home Screen
│       └── res/
│           ├── layout/widget_instantsketch.xml # Giao diện Widget điện thoại
│           └── xml/instantsketch_widget_info.xml # Cấu hình Widget Android
├── src/
│   ├── components/
│   │   ├── Canvas.tsx               # Bảng vẽ cảm ứng, chèn ảnh, sticker, text
│   │   ├── Toolbar.tsx              # Thanh công cụ cọ, màu sắc, hình khối, kiểu nền
│   │   ├── Header.tsx               # Nút gửi vẽ, trạng thái kết nối bạn bè
│   │   ├── WidgetSimulatorModal.tsx # Bộ mô phỏng Widget điện thoại Android & iOS
│   │   ├── FriendPairModal.tsx      # Ghép đôi mã bạn bè, đổi thông tin hồ sơ
│   │   └── HistoryFeedModal.tsx     # Bộ sưu tập tranh vẽ và thả tim reaction
│   ├── services/
│   │   └── storageService.ts        # Lưu trữ cục bộ & live sync thời gian thực
│   ├── types/
│   │   └── sketch.ts                # Định nghĩa kiểu dữ liệu TypeScript
│   ├── App.tsx                      # Giao diện chính kết hợp các luồng
│   ├── index.css                    # Cấu hình Tailwind CSS v4 & tùy biến
│   └── main.tsx                     # Điểm khởi động React
├── capacitor.config.json            # Cấu hình Capacitor Mobile App
├── vercel.json                      # Cấu hình Deploy Vercel SPA
└── package.json
```
