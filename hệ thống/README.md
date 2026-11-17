# MedCare – Hệ Thống Quản Trị Phòng Khám & Hồ Sơ Y Tế Điện Tử
> **Bài tập lớn cuối kỳ – Học phần Lập trình Web**  
> **Quy mô nhóm:** 6 thành viên  
> **Công nghệ chủ đạo:** React 18 (Vite + Tailwind CSS), Node.js, Express REST API, MongoDB (Mongoose), Redux Toolkit, Context API, JWT Auth.

---

## 1. Phân chia 6 Phân hệ cho 6 Thành viên (Full-stack)

| Thành viên | Phân hệ (Feature) | Thư mục Frontend (React) | File Backend (Express + MongoDB) |
| :---: | :--- | :--- | :--- |
| **Nguyễn Thọ Việt Dũng (Leader)** | **Cổng Bác sĩ & Chuyên khoa** | `client/src/features/doctors/` | `server/controllers/doctorController.js`, `Specialty.js`, `DoctorProfile.js` |
| **Lưu Tổng** | **Booking Engine & Giữ chỗ 5p** | `client/src/features/booking/` | `server/controllers/appointmentController.js`, `Appointment.js` |
| **Vương Gia khánh** | **Bàn làm việc Bác sĩ & Bệnh án (EHR)** | `client/src/features/examination/` | `server/controllers/medicalRecordController.js`, `MedicalRecord.js` |
| **Vũ Ngọc Mai** | **Kê đơn thuốc & Kho Dược** | `client/src/features/pharmacy/` | `server/controllers/medicineController.js`, `Medicine.js`, `Prescription.js` |
| **Nguyễn Thùy Linh** | **Hỏi - Đáp Y tế & Đánh giá Review** | `client/src/features/community/` | `server/controllers/communityController.js`, `Discussion.js`, `Review.js` |
| **Nguyễn Bình Minh ** | **Quản trị Admin & Thống kê Analytics** | `client/src/features/admin/` | `server/controllers/adminController.js`, Aggregation Pipelines |

---

## 2. Tích hợp Agent Skills & Vibecoding Rules (Vercel-labs/skills)
Dự án đã tích hợp sẵn hệ thống quy chuẩn dành cho Trợ lý AI (Cursor, Windsurf, Claude Code, GitHub Copilot, Gemini CLI):
* **`.skills/medcare-vibecoding/SKILL.md`:** Chuẩn kỹ năng của [vercel-labs/skills](https://skills.sh).
* **`.cursorrules`:** Quy chuẩn tự động đọc bởi Cursor & Windsurf.
* **`AGENTS.md`:** Tài liệu chỉ dẫn kiến trúc cho mọi AI Agent.

### Lệnh hữu ích với `skills`:
```bash
# Xem danh sách các skill
npx skills list

# Thêm skill hỗ trợ từ cộng đồng Vercel Labs
npx skills add vercel-labs/agent-skills
```

---

## 3. Hướng dẫn Cài đặt & Khởi chạy dự án

### Bước 1: Cài đặt dependencies cho cả Client và Server
```bash
# Cài đặt toàn bộ dependencies
npm run install:all

# Hoặc cài thủ công từng phần:
cd server && npm install
cd ../client && npm install
```

### Bước 2: Thiết lập biến môi trường
Tạo file `server/.env` dựa trên `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/medcare_db
JWT_SECRET=medcare_super_secret_jwt_key_2026_vibecoding
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Bước 3: Khởi chạy dự án
Mở 2 cửa sổ terminal:
```bash
# Terminal 1: Chạy Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Chạy Frontend Client (Port 5173)
npm run dev:client
```
Truy cập giao diện tại: **`http://localhost:5173`**

---

## 4. Tài khoản Demo cho từng Vai trò
* **Quản trị viên (Admin):** `admin@medcare.vn` / `123456`
* **Bác sĩ (Doctor):** `doctor.an@medcare.vn` / `123456`
* **Dược sĩ (Pharmacist):** `duocsi.mai@medcare.vn` / `123456`
* **Bệnh nhân (Patient):** `benhnhan@gmail.com` / `123456`

---

## 5. Danh mục 9 Tiêu chí Kỹ thuật (Đã tích hợp sẵn trong Codebase)
1. **Giao diện HTML5 & Tailwind:** Responsive toàn diện, Dark/Light mode.
2. **ES6 Chuẩn mực:** Không dùng `var`, áp dụng destructuring, arrow functions, async/await.
3. **Component & State:** Hơn 15 component tái sử dụng, form controlled có bắt lỗi.
4. **React Hooks:** Tích hợp `useCountdown`, `useDebounce`, `useFetch` có cleanup timer.
5. **React Router v6 (SPA):** Nested routes `<Outlet />`, `ProtectedRoute`, trang `NotFound 404`.
6. **State Management:** `Context API` (AuthContext, ThemeContext) và `Redux Toolkit` (Booking workflow).
7. **REST API Express:** URL danh từ số nhiều, mã trạng thái chuẩn (200, 201, 400, 401, 403, 404, 409 Conflict).
8. **MongoDB (Mongoose):** 8 collection liên kết, chống race condition trùng slot, Aggregation Pipeline.
9. **Xác thực & Bảo mật:** JWT có thời hạn, bcrypt mã hóa mật khẩu, phân quyền RBAC 4 vai trò.
