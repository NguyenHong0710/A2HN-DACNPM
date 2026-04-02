import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import './Checkout.css';

const Checkout = () => {
  const cartData = useCart();
  // Tự động quét tìm đúng biến chứa dữ liệu giỏ hàng (dù bạn đặt tên là cart, cartItems hay items)
  const currentCart = cartData.cart || cartData.cartItems || cartData.items || [];
  
  // BẢO HIỂM LỖI: Đảm bảo safeCart luôn là mảng
  const safeCart = Array.isArray(currentCart) ? currentCart : [];
  
  // Dự phòng hàm xóa giỏ hàng
  const clearCart = cartData.clearCart || cartData.emptyCart || (() => {});

  // State lưu thông tin khách hàng
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    note: ''
  });

  // State lưu phương thức thanh toán ('COD' hoặc 'BANKING')
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Tính tổng tiền dựa trên safeCart để tránh lỗi
  const totalPrice = safeCart.reduce((total, item) => total + (item.price * (item.amount || item.quantity || 1)), 0);
  const shippingFee = (totalPrice > 300000 || totalPrice === 0) ? 0 : 30000; // Freeship đơn > 300k
  const finalPrice = totalPrice + shippingFee;

  // --- CẤU HÌNH THÔNG TIN TÀI KHOẢN NGÂN HÀNG CỦA BẠN ---
  const bankInfo = {
    bankId: 'MB',                 // Tên viết tắt ngân hàng (MB, VCB, TCB, ACB...)
    accountNo: '0905559129',      // Số tài khoản của bạn
    accountName: 'TRAN THE KIET',  // Tên chủ tài khoản (Không dấu)
  };

  // Tạo URL mã QR động từ VietQR (Tự động điền số tiền)
  const qrCodeUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${finalPrice}&addInfo=Thanh toan don hang AgriMarket&accountName=${bankInfo.accountName}`;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (safeCart.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
      return;
    }

    // --- TẠO ĐƠN HÀNG MỚI ---
    const newOrder = {
      id: 'AGRI' + Math.floor(10000 + Math.random() * 90000), // Tạo mã đơn ngẫu nhiên, VD: AGRI12345
      date: new Date().toLocaleString('vi-VN'), // Giờ đặt hàng
      items: safeCart, // Danh sách sản phẩm
      total: finalPrice, // Tổng tiền
      method: paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản QR',
      status: 'Đang xử lý', // Trạng thái mặc định
      customer: formData
    };

    // --- LƯU VÀO LOCAL STORAGE ---
    const existingOrders = JSON.parse(localStorage.getItem('agri_orders')) || [];
    existingOrders.unshift(newOrder); // Thêm đơn mới lên đầu danh sách
    localStorage.setItem('agri_orders', JSON.stringify(existingOrders));

    alert(`🎉 Đặt hàng thành công! Mã đơn hàng của bạn là ${newOrder.id}`);
    
    // Xóa giỏ hàng và chuyển sang trang Theo dõi đơn
    clearCart();
    navigate('/orders'); // <--- Chuyển hướng tới trang đơn hàng
  };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Thanh Toán Đơn Hàng</h1>
        <p>Vui lòng kiểm tra thông tin trước khi đặt hàng.</p>
      </div>

      <form className="checkout-content" onSubmit={handleSubmit}>
        
        {/* --- CỘT TRÁI: THÔNG TIN GIAO HÀNG --- */}
        <div className="checkout-form-section">
          <h3>Thông tin giao hàng</h3>
          <div className="form-group">
            <label>Họ và tên *</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Nhập họ tên của bạn" required />
          </div>
          <div className="form-group">
            <label>Số điện thoại *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Nhập số điện thoại" required />
          </div>
          <div className="form-group">
            <label>Địa chỉ nhận hàng *</label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Nhập địa chỉ chi tiết (Số nhà, đường, phường/xã...)" required rows="3"></textarea>
          </div>
          <div className="form-group">
            <label>Ghi chú đơn hàng (Tùy chọn)</label>
            <textarea name="note" value={formData.note} onChange={handleInputChange} placeholder="Ví dụ: Giao ngoài giờ hành chính..." rows="2"></textarea>
          </div>
        </div>

        {/* --- CỘT PHẢI: ĐƠN HÀNG & THANH TOÁN --- */}
        <div className="checkout-summary-section">
          <h3>Đơn hàng của bạn</h3>
          
          <div className="summary-items">
            {/* Sử dụng safeCart thay vì cart */}
            {safeCart.map((item, index) => (
              <div key={index} className="summary-item">
                <span className="item-name">{item.name} <b>x{item.amount || item.quantity || 1}</b></span>
                <span className="item-price">{(item.price * (item.amount || item.quantity || 1)).toLocaleString()}đ</span>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="total-line">
              <span>Tạm tính:</span>
              <span>{totalPrice.toLocaleString()}đ</span>
            </div>
            <div className="total-line">
              <span>Phí vận chuyển:</span>
              <span>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString()}đ`}</span>
            </div>
            <div className="total-line final">
              <span>Tổng cộng:</span>
              <span className="final-price">{finalPrice.toLocaleString()}đ</span>
            </div>
          </div>

          {/* --- CHỌN PHƯƠNG THỨC THANH TOÁN --- */}
          <h3 style={{ marginTop: '30px' }}>Phương thức thanh toán</h3>
          <div className="payment-methods">
            <label className={`payment-option ${paymentMethod === 'COD' ? 'active' : ''}`}>
              <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>💵 Thanh toán khi nhận hàng (COD)</span>
            </label>
            
            <label className={`payment-option ${paymentMethod === 'BANKING' ? 'active' : ''}`}>
              <input type="radio" name="payment" value="BANKING" checked={paymentMethod === 'BANKING'} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span>💳 Chuyển khoản ngân hàng (Quét mã QR)</span>
            </label>
          </div>

          {/* HIỂN THỊ MÃ QR NẾU CHỌN CHUYỂN KHOẢN */}
          {paymentMethod === 'BANKING' && (
            <div className="qr-code-box">
              <p className="qr-guide">Mở App Ngân hàng để quét mã</p>
              <img src={qrCodeUrl} alt="QR Code Thanh Toán" className="qr-image" />
              <p className="qr-note">Số tiền: <b>{finalPrice.toLocaleString()}đ</b></p>
              <p className="qr-note">Nội dung CK: <b>Thanh toan don hang AgriMarket</b></p>
            </div>
          )}

          <button type="submit" className="place-order-btn">
            XÁC NHẬN ĐẶT HÀNG
          </button>
        </div>

      </form>
    </div>
  );
};

export default Checkout;
