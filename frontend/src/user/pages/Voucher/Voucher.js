import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaCrown } from 'react-icons/fa'; // Cài đặt: npm install react-icons
import './Voucher.css';

// 1. Mock API (Giả lập dữ liệu từ server)
const vouchersAPI = {
  getAll: async () => {
    // Giả lập độ trễ mạng 0.5s
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { 
        id: 1, 
        code: 'LUMINA10', 
        discount: 'Giảm 10%', 
        desc: 'Cho tất cả trang sức kim cương', 
        date: '31/12/2026', 
        minOrder: 5000000 
      },
      { 
        id: 2, 
        code: 'GOLDEN20', 
        discount: 'Giảm 20%', 
        desc: 'Bộ sưu tập Vàng 18K', 
        date: '30/11/2026', 
        minOrder: 10000000 
      },
      { 
        id: 3, 
        code: 'WELCOME', 
        discount: 'Giảm 500k', 
        desc: 'Dành cho khách hàng mới', 
        date: '01/05/2026', 
        minOrder: 2000000 
      },
    ];
  }
};

const Voucher = () => {
  const navigate = useNavigate();
  
<<<<<<< HEAD
  // 1. Lấy thông tin User và Hạng (Tier) từ localStorage
  // Thay thế đoạn khai báo userTierId cũ bằng đoạn này:
const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
const userId = storedUser.id || null;

// ÉP KIỂU SỐ và đảm bảo lấy đúng trường dữ liệu
// Nếu membership_tier_id bị undefined, nó sẽ mặc định là 1
const userTierId = Number(storedUser.membership_tier_id || storedUser.tier_id || 1); 

console.log("ID Hạng hiện tại trong máy của bạn là:", userTierId);

=======
  // 2. Quản lý State
>>>>>>> b1af544 (update)
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State cho đồng hồ đếm ngược (Sử dụng tổng số giây để đếm chính xác nhất: 12 giờ = 43200 giây)
  const [totalSeconds, setTotalSeconds] = useState(12 * 3600);

<<<<<<< HEAD
  const [savedVouchers, setSavedVouchers] = useState(() => {
    const saved = localStorage.getItem('lumina_saved_vouchers');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedVoucher, setSelectedVoucher] = useState(null); 
=======
  // 3. Logic Đếm Ngược
  useEffect(() => {
    if (totalSeconds <= 0) return;
    const timer = setInterval(() => {
      setTotalSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [totalSeconds]);
>>>>>>> b1af544 (update)

  // Chuyển đổi giây thành format Giờ - Phút - Giây
  const timeDisplay = useMemo(() => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  }, [totalSeconds]);

  // 4. Lấy dữ liệu Voucher từ API
  useEffect(() => {
    localStorage.setItem('lumina_saved_vouchers', JSON.stringify(savedVouchers));
  }, [savedVouchers]);

  // --- FETCH VOUCHERS ---
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        // Thêm timestamp để chống cache dữ liệu cũ
        const url = userId 
          ? `http://127.0.0.1:8000/api/promotions?user_id=${userId}&t=${new Date().getTime()}`
          : `http://127.0.0.1:8000/api/promotions?t=${new Date().getTime()}`;

        const response = await fetch(url);      
        if (!response.ok) throw new Error('Lỗi kết nối đến máy chủ.');

        const rawData = await response.json();
        
        const formattedData = rawData
          .filter(item => Number(item.status) === 1)
          .map(item => {
            // Xác định hạng yêu cầu (Khớp với ID trong DB của bạn)
            const minRequired = Number(item.min_tier_id || 1);
            let tierName = "Mọi thành viên";
            if (minRequired === 2) tierName = "Hạng Bạc";
            if (minRequired === 3) tierName = "Hạng Vàng";

            return {
              id: item.id,
              code: item.code,
              discount: item.type === 'percent' ? `Giảm ${item.value}%` : `Giảm ${Number(item.value).toLocaleString('vi-VN')}đ`,
              desc: item.name,
              date: item.end_date ? new Date(item.end_date).toLocaleDateString('vi-VN') : 'Không giới hạn',
              minOrder: item.min_order || 0,
              scope: item.scope, 
              product_id: item.product_id,
              is_gift: item.is_gift,
              tier_requirement: tierName,
              // LOGIC KHÓA: Nếu hạng user < hạng yêu cầu
              is_locked: userTierId < minRequired 
            };
          });

        setVouchers(formattedData);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách ưu đãi.');
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, [userId, userTierId]);

<<<<<<< HEAD
  const handleSaveVoucher = (v) => {
    if (v.is_locked) return; // Chống lưu mã bị khóa
    if (!savedVouchers.includes(v.id)) {
      setSavedVouchers([...savedVouchers, v.id]);
    }
=======
  // 5. Xử lý Sự kiện
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Lumina Jewelry: Đã lưu mã ưu đãi ${code}`);
>>>>>>> b1af544 (update)
  };

  const handleBuyNow = (v) => {
    if (v.is_locked) return; // Chống dùng mã bị khóa
    if (v.scope === 'product' && v.product_id) {
      navigate(`/product/${v.product_id}`); 
    } else {
      navigate('/shop'); 
    }
    setSelectedVoucher(null); 
  };

  // 6. Render Giao diện
  return (
    <div className="voucher-container" style={{ backgroundColor: '#fff', paddingBottom: '50px' }}>
      
<<<<<<< HEAD
      {/* BANNER */}
      <div className="flash-sale-banner" style={{ background: 'linear-gradient(135deg, #111 0%, #333 100%)', color: '#c5a059', padding: '40px', borderBottom: '3px solid #c5a059', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', letterSpacing: '2px', marginBottom: '10px' }}>👑 GOLDEN HOUR PRIVILEGE</h2>
          <p style={{ color: '#eee', fontStyle: 'italic' }}>Chào mừng bạn quay lại! Hạng hiện tại: <strong>{userTierId === 2 ? 'Bạc' : userTierId === 3 ? 'Vàng' : 'Mới'}</strong></p>
=======
      {/* BANNER ƯU ĐÃI ĐẲNG CẤP */}
      <div className="flash-sale-banner" style={{ 
        background: 'linear-gradient(135deg, #111 0%, #333 100%)', 
        color: '#c5a059', 
        padding: '40px',
        borderRadius: '0px', 
        borderBottom: '3px solid #c5a059'
      }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', letterSpacing: '2px', marginBottom: '10px' }}>
            👑 GOLDEN HOUR PRIVILEGE
          </h2>
          <p style={{ color: '#eee', fontStyle: 'italic' }}>Cơ hội cuối cùng để sở hữu những tuyệt tác với đặc quyền ưu đãi.</p>
        </div>
        
        <div className="timer-box" style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          {[
            { label: 'Giờ', value: timeDisplay.hours },
            { label: 'Phút', value: timeDisplay.minutes },
            { label: 'Giây', value: timeDisplay.seconds }
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
>>>>>>> b1af544 (update)
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#111', fontSize: '24px', marginBottom: '30px', borderLeft: '4px solid #c5a059', paddingLeft: '15px', textTransform: 'uppercase' }}>
          Ưu đãi dành cho bạn
        </h3>
        
        <div className="voucher-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
<<<<<<< HEAD
          {loading && <p>Đang kiểm tra ưu đãi...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          {!loading && vouchers.map((v) => {
            const isSaved = savedVouchers.includes(v.id);

            return (
              <div key={v.id} className="voucher-card" style={{ 
                border: v.is_locked ? '1px solid #ccc' : (v.is_gift ? '1px solid #c5a059' : '1px solid #e0e0e0'),
                display: 'flex', background: '#fff', position: 'relative',
                filter: v.is_locked ? 'grayscale(0.8)' : 'none' // Làm xám nếu bị khóa
              }}>
                
                {/* Badge Trạng thái */}
                {v.is_locked ? (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', color: '#666', zIndex: 1 }}><FaLock /></div>
                ) : v.is_gift && (
                  <div style={{ position: 'absolute', top: '-10px', right: '10px', background: '#c5a059', color: '#fff', padding: '2px 10px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', zIndex: 1 }}>QUÀ TẶNG RIÊNG</div>
                )}

                <div style={{ 
                  background: v.is_locked ? '#555' : (v.is_gift ? '#c5a059' : '#111'),
                  color: (v.is_gift && !v.is_locked) ? '#111' : '#c5a059', 
                  padding: '20px', writingMode: 'vertical-rl', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px dashed #c5a059' 
                }}>
                  {v.is_locked ? 'LIMITED' : v.code}
                </div>

                <div className="voucher-info" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ color: '#111', fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', fontFamily: 'Playfair Display' }}>{v.discount}</div>
                  
                  {/* Tag hạng yêu cầu */}
                  <div style={{ fontSize: '12px', color: '#c5a059', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FaCrown style={{ marginRight: '5px' }} /> {v.tier_requirement}
                  </div>

                  <div style={{ color: '#666', fontSize: '13px', marginBottom: '10px', minHeight: '32px' }}>
                    {v.is_locked ? `Cần đạt ${v.tier_requirement} để mở khóa.` : v.desc}
                  </div>
                  
                  <div className="voucher-footer" style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: 'auto' }}>
                    <small style={{ color: '#999', display: 'block' }}>Hạn cuối: {v.date}</small>
                    <div className="voucher-actions" style={{ paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button 
                        onClick={() => setSelectedVoucher(v)}
                        style={{ background: 'none', border: 'none', color: '#0056b3', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        Điều kiện
                      </button>

                      {v.is_locked ? (
                        <button 
                          onClick={() => navigate('/profile')}
                          style={{ padding: '8px 15px', background: '#eee', color: '#333', border: '1px solid #999', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                        >
                          THĂNG HẠNG
                        </button>
                      ) : !isSaved ? (
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
=======
          {loading && <p style={{ fontStyle: 'italic', color: '#666' }}>Đang tải đặc quyền...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          {!loading && !error && vouchers.map((v) => (
            <div key={v.id} className="voucher-card" style={{ 
              border: '1px solid #e0e0e0',
              display: 'flex',
              background: '#fff',
              transition: '0.3s'
            }}>
              {/* Phần bên trái: Code */}
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
                borderRight: '2px dashed #c5a059',
                transform: 'rotate(180deg)'
              }}>
                {v.code}
              </div>

              {/* Phần bên phải: Info */}
              <div className="voucher-info" style={{ padding: '20px', flex: 1 }}>
                <div style={{ color: '#111', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', fontFamily: 'Playfair Display, serif' }}>
                  {v.discount}
                </div>
                <div className="voucher-desc" style={{ color: '#666', fontSize: '14px', marginBottom: '15px', minHeight: '40px' }}>
                  {v.desc}
                </div>
                
                <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px' }}>
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
                      flex: 1, padding: '10px', background: 'transparent', 
                      border: '1px solid #111', cursor: 'pointer', fontSize: '12px',
                      textTransform: 'uppercase', fontWeight: 'bold'
                    }}
                  >
                    Lưu mã
                  </button>
                  <button 
                    onClick={() => handleApply(v.code)}
                    style={{ 
                      flex: 1, padding: '10px', background: '#111', 
                      color: '#c5a059', border: 'none', cursor: 'pointer', fontSize: '12px',
                      textTransform: 'uppercase', fontWeight: 'bold'
                    }}
                  >
                    Sử dụng
                  </button>
>>>>>>> b1af544 (update)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedVoucher && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '450px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
              Chi tiết mã giảm giá
              <button onClick={() => setSelectedVoucher(null)} style={{ float: 'right', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px', fontSize: '14px', lineHeight: '2' }}>
              <p><strong>Mã:</strong> {selectedVoucher.is_locked ? '********' : selectedVoucher.code}</p>
              <p><strong>Ưu đãi:</strong> {selectedVoucher.discount}</p>
              <p><strong>Yêu cầu hạng:</strong> {selectedVoucher.tier_requirement}</p>
              <p><strong>Trạng thái của bạn:</strong> {userTierId < Number(selectedVoucher.min_tier_id) ? 'Chưa đủ hạng' : 'Đã đủ điều kiện'}</p>
              <p><strong>Hạn sử dụng:</strong> {selectedVoucher.date}</p>
            </div>

            <div style={{ padding: '15px', borderTop: '1px solid #eee' }}>
              <button 
                onClick={() => selectedVoucher.is_locked ? navigate('/profile') : handleBuyNow(selectedVoucher)}
                style={{ width: '100%', padding: '12px', background: selectedVoucher.is_locked ? '#777' : '#D99485', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {selectedVoucher.is_locked ? 'KIỂM TRA HẠNG THÀNH VIÊN' : 'DÙNG NGAY'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Voucher;