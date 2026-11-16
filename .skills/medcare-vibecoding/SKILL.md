---
name: medcare-vibecoding
description: "Quy chuẩn kiến trúc và hướng dẫn viết code cho AI Assistant trong dự án MedCare (Học phần Lập trình Web)."
---

# MedCare Agent Skill – Quy Chuẩn Vibecoding Dành Cho AI Assistant

Khi hỗ trợ sinh viên lập trình các chức năng trong dự án **MedCare**, bạn PHẢI tuân thủ nghiêm ngặt các quy định kiến trúc sau đây:

## 1. Công nghệ & Thư viện bắt buộc
- **Frontend:** React (Vite), Tailwind CSS, React Router v6, Redux Toolkit, Context API, Lucide React icon.
- **Backend:** Node.js, Express REST API, MongoDB (Mongoose), JSON Web Token (JWT), bcryptjs.
- **Chuẩn JavaScript:** ES6+ (Tuyệt đối KHÔNG dùng `var`; dùng `const`/`let`, arrow functions, destructuring props, template string, async/await).

## 2. Quy tắc gọi API (Cực kỳ quan trọng)
- **CẤM:** Không dùng `fetch()` trực tiếp và không import `axios` tự do tại từng component.
- **BẮT BUỘC:** Luôn import và sử dụng instance dùng chung tại `@/api/axiosClient` (hoặc `../../api/axiosClient`).
  Instance này đã tự động đính kèm `Bearer Token` và xử lý mã lỗi tập trung.

## 3. Cách ly phân vùng thư mục (Folder Isolation)
Mỗi thành viên phụ trách một phân hệ riêng trong thư mục `client/src/features/`.
- TV1: `src/features/doctors/`
- TV2: `src/features/booking/`
- TV3: `src/features/examination/`
- TV4: `src/features/pharmacy/`
- TV5: `src/features/community/`
- TV6: `src/features/admin/`
AI KHÔNG được tự ý sửa đổi các file dùng chung như `App.jsx`, `axiosClient.js`, hay `context/` trừ khi có yêu cầu rõ ràng từ Nhóm trưởng (Leader).

## 4. Đáp ứng 9 Tiêu chí Đánh giá của Giảng viên
1. **Component & Props:** Tách component nhỏ tái sử dụng, form controlled có kiểm tra dữ liệu đầu vào và hiển thị thông báo lỗi thân thiện.
2. **React Hooks:**
   - Khi dùng `useEffect` có timer (`setInterval`/`setTimeout`) hoặc event listener, BẮT BUỘC phải có hàm cleanup trả về.
   - Dùng `useMemo` khi tính toán giỏ hàng, tổng tiền đơn thuốc hoặc lọc danh sách lớn.
   - Tận dụng các Custom Hook có sẵn trong `src/hooks/` (`useCountdown`, `useDebounce`, `useFetch`).
3. **Quản lý State:**
   - Dữ liệu toàn cục (Đăng nhập User, Theme sáng/tối): Dùng `Context API` (`useAuth`, `useTheme`).
   - Dữ liệu quy trình nghiệp vụ (Giỏ slot đặt khám, đơn thuốc nháp): Dùng `Redux Toolkit` (`useSelector`, `useDispatch`).
4. **Backend REST API:**
   - URL tài nguyên ở dạng danh từ số nhiều: `/api/doctors`, `/api/appointments`, `/api/medicines`.
   - Trả mã trạng thái chuẩn: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict - Chống trùng slot), 500 (Server Error).
   - Kiểm tra dữ liệu đầu vào và phân quyền RBAC tại middleware.

## 5. Hướng dẫn giải thích cho sinh viên (Bắt buộc)
Sau khi sinh mã nguồn, bạn LUÔN PHẢI cung cấp một đoạn tóm tắt ngắn:
- Giải thích các Hook đã dùng và lý do sử dụng.
- Nêu rõ mã HTTP Status Code và cấu trúc dữ liệu trả về từ API.
- Cung cấp gợi ý câu trả lời mẫu nếu giảng viên hỏi vấn đáp về đoạn code này.
