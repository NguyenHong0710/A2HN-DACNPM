import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { setAuthSession } from '../../../../user/utils/authStorage.js'
import { API_BASE } from 'src/config';

const API_URL = `${API_BASE}/banner.php`;
const BASE_URL = `${API_BASE}/`;
const API_BASE_URL = API_BASE;

// Màu sắc chủ đạo của Lumina Jewelry
const GOLD_COLOR = '#c5a059';
const BLACK_COLOR = '#111111';

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bgImage, setBgImage] = useState('')

  useEffect(() => {
    const fetchLoginBanner = async () => {
      try {
        const response = await fetch(`${API_URL}?action=list`)
        const result = await response.json()
        if (result.status === "success") {
          const loginBanner = result.data.system.find(b => b.banner_key === 'login')
          if (loginBanner) {
            const fullPath = loginBanner.image_path.startsWith('http') 
              ? loginBanner.image_path 
              : BASE_URL + loginBanner.image_path
            setBgImage(fullPath)
          }
        }
      } catch (err) {
        console.error("Không thể tải banner Lumina:", err)
      }
    }
    fetchLoginBanner()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Vui lòng nhập tài khoản và mật khẩu định danh')
      return
    }
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()

      if (data.status === 'success') {
        const normalizedRole = String(data?.user?.role || '').toLowerCase()
        setAuthSession({
          token: data.token,
          user: { ...data.user, role: normalizedRole || data?.user?.role },
          rememberMe: true,
        })

        if (normalizedRole === 'admin') {
          navigate('/admin/panel', { replace: true })
        } else if (normalizedRole === 'admin') {
          navigate('/admin/dashboard', { replace: true })
        } else {
          setError('Tài khoản không có quyền truy cập không gian quản trị.')
        }
      } else {
        setError(data.message || 'Thông tin xác thực không chính xác.')
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ Lumina.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Background Banner với Overlay cao cấp */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          width: '100%',
          height: '100%',
          backgroundColor: BLACK_COLOR,
          overflow: 'hidden'
        }}
      >
        {bgImage && (
          <>
            <img
              src={bgImage}
              alt="Lumina Luxury Banner"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.6) contrast(1.1)', // Làm tối để nổi bật form
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)'
              }}
            />
          </>
        )}
      </div>

      <div
        className="min-vh-100 d-flex flex-row align-items-center"
        style={{ position: 'relative', zIndex: 2 }}
      >
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={9} lg={8}>
              <CCardGroup className="shadow-lg">
                {/* Cột trái: Form đăng nhập */}
                <CCard className="p-4 border-0" style={{ borderRadius: '15px 0 0 15px', backgroundColor: '#fff' }}>
                  <CCardBody>
                    <CForm>
                      <h1 style={{ color: BLACK_COLOR, fontWeight: '700', fontFamily: 'serif' }}>Đăng Nhập</h1>
                      <p style={{ color: '#666', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '12px' }}>
                        Hệ thống quản trị Tuyệt tác Lumina
                      </p>

                      {error && <CAlert color="danger" className="py-2 small">{error}</CAlert>}

                      <CInputGroup className="mb-3">
                        <CInputGroupText style={{ backgroundColor: 'transparent', borderRight: 'none' }}>
                          <CIcon icon={cilUser} style={{ color: GOLD_COLOR }} />
                        </CInputGroupText>
                        <CFormInput
                          placeholder="Email định danh"
                          style={{ borderLeft: 'none' }}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </CInputGroup>

                      <CInputGroup className="mb-4">
                        <CInputGroupText style={{ backgroundColor: 'transparent', borderRight: 'none' }}>
                          <CIcon icon={cilLockLocked} style={{ color: GOLD_COLOR }} />
                        </CInputGroupText>
                        <CFormInput
                          type="password"
                          placeholder="Mật khẩu bảo mật"
                          style={{ borderLeft: 'none' }}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                      </CInputGroup>

                      {/* ... các phần trên giữ nguyên ... */}

<CRow> {/* Đã sửa từ Row thành CRow */}
  <CCol xs={12}>
    <CButton
      style={{ 
        backgroundColor: BLACK_COLOR, 
        borderColor: BLACK_COLOR,
        padding: '10px 0'
      }}
      className="w-100 text-white fw-bold mb-3 shadow-sm"
      onClick={handleLogin}
      disabled={loading}
    >
      {loading ? 'ĐANG XÁC THỰC...' : 'TRUY CẬP HỆ THỐNG'}
    </CButton>
  </CCol>
  <CCol xs={12} className="text-center">
    <CButton color="link" className="px-0 text-decoration-none" style={{ color: GOLD_COLOR }}>
      Quên mật khẩu bảo mật?
    </CButton>
  </CCol>
</CRow> {/* Đã sửa từ /Row thành /CRow */}

{/* ... các phần dưới giữ nguyên ... */}
                    </CForm>
                  </CCardBody>
                </CCard>

                {/* Cột phải: Quảng bá thương hiệu */}
                <CCard
                  className="text-white py-5 border-0 d-none d-md-flex align-items-center justify-content-center"
                  style={{ 
                    width: '44%', 
                    borderRadius: '0 15px 15px 0',
                    background: `linear-gradient(135deg, ${BLACK_COLOR} 0%, #2c2c2c 100%)`,
                    borderLeft: `1px solid ${GOLD_COLOR}`
                  }}
                >
                  <CCardBody className="text-center">
                    <div>
                      <h2 style={{ fontFamily: 'serif', color: GOLD_COLOR }}>Lumina Privé</h2>
                      <p className="mt-4" style={{ fontStyle: 'italic', opacity: 0.9 }}>
                        "Nơi những giá trị vĩnh cửu được quản trị bằng sự tinh tế và tâm huyết nhất."
                      </p>
                      <div className="mt-4 pt-4 border-top" style={{ borderColor: 'rgba(197, 160, 89, 0.3) !important' }}>
                        <p className="small">Bạn là đối tác nghệ nhân mới?</p>
                        <Link to="/register">
                          <CButton
                            variant="outline"
                            style={{ color: GOLD_COLOR, borderColor: GOLD_COLOR }}
                            className="px-4 fw-bold"
                          >
                            GIA NHẬP HỆ THỐNG
                          </CButton>
                        </Link>
                      </div>
                    </div>
                  </CCardBody>
                </CCard>
              </CCardGroup>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    </>
  )
}

export default Login