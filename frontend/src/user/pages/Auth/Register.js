import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus, FiChevronLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FaGoogle, FaFacebookF } from 'react-icons/fa';
import './Auth.css';

const LARAVEL_API_URL = 'http://127.0.0.1:8000/api';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' hoặc 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- THÊM STATE ĐẾM NGƯỢC & GIỚI HẠN SỐ LẦN CHO OTP ---
  const [countdown, setCountdown] = useState(0); 
  const [resendCount, setResendCount] = useState(0); 

  // Chạy bộ đếm ngược thời gian khi ở bước OTP
  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, step]);
  // --------------------------------------------------------

  // 1. Logic kiểm tra lỗi từng ô nhập
  const validateField = (name, value) => {
    let errorMsg = '';
    switch (name) {
      case 'name':
        if (value.trim().length < 3) errorMsg = 'Họ tên phải có ít nhất 3 ký tự.';
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) errorMsg = 'Định dạng Email không hợp lệ (Ví dụ: abc@gmail.com).';
        break;
      case 'password':
        if (value.length < 6) errorMsg = 'Mật khẩu bảo mật phải từ 6 ký tự trở lên.';
        break;
      case 'confirmPassword':
        if (value !== formData.password) errorMsg = 'Mật khẩu xác nhận chưa trùng khớp.';
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Xóa thông báo lỗi chung khi người dùng bắt đầu sửa
    setError('');
    
    // Kiểm tra lỗi ngay lập tức
    const errorMsg = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  // --- BƯỚC 1: GỬI THÔNG TIN ĐĂNG KÝ ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra lại toàn bộ form trước khi gửi
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const msg = validateField(key, formData[key]);
      if (msg) newErrors[key] = msg;
    });

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('Quý khách vui lòng hoàn thiện các thông tin còn thiếu.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${LARAVEL_API_URL}/register/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
            setFieldErrors(data.errors);
            throw new Error('Thông tin không hợp lệ hoặc Email đã tồn tại.');
        }
        throw new Error(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }

      setTempToken(data.temp_token);
      if (data.otp_debug) {
        alert("Hệ thống Mail đang bảo trì. Mã OTP thử nghiệm: " + data.otp_debug);
      }
      
      // Chuyển sang bước OTP, thiết lập lại đếm ngược và đếm số lần (nếu đây là lần đầu)
      setStep('otp');
      setCountdown(60); 
      setResendCount(0);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM XỬ LÝ KHI BẤM NÚT "GỬI LẠI MÃ" TẠI TRANG ĐĂNG KÝ ---
  const handleResendOtp = async () => {
    // 1. Kiểm tra nếu đã quá 5 lần
    if (resendCount >= 5) {
      alert('Bạn đã yêu cầu gửi lại mã quá 5 lần. Hệ thống yêu cầu bạn đăng ký lại để đảm bảo an toàn!');
      // Reset toàn bộ form và quay lại bước 1
      setStep('form');
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setOtp('');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 2. Gọi lại hàm Init để Backend gửi lại mã (coi như đăng ký lại từ đầu)
      const response = await fetch(`${LARAVEL_API_URL}/register/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi lại mã OTP lúc này.');
      }

      // 3. Cập nhật Token mới, reset thời gian và tăng số lần gửi
      setTempToken(data.temp_token);
      setCountdown(60);
      setResendCount((prev) => prev + 1);
      alert('Mã OTP mới đã được gửi tới email của Quý khách!');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- BƯỚC 2: XÁC THỰC OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${LARAVEL_API_URL}/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          token: tempToken,
          otp_input: otp.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Mã xác thực không chính xác.');
      }

      alert('Tuyệt vời! Quý khách đã gia nhập Lumina Jewelry thành công.');
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
          <div className="auth-logo">Lumina<span>Jewelry</span></div>
          <h2 className="auth-title">Gia nhập cộng đồng thượng lưu</h2>
          <p className="auth-subtitle">Sở hữu những tuyệt tác trang sức độc bản</p>
        </div>

        {step === 'form' ? (
          <form className="auth-form" onSubmit={handleRegister} noValidate>
            {error && <div className="error-message luxury-alert">{error}</div>}

            <div className="form-control">
              <label>Họ và tên</label>
              <div className={`input-wrapper ${fieldErrors.name ? 'input-error' : ''}`}>
                <FiUser className="input-icon gold-text" />
                <input type="text" name="name" placeholder="Quý khách vui lòng nhập tên" value={formData.name} onChange={handleChange} required />
              </div>
              {fieldErrors.name && <span className="field-error"><FiAlertCircle /> {fieldErrors.name}</span>}
            </div>

            <div className="form-control">
              <label>Email</label>
              <div className={`input-wrapper ${fieldErrors.email ? 'input-error' : ''}`}>
                <FiMail className="input-icon gold-text" />
                <input type="email" name="email" placeholder="example@lumina.com" value={formData.email} onChange={handleChange} required />
              </div>
              {fieldErrors.email && <span className="field-error"><FiAlertCircle /> {fieldErrors.email}</span>}
            </div>

            <div className="form-control">
              <label>Mật khẩu</label>
              <div className={`input-wrapper ${fieldErrors.password ? 'input-error' : ''}`}>
                <FiLock className="input-icon gold-text" />
                <input type={showPassword ? "text" : "password"} name="password" placeholder="Tối thiểu 6 ký tự" value={formData.password} onChange={handleChange} required />
                <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
              {fieldErrors.password && <span className="field-error"><FiAlertCircle /> {fieldErrors.password}</span>}
            </div>

            <div className="form-control">
              <label>Xác nhận mật khẩu</label>
              <div className={`input-wrapper ${fieldErrors.confirmPassword ? 'input-error' : ''}`}>
                <FiLock className="input-icon gold-text" />
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} required />
                <span className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
              {fieldErrors.confirmPassword && <span className="field-error"><FiAlertCircle /> {fieldErrors.confirmPassword}</span>}
            </div>

            <button type="submit" className="auth-btn gold-btn" disabled={loading}>
              {loading ? 'ĐANG XỬ LÝ...' : 'TIẾP TỤC XÁC THỰC'} <FiUserPlus />
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="otp-intro text-center mb-4">
              <p>Mã xác thực đã được gửi tới email của Quý khách.</p>
              <p className="small-text gold-text">{formData.email}</p>
            </div>
            {error && <div className="error-message luxury-alert">{error}</div>}
            
            <div className="form-control">
              <label>Mã OTP (6 số)</label>
              <div className="input-wrapper">
                <FiLock className="input-icon gold-text" />
                <input 
                  type="text" 
                  placeholder="● ● ● ● ● ●" 
                  className="text-center otp-input-field" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  required 
                  disabled={loading} 
                  autoFocus 
                  style={{ letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <button type="submit" className="auth-btn gold-btn" disabled={loading}>
              {loading ? 'ĐANG XÁC MINH...' : 'XÁC THỰC NGAY'} <FiCheckCircle />
            </button>
            
            {/* --- NÚT GỬI LẠI MÃ MỚI THÊM VÀO ĐÂY --- */}
            <div className="resend-wrapper mt-3 text-center">
              <button 
                type="button" 
                className="resend-otp-btn"
                onClick={handleResendOtp}
                disabled={loading || countdown > 0} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: countdown > 0 ? '#9ca3af' : '#d4af37', // Màu vàng gold nếu bấm được
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  textDecoration: countdown > 0 ? 'none' : 'underline',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                {countdown > 0 
                  ? `Gửi lại mã sau ${countdown}s` 
                  : 'Gửi lại mã xác thực'}
              </button>
              
              {/* Cảnh báo số lần còn lại */}
              {resendCount > 0 && resendCount < 5 && (
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>
                  Bạn còn {5 - resendCount} lần yêu cầu gửi lại mã.
                </p>
              )}
            </div>
            {/* --------------------------------------- */}

            <button type="button" className="back-btn-luxury mt-3" onClick={() => setStep('form')} disabled={loading}>
              <FiChevronLeft /> Quay lại chỉnh sửa thông tin
            </button>
          </form>
        )}

        {/* Ẩn đăng nhập mạng xã hội khi đang ở bước OTP cho đỡ rối mắt */}
        {step === 'form' && (
          <div className="social-login">
            <div className="social-divider">Hoặc kết nối qua</div>
            <div className="social-btn-group">
              <button className="social-btn google-luxury"><FaGoogle /> Google</button>
              <button className="social-btn facebook-luxury"><FaFacebookF /> Facebook</button>
            </div>
          </div>
        )}

        <div className="auth-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;