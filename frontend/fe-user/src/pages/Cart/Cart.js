import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart(); 

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-container">
        <div className="empty-cart-content">
          <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" className="empty-cart-img" />
          <h2>Giỏ hàng của bạn đang trống!</h2>
          <p>Hãy dạo một vòng chợ nông sản để tìm những sản phẩm tươi ngon nhé.</p>
          <Link to="/shop" className="btn-continue-shopping">
            <FiArrowLeft /> Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header-title">
        <h2>Giỏ hàng của bạn</h2>
        <p>Có {cartItems.length} sản phẩm trong giỏ hàng</p>
      </div>

      <div className="cart-content-wrapper">
        <div className="cart-items-section">
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-card">
                <div className="item-image-wrapper">
                  <Link to={`/product/${item.id}`}>
                    <img src={item.image} alt={item.name} className="item-image" />
                  </Link>
                </div>
                
                <div className="item-details">
                  <Link to={`/product/${item.id}`} className="item-name">{item.name}</Link>
                  <p className="item-price">{item.price.toLocaleString()}đ</p>
                </div>

                <div className="item-quantity-control">
                  <button 
                    className="qty-btn" 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button 
                    className="qty-btn" 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <FiPlus />
                  </button>
                </div>

                <div className="item-total-price">
                  {(item.price * item.quantity).toLocaleString()}đ
                </div>

                <button 
                  className="item-remove-btn"
                  onClick={() => removeFromCart(item.id)}
                  title="Xóa sản phẩm"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
          
          <div className="cart-actions-bottom">
            <Link to="/shop" className="btn-back-shop">
              <FiArrowLeft /> Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        <div className="cart-summary-section">
          <div className="summary-card">
            <h3>Tổng đơn hàng</h3>
            
            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>{totalPrice.toLocaleString()}đ</span>
            </div>
            
            <div className="summary-row">
              <span>Phí giao hàng:</span>
              <span>Miễn phí</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row total">
              <span>Tổng cộng:</span>
              <span className="total-amount">{totalPrice.toLocaleString()}đ</span>
            </div>
            
            <Link to="/checkout" className="btn-checkout">
              Tiến hành thanh toán
            </Link>
            
            <div className="secure-checkout">
              <img src="https://cdn-icons-png.flaticon.com/512/6598/6598519.png" alt="Secure" width="20" />
              <span>Thanh toán an toàn & bảo mật</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
