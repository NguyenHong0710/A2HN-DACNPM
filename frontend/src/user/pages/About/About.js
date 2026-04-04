import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';
import { newsData } from './newsData'; 

const About = () => {
  return (
    <div className="about-container">
      {/* 1. Banner Đầu Trang */}
      <div className="about-banner" style={{ backgroundColor: '#111', color: '#c5a059', borderBottom: '2px solid #c5a059', padding: '50px 0', textAlign: 'center' }}>
        <p className="breadcrumb" style={{ color: '#ccc', marginBottom: '15px', fontSize: '14px' }}>Trang chủ / Câu chuyện</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>Về Chúng Tôi</h1>
      </div>

      <div className="about-content" style={{ display: 'flex', flexWrap: 'wrap', gap: '50px', padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', alignItems: 'center' }}>
        
        {/* Cột trái: Hiển thị Ảnh Tĩnh (Thay cho Video) */}
        <div className="about-image" style={{ flex: '1', minWidth: '300px' }}>
            <div style={{ 
                borderRadius: '8px',
                overflow: 'hidden', 
                boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                aspectRatio: '16/9',
                backgroundColor: '#f4f4f4'
            }}>
                <img 
                    src="/bong-tai-bac-ban-to-1.webp" 
                    alt="Lumina Jewelry Collection" 
                    onError={(e) => { e.target.src = 'https://placehold.jp/800x450.png?text=Lumina+Jewelry'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
            </div>
        </div>

        {/* Cột phải: Thông tin văn bản */}
        <div className="about-text" style={{ flex: '1', minWidth: '300px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#222', fontSize: '32px', marginBottom: '25px', lineHeight: '1.4' }}>
            Chào mừng bạn đến với Lumina Jewelry - Tuyệt Tác Kim Hoàn
          </h2>
          <p style={{ color: '#555', lineHeight: '1.8', marginBottom: '20px', fontSize: '16px', textAlign: 'justify' }}>
            Lumina Jewelry là nơi tôn vinh vẻ đẹp vĩnh cửu và sự tinh tế trong từng đường nét. 
            Được chế tác từ những viên đá quý tinh tuyển và kim loại cao cấp nhất, mỗi món trang sức 
            của chúng tôi không chỉ là một phụ kiện, mà còn là một tác phẩm nghệ thuật.
          </p>
          <p style={{ color: '#555', lineHeight: '1.8', marginBottom: '40px', fontSize: '16px', fontStyle: 'italic', paddingLeft: '20px', borderLeft: '3px solid #c5a059' }}>
            "Sứ mệnh của chúng tôi là lưu giữ những khoảnh khắc quý giá nhất của bạn."
          </p>
          
          <Link to="/shop" style={{ 
            display: 'inline-block', backgroundColor: '#111', color: '#c5a059', 
            padding: '14px 35px', textDecoration: 'none', fontWeight: 'bold', 
            textTransform: 'uppercase', letterSpacing: '2px', border: '1px solid #c5a059', transition: '0.3s' 
          }}>
            Khám phá bộ sưu tập
          </Link>
        </div>
      </div>

      {/* --- PHẦN DANH SÁCH TIN TỨC --- */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 80px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'Playfair Display, serif', color: '#222', fontSize: '32px', marginBottom: '40px', borderTop: '1px solid #eaeaea', paddingTop: '60px' }}>
          TIN TỨC & KIẾN THỨC
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {newsData.map((article) => (
            <div key={article.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to={`/news/${article.id}`}>
                <img 
                  src={article.image} 
                  alt={article.title} 
                  onError={(e) => { e.target.src = 'https://placehold.jp/400x300.png?text=Lumina'; }}
                  style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px' }} 
                />
              </Link>
              <div style={{ paddingTop: '15px' }}>
                <Link to={`/news/${article.id}`} style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>
                  {article.title}
                </Link>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', margin: 0 }}>
                  {article.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;