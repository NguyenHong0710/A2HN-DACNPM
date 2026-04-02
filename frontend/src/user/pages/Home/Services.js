import React from 'react';
import { FaShippingFast, FaGem, FaAward, FaHeadset } from 'react-icons/fa';
import './Services.css';

const Services = () => {
  const services = [
    { icon: <FaShippingFast />, title: "Vận chuyển an toàn", desc: "Bảo hiểm 100% giá trị" },
    { icon: <FaGem />, title: "Thiết kế tinh xảo", desc: "Cam kết vàng bạc chuẩn" },
    { icon: <FaAward />, title: "Kiểm định quốc tế", desc: "Đầy đủ chứng nhận GIA" },
    { icon: <FaHeadset />, title: "Bảo hành trọn đời", desc: "Miễn phí làm sạch & xi mới" },
  ];

  return (
    <div className="services-container">
      {services.map((item, index) => (
        <div key={index} className="service-item">
          <div className="icon-circle" style={{ color: '#c5a059' }}>
            {item.icon}
          </div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#222' }}>{item.title}</h3>
          <p style={{ color: '#666' }}>{item.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default Services;