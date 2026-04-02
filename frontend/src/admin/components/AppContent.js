import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'

// routes config
import routes from '../routes'

// 1. ĐÃ SỬA: Đổi tên và logic từ vendor sang admin
const toAdminChildPath = (path = '') => {
  if (typeof path !== 'string') return path
  if (!path.startsWith('/admin')) return path

  // Cắt bỏ phần '/admin/' ở đầu chuỗi đi để map đúng với relative route
  const childPath = path.replace(/^\/admin\/?/, '')
  return childPath || ''
}

const AppContent = () => {
  return (
    <CContainer className="px-4" lg>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {routes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  // Áp dụng hàm xử lý path mới
                  path={toAdminChildPath(route.path)}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            )
          })}
          
          {/* 2. ĐÃ FIX LỖI VÒNG LẶP VÔ TẬN: Thêm đường dẫn tuyệt đối bắt đầu bằng dấu / */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)