import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  // Dữ liệu mẫu ban đầu
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Chào bạn mới",
      desc: "Chào mừng bạn đến với AgriMarket!",
      time: "Vừa xong",
      unread: true
    }
  ]);

  // Hàm thêm thông báo mới (Các trang khác sẽ gọi hàm này)
  const addNotification = (title, desc) => {
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

  // Hàm đánh dấu đã đọc (khi bấm vào chuông)
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map(n => ({ ...n, unread: false })));
  };

  // Đếm số tin chưa đọc
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, unreadCount, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
