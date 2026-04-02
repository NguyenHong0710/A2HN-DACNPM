import React from 'react';
import { FaShippingFast, FaLeaf, FaAward, FaHeadset } from 'react-icons/fa';
import './Services.css';

const Services = () => {
  const services = [
    { icon: <FaShippingFast />, title: "Miễn phí vận chuyển", desc: "Cho đơn từ 300k" },
    { icon: <FaLeaf />, title: "Rau củ tươi xanh", desc: "Cam kết 100% tươi" },
    { icon: <FaAward />, title: "Chất lượng cao", desc: "Đạt chuẩn VietGAP" },
    { icon: <FaHeadset />, title: "Hỗ trợ 24/7", desc: "Hotline: 1900 1234" },
  ];

  return (
    <div className="services-container">
      {services.map((item, index) => (
        <div key={index} className="service-item">
          <div className="icon-circle">
            {item.icon}
          </div>
          <h3>{item.title}</h3>
          <p>{item.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default Services;
