import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaCheckCircle, FaTruck, FaClock, FaGem } from 'react-icons/fa';
import { getAuthToken } from '../../utils/authStorage';
import './OrderHistory.css';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          navigate('/login');
          return;
        }

        setLoading(true);
        
        // SỬA LỖI TẠI ĐÂY: Thay vì gọi ordersAPI chưa định nghĩa, 
        // chúng ta dùng fetch trực tiếp đến API Laravel đã viết
        const response = await fetch('http://localhost:8000/api/my-invoices', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Không thể lấy dữ liệu đơn hàng');
        }

        const result = await response.json();
        
        // Laravel trả về { status: 'success', data: [...] }
        if (result.status === 'success') {
          setOrders(result.data);
        } else {
          setOrders([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(err.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    window.scrollTo(0, 0);
  }, [navigate]);

  // Map icon theo deliveryStatus từ Laravel
  const getStatusIcon = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'pending' || s.includes('chờ')) return <FaClock color="#c5a059" />;
    if (s === 'shipping' || s.includes('giao')) return <FaTruck color="#1a237e" />;
    if (s === 'delivered' || s === 'success' || s.includes('hoàn thành')) return <FaCheckCircle color="#c5a059" />;
    return <FaGem color="#c5a059" />;
  };

  if (loading) {
    return (
      <div className="orders-container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', color: '#c5a059' }}>Đang tìm kiếm hành trình tuyệt tác của bạn...</p>
      </div>
    );
  }

  return (
    <div className="orders-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '50px 20px' }}>
      <div className="orders-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', textTransform: 'uppercase', color: '#111' }}>
          Lịch Sử Tuyệt Tác
        </h1>
        <div style={{ width: '60px', height: '2px', background: '#c5a059', margin: '20px auto' }}></div>
        <p style={{ color: '#666' }}>Theo dõi hành trình những món trang sức quý giá được tạo tác dành riêng cho bạn.</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders" style={{ textAlign: 'center', padding: '60px', border: '1px solid #eee' }}>
          <FaBoxOpen size={50} color="#ddd" />
          <h2 style={{ fontFamily: 'Playfair Display', margin: '20px 0' }}>Bạn chưa có yêu cầu tạo tác nào</h2>
          <Link to="/shop" style={{ 
            display: 'inline-block', padding: '12px 30px', backgroundColor: '#111', 
            color: '#c5a059', textDecoration: 'none', fontWeight: 'bold' 
          }}>Bắt đầu mua sắm ngay</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card" style={{ 
              border: '1px solid #eee', marginBottom: '30px', background: '#fff',
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)' 
            }}>
              <div className="order-card-header" style={{ 
                padding: '20px', display: 'flex', justifyContent: 'space-between', 
                alignItems: 'center', background: '#fafafa'
              }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#888' }}>Mã đơn: </span>
                  <b>#{order.id}</b>
                  <span style={{ margin: '0 15px', color: '#ddd' }}>|</span>
                  <span style={{ fontSize: '14px', color: '#666' }}>Ngày đặt: {order.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                  {getStatusIcon(order.deliveryStatus)} 
                  <span style={{ textTransform: 'uppercase', fontSize: '12px' }}>{order.deliveryStatus}</span>
                </div>
              </div>

              <div className="order-items" style={{ padding: '20px' }}>
                {(order.items || []).map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    {/* Nếu có ảnh từ API thì dùng, không thì dùng ảnh mặc định */}
                    <div style={{ width: '80px', height: '80px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaGem color="#ddd" />
                    </div>
                    <div style={{ flex: 1, paddingLeft: '20px' }}>
                      <h4 style={{ margin: '0 0 5px 0', fontFamily: 'Playfair Display' }}>{item.name}</h4>
                      <p style={{ color: '#888', fontSize: '14px' }}>Số lượng: {item.qty}</p>
                    </div>
                    <div style={{ fontWeight: '500' }}>
                      {Number(item.price).toLocaleString()}đ
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-card-footer" style={{ 
                padding: '20px', borderTop: '1px solid #f9f9f9', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
              }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Thanh toán: <span style={{ color: '#111' }}>{order.payment_method}</span>
                </div>
                <div style={{ fontSize: '18px' }}>
                  Tổng giá trị: <span style={{ color: '#c5a059', fontWeight: 'bold', fontSize: '22px' }}>
                    {Number(order.amount).toLocaleString()}đ
                  </span>
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