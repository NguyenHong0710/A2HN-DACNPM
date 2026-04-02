// -------------------------------------------------------------------
// CẤU HÌNH KẾT NỐI TRỰC TIẾP API (FRONTEND -> BACKEND)
// -------------------------------------------------------------------

// Hàm xóa dấu gạch chéo '/' dư thừa ở cuối URL
const stripTrailingSlash = (value) => (value || '').replace(/\/$/, '');

// Lấy trực tiếp URL từ file .env. 
// Nếu quên cấu hình .env, nó sẽ gọi mặc định đến http://127.0.0.1:8000/api
const envBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const API_BASE = stripTrailingSlash(envBase);

console.log("Đang gọi API trực tiếp đến:", API_BASE); // Dòng này giúp bạn check lỗi F12