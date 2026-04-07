import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilHistory,
  cilChartPie,
  cilPuzzle,
  cilContact,
  cilMoney,
  cilSpeech,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const getNavItems = (unreadCount) => [
  // ===== STYLE NHẸ: CHỈ TÔ MÀU GROUP ĐANG SỔ =====
  {
    component: () => (
      <style>
        {`
          /* CHỈ đổi màu dòng group khi mở */
          .sidebar-nav .nav-group.show > .nav-group-toggle {
            background-color: rgba(255, 255, 255, 0.08);
          }
        `}
      </style>
    ),
  },

  // ===== TỔNG QUAN =====
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/admin/dashboard',
    icon: <CIcon icon={cilSpeedometer} className="nav-icon" />,
  },

  // ===== QUẢN LÝ =====
  {
    component: CNavTitle,
    name: 'Quản lý',
  },
    { component: CNavItem, name: 'Quản lý người dùng', to: '/admin/manage' },

  { component: CNavItem, name: 'Sản phẩm', to: '/admin/products' },
  { component: CNavItem, name: 'Hóa đơn', to: '/admin/invoice' },
  { component: CNavItem, name: 'Vận chuyển', to: '/admin/shipping' },
      { component: CNavItem, name: 'Quản lý danh mục', to: '/admin/category' },

  { component: CNavItem, name: 'Doanh thu', to: '/admin/revenue' },
  
{
  component: CNavItem,
  name: 'Nhật ký hệ thống',
  to: '/admin/logs',
  icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
},
  // ===== TƯƠNG TÁC =====
  {
    component: CNavTitle,
    name: 'Tương tác',
  },
  { component: CNavItem, name: 'Đánh giá & phản hồi', to: '/admin/reviews' },
  { component: CNavItem, name: 'Khuyến mãi', to: '/admin/promotions' },
  

  // ===== TÀI KHOẢN =====
  {
    component: CNavTitle,
    name: 'Tài khoản',
  },
  {
    component: CNavItem,
    name: 'Hồ sơ của tôi',
    to: '/admin/profile',
    icon: <CIcon icon={cilContact} className="nav-icon" />,
  },
]

export default getNavItems
