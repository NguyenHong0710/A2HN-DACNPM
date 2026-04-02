import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="luxury-footer" style={{ backgroundColor: '#111', color: '#ccc', paddingTop: '40px' }}>
      {/* Thay thế đường lượn sóng bằng đường viền gradient vàng kim tinh tế */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #c5a059, transparent)', marginBottom: '50px' }}></div> 

      <div className="footer-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '30px', padding: '0 20px' }}>
        
        {/* Cột 1: Về Thương Hiệu */}
        <div className="footer-col" style={{ flex: '1', minWidth: '250px' }}>
          <h3 style={{ color: '#c5a059', fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '20px' }}>Lumina Jewelry</h3>
          <p style={{ lineHeight: '1.8' }}>Lumina Jewelry tự hào mang đến những tuyệt tác kim hoàn tinh xảo. Chúng tôi cam kết tôn vinh vẻ đẹp quý phái và lưu giữ những khoảnh khắc vĩnh cửu của bạn.</p>
        </div>

        {/* Cột 2: Liên kết */}
        <div className="footer-col" style={{ flex: '1', minWidth: '150px' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Khám Phá</h3>
          <ul className="footer-links" style={{ listStyle: 'none', padding: 0, lineHeight: '2.2' }}>
            <li><Link to="/" style={{ color: '#ccc', textDecoration: 'none', transition: '0.3s' }}>Trang chủ</Link></li>
            <li><Link to="/shop" style={{ color: '#ccc', textDecoration: 'none', transition: '0.3s' }}>Bộ sưu tập</Link></li>
            <li><Link to="/about" style={{ color: '#ccc', textDecoration: 'none', transition: '0.3s' }}>Câu chuyện</Link></li>
            <li><Link to="/voucher" style={{ color: '#ccc', textDecoration: 'none', transition: '0.3s' }}>Đặc quyền VIP</Link></li>
          </ul>
        </div>

        {/* Cột 3: Liên hệ */}
        <div className="footer-col" style={{ flex: '1', minWidth: '250px' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Liên Hệ</h3>
          <ul className="footer-contact" style={{ listStyle: 'none', padding: 0, lineHeight: '2.2' }}>
            <li><FaMapMarkerAlt style={{ color: '#c5a059', marginRight: '10px' }} /> Showroom: ĐH Kiến Trúc Đà Nẵng</li>
            <li><FaPhoneAlt style={{ color: '#c5a059', marginRight: '10px' }} /> Hotline: 0905 559 129</li>
            <li><FaEnvelope style={{ color: '#c5a059', marginRight: '10px' }} /> contact@luminajewelry.com</li>
          </ul>
        </div>

        {/* Cột 4: Kết nối */}
        <div className="footer-col" style={{ flex: '1', minWidth: '250px' }}>
          <h3 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>Theo Dõi Chúng Tôi</h3>
          <div className="social-links" style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: '#c5a059', fontSize: '20px', transition: '0.3s' }}><FaFacebook /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: '#c5a059', fontSize: '20px', transition: '0.3s' }}><FaInstagram /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ color: '#c5a059', fontSize: '20px', transition: '0.3s' }}><FaTwitter /></a>
          </div>
          
          <h3 style={{ color: '#fff', fontSize: '15px', marginBottom: '15px' }}>Đăng ký nhận bản tin</h3>
          <div className="subscribe-box" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden' }}>
            <input 
              type="email" 
              placeholder="Email của bạn..." 
              style={{ padding: '12px', width: '100%', border: '1px solid #333', backgroundColor: '#222', color: '#fff', outline: 'none' }} 
            />
            <button style={{ padding: '12px 20px', backgroundColor: '#c5a059', color: '#111', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
              Gửi
            </button>
          </div>
        </div>
      </div>

      <div className="footer-bottom" style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid #333', marginTop: '40px', fontSize: '14px', color: '#888' }}>
        <p>&copy; 2026 Lumina Jewelry. Tất cả các quyền được bảo lưu.</p>
      </div>
    </footer>
  );
};

export default Footer;