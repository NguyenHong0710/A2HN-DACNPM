import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserEdit, FaHistory, FaSignOutAlt, FaGem, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { clearAuthSession, getStoredUser, getAuthToken } from '../../utils/authStorage';
import './Profile.css';

const API_BASE_URL = 'http://localhost:8000/api';
const BACKEND_BASE_URL = 'http://localhost:8000';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = getAuthToken();
        const storedUser = getStoredUser();
        
        if (!authToken || !storedUser) {
          navigate('/login');
          return;
        }

        const normalizeAvatar = (avatar) => {
          if (!avatar) return "https://ui-avatars.com/api/?name=User&background=c5a059&color=fff";
          if (avatar.startsWith('http')) return avatar;
          return `${BACKEND_BASE_URL}/${avatar.replace(/^\/+/, '')}`;
        };

        // 1. Fetch thông tin Profile từ Laravel
        const profileRes = await fetch(`${API_BASE_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const profileData = await profileRes.json();

        // Laravel trả về trực tiếp object user hoặc { data: user }
        const userRaw = profileData.data || profileData;
        const finalUser = { ...userRaw, avatar: normalizeAvatar(userRaw.avatar) };
        
        setUser(finalUser);
        setFormData({
          name: finalUser.name || '',
          email: finalUser.email || '',
          phone: finalUser.phone || '',
          address: finalUser.address || ''
        });

        // 2. Fetch lịch sử đơn hàng CÁ NHÂN (Đã sửa khớp với api.php mới)
        const ordersRes = await fetch(`${API_BASE_URL}/my-invoices`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const ordersData = await ordersRes.json();
        
        // Cập nhật: Lấy từ ordersData.data vì Controller trả về định dạng { status, data }
        setOrders(ordersData.data || []);

      } catch (err) {
        console.error(err);
        setError('Không thể tải thông tin. Quý khách vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
  try {
    const authToken = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(formData)
    });

    const result = await res.json();

    if (res.ok) {
      setUser({ ...user, ...formData });
      setIsEditing(false);
      alert('Cập nhật hồ sơ thành công!');
    } else {
      // TRƯỜNG HỢP LỖI VALIDATION (Số điện thoại, email...)
      if (res.status === 422) {
        // Laravel trả về lỗi trong result.errors (ví dụ: { phone: ["Số điện thoại không hợp lệ"] })
        const validationErrors = result.errors;
        let errorMessage = "Cập nhật thất bại:\n";
        
        // Duyệt qua các lỗi để nối thành chuỗi thông báo
        Object.keys(validationErrors).forEach(field => {
          errorMessage += `- ${validationErrors[field].join(', ')}\n`;
        });
        
        alert(errorMessage);
      } else {
        alert(result.message || 'Cập nhật thất bại. Quý khách vui lòng kiểm tra lại!');
      }
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi kết nối server!');
  }
};

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));

    const fileFormData = new FormData();
    fileFormData.append('avatar', file);

    try {
      const authToken = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: fileFormData
      });

      const result = await res.json();
      if (res.ok) {
        alert('Đổi ảnh đại diện thành công!');
        // Cập nhật lại avatar từ server nếu có trả về path mới
        if(result.avatar_url) setUser({...user, avatar: normalizeAvatar(result.avatar_url)});
      } else {
        alert('Lỗi: ' + (result.message || 'Không thể upload ảnh'));
      }
    } catch (err) {
      alert('Lỗi kết nối server khi upload ảnh!');
    }
  };

  // ... các đoạn code cũ giữ nguyên

  const handleLogout = async () => {
    // Hiển thị hộp thoại xác nhận phong cách quý tộc
    const confirmLogout = window.confirm("Lumina Jewelry: Quý khách có chắc chắn muốn đăng xuất");
    
    if (!confirmLogout) return;

    try {
      const authToken = getAuthToken();
      
      // 1. (Tùy chọn) Gọi API Logout để Laravel hủy Token (Blacklist)
      // Điều này giúp bảo mật hơn vì token cũ sẽ không dùng được nữa
      if (authToken) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (err) {
      console.error("Lỗi khi gọi API Logout:", err);
      // Vẫn tiếp tục các bước dưới kể cả khi API lỗi để người dùng thoát được giao diện
    } finally {
      // 2. Xóa sạch dữ liệu trong localStorage/session thông qua hàm tiện ích bạn đã import
      clearAuthSession();

      // 3. Thông báo cho người dùng
      alert('Hẹn gặp lại Quý khách tại Lumina Jewelry!');

      // 4. Điều hướng về trang chủ hoặc trang đăng nhập
      // Sử dụng window.location thay vì navigate nếu bạn muốn reset hoàn toàn state của React
      window.location.href = '/login'; 
    }
  };


  if (loading) return <div className="loading-screen">Đang khởi tạo không gian riêng của Quý khách...</div>;
  if (error) return <div className="error-screen">{error}</div>;

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="user-avatar-section">
            {/* --- CODE MỚI --- */}
<div className="avatar-frame luxury-avatar-frame">
  <img src={avatarPreview || user?.avatar} alt="Lumina Member" className="avatar-img" />
  
  {/* Đưa nút đổi ảnh ra ngoài khung, dùng label để click vào input file */}
  {isEditing && (
    <label htmlFor="avatar-upload-input" className="avatar-edit-badge">
      <FaUserEdit />
    </label>
  )}

  <input 
    type="file" 
    id="avatar-upload-input" /* Thêm ID để label trỏ tới */
    ref={avatarInputRef} 
    style={{ display: 'none' }} 
    accept="image/*"
    onChange={handleFileChange}
  />
</div>
            <h3 className="user-display-name">{user?.name}</h3>
            <span className="membership-tier">Thành viên Lumina Privé</span>
          </div>

          <ul className="profile-menu">
            <li className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>
              <FaGem className="menu-icon" /> Thông tin tuyệt tác cá nhân
            </li>
            <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
              <FaHistory className="menu-icon" /> Lịch sử sở hữu trang sức
            </li>
            <li className="logout-item" onClick={handleLogout}>
              <FaSignOutAlt className="menu-icon" /> Đăng xuất
            </li>
          </ul>
        </div>

        <div className="profile-content">
          {activeTab === 'info' && (
            <div className="content-card">
              <div className="header-flex">
                <h2 className="content-title">Hồ sơ Quý khách</h2>
                {!isEditing && (
                  <button className="gold-outline-btn" onClick={() => setIsEditing(true)}>
                    Chỉnh sửa
                  </button>
                )}
              </div>
              
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <FaUserEdit className="info-icon" />
                    <span className="info-label">Họ và tên</span>
                  </div>
                  {isEditing ? (
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="luxury-input" />
                  ) : (
                    <p className="info-value-text">{user?.name || 'N/A'}</p>
                  )}
                </div>

                <div className="info-item">
                  <div className="info-label-wrapper">
                    <FaEnvelope className="info-icon" />
                    <span className="info-label">Email liên lạc</span>
                  </div>
                  {isEditing ? (
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="luxury-input" />
                  ) : (
                    <p className="info-value-text">{user?.email}</p>
                  )}
                </div>

                <div className="info-item">
                  <div className="info-label-wrapper">
                    <FaPhoneAlt className="info-icon" />
                    <span className="info-label">Số điện thoại</span>
                  </div>
                  {isEditing ? (
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="luxury-input" />
                  ) : (
                    <p className="info-value-text">{user?.phone || 'Chưa cập nhật'}</p>
                  )}
                </div>

                <div className="info-item full-width">
                  <div className="info-label-wrapper">
                    <FaMapMarkerAlt className="info-icon" />
                    <span className="info-label">Địa chỉ nhận trang sức</span>
                  </div>
                  {isEditing ? (
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="luxury-input" />
                  ) : (
                    <p className="info-value-text">{user?.address || 'Chưa cập nhật'}</p>
                  )}
                </div>
              </div>

              {isEditing && (
  <div className="luxury-profile-actions">
    <button 
      className="luxury-profile-btn btn-cancel-luxury" 
      onClick={() => setIsEditing(false)}
    >
      Hủy
    </button>
    
    {/* THÊM onClick={handleSave} VÀO ĐÂY */}
    <button 
      className="luxury-profile-btn btn-save-luxury" 
      onClick={handleSave}
    >
      Lưu thay đổi
    </button>
  </div>
)}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="content-card">
              <h2 className="content-title">Lịch sử sở hữu</h2>
              {orders.length > 0 ? (
                <div className="order-table-wrapper">
                  <table className="luxury-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày sở hữu</th>
                        <th>Giá trị tuyệt tác</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          {/* Dùng order.date vì Controller đã format sẵn d/m/Y H:i */}
                          <td>{order.date}</td>
                          <td className="price-cell">{order.amount.toLocaleString('vi-VN')}đ</td>
                          <td>
                            <span className={`status-tag tag-${order.deliveryStatus}`}>
                              {order.deliveryStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <FaGem className="empty-icon" />
                  <p>Quý khách chưa sở hữu tuyệt tác nào từ Lumina.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;