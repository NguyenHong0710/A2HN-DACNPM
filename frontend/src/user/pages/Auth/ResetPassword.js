import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import './Auth.css';

// ĐỊNH NGHĨA URL BACKEND TRỰC TIẾP
const LARAVEL_API_URL = 'http://127.0.0.1:8000/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy resetToken được truyền từ trang Verify OTP sang
  const resetToken = location.state?.resetToken || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra tính hợp lệ của phiên làm việc
    if (!resetToken) {
      setError('Phiên khôi phục đã hết hạn hoặc không hợp lệ. Quý khách vui lòng thực hiện lại từ đầu.');
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu bảo mật phải bao gồm ít nhất 6 ký tự!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    try {
      setLoading(true);

      // GỌI TRỰC TIẾP LARAVEL
      const response = await fetch(`${LARAVEL_API_URL}/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          token: resetToken, 
          password: password 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể thiết lập mật khẩu mới. Vui lòng thử lại sau.');
      }

      alert('Mật khẩu đã được thiết lập lại thành công. Chào mừng Quý khách trở lại!');
      navigate('/login');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper luxury-theme">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            Lumina<span>Jewelry</span>
          </div>
          <h2 className="auth-title">Khôi Phục Quyền Truy Cập</h2>
          <p className="auth-subtitle">Quý khách vui lòng thiết lập mật khẩu bảo mật mới cho tài khoản của mình</p>
        </div>

        <form className="auth-form" onSubmit={handleReset}>
          {error && <div className="error-message luxury-alert">{error}</div>}
          
          <div className="form-control">
            <label>Mật khẩu mới</label>
            <div className="input-wrapper">
              <FiLock className="input-icon gold-text" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Nhập mật khẩu mới" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </div>

          <div className="form-control">
            <label>Xác nhận mật khẩu mới</label>
            <div className="input-wrapper">
              <FiLock className="input-icon gold-text" />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Xác nhận lại mật khẩu" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
              <span className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="auth-btn gold-btn" disabled={loading}>
            {loading ? 'ĐANG CẬP NHẬT...' : 'THIẾT LẬP LẠI MẬT KHẨU'} <FiCheckCircle />
          </button>
        </form>

        <div className="auth-link">
           Quay lại <Link to="/login">Trang đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;