/* src/pages/Auth/ForgotPassword.js */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiSend, FiArrowLeft } from 'react-icons/fi';
import './Auth.css'; // Sử dụng chung file CSS với Login/Register

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert("Vui lòng nhập Email của bạn!");
      return;
    }
    
    // Giả lập gửi OTP thành công (Trong thực tế sẽ gọi API)
    alert(`Mã OTP đã được gửi đến: ${email}`);
    
    // Chuyển sang trang nhập OTP, mang theo email vừa nhập để dùng tiếp
    navigate('/verify-otp', { state: { email } });
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            Agri<span>Market</span>
          </div>
          <h2 className="auth-title">Quên Mật Khẩu</h2>
          <p className="auth-subtitle">Nhập địa chỉ email đã đăng ký để nhận mã xác thực (OTP) khôi phục mật khẩu.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-control">
            <label>Email đăng ký</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input 
                type="email" 
                placeholder="Ví dụ: email@gmail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-btn">
            Gửi Mã OTP <FiSend />
          </button>
        </form>

        <div className="auth-link" style={{ marginTop: '30px' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <FiArrowLeft /> Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
