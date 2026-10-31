# URANUS LMS - Hệ Thống Quản Lý Đào Tạo Trực Tuyến

Chào mừng bạn đến với dự án **URANUS LMS**. Đây là nền tảng quản lý học tập, cho phép giáo viên tạo khoá học, tổ chức thi trắc nghiệm (với hệ thống Anti-Cheat), và học viên có thể vào học, làm bài và xem kết quả.

🏢 **Organization:** [https://github.com/URANUS-Website](https://github.com/URANUS-Website)

Dự án được chia thành 2 phần chính:
- **URANUS-BE**: Backend sử dụng Java Spring Boot & PostgreSQL.
- **URANUS-FE**: Frontend sử dụng React, TypeScript, Vite & Tailwind CSS.

---

## 🚀 1. Hướng Dẫn Chạy Backend (URANUS-BE)

Backend được xây dựng bằng **Spring Boot 3** và sử dụng cơ sở dữ liệu **PostgreSQL**.

### Yêu cầu cấu hình hệ thống
- **Java 17** hoặc mới hơn.
- **Maven** (hoặc dùng Maven wrapper có sẵn).
- **PostgreSQL** (version 13 trở lên).

### Bước 1: Cài đặt Database
Ứng dụng yêu cầu một database PostgreSQL cục bộ. Bạn cần tạo database với thông tin sau (nếu chưa có):

- **Database URL**: `jdbc:postgresql://localhost:5432/uranus_lms`
- **Database Name**: `uranus_lms`
- **Username**: `uranus`
- **Password**: `uranus_secret`

*Lưu ý: Bạn có thể thay đổi thông tin này trong file `URANUS-BE/src/main/resources/application.yml`.*

### Bước 2: Chạy Backend
Mở Terminal / Command Prompt, di chuyển vào thư mục `URANUS-BE`:

```bash
cd URANUS-BE
```

Sau đó, chạy ứng dụng bằng Maven:

```bash
# Trên Windows
.\mvnw.cmd spring-boot:run

# Trên MacOS/Linux
./mvnw spring-boot:run
```

Nếu bạn sử dụng IDE (như IntelliJ IDEA, Eclipse, VS Code), chỉ cần mở thư mục `URANUS-BE` và chạy file `UranusApplication.java`.

Backend sẽ khởi động và chạy tại địa chỉ: **http://localhost:8080**

---

## 🎨 2. Hướng Dẫn Chạy Frontend (URANUS-FE)

Frontend được xây dựng bằng **ReactJS** (Vite) và styled bằng **TailwindCSS**.

### Yêu cầu cấu hình hệ thống
- **Node.js** (version 18 trở lên).
- **npm** hoặc **yarn**.

### Bước 1: Cài đặt thư viện (Dependencies)
Mở Terminal, di chuyển vào thư mục `URANUS-FE`:

```bash
cd URANUS-FE
```

Chạy lệnh sau để tải các thư viện cần thiết:

```bash
npm install
# hoặc nếu dùng yarn: yarn install
```

### Bước 2: Khởi chạy môi trường Dev
Sau khi cài đặt xong, khởi chạy server development bằng lệnh:

```bash
npm run dev
# hoặc nếu dùng yarn: yarn dev
```

Frontend sẽ tự động mở hoặc bạn có thể truy cập tại địa chỉ: **http://localhost:5173** (hoặc port tương ứng được Vite cấp).

---

## 🔑 3. Một Số Thông Tin Hữu Ích

- **Mã Bí Mật Giáo Viên (Teacher Secret Code)**: Khi tạo tài khoản giáo viên, hệ thống sẽ yêu cầu một mã bí mật. Mặc định mã này là: `URANUS_TEACHER_2026`.
- **API Endpoints**: Mặc định Frontend sẽ gọi API tới `http://localhost:8080/api`. Đảm bảo Backend luôn chạy trước khi thao tác trên Frontend.
- **Tài khoản Demo**: Nếu database mới tinh, bạn có thể tự đăng ký tài khoản (Học sinh hoặc Giáo viên) trực tiếp trên giao diện Đăng ký của Frontend.

---

Chúc bạn code vui vẻ cùng URANUS! ✨
