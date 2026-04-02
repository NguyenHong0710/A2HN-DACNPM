/* src/components/Layout/Header.js */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiBell, FiShoppingCart, FiUser, FiClipboard, FiMenu, FiX, FiMessageSquare } from 'react-icons/fi';
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
  
  // 👇 NEW: Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifyRef = useRef(null);
  const profileMenuRef = useRef(null);
  const seenNotifRef = useRef(new Set());
  const hasInitializedNotifRef = useRef(false);

  // Initialize login state from persisted or session-based auth storage
  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser() || {};
    setIsLoggedIn(!!token);
    setUserName(user.name || '');
  }, []);

  // Listen for login/logout events to update header
  useEffect(() => {
    const handleLoginLogout = () => {
      const token = getAuthToken();
      const user = getStoredUser() || {};
      setIsLoggedIn(!!token);
      setUserName(user.name || '');
      setShowProfileMenu(false);
      console.log('Header updated on login/logout:', { token: !!token, name: user.name });
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

  useEffect(() => {
    if (!Array.isArray(notifications)) return;

    // Prime known notifications to avoid blasting toasts on first render.
    if (!hasInitializedNotifRef.current) {
      notifications.forEach((n) => seenNotifRef.current.add(String(n.id)));
      hasInitializedNotifRef.current = true;
      return;
    }

    const incomingUnread = notifications.filter((n) => n?.unread);
    const newOnes = incomingUnread.filter((n) => !seenNotifRef.current.has(String(n.id))).slice(0, 2);

    if (newOnes.length === 0) {
      return;
    }

    newOnes.forEach((n) => seenNotifRef.current.add(String(n.id)));
    const toastBatch = newOnes.map((n) => ({
      id: `toast-${n.id}-${Date.now()}`,
      title: n.title,
      desc: n.desc,
    }));

    setToastItems((prev) => [...prev, ...toastBatch]);

    toastBatch.forEach((toast) => {
      window.setTimeout(() => {
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
    const handleClickOutside = (event) => {
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setShowNotify(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
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

      <Link to="/" className="logo">AgriMarket</Link>

      <nav className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Trang Chủ</Link>
        <Link to="/shop" className={location.pathname === '/shop' ? 'active' : ''}>Sản Phẩm</Link>
        <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>Giới Thiệu</Link>
        <Link to="/voucher" className={location.pathname === '/voucher' ? 'active' : ''}>Ưu Đãi</Link>
        <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Liên Hệ</Link>
      </nav>

      <div className="actions">
        <div className="search-box" style={{ width: isSearchOpen ? '200px' : 'auto' }}>
          <FiSearch 
            className="action-icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)} 
          />
          {isSearchOpen && (
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              onKeyDown={handleSearch}
              autoFocus
            />
          )}
        </div>

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
                    <div key={item.id} className={`notify-item ${item.unread ? 'unread' : ''}`} onClick={(e) => { e.stopPropagation(); markAsRead(item.id); }}>
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
                    style={{
                      color: '#2e7d32', 
                      fontWeight: 'bold', 
                      fontSize: '13px', 
                      textDecoration: 'none',
                      display: 'block'
                    }}
                  >
                    Xem tất cả thông báo &rarr;
                  </Link>
              </div>
            </div>
          )}
        </div>

        <div className="cart-icon-wrapper">
           <Link to="/messages" title="Tin nhắn">
              <FiMessageSquare className="action-icon" />
           </Link>
        </div>

        <div className="cart-icon-wrapper">
           <Link to="/orders" title="Lịch sử đơn hàng">
              <FiClipboard className="action-icon" />
           </Link>
        </div>

        <div className="cart-icon-wrapper">
           <Link to="/cart" title="Giỏ hàng">
              <FiShoppingCart className="action-icon" />
              {totalItems > 0 && (
                <span className="cart-badge">
                  {totalItems}
                </span>
              )}
           </Link>
        </div>

        {/* 👇 NEW: Login state with profile dropdown */}
        <div className="cart-icon-wrapper" ref={profileMenuRef}>
          {isLoggedIn ? (
            <>
              <button 
                className="account-btn user-profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <FiUser className="account-icon" /> <span>{userName || 'Tài Khoản'}</span>
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown-menu">
                  <Link to="/profile" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                    Thông tin tài khoản
                  </Link>
                  
                  <Link to="/orders" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                    Lịch sử đơn hàng
                  </Link>

                  <button 
                    className="profile-menu-item logout-item"
                    onClick={() => {
                      clearAuthSession();
                      setShowProfileMenu(false);
                      window.dispatchEvent(new Event('logout'));
                      navigate('/login');
                    }}
                    style={{ border: 'none', width: '100%', textAlign: 'left', background: 'none', cursor: 'pointer', padding: '10px 15px' }}
                  >
                    Đăng xuất
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
    <div className="notif-toast-stack" aria-live="polite">
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
