import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { getAuthToken } from '../../utils/authStorage';
import { FiShield, FiPackage } from 'react-icons/fi';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const cartData = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [voucherError, setVoucherError] = useState('');
  
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '', note: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Lấy danh sách sản phẩm từ CartContext
  const currentCart = cartData.cart || cartData.cartItems || cartData.items || [];
  const safeCart = Array.isArray(currentCart) ? currentCart : [];
  const clearCart = cartData.clearCart || cartData.emptyCart || (() => {});

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
    
    const loadProfile = async () => {
      try {
        // SỬA LỖI: Thay authAPI bằng fetch trực tiếp
        const res = await fetch('http://localhost:8000/api/profile', {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) {
            const profile = await res.json();
            setFormData(prev => ({
              ...prev,
              fullName: profile.name || prev.fullName,
              phone: profile.phone || prev.phone,
              address: profile.address || prev.address
            }));
        }
      } catch (e) { console.error("Lỗi tải profile:", e); }
    };
    if (token) loadProfile();
  }, []);

  const totalPrice = safeCart.reduce((total, item) => total + (item.price * (item.amount || item.quantity || 1)), 0);
  const discountAmount = Number(appliedVoucher?.discount_amount || 0);
  const finalPrice = Math.max(totalPrice - discountAmount, 0);

  // Xử lý Voucher (Giả định endpoint /api/vouchers/validate)
  const handleApplyVoucher = async () => {
    setVoucherError('');
    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:8000/api/vouchers/validate', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ code: voucherCode.trim().toUpperCase(), total: totalPrice })
      });
      const result = await res.json();
      if (res.ok) {
        setAppliedVoucher(result);
        setVoucherMessage(`Ưu đãi: -${Number(result.discount_amount).toLocaleString()}đ`);
      } else {
        setVoucherError(result.message || 'Mã không hợp lệ');
      }
    } catch (err) { setVoucherError('Lỗi kết nối voucher'); }
  };

  // XỬ LÝ ĐẶT HÀNG (SỬA LỖI ordersAPI)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) { navigate('/login'); return; }
    if (safeCart.length === 0) { alert("Giỏ hàng rỗng"); return; }

    try {
      setIsSubmitting(true);
      
      // Chuẩn bị dữ liệu gửi lên Laravel HoadonController
      const orderPayload = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        amount: finalPrice, // Sửa từ total_amount thành amount để khớp với DB và Model
        payment_method: paymentMethod === 'COD' ? 'Tiền mặt khi nhận' : 'Chuyển khoản bảo mật',
        items: safeCart.map(item => ({
            name: item.name, // Controller dùng $item['name']
            qty: item.amount || item.quantity || 1, // Controller dùng $item['qty']
            price: item.price // Controller dùng $item['price']
        }))
      };

      // Gửi yêu cầu đến Laravel
      const response = await fetch('http://localhost:8000/api/all-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✨ Tuyệt tác đã được xác nhận! Mã đơn: #${result.order_id || 'Lumina'}`);
        clearCart();
        navigate('/orders'); // Hoặc /profile để xem lịch sử
      } else {
        throw new Error(result.message || 'Lỗi khi tạo đơn hàng');
      }
    } catch (err) {
      alert(`Lỗi đặt hàng: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const qrCodeUrl = `https://img.vietqr.io/image/MB-0905559129-compact2.png?amount=${finalPrice}&addInfo=Thanh toan Lumina&accountName=TRAN THE KIET`;

  return (
    <div className="checkout-container" style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="checkout-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#111' }}>HOÀN TẤT ĐẶT HÀNG</h1>
      </div>

      <form className="checkout-content" onSubmit={handleSubmit} style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
        <div className="checkout-form-section" style={{ flex: '1.5', minWidth: '350px' }}>
          <h3 style={{ borderBottom: '1px solid #111', paddingBottom: '10px', marginBottom: '25px' }}>1. Địa chỉ nhận tuyệt tác</h3>
          <div style={{ display: 'grid', gap: '20px' }}>
            <input style={{ padding: '12px', border: '1px solid #ddd' }} type="text" placeholder="HỌ TÊN *" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
            <input style={{ padding: '12px', border: '1px solid #ddd' }} type="tel" placeholder="SỐ ĐIỆN THOẠI *" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            <textarea style={{ padding: '12px', border: '1px solid #ddd' }} placeholder="ĐỊA CHỈ GIAO HÀNG *" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required rows="3"></textarea>
          </div>

          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', border: '1px dashed #c5a059', display: 'flex', gap: '15px' }}>
            <FiPackage size={24} color="#c5a059" />
            <div>
              <strong>ĐẶC QUYỀN BAO BÌ LUMINA</strong>
              <p style={{ fontSize: '13px', color: '#666' }}>Sản phẩm được đóng gói cao cấp kèm chứng thư kiểm định.</p>
            </div>
          </div>
        </div>

        <div className="checkout-summary-section" style={{ flex: '1', minWidth: '320px', padding: '30px', border: '1px solid #eee' }}>
          <h3 style={{ marginBottom: '20px' }}>Tóm tắt đơn hàng</h3>
          {safeCart.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>{item.name} x{item.amount || item.quantity || 1}</span>
              <span>{(item.price * (item.amount || item.quantity || 1)).toLocaleString()}đ</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold' }}>
              <span>TỔNG CỘNG</span>
              <span>{finalPrice.toLocaleString()}đ</span>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h4 style={{ fontSize: '14px' }}>PHƯƠNG THỨC THANH TOÁN</h4>
            <label style={{ display: 'block', padding: '10px', border: '1px solid #eee', marginTop: '10px' }}>
              <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /> COD
            </label>
            <label style={{ display: 'block', padding: '10px', border: '1px solid #eee', marginTop: '10px' }}>
              <input type="radio" checked={paymentMethod === 'BANKING'} onChange={() => setPaymentMethod('BANKING')} /> Chuyển khoản
            </label>
            {paymentMethod === 'BANKING' && <img src={qrCodeUrl} alt="QR" style={{ width: '100%', marginTop: '15px' }} />}
          </div>

          <button type="submit" disabled={isSubmitting} style={{ 
            width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#111', 
            color: '#c5a059', border: 'none', fontWeight: 'bold', cursor: 'pointer' 
          }}>
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN TẠO TÁC'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;