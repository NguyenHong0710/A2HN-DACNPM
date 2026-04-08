import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../store/CartContext';
import { getAuthToken } from '../../utils/authStorage';
import { FiShield, FiPackage } from 'react-icons/fi';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartData = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '', note: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [voucherError, setVoucherError] = useState('');

  const getImageUrl = (images) => {
    const placeholder = 'https://placehold.jp/150x150.png?text=Lumina';
    if (!images || images === 'NULL') return placeholder;
    try {
      let path = '';
      if (typeof images === 'string' && images.startsWith('[')) {
        const parsed = JSON.parse(images);
        path = Array.isArray(parsed) ? parsed[0] : parsed;
      } else if (Array.isArray(images)) {
        path = images[0];
      } else {
        path = images;
      }
      if (!path) return placeholder;
      if (path.startsWith('http')) return path;
      const cleanPath = String(path).replace(/\\/g, '/').replace(/^\//, '');
      return `http://127.0.0.1:8000/storage/${cleanPath}`;
    } catch (e) { return placeholder; }
  };

  const getSelectedItems = () => {
    if (location.state?.selectedItems) return location.state.selectedItems;
    const localItems = localStorage.getItem('checkoutItems');
    if (localItems) {
      try { return JSON.parse(localItems); } catch (e) { return []; }
    }
    return [];
  };
//chu y

  const safeCart = getSelectedItems();
  const clearCart = cartData.clearCart || cartData.emptyCart || (() => {});

  const totalPrice = safeCart.reduce((total, item) => total + (item.price * (item.amount || item.quantity || 1)), 0);
  const discountAmount = Number(appliedVoucher?.discount_amount || 0);
  const finalPrice = Math.max(totalPrice - discountAmount, 0);

  const paypalUser = "nguyenhong"; 
  const usdAmount = (finalPrice / 25400).toFixed(2);
  const paypalMeLink = `https://www.paypal.me/${paypalUser}/${usdAmount}`;
  const qrPayPalUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paypalMeLink)}`;

  useEffect(() => {
    if (safeCart.length === 0) {
      navigate('/cart');
      return;
    }
    const token = getAuthToken();
    setIsLoggedIn(!!token);

    const loadProfile = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/profile', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) {
          const profile = await res.json();
          const userData = profile.data || profile; 
          setFormData(prev => ({
            ...prev,
            fullName: userData.name || prev.fullName,
            phone: userData.phone || prev.phone,
            address: userData.address || prev.address
          }));
        }
      } catch (e) { console.error("Lỗi tải profile:", e); }
    };
    if (token) loadProfile();
  }, [navigate, safeCart.length]);

  // ================= CẬP NHẬT HÀM ÁP DỤNG VOUCHER (GỬI CHI TIẾT ITEMS) =================
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) { setVoucherError('Vui lòng nhập mã'); return; }

    try {
      const token = getAuthToken();
      
      // Gửi danh sách sản phẩm chi tiết để Backend đối chiếu id và tính toán trên item đó
      const itemsForValidate = safeCart.map(item => ({
        product_id: item.id || item.product_id,
        price: item.price,
        qty: item.amount || item.quantity || 1
      }));

      const res = await fetch('http://127.0.0.1:8000/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          code: voucherCode.trim().toUpperCase(), 
          items: itemsForValidate 
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        setAppliedVoucher(result); // result nên chứa discount_amount và product_id được áp dụng
        setVoucherMessage(`Thành công: -${Number(result.discount_amount).toLocaleString()}đ`);
        setVoucherError('');
      } else {
        setVoucherError(result.message);
        setAppliedVoucher(null);
        setVoucherMessage('');
      }
    } catch (err) {
      setVoucherError('Lỗi kết nối server');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) { alert("Vui lòng đăng nhập"); return; }
    
    setIsSubmitting(true);
    
    const orderPayload = {
      fullName: formData.fullName,
      phone: formData.phone,
      address: formData.address,
      amount: finalPrice,
      payment_method: paymentMethod === 'COD' ? 'Tiền mặt khi nhận' : 'PayPal QR',
      voucher_code: appliedVoucher ? appliedVoucher.code : null,
      discount_amount: discountAmount,
      items: safeCart.map(item => ({
        name: item.name,
        qty: item.amount || item.quantity || 1,
        price: item.price,
        product_id: item.id || item.product_id,
        images: item.images || item.image || item.product_image 
      }))
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/create_invoice', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });
      
      if (response.ok) {
        alert("✨ Tuyệt tác đã được xác nhận!");
        localStorage.removeItem('checkoutItems');
        clearCart();
        navigate('/orders');
      } else {
        const errorData = await response.json();
        alert("Lỗi khi tạo đơn hàng: " + (errorData.message || "Vui lòng thử lại"));
      }
    } catch (err) {
      alert("Lỗi kết nối: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-container" style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="checkout-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#111' }}>HOÀN TẤT ĐẶT HÀNG</h1>
        </div>

        <form className="checkout-content" onSubmit={handleSubmit} style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
          <div className="checkout-form-section" style={{ flex: '1.5', minWidth: '350px' }}>
            <h3 style={{ borderBottom: '1px solid #111', paddingBottom: '10px', marginBottom: '25px' }}>1. Địa chỉ nhận tuyệt tác</h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              <input style={{ padding: '12px', border: '1px solid #ddd' }} type="text" placeholder="HỌ TÊN *" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
              <input style={{ padding: '12px', border: '1px solid #ddd' }} type="tel" placeholder="SỐ ĐIỆN THOẠI *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              <textarea style={{ padding: '12px', border: '1px solid #ddd' }} placeholder="ĐỊA CHỈ GIAO HÀNG *" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required rows="3"></textarea>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', border: '1px dashed #c5a059', display: 'flex', gap: '15px' }}>
              <FiPackage size={24} color="#c5a059" />
              <div>
                <strong>ĐẶC QUYỀN BAO BÌ LUMINA</strong>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>Sản phẩm được đóng gói cao cấp kèm chứng thư kiểm định.</p>
              </div>
            </div>
          </div>

          <div className="checkout-summary-section" style={{ flex: '1', minWidth: '320px', padding: '30px', border: '1px solid #eee' }}>
            <h3 style={{ marginBottom: '20px' }}>Tóm tắt đơn hàng</h3>
            
            <div className="checkout-items-scroll" style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
              {safeCart.map((item, index) => {
                // Kiểm tra xem item này có phải item được áp mã giảm giá không
                const isDiscountedItem = appliedVoucher && 
                  (item.id === appliedVoucher.product_id || item.product_id === appliedVoucher.product_id);
                
                return (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f5f5f5' }}>
                    <img src={getImageUrl(item.images || item.image)} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '500' }}>
                        <span style={{ maxWidth: '180px' }}>{item.name}</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ 
                            display: 'block', 
                            textDecoration: isDiscountedItem ? 'line-through' : 'none',
                            color: isDiscountedItem ? '#999' : '#111',
                            fontSize: isDiscountedItem ? '12px' : '14px'
                          }}>
                            {(item.price * (item.amount || item.quantity || 1)).toLocaleString()}đ
                          </span>
                          {isDiscountedItem && (
                            <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '14px' }}>
                              {((item.price * (item.amount || item.quantity || 1)) - discountAmount).toLocaleString()}đ
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#888' }}>x{item.amount || item.quantity || 1}</span>
                        {isDiscountedItem && <span style={{ fontSize: '11px', color: '#28a745', fontStyle: 'italic' }}>Đã áp dụng mã</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px dashed #ddd', borderBottom: '1px dashed #ddd', padding: '20px 0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Mã ưu đãi..." value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} style={{ flex: 1, padding: '10px', border: '1px solid #ddd' }} />
                <button type="button" onClick={handleApplyVoucher} style={{ padding: '0 15px', background: '#111', color: '#c5a059', fontWeight: 'bold' }}>ÁP DỤNG</button>
              </div>
              {voucherMessage && <p style={{ color: '#28a745', fontSize: '12px', marginTop: '5px' }}>{voucherMessage}</p>}
              {voucherError && <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>{voucherError}</p>}
            </div>

            <div style={{ marginBottom: '20px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}><span>Tạm tính</span><span>{totalPrice.toLocaleString()}đ</span></div>
               {discountAmount > 0 && (
                 <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc3545', marginTop: '5px' }}>
                   <span>Giảm giá {appliedVoucher?.code && `(${appliedVoucher.code})`}</span>
                   <span>-{discountAmount.toLocaleString()}đ</span>
                 </div>
               )}
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', marginTop: '15px', color: '#111' }}>
                 <span>TỔNG CỘNG</span>
                 <span>{finalPrice.toLocaleString()}đ</span>
               </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '15px', letterSpacing: '1px' }}>PHƯƠNG THỨC THANH TOÁN</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid #eee', marginBottom: '10px', cursor: 'pointer' }}>
                <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /> 
                <span style={{ fontSize: '14px' }}>Tiền mặt khi nhận hàng (COD)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid #eee', cursor: 'pointer' }}>
                <input type="radio" checked={paymentMethod === 'PAYPAL'} onChange={() => setPaymentMethod('PAYPAL')} /> 
                <span style={{ fontSize: '14px' }}>PayPal QR / Chuyển khoản quốc tế</span>
              </label>

              {paymentMethod === 'PAYPAL' && (
                <div style={{ marginTop: '15px', textAlign: 'center', background: '#f0f7ff', padding: '20px', border: '1px solid #0070ba', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 'bold', color: '#0070ba', marginBottom: '10px', fontSize: '13px' }}>QUÉT MÃ PAYPAL ĐỂ THANH TOÁN</p>
                  <img src={qrPayPalUrl} alt="PayPal QR" style={{ width: '180px', height: '180px', border: '5px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Tỷ giá tạm tính: 1 USD ≈ 25.400đ</p>
                  <p style={{ fontSize: '14px', color: '#111', marginTop: '5px' }}>Số tiền: <strong>${usdAmount} USD</strong></p>
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} style={{ 
              width: '100%', 
              marginTop: '30px', 
              padding: '18px', 
              backgroundColor: '#111', 
              color: '#c5a059', 
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: '0.3s'
            }}>
              {isSubmitting ? 'ĐANG XỬ LÝ ĐƠN HÀNG...' : 'XÁC NHẬN TẠO TÁC'}
            </button>
          </div>
        </form>
    </div>
  );
};

export default Checkout;