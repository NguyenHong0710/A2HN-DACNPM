import React from 'react';

export const PrintTemplate = React.forwardRef((props, ref) => {
  const { data } = props; // Lấy data từ props
  
  // Dù không có data vẫn phải trả về div có gắn ref để tránh lỗi "target is null"
  if (!data) return <div ref={ref} style={{ display: 'none' }}></div>;

  return (
    <div ref={ref} style={{ padding: '20px', width: '100%', color: '#000', backgroundColor: '#fff' }}>
      <div style={{ border: '2px solid #000', padding: '15px' }}>
         <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>PHIẾU GIAO HÀNG</h2>
         <p style={{ textAlign: 'center' }}>Mã: <strong>{data.id}</strong></p>
         <hr/>
         <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
            <p><strong>Khách hàng:</strong> {data.customer}</p>
            <p><strong>Đơn hàng:</strong> {data.orderId}</p>
            <p><strong>Phương thức:</strong> {data.method}</p>
            <p><strong>Ghi chú:</strong> {data.note || 'Không có'}</p>
         </div>
      </div>
    </div>
  );
});
