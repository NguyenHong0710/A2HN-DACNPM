import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import { setAuthSession } from "../../utils/authStorage";
import './Auth.css';

// Lưu ý: Nếu bạn dùng ApiFetchAdapter, bạn có thể chỉ cần để '/api'
// Nhưng để chắc chắn nhất, ta dùng URL tuyệt đối của Laravel
const LARAVEL_API_URL = 'http://127.0.0.1:8000/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lấy đường dẫn trước đó hoặc mặc định là trang chủ
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${LARAVEL_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        throw new Error("Máy chủ phản hồi không đúng định dạng JSON.");
      }

      if (!response.ok) {
        throw new Error(data.message || 'Thông tin đăng nhập không chính xác.');
      }

      // --- PHẦN QUAN TRỌNG NHẤT: ĐỒNG BỘ STORAGE ---
      // data.token và data.user phải khớp với cấu trúc trả về từ Laravel
      if (data.token && data.user) {
        setAuthSession({ 
          token: data.token, 
          user: data.user, 
          rememberMe: true 
        });

        // Kích hoạt event để Header cập nhật (nếu có)
        window.dispatchEvent(new Event('login'));

        const role = String(data.user.role || '').toLowerCase();
        console.log("Đăng nhập thành công! Role:", role);

        // Điều hướng dựa trên Role
        if (['admin', 'staff', 'vendor'].includes(role)) {
          console.log("Đang chuyển hướng tới Admin Dashboard...");
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        throw new Error("Không nhận được thông tin xác thực từ máy chủ.");
      }

    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper luxury-theme">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">Lumina<span>Jewelry</span></div>
          <h2 className="auth-title">Chào mừng Quý khách trở lại</h2>
          <p className="auth-subtitle">Đăng nhập để chiêm ngưỡng tuyệt tác trang sức</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          {error && <div className="error-message luxury-alert">{error}</div>}
          
          <div className="form-control">
            <label>Email định danh</label>
            <div className="input-wrapper">
              <FiMail className="input-icon gold-text" />
              <input 
                type="email" 
                placeholder="Nhập email của bạn" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>
          
          <div className="form-control" style={{ marginBottom: '10px' }}>
            <label>Mật khẩu bảo mật</label>
            <div className="input-wrapper">
              <FiLock className="input-icon gold-text" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </div>

          {/* --- NÚT QUÊN MẬT KHẨU ĐƯỢC THÊM VÀO ĐÂY --- */}
          <div className="forgot-password-link" style={{ textAlign: 'right', marginBottom: '25px' }}>
            <Link to="/forgot-password" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>
              Quý khách quên mật khẩu?
            </Link>
          </div>
          {/* ------------------------------------------- */}

          <button type="submit" className="auth-btn gold-btn" disabled={loading}>
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP HỆ THỐNG'} <FiLogIn />
          </button>
        </form>

        <div className="auth-link">
          Quý khách chưa có tài khoản? <Link to="/register">Khởi tạo ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;