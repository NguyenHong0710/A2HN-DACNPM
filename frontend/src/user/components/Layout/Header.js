import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiBell, FiShoppingCart, FiUser, FiClipboard, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useCart } from '../../store/CartContext';
import { useNotification } from '../../store/NotificationContext';
import { clearAuthSession, getAuthToken, getStoredUser } from '../../utils/authStorage';
import './Header.css';

const Header = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotification();
  
  const [showNotify, setShowNotify] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastItems, setToastItems] = useState([]);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifyRef = useRef(null);
  const profileMenuRef = useRef(null);
  const seenNotifRef = useRef(new Set());
  const hasInitializedNotifRef = useRef(false);

  // Hàm cập nhật trạng thái hiển thị
  const updateStatus = () => {
    const token = getAuthToken();
    const user = getStoredUser() || {};
    setIsLoggedIn(!!token);
    setUserName(user.name || '');
  };

  useEffect(() => {
    updateStatus();
  }, []);

  useEffect(() => {
    const handleLoginLogout = () => {
      updateStatus();
      setShowProfileMenu(false);
    };

    window.addEventListener('login', handleLoginLogout);
    window.addEventListener('logout', handleLoginLogout);
    
    return () => {
      window.removeEventListener('login', handleLoginLogout);
      window.removeEventListener('logout', handleLoginLogout);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setShowNotify(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!Array.isArray(notifications)) return;

    if (!hasInitializedNotifRef.current) {
      notifications.forEach((n) => seenNotifRef.current.add(String(n.id)));
      hasInitializedNotifRef.current = true;
      return;
    }

    const incomingUnread = notifications.filter((n) => n?.unread);
    const newOnes = incomingUnread.filter((n) => !seenNotifRef.current.has(String(n.id))).slice(0, 2);

    if (newOnes.length === 0) return;

    newOnes.forEach((n) => seenNotifRef.current.add(String(n.id)));

    const toastBatch = newOnes.map((n) => ({
      id: `toast-${n.id}-${Date.now()}`,
      title: n.title,
      desc: n.desc,
    }));

    setToastItems((prev) => [...prev, ...toastBatch]);

    toastBatch.forEach((toast) => {
      setTimeout(() => {
        setToastItems((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500);
    });
  }, [notifications]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const keyword = e.target.value.trim();
      navigate(keyword ? `/shop?search=${encodeURIComponent(keyword)}` : '/shop');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="header-container">
        
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* LOGO */}
        <Link to="/" className="logo">
          <span className="logo-highlight">Lumina</span> Jewelry
        </Link>

        {/* NAV */}
        <nav className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Trang Chủ</Link>
          <Link to="/shop" className={location.pathname === '/shop' ? 'active' : ''}>Bộ Sưu Tập</Link>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>Câu Chuyện</Link>
          <Link to="/voucher" className={location.pathname === '/voucher' ? 'active' : ''}>Voucher</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Dịch Vụ</Link>
        </nav>

        {/* ACTIONS */}
        <div className="actions">

          {/* SEARCH */}
          <div className="search-box">
            <FiSearch 
              className="action-icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)} 
            />
            {isSearchOpen && (
              <input 
                type="text" 
                placeholder="Tìm kiếm trang sức..." 
                onKeyDown={handleSearch}
                autoFocus
                className="search-input"
              />
            )}
          </div>

          {/* NOTIFICATION */}
          <div 
            className="notification-wrapper" 
            ref={notifyRef}
            onClick={() => {
              setShowNotify(!showNotify);
              if (!showNotify) markAllAsRead();
            }}
          >
            <FiBell className="action-icon" />
            {unreadCount > 0 && <span className="notification-badge"></span>}

            {showNotify && (
              <div className="notification-dropdown">
                <div className="notify-header">Thông báo mới</div>
                
                <div className="notify-list">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((item) => (
                      <div 
                        key={item.id} 
                        className={`notify-item ${item.unread ? 'unread' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); markAsRead(item.id); }}
                      >
                        <img 
                          src={item.image || "https://cdn-icons-png.flaticon.com/512/3595/3595458.png"} 
                          alt="icon" 
                          className="notify-img" 
                        />
                        <div className="notify-content">
                          <h4>{item.title}</h4>
                          <p>{item.desc}</p>
                          <span className="notify-time">{item.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-notify">Chưa có thông báo nào</p>
                  )}
                </div>

                <div className="notify-footer">
                  <Link 
                    to="/notifications" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotify(false);
                    }}
                    className="view-all-notify"
                  >
                    Xem tất cả thông báo →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ORDERS */}
          <div className="cart-icon-wrapper">
            <Link to="/orders">
              <FiClipboard className="action-icon" />
            </Link>
          </div>

          {/* CART */}
          <div className="cart-icon-wrapper">
            <Link to="/cart">
              <FiShoppingCart className="action-icon" />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </Link>
          </div>

          {/* ACCOUNT - GIỮ NGUYÊN CẤU TRÚC NHƯNG CẬP NHẬT BIẾN */}
          <div className="cart-icon-wrapper" ref={profileMenuRef}>
            {isLoggedIn ? (
              <>
                <button 
                  className="account-btn user-profile-btn"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <FiUser className="account-icon" /> 
                  <span>{userName || 'Thành viên'}</span>
                </button>

                {showProfileMenu && (
                  <div className="profile-dropdown-menu">
                    <Link to="/profile" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                      <FiUser /> Hồ sơ thành viên
                    </Link>
                    
                    <Link to="/orders" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                      <FiClipboard /> Lịch sử giao dịch
                    </Link>

                    <button 
                      className="profile-menu-item logout-item"
                      onClick={() => {
                        clearAuthSession();
                        setShowProfileMenu(false);
                        window.dispatchEvent(new Event('logout'));
                        navigate('/login');
                      }}
                    >
                      <FiLogOut /> Đăng xuất
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="account-btn">
                <FiUser className="account-icon" /> <span>Tài Khoản</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* TOAST */}
      <div className="notif-toast-stack">
        {toastItems.map((toast) => (
          <div key={toast.id} className="notif-toast-item">
            <strong>{toast.title}</strong>
            <p>{toast.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default Header;