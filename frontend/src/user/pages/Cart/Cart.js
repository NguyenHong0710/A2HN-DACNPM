import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft, FiShield } from 'react-icons/fi'; // Dùng FiShield cho bảo mật trang sức
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart(); 

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div className="empty-cart-content">
          {/* Thay icon giỏ hàng trống bằng icon kim cương mờ hoặc hộp quà */}
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

  return (
    <div className="cart-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
      <div className="cart-header-title" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px' }}>Túi mua sắm của bạn</h2>
        <p style={{ color: '#888' }}>Quý khách có {cartItems.length} tuyệt tác trong danh sách</p>
      </div>

      <div className="cart-content-wrapper" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <div className="cart-items-section" style={{ flex: '2', minWidth: '350px' }}>
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-card" style={{ 
                display: 'flex', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #f5f5f5' 
              }}>
                <div className="item-image-wrapper" style={{ width: '100px', height: '100px', overflow: 'hidden' }}>
                  <Link to={`/product/${item.id}`}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Link>
                </div>
                
                <div className="item-details" style={{ flex: 1, paddingLeft: '20px' }}>
                  <Link to={`/product/${item.id}`} style={{ 
                    textDecoration: 'none', color: '#111', fontSize: '18px', 
                    fontFamily: 'Playfair Display', fontWeight: 'bold' 
                  }}>{item.name}</Link>
                  <p style={{ color: '#c5a059', fontWeight: 'bold', marginTop: '5px' }}>{item.price.toLocaleString()}đ</p>
                </div>

                {/* Kiểm soát số lượng tối giản */}
                <div className="item-quantity-control" style={{ display: 'flex', alignItems: 'center', border: '1px solid #eee' }}>
                  <button 
                    style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <FiMinus size={12} />
                  </button>
                  <span style={{ padding: '0 10px', fontSize: '14px' }}>{item.quantity}</span>
                  <button 
                    style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <FiPlus size={12} />
                  </button>
                </div>

                <div className="item-total-price" style={{ width: '120px', textAlign: 'right', fontWeight: 'bold' }}>
                  {(item.price * item.quantity).toLocaleString()}đ
                </div>

                <button 
                  style={{ marginLeft: '20px', border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}
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

        {/* Tổng kết đơn hàng phong cách sang trọng */}
        <div className="cart-summary-section" style={{ flex: '1', minWidth: '300px' }}>
          <div className="summary-card" style={{ padding: '30px', backgroundColor: '#fafafa', border: '1px solid #eee' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Thông tin đơn hàng</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#666' }}>
              <span>Tạm tính</span>
              <span>{totalPrice.toLocaleString()}đ</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#666' }}>
              <span>Bảo hiểm & Vận chuyển</span>
              <span style={{ color: '#2e7d32' }}>Miễn phí</span>
            </div>
            
            <div style={{ height: '1px', background: '#eee', margin: '20px 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <span style={{ fontWeight: 'bold' }}>Tổng cộng</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#111' }}>{totalPrice.toLocaleString()}đ</span>
            </div>
            
           <Link to="/checkout" className="btn-checkout">
              Tiến hành thanh toán
            </Link>
            
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