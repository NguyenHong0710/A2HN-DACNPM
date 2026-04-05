import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaCheckCircle, FaTruck, FaClock, FaGem } from 'react-icons/fa';
import { getAuthToken } from '../../utils/authStorage';
import './OrderHistory.css';

// --- HÀM XỬ LÝ ẢNH TỐI ƯU ---
const getImageUrl = (imgData) => {
    if (!imgData || imgData === "undefined" || imgData === "null") {
        return 'https://via.placeholder.com/150?text=Lumina+Jewelry';
    }
    
    try {
        let path = imgData;
        
        // 1. Nếu là mảng JSON (ví dụ: ["products/abc.jpg"])
        if (typeof imgData === 'string' && imgData.startsWith('[')) {
            const parsed = JSON.parse(imgData);
            path = Array.isArray(parsed) ? parsed[0] : parsed;
        }
        
        // 2. Nếu đã có http sẵn thì trả về luôn
        if (typeof path === 'string' && path.startsWith('http')) {
            return path;
        }
        
        // 3. Xử lý đường dẫn tương đối từ Laravel Storage
        const cleanPath = String(path).replace(/\\/g, '/').replace(/^\//, '');
        return `http://127.0.0.1:8000/storage/${cleanPath}`;
    } catch (e) {
        console.error("Lỗi xử lý ảnh:", e);
        return 'https://via.placeholder.com/150?text=Lumina+Jewelry';
    }
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        
        const response = await fetch('http://127.0.0.1:8000/api/my-invoices', {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server error: Lỗi từ phía Backend (Không trả về JSON).");
        }

        const result = await response.json();
        
        // Kiểm tra cấu trúc dữ liệu trả về từ Laravel (thường nằm trong result.data hoặc result)
        const ordersData = result.data || result || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);

      } catch (err) {
        console.error('LỖI GỌI API:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    window.scrollTo(0, 0);
  }, [navigate]);

  const getStatusIcon = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('pending') || s.includes('chờ')) return <FaClock color="#c5a059" />;
    if (s.includes('shipping') || s.includes('giao')) return <FaTruck color="#1a237e" />;
    if (s.includes('delivered') || s.includes('thành') || s.includes('success')) return <FaCheckCircle color="#c5a059" />;
    return <FaGem color="#c5a059" />;
  };

  if (loading) {
    return (
      <div className="orders-container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', color: '#c5a059' }}>Đang tìm kiếm hành trình tuyệt tác của bạn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <p style={{ color: 'red', fontWeight: 'bold' }}>Đã xảy ra lỗi: {error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer', background: '#111', color: '#fff', border: 'none' }}>Thử lại</button>
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
              border: '1px solid #eee', marginBottom: '40px', background: '#fff',
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
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                  {getStatusIcon(order.status || order.deliveryStatus)}
                  <span style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                    {order.status || order.deliveryStatus || 'Chờ xử lý'}
                  </span>
                </div>
              </div>

              <div className="order-items" style={{ padding: '20px' }}>
                {(order?.items || []).map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', borderBottom: index !== (order.items.length - 1) ? '1px solid #f9f9f9' : 'none', paddingBottom: '15px' }}>
                    <div style={{ width: '80px', height: '80px', background: '#f0f0f0', overflow: 'hidden', borderRadius: '4px', border: '1px solid #eee' }}>
                      <img 
                          // Ưu tiên lấy item.image (từ bảng chi tiết hóa đơn)
                          src={getImageUrl(item.image || item.product_image)} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          // Nếu ảnh lỗi (đơn hàng cũ ko có ảnh), hiện placeholder
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Lumina'; }}
                      />
                    </div>
                    <div style={{ flex: 1, paddingLeft: '20px' }}>
                      <h4 style={{ margin: '0 0 5px 0', fontFamily: 'Playfair Display', fontSize: '16px' }}>{item.name}</h4>
                      <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Số lượng: {item.qty || item.quantity}</p>
                    </div>
                    <div style={{ fontWeight: '500', color: '#111' }}>
                      {Number(item.price || 0).toLocaleString()}đ
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-card-footer" style={{ 
                padding: '20px', borderTop: '1px solid #eee', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#fff'
              }}>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  Phương thức: <span style={{ color: '#111', fontWeight: '500' }}>{order.payment_method || 'Tiền mặt'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', color: '#888' }}>Tổng thanh toán: </span>
                  <div style={{ color: '#c5a059', fontWeight: 'bold', fontSize: '22px' }}>
                    {Number(order.amount || order.total_amount || 0).toLocaleString()}đ
                  </div>
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