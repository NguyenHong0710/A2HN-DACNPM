import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Voucher.css';

const Voucher = () => {
  const navigate = useNavigate();
  
  // State cho đồng hồ đếm ngược - Tạo cảm giác gấp gáp cho các bộ sưu tập giới hạn
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 0,
    seconds: 0
  });

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const data = await vouchersAPI.getAll();
        setVouchers(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách ưu đãi.');
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Lumina Jewelry: Đã lưu mã ưu đãi ${code}`);
  };

  const handleApply = (code) => {
    localStorage.setItem('selectedVoucherCode', code);
    navigate('/checkout');
  };

  return (
    <div className="voucher-container" style={{ backgroundColor: '#fff', paddingBottom: '50px' }}>
      
      {/* BANNER ƯU ĐÃI ĐẲNG CẤP */}
      <div className="flash-sale-banner" style={{ 
        background: 'linear-gradient(135deg, #111 0%, #333 100%)', 
        color: '#c5a059', 
        padding: '40px',
        borderRadius: '0px', // Đẳng cấp thường dùng góc vuông hoặc bo cực nhẹ
        borderBottom: '3px solid #c5a059'
      }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', letterSpacing: '2px', marginBottom: '10px' }}>
            👑 GOLDEN HOUR PRIVILEGE
          </h2>
          <p style={{ color: '#eee', fontStyle: 'italic' }}>Cơ hội cuối cùng để sở hữu những tuyệt tác với đặc quyền ưu đãi.</p>
        </div>
        
        <div className="timer-box" style={{ display: 'flex', gap: '15px' }}>
          {[
            { label: 'Giờ', value: timeLeft.hours },
            { label: 'Phút', value: timeLeft.minutes },
            { label: 'Giây', value: timeLeft.seconds }
          ].map((item, idx) => (
            <div key={idx} className="time-unit" style={{ 
              background: 'rgba(197, 160, 89, 0.2)', 
              border: '1px solid #c5a059',
              padding: '10px',
              minWidth: '70px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', display: 'block' }}>
                {item.value.toString().padStart(2, '0')}
              </span>
              <small style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>{item.label}</small>
            </div>
          ))}
        </div>
      </div>

      {/* DANH SÁCH MÃ GIẢM GIÁ */}
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <h3 style={{ 
          fontFamily: 'Playfair Display, serif', 
          color: '#111', 
          fontSize: '24px',
          marginBottom: '30px', 
          borderLeft: '4px solid #c5a059', 
          paddingLeft: '15px',
          textTransform: 'uppercase'
        }}>
          Đặc quyền của riêng bạn
        </h3>
        
        <div className="voucher-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
          {loading && <p>Đang kiểm tra đặc quyền...</p>}
          
          {!loading && vouchers.map((v) => (
            <div key={v.id} className="voucher-card" style={{ 
              border: '1px solid #e0e0e0',
              display: 'flex',
              background: '#fff',
              transition: '0.3s'
            }}>
              {/* Phần bên trái: Code và Discount */}
              <div style={{ 
                background: '#111', 
                color: '#c5a059', 
                padding: '20px', 
                writingMode: 'vertical-rl', 
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '2px dashed #c5a059'
              }}>
                {v.code}
              </div>

              {/* Phần bên phải: Info */}
              <div className="voucher-info" style={{ padding: '20px', flex: 1 }}>
                <div style={{ color: '#111', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', fontFamily: 'Playfair Display' }}>
                  {v.discount}
                </div>
                <div className="voucher-desc" style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                  {v.desc}
                </div>
                
                <div style={{ borderTop: '1px solid #eee', pt: '10px', marginTop: '10px' }}>
                  <small style={{ color: '#999', display: 'block' }}>Hạn cuối: {v.date}</small>
                  {Number(v.minOrder) > 0 && (
                    <small style={{ color: '#c5a059', fontWeight: '500' }}>
                      Áp dụng cho đơn từ {Number(v.minOrder).toLocaleString('vi-VN')}đ
                    </small>
                  )}
                </div>

                <div className="voucher-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleCopy(v.code)}
                    style={{ 
                      flex: 1, padding: '8px', background: 'transparent', 
                      border: '1px solid #111', cursor: 'pointer', fontSize: '13px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Lưu mã
                  </button>
                  <button 
                    onClick={() => handleApply(v.code)}
                    style={{ 
                      flex: 1, padding: '8px', background: '#111', 
                      color: '#c5a059', border: 'none', cursor: 'pointer', fontSize: '13px',
                      textTransform: 'uppercase', fontWeight: 'bold'
                    }}
                  >
                    Sử dụng
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Voucher;