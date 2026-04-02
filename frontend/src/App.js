import React, { Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom' // Đã đổi thành BrowserRouter
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import './admin/scss/style.scss'
import './admin/scss/examples.scss'
import SplashCursor from './admin/components/SplashCursor'
import GlobalMediaPlayer from './admin/layout/GlobalMediaPlayer'
import NekoCat from './admin/components/NekoCat'
import { API_BASE } from './config'
import AdminNotification from './admin/components/AdminNotification'

// 1. IMPORT FILE ROUTES.JS CỦA ADMIN
import routes from './routes' 

// Layouts
const DefaultLayout = React.lazy(() => import('./admin/layout/DefaultLayout'))

// 2. IMPORT CÁC TRANG DÀNH CHO KHÁCH HÀNG (USER PAGES)
const Home = React.lazy(() => import('./user/pages/Home/Home'))
const Shop = React.lazy(() => import('./user/pages/Shop/Shop'))
const ProductDetail = React.lazy(() => import('./user/pages/ProductDetail/ProductDetail'))

// Pages hệ thống
const Login = React.lazy(() => import('./admin/views/pages/login/Login'))
const Register = React.lazy(() => import('./admin/views/pages/register/Register'))
const Page404 = React.lazy(() => import('./admin/views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./admin/views/pages/page500/Page500'))

/**
 * Component Bảo vệ Route (Role-based Authorization)
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token')
  const userJson = localStorage.getItem('user')
  const user = userJson ? JSON.parse(userJson) : null

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/404" replace />
  }

  return children
}

const NotificationWrapper = () => {
  const location = useLocation()
  const userJson = localStorage.getItem('user')
  const currentUser = userJson ? JSON.parse(userJson) : null

  if (currentUser?.role === 'admin' && location.pathname.includes('/admin')) {
    return <AdminNotification />
  }
  return null
}

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  // --- AUTO LOGOUT CHECK ---
  useEffect(() => {
    const checkServerOnce = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      try {
        const res = await fetch(`${API_BASE}/check_status.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (!res.ok) throw new Error('Server error')
        const data = await res.json()
        if (data.logout === true) {
          localStorage.clear()
          window.location.href = '/login'
        }
      } catch (err) {
        console.warn('⚠️ Không check được server', err)
      }
    }
    checkServerOnce()
  }, [])

  useEffect(() => {
    if (!isColorModeSet()) {
      setColorMode(storedTheme)
    }
  }, [isColorModeSet, setColorMode, storedTheme])

  return (
    <BrowserRouter> {/* Sử dụng BrowserRouter để URL đẹp và khớp với ảnh lỗi */}
      <SplashCursor />
      <NekoCat />
      <NotificationWrapper />

      <Suspense fallback={<div className="pt-3 text-center"><CSpinner color="primary" variant="grow" /></div>}>
        <Routes>
          {/* ============================================================ */}
          {/* PUBLIC ROUTES (DÀNH CHO KHÁCH HÀNG) - ĐƯỢC ƯU TIÊN LÊN ĐẦU */}
          {/* ============================================================ */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          
          {/* ROUTE CHI TIẾT SẢN PHẨM: Quan trọng để nhận ID từ URL */}
          <Route path="/product/:id" element={<ProductDetail />} /> 

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/404" element={<Page404 />} />
          <Route path="/500" element={<Page500 />} />

          {/* ============================================================ */}
          {/* ADMIN ROUTES (DÀNH CHO QUẢN TRỊ VIÊN) */}
          {/* ============================================================ */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DefaultLayout />
              </ProtectedRoute>
            }
          >
            {routes.map((route, idx) => (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            ))}
          </Route>

          {/* 404 Catcher */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>

        <GlobalMediaPlayer />
      </Suspense>
    </BrowserRouter>
  )
}

export default App