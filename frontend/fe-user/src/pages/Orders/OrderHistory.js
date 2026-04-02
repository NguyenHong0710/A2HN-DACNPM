import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaCheckCircle, FaTruck, FaClock } from 'react-icons/fa';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);

  // Lấy danh sách đơn hàng từ LocalStorage khi trang vừa load
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('agri_orders')) || [];
    setOrders(savedOrders);
    window.scrollTo(0, 0);
  }, []);

  // Hàm chọn icon theo trạng thái
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Đang xử lý': return <FaClock color="#f57c00" />;
      case 'Đang giao hàng': return <FaTruck color="#1976d2" />;
      case 'Hoàn thành': return <FaCheckCircle color="#2e7d32" />;
      default: return <FaClock color="#f57c00" />;
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Theo Dõi Đơn Hàng</h1>
        <p>Kiểm tra trạng thái các đơn hàng bạn đã đặt tại AgriMarket</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <FaBoxOpen size={60} color="#ccc" />
          <h2>Bạn chưa có đơn hàng nào</h2>
          <Link to="/shop" className="btn-shopping">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              
              {/* Tiêu đề đơn hàng (Mã + Trạng thái) */}
              <div className="order-card-header">
                <div>
                  <span className="order-id">Mã đơn: <b>{order.id}</b></span>
                  <span className="order-date">{order.date}</span>
                </div>
                <div className="order-status">
                  {getStatusIcon(order.status)} <span className={`status-text ${order.status === 'Hoàn thành' ? 'success' : ''}`}>{order.status}</span>
                </div>
              </div>

              {/* Danh sách sản phẩm trong đơn */}
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item-row">
                    <img src={item.image} alt={item.name} className="order-item-img" />
                    <div className="order-item-info">
                      <h4>{item.name}</h4>
                      <p>x{item.amount || item.quantity || 1}</p>
                    </div>
                    <div className="order-item-price">
                      {(item.price * (item.amount || item.quantity || 1)).toLocaleString()}đ
                    </div>
                  </div>
                ))}
              </div>

              {/* Tổng kết đơn hàng */}
              <div className="order-card-footer">
                <div className="order-method">
                  Thanh toán: <b>{order.method}</b>
                </div>
                <div className="order-total">
                  Tổng tiền: <span>{order.total.toLocaleString()}đ</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
