import React, { useState, useEffect } from 'react'
import {
  CButton, CCard, CCardBody, CCol, CContainer, CForm, CFormInput, CInputGroup, CInputGroupText, CRow, CAlert, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilEnvelopeClosed, cilShieldAlt } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { API_BASE as API_BASE_URL } from 'src/config';

const Register = () => {
  const navigate = useNavigate(); 
  const [step, setStep] = useState('form'); 
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', repeatPassword: ''
  });
  
  const [otpInput, setOtpInput] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  
  // State lưu trữ đường dẫn hình ảnh banner
  const [banner, setBanner] = useState('');

  // Lấy dữ liệu banner khi load trang
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        // Cập nhật 'banner_api.php' thành tên file PHP xử lý banner thực tế của bạn
        const res = await fetch(`${API_BASE_URL}/banner.php?action=list`);
        const data = await res.json();
        
        if (data.status === 'success' && data.data && data.data.system) {
          // Tìm banner dành riêng cho trang đăng ký
          const regBanner = data.data.system.find(item => item.banner_key === 'register');
          if (regBanner && regBanner.image_path) {
            setBanner(`${API_BASE_URL}/${regBanner.image_path}`);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải banner:", err);
      }
    };

    fetchBanner();
  }, []);

  const handleChange = (e) => {
    setError(''); 
    setFormData({...formData, [e.target.name]: e.target.value});
  }

  const validateForm = () => {
    const { username, email, password, repeatPassword } = formData;
    if (!username || !email || !password) {
      setError("Vui lòng điền đầy đủ các trường thông tin!");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Định dạng Email không hợp lệ!");
      return false;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return false;
    }
    if (password !== repeatPassword) {
      setError("Mật khẩu nhập lại không khớp!");
      return false;
    }
    return true;
  }

  const handleRegisterInit = async () => {
      setError(''); 
      if (!validateForm()) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/register_init.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.username,
            email: formData.email,
            password: formData.password
          })
        });
        const data = await res.json();
        if (data.status === 'success') {
          setTempToken(data.temp_token); 
          setStep('otp'); 
          alert(`Mã OTP đã gửi đến ${formData.email}.`);
        } else {
          setError(data.message); 
          window.scrollTo(0, 0); 
        }
      } catch (err) {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại!");
      } finally {
        setLoading(false);
      }
  }

  const handleVerifyOtp = async () => {
    const cleanOtp = otpInput.trim();
    if(!cleanOtp || cleanOtp.length !== 6) return setError("Vui lòng nhập đúng 6 số OTP");
    setLoading(true);
    setError('');
    try {
        const res = await fetch(`${API_BASE_URL}/verify_register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tempToken, otp_input: cleanOtp })
        });
        const data = await res.json();
        if (data.status === 'success') {
            alert("Đăng ký thành công!");
            navigate('/login');
        } else {
            const newAttempts = otpAttempts + 1;
            setOtpAttempts(newAttempts);
            if (newAttempts >= 3) {
                alert("Sai mã quá 3 lần. Vui lòng đăng ký lại.");
                window.location.reload(); 
            } else {
                setError(`${data.message || 'Mã xác nhận sai'}. Bạn còn ${3 - newAttempts} lần thử.`);
            }
        }
    } catch (err) {
        setError("Lỗi hệ thống. Vui lòng thử lại.");
    } finally {
        setLoading(false);
    }
  }

  // --- STYLE ---
  const whiteCardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    border: 'none',
  };

  const grayInputStyle = {
    backgroundColor: '#dee2e6', 
    border: '1px solid #adb5bd',
    color: '#000000', 
    borderRadius: '8px',
    fontWeight: '500' 
  };

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      overflow: 'hidden', 
      backgroundColor: '#000',
      backgroundImage: banner ? `url(${banner})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      
      <style>{`
        .custom-placeholder::placeholder {
          color: #495057 !important;
          font-weight: 600 !important;
          opacity: 1;
        }
        .text-black-custom {
          color: #000000 !important;
        }
        .login-link:hover {
          color: #1b9e3e !important;
          text-decoration: underline !important;
        }
      `}</style>

      {/* Lớp phủ mờ giúp Card hiển thị rõ ràng hơn khi có ảnh nền */}
      <div className="min-vh-100 d-flex flex-row align-items-center" style={{ position: 'relative', zIndex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={9} lg={7} xl={5}>
              
              <CCard className="mx-4 shadow-lg" style={whiteCardStyle}>
                <CCardBody className="p-4 p-md-5">
                  
                  {step === 'form' && (
                    <CForm>
                      <div className="text-center mb-4">
                        <h1 className="text-success fw-bold">Đăng Ký admin</h1>
                        <p className="text-black-custom fw-medium">Bắt đầu hành trình kinh doanh nông sản của bạn</p>
                      </div>
                      
                      {error && <CAlert color="danger" className="py-2 small mb-4">{error}</CAlert>}

                      <div className="mb-3">
                        <label className="small fw-bold text-black-custom mb-1">Tên tài khoản</label>
                        <CInputGroup>
                          <CInputGroupText style={grayInputStyle} className="border-end-0 border-top-right-0 border-bottom-right-0">
                            <CIcon icon={cilUser} className="text-success" />
                          </CInputGroupText>
                          <CFormInput 
                            style={grayInputStyle}
                            className="border-start-0 custom-placeholder"
                            placeholder="Nhập tên tên cửa hàng của bạn" 
                            name="username" 
                            value={formData.username}
                            onChange={handleChange} 
                          />
                        </CInputGroup>
                      </div>
                      
                      <div className="mb-3">
                        <label className="small fw-bold text-black-custom mb-1">Email</label>
                        <CInputGroup>
                          <CInputGroupText style={grayInputStyle} className="border-end-0 border-top-right-0 border-bottom-right-0">
                            <CIcon icon={cilEnvelopeClosed} className="text-success" />
                          </CInputGroupText>
                          <CFormInput 
                            style={grayInputStyle}
                            className="border-start-0 custom-placeholder"
                            placeholder="email@example.com" 
                            name="email" 
                            value={formData.email}
                            onChange={handleChange} 
                          />
                        </CInputGroup>
                      </div>

                      <div className="mb-3">
                        <label className="small fw-bold text-black-custom mb-1">Mật khẩu</label>
                        <CInputGroup>
                          <CInputGroupText style={grayInputStyle} className="border-end-0 border-top-right-0 border-bottom-right-0">
                            <CIcon icon={cilLockLocked} className="text-success" />
                          </CInputGroupText>
                          <CFormInput 
                            style={grayInputStyle}
                            className="border-start-0 custom-placeholder"
                            type="password" 
                            placeholder="Tối thiểu 6 ký tự" 
                            name="password" 
                            value={formData.password}
                            onChange={handleChange} 
                          />
                        </CInputGroup>
                      </div>

                      <div className="mb-4">
                        <label className="small fw-bold text-black-custom mb-1">Xác nhận mật khẩu</label>
                        <CInputGroup>
                          <CInputGroupText style={grayInputStyle} className="border-end-0 border-top-right-0 border-bottom-right-0">
                            <CIcon icon={cilLockLocked} className="text-success" />
                          </CInputGroupText>
                          <CFormInput 
                            style={grayInputStyle}
                            className="border-start-0 custom-placeholder"
                            type="password" 
                            placeholder="Nhập lại mật khẩu" 
                            name="repeatPassword" 
                            value={formData.repeatPassword}
                            onChange={handleChange} 
                          />
                        </CInputGroup>
                      </div>

                      <div className="d-grid mt-4">
                        <CButton 
                          color="success" 
                          onClick={handleRegisterInit} 
                          disabled={loading} 
                          className="text-white fw-bold py-2 shadow-sm"
                        >
                          {loading ? <CSpinner size="sm"/> : 'TIẾP TỤC & GỬI MÃ'}
                        </CButton>
                      </div>

                      {/* DÒNG CHUYỂN VỀ LOGIN */}
                      <div className="text-center mt-3">
                        <span className="text-black-custom small">Đã có tài khoản? </span>
                        <span 
                          className="text-success small fw-bold login-link" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate('/login')}
                        >
                          Quay lại đăng nhập
                        </span>
                      </div>
                    </CForm>
                  )}

                  {step === 'otp' && (
                    <CForm>
                      <div className="text-center mb-4">
                        <CIcon icon={cilShieldAlt} size="3xl" className="text-success mb-2"/>
                        <h3 className="fw-bold text-black-custom">Xác Thực OTP</h3>
                        <p className="text-black-custom small">Nhập mã đã gửi tới <strong>{formData.email}</strong></p>
                      </div>

                      {error && <CAlert color="danger" className="text-center py-2 small">{error}</CAlert>}

                      <div className="mb-4">
                        <CFormInput 
                          style={{ ...grayInputStyle, height: '55px', fontSize: '1.5rem', letterSpacing: '8px' }}
                          className="text-center fw-bold custom-placeholder"
                          placeholder="000000" 
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                      </div>

                      <div className="d-grid gap-2">
                        <CButton color="success" onClick={handleVerifyOtp} disabled={loading} className="text-white fw-bold py-2">
                          {loading ? <CSpinner size="sm"/> : 'XÁC NHẬN ĐĂNG KÝ'}
                        </CButton>
                        <CButton color="link" className="text-decoration-none text-muted small fw-bold" onClick={() => window.location.reload()}>
                          Quay lại sửa thông tin
                        </CButton>
                      </div>
                    </CForm>
                  )}

                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    </div>
  )
}

export default Register