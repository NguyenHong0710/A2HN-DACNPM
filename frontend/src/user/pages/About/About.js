import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import './About.css';

const About = () => {
  // Trạng thái kiểm soát việc ẩn/hiện video YouTube
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="about-container">
      {/* 1. Banner Đầu Trang */}
      <div className="about-banner" style={{ backgroundColor: '#111', color: '#c5a059', borderBottom: '2px solid #c5a059', padding: '50px 0', textAlign: 'center' }}>
        <p className="breadcrumb" style={{ color: '#ccc', marginBottom: '15px', fontSize: '14px' }}>Trang chủ / Câu chuyện</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>Về Chúng Tôi</h1>
      </div>

      <div className="about-content" style={{ display: 'flex', flexWrap: 'wrap', gap: '50px', padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', alignItems: 'center' }}>
        
        {/* Cột trái: Form Video YouTube */}
        <div className="about-image" style={{ flex: '1', minWidth: '300px' }}>
          
          {/* Nếu chưa bấm Play -> Hiện ảnh cover và nút Play màu vàng kim */}
          {!isPlaying ? (
            <div 
              onClick={() => setIsPlaying(true)} 
              style={{ 
                position: 'relative', 
                cursor: 'pointer', 
                borderRadius: '8px',
                overflow: 'hidden', 
                boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                aspectRatio: '16/9', // Giữ tỷ lệ khung hình chuẩn của video
                backgroundColor: '#111'
              }}
            >
              {/* Ảnh bìa (Thumbnail) sang trọng trước khi xem video */}
              <img 
                src="https://images.unsplash.com/photo-1599643478524-fb66f70a0066?auto=format&fit=crop&w=800&q=80" 
                alt="Lumina Jewelry Cinematic" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.6 }}
              />
              
              {/* Nút Play ở giữa */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease-in-out'
              }}>
                <div style={{ 
                  backgroundColor: 'rgba(197, 160, 89, 0.95)', color: '#fff', 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)', transition: 'transform 0.3s'
                }} className="play-icon-wrapper">
                  <FaPlay style={{marginLeft: '6px', fontSize: '26px'}}/>
                </div>
              </div>
            </div>
          ) : (
            /* Nếu đã bấm Play -> Load iframe của YouTube và tự động phát (autoplay=1) */
            <div style={{ 
              borderRadius: '8px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
              aspectRatio: '16/9', backgroundColor: '#000' 
            }}>
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/yQgNO6Msop4?autoplay=1" 
                title="Lumina Jewelry Cinematic Showcase" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{ display: 'block' }}
              ></iframe>
            </div>
          )}

        </div>

        {/* Cột phải: Thông tin */}
        <div className="about-text" style={{ flex: '1', minWidth: '300px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#222', fontSize: '32px', marginBottom: '25px', lineHeight: '1.4' }}>
            Chào mừng bạn đến với Lumina Jewelry - Tuyệt Tác Kim Hoàn
          </h2>
          <p style={{ color: '#555', lineHeight: '1.8', marginBottom: '20px', fontSize: '16px', textAlign: 'justify' }}>
            Lumina Jewelry là nơi tôn vinh vẻ đẹp vĩnh cửu và sự tinh tế trong từng đường nét. 
            Được chế tác từ những viên đá quý tinh tuyển và kim loại cao cấp nhất, mỗi món trang sức 
            của chúng tôi không chỉ là một phụ kiện, mà còn là một tác phẩm nghệ thuật mang đậm dấu ấn cá nhân của những nghệ nhân lành nghề.
          </p>
          <p style={{ color: '#555', lineHeight: '1.8', marginBottom: '40px', fontSize: '16px', fontStyle: 'italic', paddingLeft: '20px', borderLeft: '3px solid #c5a059' }}>
            "Sứ mệnh của chúng tôi là lưu giữ những khoảnh khắc quý giá nhất của bạn." Hãy để Lumina Jewelry 
            đồng hành cùng bạn tỏa sáng trong mọi dịp quan trọng của cuộc đời với sự sang trọng và đẳng cấp vượt thời gian.
          </p>
          
          <Link to="/shop" className="shop-now-btn" style={{ 
            display: 'inline-block', backgroundColor: '#111', color: '#c5a059', 
            padding: '14px 35px', textDecoration: 'none', fontWeight: 'bold', 
            textTransform: 'uppercase', letterSpacing: '2px', border: '1px solid #c5a059', transition: '0.3s' 
          }}>
            Khám phá bộ sưu tập
          </Link>
        </div>

      </div>
    </div>
  );
};

export default About;