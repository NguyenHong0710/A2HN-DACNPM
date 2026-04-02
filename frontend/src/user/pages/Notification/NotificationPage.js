import React from 'react';
import { useNotification } from '../../store/NotificationContext';
import { FaCheckDouble, FaTrash } from 'react-icons/fa';
import './NotificationPage.css';

const NotificationPage = () => {
  const { notifications, markAllAsRead, markAsRead } = useNotification();

  return (
    <div className="notif-page-container">
      <div className="notif-header">
        <h2>🔔 Thông Báo Của Bạn</h2>
        <button className="mark-read-btn" onClick={markAllAsRead}>
          <FaCheckDouble /> Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="notif-content">
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <div key={item.id} className={`notif-card ${item.unread ? 'unread' : ''}`} onClick={() => markAsRead(item.id)}>
              <img 
                src={item.image || "https://cdn-icons-png.flaticon.com/512/3602/3602145.png"} 
                alt="icon" 
                className="notif-card-img" 
              />
              <div className="notif-card-info">
                <h3>{item.title} {item.unread && <span className="badge-new">Mới</span>}</h3>
                <p>{item.desc}</p>
                <span className="notif-card-time">{item.time}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-notif">
            <img src="https://cdn-icons-png.flaticon.com/512/4076/4076432.png" alt="empty" width="100" />
            <p>Bạn chưa có thông báo nào!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
