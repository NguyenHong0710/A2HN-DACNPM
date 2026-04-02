import React, { useState } from 'react';
import './Profile.css';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('info'); // Tab đang chọn: 'info' hoặc 'orders'

  // Dữ liệu giả lập
  const userInfo = {
    name: "Kiệt Đẹp Trai",
    email: "kiet31544@gmail.com",
    phone: "0905 559 129",
    address: "ĐẠi HỌC KIẾN TRÚC, Đà Nẵng",
    avatar: "https://i.pravatar.cc/150?img=3"
  };

  const orders = [
    { id: '#DH001', date: '25/01/2026', total: '150.000đ', status: 'Giao thành công', type: 'success' },
    { id: '#DH002', date: '20/01/2026', total: '320.000đ', status: 'Đang vận chuyển', type: 'pending' },
    { id: '#DH003', date: '15/01/2026', total: '45.000đ', status: 'Đã hủy', type: 'cancel' },
  ];

  return (
    <div className="profile-container">
      {/* Cột trái: Sidebar */}
      <div className="profile-sidebar">
        <div className="user-avatar">
          <img src={userInfo.avatar} alt="Avatar" className="avatar-img" />
          <div className="user-name">{userInfo.name}</div>
        </div>
        <ul className="profile-menu">
          <li 
            className={activeTab === 'info' ? 'active' : ''} 
            onClick={() => setActiveTab('info')}
          >
            Thông tin tài khoản
          </li>
          <li 
            className={activeTab === 'orders' ? 'active' : ''} 
            onClick={() => setActiveTab('orders')}
          >
            Lịch sử đơn hàng
          </li>
          <li style={{color: 'red'}}>Đăng xuất</li>
        </ul>
      </div>

      {/* Cột phải: Nội dung thay đổi theo Tab */}
      <div className="profile-content">
        {activeTab === 'info' && (
          <div>
            <h2 style={{color: '#2e7d32', marginBottom: '20px'}}>Thông tin cá nhân</h2>
            <div className="info-group">
              <span className="info-label">Họ và tên</span>
              <div className="info-value">{userInfo.name}</div>
            </div>
            <div className="info-group">
              <span className="info-label">Email</span>
              <div className="info-value">{userInfo.email}</div>
            </div>
            <div className="info-group">
              <span className="info-label">Số điện thoại</span>
              <div className="info-value">{userInfo.phone}</div>
            </div>
            <div className="info-group">
              <span className="info-label">Địa chỉ</span>
              <div className="info-value">{userInfo.address}</div>
            </div>
            <button className="auth-btn" style={{width: 'auto'}}>Chỉnh sửa thông tin</button>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 style={{color: '#2e7d32', marginBottom: '20px'}}>Lịch sử đơn hàng</h2>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={index}>
                    <td style={{fontWeight: 'bold'}}>{order.id}</td>
                    <td>{order.date}</td>
                    <td style={{color: '#d32f2f', fontWeight: 'bold'}}>{order.total}</td>
                    <td>
                      <span className={`status-badge status-${order.type}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
