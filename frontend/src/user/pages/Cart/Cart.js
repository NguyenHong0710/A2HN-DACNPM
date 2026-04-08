import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft, FiShield } from 'react-icons/fi';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  // --- State quản lý các sản phẩm được chọn (Mặc định là mảng rỗng []) ---
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // BỎ ĐOẠN USEEFFECT TỰ ĐỘNG TICK CHỌN TẤT CẢ Ở ĐÂY

  // Đảm bảo khi xóa 1 sản phẩm khỏi giỏ, nó cũng bị xóa khỏi danh sách đã tick
  useEffect(() => {
    setSelectedItemIds(prev => prev.filter(id => cartItems.some(item => item.id === id)));
  }, [cartItems]);

  // Hàm xử lý khi tick/bỏ tick 1 sản phẩm
  const handleToggleSelect = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  // Hàm xử lý chọn/bỏ chọn tất cả
  const handleSelectAll = () => {
    if (selectedItemIds.length === cartItems.length) {
      setSelectedItemIds([]); // Nếu đang chọn hết -> Bỏ chọn tất cả
    } else {
      setSelectedItemIds(cartItems.map(item => item.id)); // Nếu chưa chọn hết -> Chọn tất cả
    }
  };

  // Tính tổng tiền CHỈ cho các sản phẩm ĐƯỢC TICK CHỌN
  const selectedTotalPrice = cartItems
    .filter(item => selectedItemIds.includes(item.id))
    .reduce((total, item) => total + (item.price * item.quantity), 0);

  // Xử lý khi bấm nút "Tiến hành thanh toán"
  const handleCheckoutClick = (e) => {
    e.preventDefault(); 
    
    if (selectedItemIds.length === 0) {
      alert("Vui lòng tick chọn ít nhất 1 sản phẩm để thanh toán!");
      return;
    }

    // Lọc ra data đầy đủ của các sản phẩm được tick
    const itemsToCheckout = cartItems.filter(item => selectedItemIds.includes(item.id));

    // Lưu vào localStorage để trang Checkout có thể lấy ra sử dụng
    localStorage.setItem('checkoutItems', JSON.stringify(itemsToCheckout));

    // Chuyển hướng sang trang checkout
    navigate('/checkout', { state: { selectedItems: itemsToCheckout } });
  };
  // -------------------------------------------------------

  // --- COPY LOGIC XỬ LÝ ẢNH TỪ TRANG HOME ---
  const getImageUrl = (images) => {
    if (!images) return 'https://via.placeholder.com/300?text=Lumina+Jewelry';

    try {
      const parsed = typeof images === 'string' ? JSON.parse(images) : images;
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstImage = parsed[0];
        return firstImage.startsWith('http') 
          ? firstImage 
          : `http://127.0.0.1:8000/storage/${firstImage}`;
      }
      if (typeof parsed === 'string') {
          return parsed.startsWith('http') ? parsed : `http://127.0.0.1:8000/storage/${parsed}`;
      }
    } catch (e) {
      if (typeof images === 'string' && images.length > 0) {
          return images.startsWith('http') ? images : `http://127.0.0.1:8000/storage/${images}`;
      }
    }
    return 'https://via.placeholder.com/300?text=Lumina+Jewelry';
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="empty-cart-content">
          <img src="https://cdn-icons-png.flaticon.com/512/10056/10056557.png" alt="Empty Cart" style={{ width: '120px', opacity: 0.3 }} />
          <h2 style={{ fontFamily: 'Playfair Display, serif', marginTop: '30px' }}>Kiệt tác đang chờ đón bạn</h2>
          <p style={{ color: '#888', marginBottom: '30px' }}>Túi đồ của quý khách hiện đang trống. Hãy khám phá những bộ sưu tập mới nhất từ Lumina.</p>
          <Link to="/shop" className="btn-continue-shopping" style={{ 
            backgroundColor: '#111', color: '#c5a059', padding: '12px 30px', 
            textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px' 
          }}>
            <FiArrowLeft /> Khám phá bộ sưu tập
          </Link>
        </div>
      </div>
    );
  }
