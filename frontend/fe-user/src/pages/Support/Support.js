import React from 'react';

const Support = () => {
  const faqs = [
    { q: "Làm thế nào để đổi trả hàng?", a: "Bạn có thể yêu cầu đổi trả trong vòng 24h nếu sản phẩm bị hư hỏng." },
    { q: "Phí vận chuyển tính thế nào?", a: "Miễn phí vận chuyển cho đơn hàng từ 300k trong nội thành." },
    { q: "Nông sản có nguồn gốc ở đâu?", a: "100% nông sản từ các nông trại VietGAP tại Đà Lạt và Mộc Châu." }
  ];

  return (
    <div style={{maxWidth: '800px', margin: '40px auto', padding: '20px', background: 'white', borderRadius: '8px'}}>
      <h2 style={{color: '#2e7d32', textAlign: 'center'}}>Câu hỏi thường gặp (FAQ)</h2>
      
      <div style={{marginTop: '30px'}}>
        {faqs.map((item, index) => (
          <div key={index} style={{marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
            <h3 style={{fontSize: '18px', color: '#333'}}>{index + 1}. {item.q}</h3>
            <p style={{color: '#666', marginTop: '5px'}}>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Support;
