import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiSend, FiArrowLeft } from 'react-icons/fi';
import './Auth.css';

// ĐỊNH NGHĨA URL BACKEND TRỰC TIẾP
const LARAVEL_API_URL = 'http://127.0.0.1:8000/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockSeconds, setLockSeconds] = useState(0);

  const getLockoutMessage = (seconds) => `Hệ thống tạm dừng gửi mã. Vui lòng quay lại sau ${seconds} giây.`;

  useEffect(() => {
    if (lockSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setLockSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError("Quý khách vui lòng cung cấp địa chỉ Email định danh!");
      return;
    }

    if (lockSeconds > 0) {
      setError(getLockoutMessage(lockSeconds));
      return;
    }

    try {
      setLoading(true);

      // GỌI TRỰC TIẾP LARAVEL
      const response = await fetch(`${LARAVEL_API_URL}/password/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        // Xử lý lỗi spam (Throttle) 429 từ Laravel
        if (response.status === 429) {
          setLockSeconds(60);
          throw new Error('Yêu cầu quá thường xuyên. Vui lòng đợi một lát.');
        }
        throw new Error(data.message || 'Email không tồn tại trong hệ thống.');
      }

      // CHUYỂN HƯỚNG SANG TRANG NHẬP OTP
      // Gửi kèm email và temp_token qua state để trang sau sử dụng
      console.log('OTP đã được gửi tới Mailhog');
      navigate('/verify-otp', { 
        state: { 
          email: email.trim(), 
          tempToken: data.temp_token 
        } 
      });

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
          <h2 className="auth-title">Khôi Phục Mật Khẩu</h2>
          <p className="auth-subtitle">
            Quý khách vui lòng nhập Email định danh. Chúng tôi sẽ gửi mã OTP bảo mật để thiết lập lại quyền truy cập.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message luxury-alert">{error}</div>}
          
          <div className="form-control">
            <label>Email đã đăng ký</label>
            <div className="input-wrapper">
              <FiMail className="input-icon gold-text" />
              <input 
                type="email" 
                placeholder="example@lumina.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="auth-btn gold-btn" disabled={loading}>
            {loading ? 'ĐANG GỬI MÃ...' : 'GỬI MÃ XÁC THỰC'} <FiSend />
          </button>
          
          {lockSeconds > 0 && (
            <div className="lockout-hint" style={{ color: '#c5a059', fontSize: '0.85rem', marginTop: '10px', textAlign: 'center' }}>
              {getLockoutMessage(lockSeconds)}
            </div>
          )}
        </form>

        <div className="auth-link" style={{ marginTop: '30px' }}>
          <Link to="/login" className="back-to-login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FiArrowLeft /> Trở về trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;