//chu y
  return (
    <div className="cart-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
      <div className="cart-header-title" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px' }}>Túi mua sắm của bạn</h2>
        <p style={{ color: '#888' }}>Quý khách có {cartItems.length} tuyệt tác trong danh sách</p>
      </div>

      <div className="cart-content-wrapper" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <div className="cart-items-section" style={{ flex: '2', minWidth: '350px' }}>
          
          {/* Nút Chọn tất cả */}
          <div style={{ paddingBottom: '15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              checked={cartItems.length > 0 && selectedItemIds.length === cartItems.length}
              onChange={handleSelectAll}
              // Giữ màu đỏ cho nút chọn tất cả
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'red' }} 
            />
            <span style={{ fontWeight: '500' }}>Chọn tất cả ({cartItems.length} sản phẩm)</span>
          </div>

          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-card" style={{ 
                display: 'flex', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #f5f5f5' 
              }}>
                
                {/* --- ĐÃ THÊM MÀU ĐỎ CHO Ô TICK CHỌN TỪNG SẢN PHẨM --- */}
                <input 
                  type="checkbox"
                  checked={selectedItemIds.includes(item.id)}
                  onChange={() => handleToggleSelect(item.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', marginRight: '15px', accentColor: 'red' }}
                />

                <div className="item-image-wrapper" style={{ width: '100px', height: '100px', overflow: 'hidden' }}>
                  <Link to={`/product/${item.id}`}>
                    <img 
                      src={getImageUrl(item.images || item.image)} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </Link>
                </div>
                
                <div className="item-details" style={{ flex: 1, paddingLeft: '20px' }}>
                  <Link to={`/product/${item.id}`} style={{ 
                    textDecoration: 'none', color: '#111', fontSize: '18px', 
                    fontFamily: 'Playfair Display', fontWeight: 'bold' 
                  }}>{item.name}</Link>
                  <p style={{ color: '#c5a059', fontWeight: 'bold', marginTop: '5px' }}>
                    {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                  </p>
                </div>

                <div className="item-quantity-control" style={{ display: 'flex', alignItems: 'center', border: '1px solid #eee' }}>
                  {/* --- ĐÃ THÊM MÀU ĐỎ CHO NÚT TRỪ --- */}
                  <button 
                    style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <FiMinus size={12} />
                  </button>
                  <span style={{ padding: '0 10px', fontSize: '14px' }}>{item.quantity}</span>
                  {/* --- ĐÃ THÊM MÀU ĐỎ CHO NÚT CỘNG --- */}
                  <button 
                    style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <FiPlus size={12} />
                  </button>
                </div>

                <div className="item-total-price" style={{ width: '120px', textAlign: 'right', fontWeight: 'bold' }}>
                  {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                </div>

                {/* --- ĐÃ THÊM MÀU ĐỎ CHO NÚT XÓA --- */}
                <button 
                  style={{ marginLeft: '20px', border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}
                  onClick={() => removeFromCart(item.id)}
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <Link to="/shop" style={{ textDecoration: 'none', color: '#111', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiArrowLeft /> Tiếp tục chọn món đồ khác
            </Link>
          </div>
        </div>

        <div className="cart-summary-section" style={{ flex: '1', minWidth: '300px' }}>
          <div className="summary-card" style={{ padding: '30px', backgroundColor: '#fafafa', border: '1px solid #eee' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Thông tin đơn hàng</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#666' }}>
              <span>Tạm tính ({selectedItemIds.length} món)</span>
              <span>{new Intl.NumberFormat('vi-VN').format(selectedTotalPrice)}đ</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#666' }}>
              <span>Bảo hiểm & Vận chuyển</span>
              <span style={{ color: '#2e7d32' }}>Miễn phí</span>
            </div>
            
            <div style={{ height: '1px', background: '#eee', margin: '20px 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <span style={{ fontWeight: 'bold' }}>Tổng cộng</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>
                {new Intl.NumberFormat('vi-VN').format(selectedTotalPrice)}đ
              </span>
            </div>
            
            <button 
              onClick={handleCheckoutClick} 
              className="btn-checkout"
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: selectedItemIds.length > 0 ? '#111' : '#ccc',
                color: selectedItemIds.length > 0 ? '#c5a059' : '#666',
                border: 'none',
                cursor: selectedItemIds.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none'
              }}
              disabled={selectedItemIds.length === 0}
            >
              Tiến hành thanh toán
            </button>
            
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', color: '#999', fontSize: '13px' }}>
              <FiShield />
              <span>Bảo mật thông tin thanh toán 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;