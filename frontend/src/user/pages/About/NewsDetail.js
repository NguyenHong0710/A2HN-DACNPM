// src/NewsDetail.js
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsData } from './newsData';

const NewsDetail = () => {
  const { id } = useParams(); 
  const article = newsData.find(item => item.id === parseInt(id));

  if (!article) return <h2 style={{textAlign: 'center', marginTop: '50px'}}>Bài viết không tồn tại!</h2>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      
      {/* Đường dẫn */}
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '30px', textTransform: 'uppercase' }}>
        <Link to="/" style={{ color: '#333', textDecoration: 'none', fontWeight: 'bold' }}>Trang chủ</Link> / 
        <Link to="/about" style={{ color: '#333', textDecoration: 'none', fontWeight: 'bold' }}> Tin tức</Link> / 
        <span style={{ color: '#c5a059', marginLeft: '5px' }}>{article.title}</span>
      </div>
      
      {/* Tiêu đề & Thông tin tác giả */}
      <h1 style={{ fontSize: '32px', color: '#d81b60', marginBottom: '15px', textTransform: 'capitalize' }}>
        {article.title}
      </h1>
      <p style={{ fontSize: '13px', color: '#777', marginBottom: '40px', textTransform: 'uppercase' }}>
        Đăng vào {article.date} bởi {article.author}
      </p>
      
      {/* Nội dung bài viết */}
      <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#333', textAlign: 'justify' }}>
        {article.content.map((paragraph, index) => (
          <p key={index} style={{ marginBottom: '20px' }}>{paragraph}</p>
        ))}
      </div>
      
    </div>
  );
};

export default NewsDetail;