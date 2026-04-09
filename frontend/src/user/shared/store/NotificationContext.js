import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAuthToken, getStoredUser } from '../../utils/authStorage';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  const getCurrentAccountKey = useCallback(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    const userId = String(user?.id || '').trim();

    if (!token || !userId) return 'guest';
    return `user:${userId}`;
  }, []);
  
  const [accountKey, setAccountKey] = useState(() => getCurrentAccountKey());

  // 🛠 TỐI ƯU: Tạm thời tắt gọi API để giải phóng băng thông cho Products
  const refreshNotifications = useCallback(async () => {
    const nextAccountKey = getCurrentAccountKey();
    if (nextAccountKey === 'guest') {
      setNotifications([]);
      return;
    }

<<<<<<< HEAD
try {
      const token = getAuthToken();
      const res = await fetch('http://127.0.0.1:8000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json' // BẮT BUỘC PHẢI CÓ DÒNG NÀY
        }
      });
      
      // Kiểm tra nếu API không trả về 200 OK thì ném lỗi để nhảy xuống catch
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      
      // Hỗ trợ cả trường hợp API trả về mảng trực tiếp hoặc bọc trong object { data: [] }
      const finalData = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
      
=======
    // --- TẠM KHÓA PHẦN NÀY ĐỂ HẾT "ÍU" ---
    /* try {
      const token = getAuthToken();
      const res = await fetch('http://127.0.0.1:8000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      const finalData = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : []);
>>>>>>> 68c2f8a2431eabbeade62f72cd05b60c1d466ba9
      setNotifications(finalData);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    }
    */
    // Trả về mảng rỗng ngay lập tức để không bị treo 1.4s
    setNotifications(prev => prev.length > 0 ? prev : []); 
  }, [getCurrentAccountKey]);

  // 🛠 TỐI ƯU: Giảm tần suất gọi hoặc tắt setInterval khi đang phát triển
  useEffect(() => {
    refreshNotifications();

    // Tăng lên 60 giây hoặc tắt hẳn để tránh request chồng chéo
    const timer = setInterval(() => {
      // refreshNotifications(); 
    }, 60000);

    return () => clearInterval(timer);
  }, [refreshNotifications]);

  useEffect(() => {
    const handleAuthChanged = () => {
      const nextAccountKey = getCurrentAccountKey();
      if (nextAccountKey !== accountKey) {
        setNotifications([]);
        setAccountKey(nextAccountKey);
      }
      refreshNotifications();
    };

    window.addEventListener('login', handleAuthChanged);
    window.addEventListener('logout', handleAuthChanged);
    window.addEventListener('storage', handleAuthChanged);
    return () => {
      window.removeEventListener('login', handleAuthChanged);
      window.removeEventListener('logout', handleAuthChanged);
      window.removeEventListener('storage', handleAuthChanged);
    };
  }, [accountKey, getCurrentAccountKey, refreshNotifications]);

  // Hàm thêm thông báo mới (Local Only)
  const addNotification = (title, desc) => {
    if (getCurrentAccountKey() === 'guest') return;

    const newNotify = {
      id: Date.now(),
      title,
      desc,
      time: "Vừa xong",
      unread: true,
      image: "https://cdn-icons-png.flaticon.com/512/7518/7518748.png"
    };
    
    setNotifications((prev) => [newNotify, ...prev]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id) => {
    const targetId = String(id || '');
    setNotifications((prev) => prev.map((n) => (
      String(n.id) === targetId ? { ...n, unread: false } : n
    )));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, unreadCount, markAllAsRead, markAsRead, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);