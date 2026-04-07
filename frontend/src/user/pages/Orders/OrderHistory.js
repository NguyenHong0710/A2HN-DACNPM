import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaCheckCircle, FaTruck, FaClock, FaGem } from 'react-icons/fa';
import { getAuthToken } from '../../utils/authStorage';
import './OrderHistory.css';

// --- HÀM XỬ LÝ ẢNH TỐI ƯU ---
const getImageUrl = (imgData) => {
    if (!imgData || imgData === "undefined" || imgData === "null") {
        return 'https://dummyimage.com/150x150/f0f0f0/c5a059&text=Lumina';
    }
    try {
        let path = imgData;
        if (typeof imgData === 'string' && imgData.startsWith('[')) {
            const parsed = JSON.parse(imgData);
            path = Array.isArray(parsed) ? parsed[0] : parsed;
        }
        if (typeof path === 'string' && path.startsWith('http')) {
            return path;
        }
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

  // ==========================================
  // 1. STATE CHO FORM ĐÁNH GIÁ
  // ==========================================
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewProductId, setReviewProductId] = useState(null);

  // ==========================================
  // 2. HÀM XỬ LÝ GỬI ĐÁNH GIÁ
  // ==========================================
  const handleSubmitReview = async () => {
    if (rating === 0) return alert("Vui lòng chọn số sao đánh giá!");

    try {
      const token = getAuthToken(); // Lấy token của khách đang đăng nhập

      const res = await fetch(`http://127.0.0.1:8000/api/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: reviewProductId, // Đã trả lại biến thật
          customer_name: "Khách Hàng VVIP",
          rating: rating,
          comment: comment
        })
      });

      const data = await res.json();
      console.log("KẾT QUẢ TỪ BACKEND:", data); // In ra console để theo dõi

      if (data.status === 'success') {
        alert("Cảm ơn bạn! Đánh giá đã được gửi và đang chờ duyệt.");
        setReviewModal(false);
        setRating(0);
        setComment('');
      } else {
        alert("Lỗi từ server: " + (data.message || "Hãy kiểm tra lại."));
      }
    } catch (error) {
      console.error("Lỗi mạng:", error);
      alert("Lỗi kết nối! Hãy ấn F12 sang tab Console để xem chi tiết.");
    }
  };

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
          {orders.map((order) => {
            // Lấy trạng thái chung của đơn hàng
            const currentStatus = String(order.status || order.deliveryStatus || '').toLowerCase();
            const isCompleted = currentStatus.includes('thành') || currentStatus.includes('delivered') || currentStatus.includes('success') || currentStatus.includes('completed');

            return (
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
                            src={getImageUrl(item.image || item.product_image)}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://dummyimage.com/150x150/f0f0f0/c5a059&text=Lumina'; }}
                        />
                      </div>
                      <div style={{ flex: 1, paddingLeft: '20px' }}>
                        <h4 style={{ margin: '0 0 5px 0', fontFamily: 'Playfair Display', fontSize: '16px' }}>{item.name}</h4>
                        <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Số lượng: {item.qty || item.quantity}</p>

                        {/* ========================================== */}
                        {/* HIỂN THỊ NÚT ĐÁNH GIÁ NẾU ĐƠN HÀNG ĐÃ GIAO XONG */}
                        {/* ========================================== */}
                        {isCompleted && (
                            <button
                              onClick={() => {
                                // THÊM DÒNG NÀY ĐỂ SOI XEM THẰNG BACKEND GỬI GÌ VỀ:
                                console.log("CHI TIẾT MÓN HÀNG NÀY LÀ:", item);

                                const idChuan = item.product_id || item.san_pham_id || item.id;
                                console.log("Mã sản phẩm chuẩn bị đánh giá là:", idChuan);

                                setReviewProductId(idChuan);
                                setReviewModal(true);
                              }}
                              style={{
                                marginTop: '10px', padding: '6px 15px', fontSize: '12px',
                                background: '#fff', border: '1px solid #c5a059', color: '#c5a059',
                                borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold',
                                transition: '0.3s'
                              }}
                              onMouseOver={(e) => { e.target.style.background = '#c5a059'; e.target.style.color = '#fff'; }}
                              onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#c5a059'; }}
                            >
                              ★ Viết đánh giá
                            </button>
                        )}

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
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL KHÁCH HÀNG VIẾT ĐÁNH GIÁ               */}
      {/* ========================================== */}
      {reviewModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '16px',
            padding: '30px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)', position: 'relative',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* ĐÃ FIX: NÚT X BÂY GIỜ CHỈ CÒN NHIỆM VỤ ĐÓNG POPUP */}
            <button
              onClick={() => setReviewModal(false)}
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}
            >
              &times;
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#111', margin: '0 0 10px 0' }}>Đánh Giá Sản Phẩm</h2>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Mức độ hài lòng của bạn về tuyệt tác trang sức này?</p>
            </div>

            {/* Dải 5 ngôi sao */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: '45px', cursor: 'pointer', lineHeight: '1',
                    color: star <= (hoverRating || rating) ? '#c5a059' : '#e2e8f0',
                    transition: 'all 0.2s ease-in-out',
                    transform: star <= (hoverRating || rating) ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>

            <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
              Chia sẻ thêm (không bắt buộc):
            </div>
            <textarea
              rows="3"
              placeholder="Chất lượng sản phẩm, dịch vụ đóng gói..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #ddd',
                backgroundColor: '#f9f9f9', resize: 'none', outline: 'none', fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#c5a059'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setReviewModal(false)}
                style={{ padding: '10px 25px', background: '#f1f1f1', color: '#333', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmitReview}
                style={{ padding: '10px 25px', background: '#111', color: '#c5a059', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
              >
                Gửi Đánh Giá
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderHistory;
