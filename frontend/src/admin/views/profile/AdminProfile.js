import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CButton,
  CFormInput, CFormLabel, CSpinner, CBadge, CFormTextarea
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPencil, cilSave, cilCloudUpload, cilCloudDownload
} from '@coreui/icons'

// URL tới Laravel Backend
const API_BASE_URL = "http://127.0.0.1:8000/api";

const AdminProfile = () => {
  const [admin, setAdmin] = useState({
    id: '', name: '', email: '', phone: '',
    address: '', avatar: '', bio: '', joinDate: ''
  })

  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState('https://via.placeholder.com/150')
  const [selectedFile, setSelectedFile] = useState(null)
  const [backupData, setBackupData] = useState(null)

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
  }, []);

  // 1. LẤY DỮ LIỆU (Khớp với Route: Route::get('/profile', ...))
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        const u = res.data.data;
        setAdmin({
          id: u.id,
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          address: u.address || '',
          avatar: u.avatar || '',
          bio: u.bio || '',
          joinDate: u.created_at || ''
        });
        
        // Xử lý hiển thị ảnh: Nếu có avatar từ server thì nối URL, không thì dùng placeholder
        if (u.avatar) {
            setPreviewAvatar(u.avatar.startsWith('http') ? u.avatar : `http://127.0.0.1:8000/storage/${u.avatar}`);
        } else {
            setPreviewAvatar('https://via.placeholder.com/150');
        }
      }
    } catch (error) {
      console.error("Lỗi tải profile:", error);
      if (error.response?.status === 401) alert("Phiên đăng nhập hết hạn!");
    } finally {
      setLoading(false);
    }
  }

  const handleEditMode = () => { setBackupData({ ...admin }); setIsEditing(true); }
  
  const handleCancel = () => { 
    setAdmin(backupData); 
    setIsEditing(false); 
    setSelectedFile(null);
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setAdmin({ ...admin, [name]: value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPreviewAvatar(URL.createObjectURL(file))
      setSelectedFile(file)
    }
  }

  // 2. LƯU DỮ LIỆU (Khớp với Route: Route::put('/profile', ...) và Route::post('/profile/avatar', ...))
  const handleSave = async () => {
    setLoading(true);
    try {
      // BƯỚC A: Cập nhật thông tin (Dùng PUT theo api.php của bạn)
      await axios.put(`${API_BASE_URL}/profile`, {
        name: admin.name,
        phone: admin.phone,
        address: admin.address,
        bio: admin.bio
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // BƯỚC B: Cập nhật Avatar nếu có chọn file mới
      if (selectedFile) {
        const imgData = new FormData();
        imgData.append('avatar', selectedFile);
        await axios.post(`${API_BASE_URL}/profile/avatar`, imgData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      alert('Cập nhật hồ sơ Admin thành công!');
      setIsEditing(false);
      fetchProfile(); // Reload dữ liệu
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể kết nối server';
      alert('Lỗi cập nhật: ' + msg);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-5"><CSpinner color="primary"/></div>;

  return (
    <div className="profile-container pb-5">
      <style>{`
        .glass-card { border: none; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); background: #ffffff; overflow: hidden; }
        .profile-header-bg { height: 100px; background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); }
        .avatar-wrapper { margin-top: -50px; position: relative; display: inline-block; }
        .avatar-main-img { width: 120px; height: 120px; object-fit: cover; border-radius: 50%; border: 4px solid #ffffff; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background: #f8f9fa; }
        .upload-badge { position: absolute; bottom: 5px; right: 5px; background: #4f46e5; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid #ffffff; }
        .input-modern { border-radius: 12px; padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #fdfdfd; }
        .input-modern:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); background-color: #ffffff; }
        .btn-action-main { border-radius: 10px; font-weight: 700; padding: 8px 20px; }
      `}</style>

      <CRow className="justify-content-center">
        <CCol lg={4} className="mb-4">
          <CCard className="glass-card">
            <div className="profile-header-bg"></div>
            <CCardBody className="text-center pt-0 pb-4">
              <div className="avatar-wrapper mb-3">
                <img src={previewAvatar} alt="Avatar" className="avatar-main-img" />
                {isEditing && (
                  <label htmlFor="avatar-upload" className="upload-badge">
                    <CIcon icon={cilCloudUpload} size="sm" />
                    <input type="file" id="avatar-upload" hidden accept="image/*" onChange={handleImageChange}/>
                  </label>
                )}
              </div>
              <h4 className="fw-bold text-dark mb-1">{admin.name}</h4>
              <CBadge color="primary" className="mb-3 px-3 py-2">Quản trị viên cấp cao</CBadge>

              <div className="text-start px-3 py-3 rounded-4 bg-light mx-2">
                <div className="d-flex justify-content-between mb-2 small">
                  <span className="text-muted">Mã quản trị:</span>
                  <span className="fw-bold text-dark">UID-{admin.id}</span>
                </div>
                <div className="d-flex justify-content-between small">
                  <span className="text-muted">Ngày gia nhập:</span>
                  <span className="fw-medium text-dark">{admin.joinDate ? new Date(admin.joinDate).toLocaleDateString('vi-VN') : '---'}</span>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={8} className="mb-4">
          <CCard className="glass-card h-100">
            <CCardHeader className="bg-white border-0 p-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Thông tin cá nhân Admin</h5>
              <div className="d-flex gap-2">
                {!isEditing ? (
                  <CButton color="info" className="btn-action-main text-white shadow-sm" onClick={handleEditMode}>
                    <CIcon icon={cilPencil} className="me-2" /> Chỉnh sửa hồ sơ
                  </CButton>
                ) : (
                  <>
                    <CButton color="light" className="btn-action-main border" onClick={handleCancel}>Hủy bỏ</CButton>
                    <CButton color="primary" className="btn-action-main text-white shadow-sm" onClick={handleSave}>
                      <CIcon icon={cilSave} className="me-2" /> Lưu cập nhật
                    </CButton>
                  </>
                )}
              </div>
            </CCardHeader>

            <CCardBody className="p-4 pt-0">
              <CRow className="g-4">
                <CCol md={6}>
                  <CFormLabel className="fw-bold small text-secondary mb-2">Họ và tên</CFormLabel>
                  <CFormInput name="name" value={admin.name} onChange={handleChange} disabled={!isEditing} className="input-modern" />
                </CCol>
                
                <CCol md={6}>
                  <CFormLabel className="fw-bold small text-secondary mb-2">Số điện thoại</CFormLabel>
                  <CFormInput name="phone" value={admin.phone} onChange={handleChange} disabled={!isEditing} className="input-modern" />
                </CCol>

                <CCol md={12}>
                  <CFormLabel className="fw-bold small text-secondary mb-2">Email đăng nhập (Cố định)</CFormLabel>
                  <CFormInput value={admin.email} disabled className="input-modern bg-light" />
                </CCol>

                <CCol xs={12}>
                  <CFormLabel className="fw-bold small text-secondary mb-2">Địa chỉ văn phòng</CFormLabel>
                  <CFormInput name="address" value={admin.address} onChange={handleChange} disabled={!isEditing} className="input-modern" />
                </CCol>

                <CCol xs={12}>
                  <CFormLabel className="fw-bold small text-secondary mb-2">Giới thiệu ngắn (Bio)</CFormLabel>
                  <CFormTextarea name="bio" rows={3} value={admin.bio} onChange={handleChange} disabled={!isEditing} className="input-modern" placeholder="Chia sẻ đôi chút về vai trò của bạn..." />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default AdminProfile