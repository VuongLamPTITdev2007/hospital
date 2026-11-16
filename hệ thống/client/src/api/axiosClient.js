import axios from 'axios';

// Khởi tạo instance Axios dùng chung toàn dự án
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Tự động đính kèm Token JWT nếu đã đăng nhập
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medcare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý dữ liệu trả về và bắt lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ!';
    
    // Nếu token hết hạn (401), xóa token và điều hướng về trang đăng nhập
    if (error.response?.status === 401) {
      localStorage.removeItem('medcare_token');
      localStorage.removeItem('medcare_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
