import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import { AppSidebarNav } from './AppSidebarNav'
import { API_BASE } from 'src/config';
import getNavItems from '../_nav'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  
  // State quản lý số tin nhắn chưa đọc
  const [unreadCount, setUnreadCount] = useState(0)

  // Lấy ID người dùng hiện tại
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userId = storedUser.id || 1

  // Hàm fetch số tin nhắn chưa đọc từ API
  // Hàm fetch số tin nhắn chưa đọc từ API Laravel
  const fetchUnreadCount = async () => {
    try {
      // Đổi từ message.php sang route API Laravel đã khai báo
      const response = await fetch(`${API_BASE}/get_conversations?user_id=${userId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // Thêm Authorization nếu route này yêu cầu đăng nhập
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Kiểm tra nếu không phải JSON (tránh lỗi Unexpected token '<')
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        return; 
      }

      const data = await response.json();
      
      // Laravel trả về { status: 'success', data: [] } theo file api.php bạn đã gửi
      const messageData = data.data || []; 
      
      if (Array.isArray(messageData)) {
        const total = messageData.reduce((acc, curr) => acc + parseInt(curr.unread || 0), 0);
        setUnreadCount(total);
      }
    } catch (error) {
      // Không log lỗi ra console liên tục để tránh làm lag trình duyệt
      // console.error('Lỗi khi lấy số tin nhắn:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount()
    // Cập nhật sau mỗi 10 giây
    const interval = setInterval(fetchUnreadCount, 10000)
    return () => clearInterval(interval)
  }, [userId])

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom d-flex align-items-center justify-content-center">
        <CSidebarBrand
          to="/vendor/dashboard"
          className="fw-bold fs-4 text-decoration-none text-center w-100"
          style={{
            color: '#60A5FA',
            letterSpacing: '1.5px',
            textShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }}
        >
          <span style={{ color: '#D99485' }}>Lumina Jewerly</span>
       
        </CSidebarBrand>

        <CCloseButton
          className="d-lg-none position-absolute end-0 me-2"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>

      {/* Truyền kết quả của hàm getNavItems với tham số unreadCount */}
      <AppSidebarNav items={getNavItems(unreadCount)} />

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)