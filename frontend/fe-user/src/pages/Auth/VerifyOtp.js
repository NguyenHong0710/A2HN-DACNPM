/* src/pages/Auth/VerifyOtp.js */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy email được truyền từ trang trước (nếu không có thì dùng email mẫu)
  const email = location.state?.email || "email@example.com";
  
  const [otp, setOtp] = useState('');

  const handleVerify = (e) => {
    e.preventDefault();
    
    // Quy định mã đúng là "123456" để test
    if (otp === "123456") {
      alert("Xác thực thành công!");
      // Chuyển sang bước 3: Đổi mật khẩu
      navigate('/reset-password', { state: { email } });
    } else {
      alert("Mã OTP không đúng! (Gợi ý: nhập 123456)");
    }
  };

  return (
    <div className="auth-container">
      <h2>Nhập Mã Xác Thực</h2>
      <p style={{marginBottom: 20, color: '#666', fontSize: '14px'}}>
        Mã xác thực gồm 6 số đã được gửi tới email: <b>{email}</b>
      </p>

      <form className="auth-form" onSubmit={handleVerify}>
        <div className="form-control">
          <label>Mã OTP</label>
          <input 
            type="text" 
            placeholder="Nhập mã 6 số (123456)" 
            value={otp}
            maxLength="6"
            onChange={(e) => setOtp(e.target.value)}
            style={{
              textAlign: 'center', 
              letterSpacing: '5px', 
              fontSize: '20px', 
              fontWeight: 'bold'
            }}
          />
        </div>

        <button type="submit" className="auth-btn">Xác Nhận</button>
      </form>
    </div>
  );
};

export default VerifyOtp;
