/* src/pages/Auth/ResetPassword.js */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleReset = (e) => {
    e.preventDefault();

    if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    // Xử lý thành công
    alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <h2>Đặt Lại Mật Khẩu</h2>
      <form className="auth-form" onSubmit={handleReset}>
        <div className="form-control">
          <label>Mật khẩu mới</label>
          <input 
            type="password" 
            placeholder="Nhập mật khẩu mới" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label>Nhập lại mật khẩu</label>
          <input 
            type="password" 
            placeholder="Nhập lại mật khẩu mới" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="auth-btn">Lưu Mật Khẩu</button>
      </form>
    </div>
  );
};

export default ResetPassword;
