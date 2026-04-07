import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Voucher.css';

const Voucher = () => {
  const navigate = useNavigate();
  
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 0, seconds: 0 });
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- LOGIC SHOPEE + GHI NHỚ TRẠNG THÁI ---
  // Khởi tạo state từ localStorage nếu đã có dữ liệu từ trước
  const [savedVouchers, setSavedVouchers] = useState(() => {
    const saved = localStorage.getItem('lumina_saved_vouchers');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedVoucher, setSelectedVoucher] = useState(null); 

  // Tự động lưu vào localStorage mỗi khi danh sách savedVouchers thay đổi
  useEffect(() => {
    localStorage.setItem('lumina_saved_vouchers', JSON.stringify(savedVouchers));
  }, [savedVouchers]);

  /* useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []); 
*/

  // 2. Hook lấy dữ liệu từ Laravel Backend (Giữ nguyên logic của bạn)
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:8000/api/promotions');      
        if (!response.ok) throw new Error('Lỗi kết nối đến máy chủ.');

        const rawData = await response.json();
        const formattedData = rawData
          .filter(item => item.status === 1 || item.status === '1')
          .map(item => ({
            id: item.id,
            code: item.code,
            discount: item.type === 'percent' ? `Giảm ${item.value}%` : `Giảm ${Number(item.value).toLocaleString('vi-VN')}đ`,
            desc: item.name,
            date: item.end_date ? new Date(item.end_date).toLocaleDateString('vi-VN') : 'Không giới hạn',
            minOrder: item.min_order || 0,
            scope: item.scope, 
            product_id: item.product_id 
          }));

        setVouchers(formattedData);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách ưu đãi.');
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  // --- HÀM XỬ LÝ ---

  // Nhấn Lưu mã -> Chuyển trạng thái sang "Mua ngay" và ghi nhớ vào máy
  const handleSaveVoucher = (v) => {
    if (!savedVouchers.includes(v.id)) {
      setSavedVouchers([...savedVouchers, v.id]);
    }
  };

  // Nhấn Mua ngay -> Điều hướng thông minh (Giữ nguyên logic của bạn)
  const handleBuyNow = (v) => {
    if (v.scope === 'product' && v.product_id) {
      navigate(`/product/${v.product_id}`); 
    } else {
      navigate('/shop'); 
    }
    setSelectedVoucher(null); 
  };

  return (
    <div className="voucher-container" style={{ backgroundColor: '#fff', paddingBottom: '50px' }}>
      
      {/* BANNER ƯU ĐÃI (Giữ nguyên) */}
      <div className="flash-sale-banner" style={{ background: 'linear-gradient(135deg, #111 0%, #333 100%)', color: '#c5a059', padding: '40px', borderBottom: '3px solid #c5a059', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', letterSpacing: '2px', marginBottom: '10px' }}>👑 GOLDEN HOUR PRIVILEGE</h2>
          <p style={{ color: '#eee', fontStyle: 'italic' }}>Cơ hội  để sở hữu những tuyệt tác với các ưu đãi.</p>
        </div>
        
        {/* <div className="timer-box" style={{ display: 'flex', gap: '15px' }}>
  {[{ label: 'Giờ', value: timeLeft.hours }, { label: 'Phút', value: timeLeft.minutes }, { label: 'Giây', value: timeLeft.seconds }].map((item, idx) => (
    <div key={idx} style={{ background: 'rgba(197, 160, 89, 0.2)', border: '1px solid #c5a059', padding: '10px', minWidth: '70px', textAlign: 'center' }}>
      <span style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}>{item.value.toString().padStart(2, '0')}</span>
      <small style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>{item.label}</small>
    </div>
  ))}
</div> 
*/}

      </div>

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#111', fontSize: '24px', marginBottom: '30px', borderLeft: '4px solid #c5a059', paddingLeft: '15px', textTransform: 'uppercase' }}>
          Ưu đãi của  bạn
        </h3>
        
        <div className="voucher-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
          {loading && <p>Đang kiểm tra ưu đãi...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          {!loading && vouchers.map((v) => {
            const isSaved = savedVouchers.includes(v.id);

            return (
              <div key={v.id} className="voucher-card" style={{ border: '1px solid #e0e0e0', display: 'flex', background: '#fff', position: 'relative' }}>
                <div style={{ background: '#111', color: '#c5a059', padding: '20px', writingMode: 'vertical-rl', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px dashed #c5a059' }}>
                  {v.code}
                </div>

                <div className="voucher-info" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ color: '#111', fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', fontFamily: 'Playfair Display' }}>{v.discount}</div>
                  <div style={{ color: '#666', fontSize: '13px', marginBottom: '10px', minHeight: '32px' }}>{v.desc}</div>
                  
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <small style={{ color: '#999', display: 'block' }}>Hạn cuối: {v.date}</small>
                  </div>

                  <div className="voucher-actions" style={{ marginTop: 'auto', paddingTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button 
                      onClick={() => setSelectedVoucher(v)}
                      style={{ background: 'none', border: 'none', color: '#0056b3', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Điều kiện
                    </button>

                    {!isSaved ? (
                      <button 
                        onClick={() => handleSaveVoucher(v)}
                        style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #111', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}
                      >
                        Lưu mã
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleBuyNow(v)}
                        style={{ padding: '8px 20px', background: '#D99485', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}
                      >
                        Mua ngay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL CHI TIẾT --- */}
      {selectedVoucher && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '450px', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
              Chi tiết mã giảm giá
              <button onClick={() => setSelectedVoucher(null)} style={{ position: 'absolute', right: '15px', top: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px', fontSize: '14px', lineHeight: '2' }}>
              <p><strong>Mã giảm giá:</strong> {selectedVoucher.code}</p>
              <p><strong>Ưu đãi:</strong> {selectedVoucher.discount}</p>
              <p><strong>Hạn sử dụng:</strong> {selectedVoucher.date}</p>
              <p><strong>Sản phẩm áp dụng:</strong> {selectedVoucher.scope === 'product' ? 'Chỉ áp dụng cho sản phẩm nhất định' : 'Toàn bộ sản phẩm trong cửa hàng'}</p>
              <p><strong>Phương thức thanh toán:</strong> Tất cả phương thức (COD, PayPal)</p>
              <p><strong>Đơn vị vận chuyển:</strong> Mọi đơn vị vận chuyển của Lumina</p>
            </div>

            <div style={{ padding: '15px', borderTop: '1px solid #eee' }}>
              <button 
                onClick={() => handleBuyNow(selectedVoucher)}
                style={{ width: '100%', padding: '12px', background: '#D99485', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Voucher;