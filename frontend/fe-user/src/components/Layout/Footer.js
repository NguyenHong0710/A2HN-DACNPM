import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="fresh-footer">
      {/* Đường lượn sóng tạo điểm nhấn */}
      <div className="footer-wave"></div> 

      <div className="footer-content">
        {/* Cột 1: Về AgriMarket */}
        <div className="footer-col">
          <h3>Về AgriMarket</h3>
          <p>AgriMarket tự hào là hệ thống cung cấp nông sản sạch, an toàn và chất lượng nhất đến tận tay người tiêu dùng Việt. Chúng tôi cam kết mang lại bữa ăn dinh dưỡng cho gia đình bạn.</p>
        </div>

        {/* Cột 2: Liên kết */}
        <div className="footer-col">
          <h3>Liên kết</h3>
          <ul className="footer-links">
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/shop">Cửa hàng</Link></li>
            <li><Link to="/about">Giới thiệu</Link></li>
            <li><Link to="/voucher">Ưu đãi</Link></li>
          </ul>
        </div>

        {/* Cột 3: Liên hệ */}
        <div className="footer-col">
          <h3>Liên hệ</h3>
          <ul className="footer-contact">
            <li><FaMapMarkerAlt /> ĐẠI HỌC KIẾN TRÚC ĐÀ NẴNG</li>
            <li><FaPhoneAlt /> 0905559129</li>
            <li><FaEnvelope /> contact@agrimarket.com</li>
          </ul>
        </div>

        {/* Cột 4: Kết nối */}
        <div className="footer-col">
          <h3>Kết nối</h3>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noreferrer"><FaFacebook /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer"><FaTwitter /></a>
          </div>
          
          <h3 style={{ marginTop: '25px', fontSize: '15px' }}>Đăng ký nhận tin</h3>
          <div className="subscribe-box">
            <input type="email" placeholder="Email của bạn" />
            <button>Gửi</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 AgriMarket. Tất cả các quyền được bảo lưu.</p>
      </div>
    </footer>
  );
};

export default Footer;
