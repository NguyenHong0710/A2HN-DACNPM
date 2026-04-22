import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilLockLocked,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { clearAuthSession } from '../../../user/utils/authStorage.js'
import { API_BASE } from 'src/config';

const normalizeAvatarUrl = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return ''
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('blob:')) {
    return avatar
  }

  const cleaned = avatar.startsWith('/') ? avatar.slice(1) : avatar
  return `${API_BASE}/${cleaned}`
}

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const getInitial = (name) => (name || 'V').trim().charAt(0).toUpperCase()
  
  const [userId, setUserId] = useState(null) // Thêm state lưu ID để đăng xuất
  const [userName, setUserName] = useState('Khách hàng')
  const [userAvatar, setUserAvatar] = useState('')

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
        try {
            const user = JSON.parse(userString);
            if (user.id) setUserId(user.id); // Lấy ID từ localStorage
            if (user.name) setUserName(user.name);
            if (user.avatar) setUserAvatar(normalizeAvatarUrl(user.avatar));
        } catch (e) {
            console.error("Lỗi đọc dữ liệu user", e);
        }
    }
  }, []);

  // Chuyển hàm thành async để gọi API
  const handleLogout = async () => {
    if (userId) {
      try {
        // Gọi API cập nhật is_online = 0
        await fetch(`${API_BASE}/logout?id=${userId}`, {
          method: 'GET'
        });
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái offline:", error);
      }
    }

    // Tiến hành xóa cache nội bộ và điều hướng
    clearAuthSession();
    alert('Đã đăng xuất thành công!');
    navigate('/login', { replace: true });
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar
          src={userAvatar || undefined}
          size="md"
          color={!userAvatar ? 'success' : undefined}
          textColor={!userAvatar ? 'white' : undefined}
          onError={(event) => {
            setUserAvatar('')
          }}
        >
          {!userAvatar ? getInitial(userName) : null}
        </CAvatar>
      </CDropdownToggle>
      
      {/* Thêm min-width để dropdown rộng ra một chút cho tên dài không bị xấu */}
      <CDropdownMenu className="pt-0" placement="bottom-end" style={{ minWidth: '220px' }}>
        
        {/* --- PHẦN HEADER ĐƯỢC CHỈNH SỬA --- */}
        <CDropdownHeader className="bg-body-secondary py-3">
          <div className="small text-body-secondary fw-semibold mb-1">Xin chào,</div>
          <div className="fw-bold fs-5 text-body-emphasis text-uppercase text-truncate">
                {userName}
            </div>
        </CDropdownHeader>
        {/* ---------------------------------- */}
        
        <CDropdownItem 
            onClick={() => navigate('/admin/profile')} 
            style={{ cursor: 'pointer' }}
          className="py-2 text-body-emphasis"
        >
          <CIcon icon={cilUser} className="me-2 text-primary" />
          Hồ sơ cửa hàng
        </CDropdownItem>

        <CDropdownDivider />

        <CDropdownItem 
            onClick={handleLogout} 
            style={{ cursor: 'pointer' }}
            className="py-2 text-danger"
        >
          <CIcon icon={cilLockLocked} className="me-2" />
          Đăng xuất
        </CDropdownItem>
        
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown