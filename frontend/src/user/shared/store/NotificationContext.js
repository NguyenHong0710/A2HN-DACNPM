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

  // 🛠 ĐÃ SỬA: Dùng fetch gọi API thay vì notificationsAPI không tồn tại
  const refreshNotifications = useCallback(async () => {
    const nextAccountKey = getCurrentAccountKey();
    if (nextAccountKey === 'guest') {
      setNotifications([]);
      return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch('http://127.0.0.1:8000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      
      // Hỗ trợ cả trường hợp API trả về mảng trực tiếp hoặc bọc trong object { data: [] }
      const finalData = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : []);
      
      setNotifications(finalData);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    }
  }, [getCurrentAccountKey]);

  useEffect(() => {
    refreshNotifications();

    const timer = setInterval(() => {
      refreshNotifications();
    }, 20000);

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

  useEffect(() => {
    if (accountKey === 'guest') {
      setNotifications([]);
    }
  }, [accountKey]);

  // Hàm thêm thông báo mới (Các trang khác sẽ gọi hàm này)
  const addNotification = (title, desc) => {
    if (getCurrentAccountKey() === 'guest') return;

    const newNotify = {
      id: Date.now(), // Tạo ID ngẫu nhiên theo thời gian
      title,
      desc,
      time: "Vừa xong",
      unread: true,
      image: "https://cdn-icons-png.flaticon.com/512/7518/7518748.png"
    };
    
    // Thêm vào đầu danh sách
    setNotifications((prev) => [newNotify, ...prev]);
  };

  // 🛠 ĐÃ SỬA: Đánh dấu đã đọc trên giao diện (Local state)
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map(n => ({ ...n, unread: false })));
    
    // Tạm thời bỏ qua việc gọi API lưu trạng thái đọc lên database vì backend chưa có route xử lý POST cho phần này
    console.log('Đã đánh dấu tất cả thông báo là đã đọc trên giao diện.');
  };

  // 🛠 ĐÃ SỬA: Đánh dấu một thông báo đã đọc
  const markAsRead = (id) => {
    const targetId = String(id || '');
    if (!targetId) return;

    const selected = notifications.find((n) => String(n.id) === targetId);
    if (!selected) return;

    setNotifications((prev) => prev.map((n) => (
      String(n.id) === targetId ? { ...n, unread: false } : n
    )));
    
    // Tạm thời bỏ qua việc gọi API lưu trạng thái đọc lên database
    console.log(`Đã đánh dấu thông báo ${id} là đã đọc trên giao diện.`);
  };

  // Đếm số tin chưa đọc
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, unreadCount, markAllAsRead, markAsRead, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);