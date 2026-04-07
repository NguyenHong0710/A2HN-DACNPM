/* src/components/Layout/Header.js */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUser, FaBell } from 'react-icons/fa';
import { useCart } from '../../store/CartContext';
import { useNotification } from '../../store/NotificationContext';
import './Header.css';

const Header = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  
  // Lấy dữ liệu từ kho thông báo
  const { notifications, unreadCount, markAllAsRead } = useNotification();
  
  const [showNotify, setShowNotify] = useState(false);
  const notifyRef = useRef(null);

  // 👇 GIỮ NGUYÊN LOGIC USER CỦA BẠN
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // 👇 MỚI: Thêm state để quản lý chữ đang gõ trong ô tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(role);
    setIsLoggedIn(!!token);
    setUserName(user.name || '');
  }, []);

  // Listen for login/logout events to update header
  useEffect(() => {
    const handleLoginLogout = () => {
      const role = localStorage.getItem('userRole');
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setUserRole(role);
      setIsLoggedIn(!!token);
      setUserName(user.name || '');
      setShowProfileMenu(false);
      console.log('Header updated:', { role, isLoggedIn: !!token, userName: user.name });
    };

    window.addEventListener('login', handleLoginLogout);
    window.addEventListener('logout', handleLoginLogout);
    
    return () => {
      window.removeEventListener('login', handleLoginLogout);
      window.removeEventListener('logout', handleLoginLogout);
    };
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 👇 CẬP NHẬT: Hàm handleSearch dùng được cho cả Enter và Click icon
  const handleSearch = (e) => {
    // Nếu nhấn Enter hoặc nhấn trực tiếp vào icon kính lúp
    if ((e.key === 'Enter' || e.type === 'click') && searchTerm.trim() !== '') {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Click ra ngoài thì tắt menu thông báo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setShowNotify(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="header-container">
      <Link to="/" className="logo">🌾 AgriMarket</Link>

      <div className="search-box">
        {/* 👇 Thêm onClick để nhấn vào icon cũng tìm được */}
        <FaSearch color="#666" onClick={handleSearch} style={{ cursor: 'pointer' }} />
        <input 
          type="text" 
          placeholder="Tìm kiếm rau, củ, quả..." 
          value={searchTerm} // Gắn giá trị từ state
          onChange={(e) => setSearchTerm(e.target.value)} // Cập nhật chữ khi gõ
          onKeyDown={handleSearch}
        />
      </div>

      <div className="actions">
        <nav className="nav-links">
          <Link to="/">Trang chủ</Link>
          <Link to="/about">Giới thiệu</Link>
          <Link to="/voucher">Ưu đãi</Link>
          <Link to="/contact">Liên hệ</Link>
          {userRole === 'vendor' && <Link to="/vendor/panel" style={{ color: '#ff9800', fontWeight: 'bold' }}>⚙️ Quản lý</Link>}
        </nav>

        {/* --- KHU VỰC THÔNG BÁO (GIỮ NGUYÊN) --- */}
        <div 
          className="header-action-item notification-wrapper" 
          ref={notifyRef}
          onClick={() => {
            setShowNotify(!showNotify);
            if (!showNotify) markAllAsRead();
          }}
        >
          <div className="header-action-link">
            <FaBell size={20} className="notification-icon" />
            <span className="action-label">Thông báo</span>
          </div>
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}

          {showNotify && (
            <div className="notification-dropdown">
              <div className="notify-header">Thông báo mới</div>
              <div className="notify-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((item) => (
                    <div key={item.id} className={`notify-item ${item.unread ? 'unread' : ''}`}>
                      <img src={item.image || "https://cdn-icons-png.flaticon.com/512/3602/3602145.png"} alt="icon" className="notify-img" />
                      <div className="notify-content">
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                        <span className="notify-time">{item.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{padding: '15px', textAlign: 'center', color: '#999'}}>Chưa có thông báo nào</p>
                )}
              </div>

              <div style={{
                  borderTop: '1px solid #eee', 
                  padding: '12px', 
                  textAlign: 'center',
                  backgroundColor: '#f9f9f9',
                  borderBottomLeftRadius: '8px',
                  borderBottomRightRadius: '8px'
              }}>
                  <Link 
                    to="/notifications" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotify(false);
                    }}
                    style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '13px', textDecoration: 'none', display: 'block' }}
                  >
                    Xem tất cả thông báo &rarr;
                  </Link>
              </div>
            </div>
          )}
        </div>

        {/* --- GIỎ HÀNG (GIỮ NGUYÊN) --- */}
        <div className="header-action-item" style={{ position: 'relative' }}>
           <Link to="/cart" className="header-action-link">
              <FaShoppingCart size={20} />
              <span className="action-label">Giỏ hàng</span>
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
           </Link>
        </div>

        {/* --- TÀI KHOẢN (GIỮ NGUYÊN) --- */}
        <div className="header-action-item" ref={profileMenuRef}>
           {isLoggedIn ? (
             <>
               <button 
                 className="header-action-link"
                 onClick={() => setShowProfileMenu(!showProfileMenu)}
                 style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
               >
                 <FaUser size={20} />
                 <span className="action-label">{userName || 'Tài khoản'}</span>
               </button>

               {showProfileMenu && (
                 <div className="profile-dropdown-menu">
                   <div className="profile-menu-header">
                     {userName && <p className="profile-name">{userName}</p>}
                   </div>
                   <div className="profile-menu-items">
                     <Link to="/profile" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                       👤 Thông tin cá nhân
                     </Link>
                     <Link to="/orders" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                       🛒 Đơn hàng của tôi
                     </Link>
                     {userRole === 'vendor' && (
                       <>
                         <div className="profile-menu-divider"></div>
                         <Link to="/vendor/panel" className="profile-menu-item vendor-item" onClick={() => setShowProfileMenu(false)}>
                           ⚙️ Quản lý vendor
                         </Link>
                       </>
                     )}
                     <div className="profile-menu-divider"></div>
                     <button 
                       className="profile-menu-item logout-item"
                       onClick={() => {
                         localStorage.removeItem('token');
                         localStorage.removeItem('user');
                         localStorage.removeItem('userRole');
                         setShowProfileMenu(false);
                         window.dispatchEvent(new Event('logout'));
                         navigate('/login');
                       }}
                       style={{ border: 'none', width: '100%', textAlign: 'left', background: 'none', cursor: 'pointer' }}
                     >
                       🚪 Đăng xuất
                     </button>
                   </div>
                 </div>
               )}
             </>
           ) : (
             <Link to="/login" className="header-action-link">
               <FaUser size={20} />
               <span className="action-label">Tài khoản</span>
             </Link>
           )}
        </div>
      </div>
    </header>
  );
};

export default Header;