import React, { useState, useEffect } from 'react';
import './Voucher.css';

const Voucher = () => {
  // State cho đồng hồ đếm ngược
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 59,
    seconds: 59
  });

  // Giả lập danh sách Voucher
  const vouchers = [
    { id: 1, code: "CHAOMUNG", discount: "Giảm 20%", desc: "Cho đơn hàng đầu tiên từ 0đ", date: "30/12/2026" },
    { id: 2, code: "FREESHIP", discount: "Freeship", desc: "Giảm tối đa 30k phí vận chuyển", date: "31/01/2026" },
    { id: 3, code: "RAUSACH", discount: "Giảm 50k", desc: "Cho đơn hàng rau củ từ 300k", date: "15/02/2026" },
    { id: 4, code: "TET2026", discount: "Lì xì 10%", desc: "Giảm tối đa 100k mua sắm Tết", date: "01/01/2027" },
  ];

  // Logic đếm ngược (Mỗi giây trừ 1)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev; // Hết giờ thì đứng im
      });
    }, 1000);

    return () => clearInterval(timer); // Dọn dẹp khi thoát trang
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Đã sao chép mã: ${code}`);
  };

  return (
    <div className="voucher-container">
      {/* BANNER FLASH SALE ĐẾM GIỜ */}
      <div className="flash-sale-banner">
        <div>
          <h2 style={{ fontSize: '28px', marginBottom: '5px' }}>⚡ FLASH SALE SĂN DEAL</h2>
          <p>Sắp kết thúc đợt phát mã giảm giá khủng!</p>
        </div>
        
        <div className="timer-box">
          <div className="time-unit">
            <span>{timeLeft.hours.toString().padStart(2, '0')}</span>
            <small>Giờ</small>
          </div>
          <div className="time-unit">
            <span>{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <small>Phút</small>
          </div>
          <div className="time-unit">
            <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
            <small>Giây</small>
          </div>
        </div>
      </div>

      {/* DANH SÁCH MÃ GIẢM GIÁ */}
      <h3 style={{ color: '#2e7d32', marginBottom: '20px', borderLeft: '4px solid #82ae46', paddingLeft: '10px' }}>
        Kho Voucher của bạn
      </h3>
      
      <div className="voucher-list">
        {vouchers.map((v) => (
          <div key={v.id} className="voucher-card">
            <div className="voucher-info">
              <div className="voucher-code">{v.code}</div>
              <div style={{color: '#ff5722', fontWeight: 'bold', marginBottom: '5px'}}>{v.discount}</div>
              <div className="voucher-desc">{v.desc}</div>
              <div className="expiry">HSD: {v.date}</div>
            </div>
            <div className="voucher-action" onClick={() => handleCopy(v.code)}>
              Lưu
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Voucher;
