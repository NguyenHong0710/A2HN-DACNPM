import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      {/* 1. Banner Đầu Trang */}
      <div className="about-banner">
        <p className="breadcrumb">Trang chủ / Giới thiệu</p>
        <h1>Về Chúng Tôi</h1>
      </div>

      
      <div className="about-content">
        
        {/* Cột trái: Ảnh minh họa */}
        <div className="about-image">
          {}
          <img 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80" 
            alt="About AgriMarket" 
          />
          {/* Nút Play trang trí */}
          <div className="play-btn">
            <FaPlay style={{marginLeft: '5px'}}/> {}
          </div>
        </div>

        {/* Cột phải: Thông tin */}
        <div className="about-text">
          <h2>Chào mừng bạn đến với AgriMarket - Website Nông Sản Sạch</h2>
          <p>
            AgriMarket là cầu nối trực tiếp giữa người nông dân và bàn ăn của gia đình bạn. 
            Chúng tôi cam kết cung cấp các loại rau, củ, quả tươi ngon nhất, được trồng theo tiêu chuẩn VietGAP, 
            không hóa chất độc hại.
          </p>
          <p>
            "Sức khỏe của khách hàng là niềm vui của chúng tôi". Hãy để AgriMarket đồng hành cùng bữa cơm 
            hàng ngày của gia đình bạn với những sản phẩm xanh, sạch và an toàn nhất.
          </p>
          
          <Link to="/" className="shop-now-btn">Mua sắm ngay</Link>
        </div>

      </div>
    </div>
  );
};

export default About;
