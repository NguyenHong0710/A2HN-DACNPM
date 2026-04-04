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
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '', note: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // ================= STATE CHO VOUCHER =================
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [voucherError, setVoucherError] = useState('');
  // =======================================================

  // --- 1. HÀM XỬ LÝ ẢNH TỐI ƯU ---
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
    } catch (e) {
      console.error("Lỗi xử lý images:", e);
      return placeholder;
    }
  };

  const currentCart = cartData.cart || cartData.cartItems || cartData.items || [];
  const safeCart = Array.isArray(currentCart) ? currentCart : [];
  const clearCart = cartData.clearCart || cartData.emptyCart || (() => {});

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);

    // Tự động điền mã nếu khách hàng bấm "Sử dụng" từ trang Khuyến mãi
    const savedVoucher = localStorage.getItem('selectedVoucherCode');
    if (savedVoucher) {
      setVoucherCode(savedVoucher);
      localStorage.removeItem('selectedVoucherCode');
    }

    const loadProfile = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
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

  // --- TÍNH TOÁN TIỀN TỆ ---
  const totalPrice = safeCart.reduce((total, item) => total + (item.price * (item.amount || item.quantity || 1)), 0);
  const discountAmount = Number(appliedVoucher?.discount_amount || 0);
  const finalPrice = Math.max(totalPrice - discountAmount, 0);

  // --- 2. XỬ LÝ ÁP DỤNG VOUCHER ---
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã ưu đãi');
      return;
    }
    setVoucherError('');
    setVoucherMessage('');

    try {
      const token = getAuthToken();
      const res = await fetch('http://127.0.0.1:8000/api/vouchers/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: voucherCode.trim().toUpperCase(),
          total: totalPrice
        })
      });
      const result = await res.json();

      if (res.ok) {
        setAppliedVoucher(result);
        setVoucherMessage(`Đã áp dụng thành công: -${Number(result.discount_amount).toLocaleString('vi-VN')}đ`);
      } else {
        setVoucherError(result.message || 'Mã ưu đãi không hợp lệ hoặc không đủ điều kiện.');
        setAppliedVoucher(null);
      }
    } catch (err) {
      setVoucherError('Không thể kiểm tra mã ưu đãi lúc này.');
      setAppliedVoucher(null);
    }
  };

  // --- 3. XỬ LÝ ĐẶT HÀNG ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      alert("Vui lòng đăng nhập để thanh toán");
      navigate('/login');
      return;
    }
    if (safeCart.length === 0) {
      alert("Giỏ hàng của bạn đang trống");
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        amount: finalPrice,
        voucher_code: appliedVoucher ? voucherCode.toUpperCase() : null,
        discount: discountAmount,
        payment_method: paymentMethod === 'COD' ? 'Tiền mặt khi nhận' : 'Chuyển khoản ngân hàng',
        items: safeCart.map(item => {
          let imagePath = '';
          const rawImg = item.images || item.image || item.product_image;
          if (Array.isArray(rawImg)) imagePath = rawImg[0];
          else if (typeof rawImg === 'string' && rawImg.startsWith('[')) {
            try { imagePath = JSON.parse(rawImg)[0]; } catch (e) { imagePath = rawImg; }
          } else imagePath = rawImg;

          return {
            name: item.name,
            qty: item.amount || item.quantity || 1,
            price: item.price,
            images: imagePath
          };
        })
      };

      const response = await fetch('http://127.0.0.1:8000/api/create_invoice', {
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
        alert(`✨ Tuyệt tác đã được xác nhận! Mã đơn: #${result.id || result.order_id || 'Lumina'}`);
        clearCart();
        navigate('/orders');
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
        {/* CỘT TRÁI */}
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

        {/* CỘT PHẢI */}
        <div className="checkout-summary-section" style={{ flex: '1', minWidth: '320px', padding: '30px', border: '1px solid #eee' }}>
          <h3 style={{ marginBottom: '20px' }}>Tóm tắt đơn hàng</h3>

          <div className="checkout-items-scroll" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
            {safeCart.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <img
                  src={getImageUrl(item.images || item.image || item.product_image)}
                  alt={item.name}
                  onError={(e) => { e.target.src = 'https://placehold.jp/150x150.png?text=Lumina'; }}
                  style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '500' }}>
                    <span style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                    <span>{(item.price * (item.amount || item.quantity || 1)).toLocaleString()}đ</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>x{item.amount || item.quantity || 1}</div>
                </div>
              </div>
            ))}
          </div>

          {/* KHU VỰC VOUCHER */}
          <div style={{ borderTop: '1px dashed #ddd', borderBottom: '1px dashed #ddd', padding: '20px 0', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Nhập mã ưu đãi..."
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', outline: 'none' }}
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                style={{ padding: '0 15px', background: '#111', color: '#c5a059', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ÁP DỤNG
              </button>
            </div>
            {voucherMessage && <p style={{ color: '#28a745', fontSize: '13px', marginTop: '10px', fontWeight: 'bold' }}>✓ {voucherMessage}</p>}
            {voucherError && <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '10px' }}>⚠ {voucherError}</p>}
          </div>

          {/* TỔNG TIỀN */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#666' }}>
              <span>Tạm tính</span>
              <span>{totalPrice.toLocaleString()}đ</span>
            </div>
            {appliedVoucher && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#c5a059', fontWeight: '500' }}>
                <span>Khuyến mãi</span>
                <span>-{discountAmount.toLocaleString()}đ</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', borderTop: '1px solid #111', paddingTop: '15px', marginTop: '10px' }}>
              <span>TỔNG CỘNG</span>
              <span>{finalPrice.toLocaleString()}đ</span>
            </div>
          </div>

          {/* PHƯƠNG THỨC THANH TOÁN */}
          <div style={{ marginTop: '30px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '15px' }}>PHƯƠNG THỨC THANH TOÁN</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid #eee', marginBottom: '10px', cursor: 'pointer' }}>
              <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
              <span>Tiền mặt khi nhận hàng (COD)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid #eee', cursor: 'pointer' }}>
              <input type="radio" checked={paymentMethod === 'BANKING'} onChange={() => setPaymentMethod('BANKING')} />
              <span>Chuyển khoản ngân hàng</span>
            </label>
            {paymentMethod === 'BANKING' && (
              <div style={{ marginTop: '15px', textAlign: 'center', background: '#f9f9f9', padding: '15px', border: '1px dashed #ddd' }}>
                <img src={qrCodeUrl} alt="QR Thanh toán" style={{ width: '80%', maxWidth: '200px', margin: '0 auto' }} />
                <p style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>Quét mã QR để thanh toán an toàn</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#111',
              color: '#c5a059', border: 'none', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN TẠO TÁC'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;