import React, { useEffect, useState } from 'react';
import './Contact.css';

const Contact = () => {
  const MAX_MESSAGE_LENGTH = 2000;
  // Thay đổi thông báo sang tiếng Việt có dấu cho chuyên nghiệp
  const getLockoutMessage = (seconds) => `Hệ thống đang bận. Vui lòng thử lại sau ${seconds} giây.`;
  
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lockSeconds, setLockSeconds] = useState(0);

  useEffect(() => {
    if (lockSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setLockSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockSeconds]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin để Lumina hỗ trợ bạn tốt nhất.');
      return;
    }

    if (lockSeconds > 0) {
      setError(getLockoutMessage(lockSeconds));
      return;
    }

    try {
      setLoading(true);
      const response = await contactAPI.submit(formData.name.trim(), formData.email.trim(), formData.message.trim());
      setSuccess(response?.message || 'Yêu cầu tư vấn của bạn đã được gửi đi. Chúng tôi sẽ liên hệ lại trong vòng 24h.');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.message || 'Không thể gửi liên hệ lúc này. Vui lòng gọi Hotline.');
      if (Number(err?.retryAfter) > 0) {
        setLockSeconds(Number(err.retryAfter));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container" style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
      
      {/* Bên trái: Form liên hệ sang trọng */}
      <div className="contact-info" style={{ flex: '1', minWidth: '350px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#111', marginBottom: '15px' }}>Liên Hệ & Tư Vấn</h2>
        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
          Quý khách đang tìm kiếm một tuyệt tác độc bản? Hãy để các chuyên gia kim hoàn của Lumina Jewelry hỗ trợ bạn.
        </p>
        
        <form className="contact-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {error && <p style={{ color: '#d32f2f', margin: 0, fontSize: '14px' }}>{error}</p>}
          {success && <p style={{ color: '#c5a059', fontWeight: 'bold', margin: 0, fontSize: '14px' }}>{success}</p>}
          
          <input 
            style={{ padding: '15px', border: '1px solid #ddd', outline: 'none' }}
            type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Họ và tên" disabled={loading} 
          />
          <input 
            style={{ padding: '15px', border: '1px solid #ddd', outline: 'none' }}
            type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Địa chỉ Email" disabled={loading} 
          />
          <textarea 
            style={{ padding: '15px', border: '1px solid #ddd', outline: 'none', resize: 'none' }}
            rows="5" name="message" value={formData.message} onChange={handleChange} placeholder="Lời nhắn hoặc yêu cầu đặt lịch xem mẫu..." disabled={loading} maxLength={MAX_MESSAGE_LENGTH}
          ></textarea>
          
          <div style={{ fontSize: '12px', color: '#999', textAlign: 'right' }}>
            {formData.message.length}/{MAX_MESSAGE_LENGTH}
          </div>
          
          <button 
            className="send-btn" 
            disabled={loading}
            style={{ 
              backgroundColor: '#111', color: '#c5a059', padding: '15px', 
              border: 'none', cursor: 'pointer', textTransform: 'uppercase', 
              fontWeight: 'bold', letterSpacing: '2px', transition: '0.3s' 
            }}
          >
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
          
          {lockSeconds > 0 && <p style={{ color: '#d32f2f', fontSize: '12px' }}>{getLockoutMessage(lockSeconds)}</p>}
        </form>

        {/* Thông tin liên hệ phụ */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ margin: '5px 0' }}><strong>Hotline:</strong> 1900 8888</p>
          <p style={{ margin: '5px 0' }}><strong>Email:</strong> concierge@luminajewelry.com</p>
        </div>
      </div>

      {/* Bên phải: Google Maps - Cập nhật link map thật */}
      <div className="contact-map" style={{ flex: '1', minWidth: '350px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#111', marginBottom: '25px' }}>Showroom Lumina</h2>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096814183571!2d105.847312075969!3d21.02881188777854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab953357c995%3A0x1babf6bcdfd2ef2!2zVHLDoG5nIFRp4buBbiBQbGF6YQ!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s" 
            width="100%" 
            height="450" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy"
            title="Lumina Showroom Map"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default Contact;