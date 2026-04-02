import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-container">
      {/* Bên trái: Form liên hệ */}
      <div className="contact-info">
        <h2>Liên hệ với chúng tôi</h2>
        <p>Gửi thắc mắc hoặc góp ý của bạn, chúng tôi sẽ phản hồi sớm nhất.</p>
        
        <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
           <input type="text" placeholder="Họ tên của bạn" />
           <input type="email" placeholder="Email liên hệ" />
           <textarea rows="5" placeholder="Nội dung lời nhắn..."></textarea>
           <button className="send-btn">Gửi tin nhắn</button>
        </form>
      </div>

      {/* Bên phải: Google Maps */}
      <div className="contact-map">
        <h2>Bản đồ</h2>
        {}
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096814183571!2d105.78009331476332!3d21.02881188599839!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab4cd0c66f71%3A0x65e634b475d9e666!2zSMOgIE7huqFpLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1626078654817!5m2!1svi!2s" 
          width="100%" 
          height="350" 
          style={{border:0, borderRadius: '8px'}} 
          allowFullScreen="" 
          loading="lazy">
        </iframe>
      </div>
    </div>
  );
};

export default Contact;
