import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiLock, FiChevronLeft, FiCheck } from 'react-icons/fi';
import './Auth.css';

// ĐỊNH NGHĨA URL BACKEND TRỰC TIẾP
const LARAVEL_API_URL = 'http://127.0.0.1:8000/api';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy dữ liệu được truyền từ trang ForgotPassword sang
  const email = location.state?.email || "Quý khách";
  const tempToken = location.state?.tempToken || '';
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    const otpValue = otp.trim();
    if (otpValue.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã OTP gồm 6 số.');
      return;
    }

    if (!tempToken) {
      setError('Phiên xác thực đã hết hạn. Vui lòng quay lại bước nhập Email.');
      return;
    }

    try {
      setLoading(true);

      // GỌI TRỰC TIẾP LARAVEL
      const response = await fetch(`${LARAVEL_API_URL}/password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          token: tempToken,     // temp_token nhận từ bước trước
          otp_input: otpValue   // mã 6 số người dùng nhập
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Mã xác thực không chính xác hoặc đã hết hạn.');
      }

      // XÁC THỰC THÀNH CÔNG
      // Chuyển sang trang đặt lại mật khẩu, gửi kèm reset_token nhận được từ server
      navigate('/reset-password', {
        state: {
          email,
          resetToken: data.reset_token || '', // reset_token dùng để "chốt" việc đổi mật khẩu
        },
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
          <h2 className="auth-title">Xác Thực Danh Tính</h2>
          <p className="auth-subtitle">
            Mã OTP bảo mật đã được gửi tới:<br/>
            <strong className="gold-text">{email}</strong>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleVerify}>
          {error && <div className="error-message luxury-alert">{error}</div>}
          
          <div className="form-control">
            <label>Mã xác thực OTP (6 số)</label>
            <div className="input-wrapper">
              <FiLock className="input-icon gold-text" />
              <input
                type="text"
                placeholder="● ● ● ● ● ●"
                value={otp}
                maxLength="6"
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                autoFocus
                className="text-center otp-input"
                style={{ 
                  letterSpacing: '8px', 
                  fontSize: '24px', 
                  fontWeight: 'bold' 
                }}
              />
            </div>
          </div>

          <button type="submit" className="auth-btn gold-btn" disabled={loading}>
            {loading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN MÃ'} <FiCheck />
          </button>

          <button 
            type="button" 
            className="back-btn-luxury mt-3" 
            onClick={() => navigate('/forgot-password')}
            disabled={loading}
          >
            <FiChevronLeft /> Gửi lại mã khác
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;