import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { getAuthToken } from '../../utils/authStorage';
import { FiShield, FiPackage, FiCheckCircle } from 'react-icons/fi';
import { API_BASE as API_BASE_URL } from 'src/config'; // Khuyên dùng config để dễ quản lý URL

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

  const token = getAuthToken();

  // Lấy danh sách sản phẩm từ CartContext an toàn
  const currentCart = cartData.cart || cartData.cartItems || cartData.items || [];
  const safeCart = Array.isArray(currentCart) ? currentCart : [];
  const clearCart = cartData.clearCart || cartData.emptyCart || (() => {});

  useEffect(() => {
    setIsLoggedIn(!!token);
    
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) {
            const result = await res.json();
            const profile = result.data || result;
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
  }, [token]);

  const totalPrice = safeCart.reduce((total, item) => total + (item.price * (item.amount || item.quantity || 1)), 0);
  const discountAmount = appliedVoucher ? Number(appliedVoucher.discount_amount) : 0;
  const finalPrice = Math.max(totalPrice - discountAmount, 0);

  // Xử lý Voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherError('');
    setVoucherMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/vouchers/validate`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ code: voucherCode.trim().toUpperCase(), total: totalPrice })
      });
      const result = await res.json();
      if (res.ok) {
        setAppliedVoucher(result);
        setVoucherMessage(`Ưu đãi áp dụng: -${Number(result.discount_amount).toLocaleString()}đ`);
      } else {
        setVoucherError(result.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
        setAppliedVoucher(null);
      }
    } catch (err) { setVoucherError('Lỗi kết nối máy chủ voucher'); }
  };

  // XỬ LÝ ĐẶT HÀNG
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { alert("Vui lòng đăng nhập để đặt hàng"); navigate('/login'); return; }
    if (safeCart.length === 0) { alert("Giỏ hàng của quý khách hiện đang trống"); return; }

    try {
      setIsSubmitting(true);
      
      const orderPayload = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        note: formData.note,
        amount: finalPrice, // Khớp với HoadonController
        payment_method: paymentMethod === 'COD' ? 'Tiền mặt khi nhận' : 'Chuyển khoản bảo mật',
        items: safeCart.map(item => ({
            name: item.name,
            qty: item.amount || item.quantity || 1,
            price: item.price
        })),
        voucher_id: appliedVoucher?.id || null // Gửi kèm voucher để Controller xử lý trừ lượt dùng
      };

      const response = await fetch(`${API_BASE_URL}/create_invoice`, {
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
        navigate('/my-orders'); // Chuyển hướng về trang lịch sử đơn hàng của User
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra trong quá trình tạo đơn');
      }
    } catch (err) {
      alert(`Lỗi đặt hàng: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const qrCodeUrl = `https://img.vietqr.io/image/MB-0905559129-compact2.png?amount=${finalPrice}&addInfo=Thanh toan Lumina&accountName=TRAN THE KIET`;

  return (
    <div className="checkout-container" style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', color: '#111' }}>
      <div className="checkout-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', letterSpacing: '2px' }}>THANH TOÁN</h1>
      </div>

      <form className="checkout-content" onSubmit={handleSubmit} style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
        <div className="checkout-form-section" style={{ flex: '1.5', minWidth: '350px' }}>
          <h3 style={{ borderBottom: '1px solid #111', paddingBottom: '10px', marginBottom: '25px', fontSize: '18px', letterSpacing: '1px' }}>1. THÔNG TIN GIAO NHẬN</h3>
          <div style={{ display: 'grid', gap: '20px' }}>
            <input style={{ padding: '14px', border: '1px solid #eee', outline: 'none' }} type="text" placeholder="HỌ TÊN NGƯỜI NHẬN *" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
            <input style={{ padding: '14px', border: '1px solid #eee', outline: 'none' }} type="tel" placeholder="SỐ ĐIỆN THOẠI *" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            <textarea style={{ padding: '14px', border: '1px solid #eee', outline: 'none' }} placeholder="ĐỊA CHỈ GIAO HÀNG CHI TIẾT *" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required rows="3"></textarea>
            <input style={{ padding: '14px', border: '1px solid #eee', outline: 'none' }} type="text" placeholder="GHI CHÚ THÊM (VÍ DỤ: GIAO GIỜ HÀNH CHÍNH)" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
          </div>

          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0', display: 'flex', gap: '15px' }}>
            <FiPackage size={24} color="#c5a059" />
            <div>
              <strong style={{ fontSize: '14px' }}>QUY CÁCH ĐÓNG GÓI ĐỘC QUYỀN</strong>
              <p style={{ fontSize: '13px', color: '#888', marginTop: '5px' }}>Tất cả sản phẩm Lumina được đặt trong hộp nhung lót lụa cao cấp, niêm phong tem chống giả.</p>
            </div>
          </div>
        </div>

        <div className="checkout-summary-section" style={{ flex: '1', minWidth: '320px', padding: '30px', backgroundColor: '#fff', border: '1px solid #f0f0f0', alignSelf: 'flex-start' }}>
          <h3 style={{ marginBottom: '25px', fontSize: '18px' }}>TÓM TẮT ĐƠN HÀNG</h3>
          
          <div className="cart-items-preview" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
            {safeCart.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#555' }}>{item.name} <small>x{item.amount || item.quantity || 1}</small></span>
                <span style={{ fontWeight: '500' }}>{(item.price * (item.amount || item.quantity || 1)).toLocaleString()}đ</span>
              </div>
            ))}
          </div>

          {/* VOUCHER SECTION */}
          <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                style={{ flex: 1, padding: '10px', border: '1px solid #eee', fontSize: '13px' }} 
                type="text" 
                placeholder="MÃ ƯU ĐÃI" 
                value={voucherCode} 
                onChange={(e) => setVoucherCode(e.target.value)}
              />
              <button 
                type="button" 
                onClick={handleApplyVoucher}
                style={{ padding: '10px 15px', backgroundColor: '#f5f5f5', border: '1px solid #eee', fontSize: '12px', cursor: 'pointer' }}
              >
                ÁP DỤNG
              </button>
            </div>
            {voucherMessage && <p style={{ color: '#27ae60', fontSize: '12px', marginTop: '8px' }}><FiCheckCircle /> {voucherMessage}</p>}
            {voucherError && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '8px' }}>{voucherError}</p>}
          </div>

          <div style={{ borderTop: '1px solid #111', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#888' }}>
              <span>Tạm tính</span>
              <span>{totalPrice.toLocaleString()}đ</span>
            </div>
            {appliedVoucher && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#27ae60' }}>
                <span>Giảm giá</span>
                <span>-{discountAmount.toLocaleString()}đ</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>
              <span>TỔNG CỘNG</span>
              <span style={{ color: '#c5a059' }}>{finalPrice.toLocaleString()}đ</span>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h4 style={{ fontSize: '13px', marginBottom: '15px', color: '#888' }}>PHƯƠNG THỨC THANH TOÁN</h4>
            <div style={{ display: 'grid', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: '1px solid #eee', cursor: 'pointer' }}>
                <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                <span style={{ fontSize: '14px' }}>Tiền mặt khi nhận hàng (COD)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: '1px solid #eee', cursor: 'pointer' }}>
                <input type="radio" checked={paymentMethod === 'BANKING'} onChange={() => setPaymentMethod('BANKING')} />
                <span style={{ fontSize: '14px' }}>Chuyển khoản qua mã QR</span>
              </label>
            </div>
            
            {paymentMethod === 'BANKING' && (
              <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #eee', textAlign: 'center' }}>
                <img src={qrCodeUrl} alt="QR Thanh toán" style={{ width: '100%', maxWidth: '200px' }} />
                <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>Quét mã để thanh toán an toàn qua ngân hàng</p>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            style={{ 
              width: '100%', 
              marginTop: '30px', 
              padding: '18px', 
              backgroundColor: '#111', 
              color: '#c5a059', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              letterSpacing: '2px',
              transition: 'all 0.3s'
            }}
          >
            {isSubmitting ? 'ĐANG KHỞI TẠO...' : 'XÁC NHẬN ĐẶT HÀNG'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;