import React from 'react'

// Dashboard
const Dashboard = React.lazy(() => import('../admin/views/dashboard/Dashboard'))

// Pages
const Login = React.lazy(() => import('../admin/views/pages/login/Login'))
const Register = React.lazy(() => import('../admin/views/pages/register/Register'))
const Page404 = React.lazy(() => import('../admin/views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('../admin/views/pages/page500/Page500'))
const Reviews = React.lazy(() => import('./views/reviews/Reviews'))
const manage_user = React.lazy(() => import('./views/manage_user/manage'))
// Sửa lại dòng số 9 thành như thế này:
const ManageLogs = React.lazy(() => import('./views/logs/ManageLogs'))
// Features

const Products = React.lazy(() => import('../admin/views/products/Products'))
const AdminProfile = React.lazy(() => import('./views/profile/AdminProfile')) // ✅ đúng tên file
const Revenue = React.lazy(() => import('../admin/views/revenue/Revenue'))
const Invoice = React.lazy(() => import('./views/invoices/Invoice'))
const Shipping = React.lazy(() => import('./views/shipping/Shipping'))

const CategoryJewelry = React.lazy(() => import('./views/category/category'))

const Promotions = React.lazy(() => import('./views/promotions/Promotions'))


const routes = [
  { path: '/admin', name: 'Home' },
  { path: '/admin/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/admin/reviews', name: 'Đánh Giá', element: Reviews },
  { path: '/admin/login', name: 'Login', element: Login },
  { path: '/admin/register', name: 'Register', element: Register },
  { path: '/admin/404', name: 'Page 404', element: Page404 },
  { path: '/admin/500', name: 'Page 500', element: Page500 },
  
  { path: '/admin/shipping', name: 'Vận Chuyển', element: Shipping },
  
  { path: '/admin/promotions', name: 'Khuyến Mãi', element: Promotions },
  { path: '/admin/products', name: 'Products', element: Products },
  { path: '/admin/profile', name: 'Admin Profile', element: AdminProfile },
  { path: '/admin/revenue', name: 'Revenue', element: Revenue },
  { path: '/admin/invoice', name: 'Invoice', element: Invoice },
    { path: '/admin/manage', name: 'manage', element: manage_user },
      { path: '/admin/category', name: 'category', element: CategoryJewelry },
{ path: '/admin/logs', name: 'Nhật ký hoạt động', element: ManageLogs },

]

export default routes