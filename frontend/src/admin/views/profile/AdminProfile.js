import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CButton,
  CFormInput, CFormLabel, CSpinner, CBadge, CFormTextarea
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPencil, cilSave, cilCloudUpload, cilUser, cilMap, cilPhone, cilEnvelopeOpen, cilCalendar, cilArrowLeft
} from '@coreui/icons'

const API_BASE_URL = "http://127.0.0.1:8000/api";

const formatPhoneNumber = (phone) => {
  if (!phone || phone === 'Chưa có') return 'Chưa cập nhật';
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{4})(\d{3})(\d{3})$/);
  if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  return phone;
};

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
        
        if (u.avatar) {
            setPreviewAvatar(u.avatar.startsWith('http') ? u.avatar : `http://127.0.0.1:8000/storage/${u.avatar}`);
        } else {
            setPreviewAvatar('https://via.placeholder.com/150');
        }
      }
    } catch (error) {
      console.error("Lỗi tải profile:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEditMode = () => { 
    setBackupData({ ...admin }); 
    setIsEditing(true); 
  }
  
  const handleCancel = () => { 
    setAdmin(backupData); 
    setIsEditing(false); 
    setSelectedFile(null);
    if (backupData.avatar) {
      setPreviewAvatar(backupData.avatar.startsWith('http') ? backupData.avatar : `http://127.0.0.1:8000/storage/${backupData.avatar}`);
    } else {
      setPreviewAvatar('https://via.placeholder.com/150');
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setAdmin({ ...admin, [name]: value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Logic cho phép "đuôi ảnh gì cũng được"
      setPreviewAvatar(URL.createObjectURL(file))
      setSelectedFile(file)
    }
  }

  const handleSave = async () => {
    const cleanPhone = admin.phone ? admin.phone.toString().replace(/\D/g, '') : '';
    const phoneRegex = /^0\d{9}$/;
    
    if (cleanPhone !== '' && !phoneRegex.test(cleanPhone)) {
      alert('Số điện thoại không hợp lệ!');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/profile`, {
        name: admin.name,
        phone: cleanPhone, 
        address: admin.address,
        bio: admin.bio
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

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

      alert('Cập nhật thành công!');
      setIsEditing(false);
      setSelectedFile(null);
      fetchProfile();
    } catch (error) {
      alert('Lỗi cập nhật: ' + (error.response?.data?.message || 'Lỗi kết nối'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-5"><CSpinner style={{color: '#D99485'}}/></div>;

  return (
    <div className="profile-page py-4" style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
      <style>{`
        .glass-card { border: none; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background: #ffffff; }
        .header-gradient { height: 140px; background: linear-gradient(135deg, #D99485 0%, #b57a6d 100%); border-radius: 20px 20px 0 0; }
        .avatar-container { margin-top: -70px; position: relative; z-index: 2; }
        .avatar-img { width: 140px; height: 140px; object-fit: cover; border-radius: 25px; border: 6px solid #ffffff; box-shadow: 0 8px 20px rgba(0,0,0,0.1); background: #fff; }
        .upload-btn-overlay { position: absolute; bottom: 8px; right: -8px; background: #D99485; color: white; width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid #ffffff; transition: 0.3s; }
        .upload-btn-overlay:hover { transform: scale(1.1); background: #c57f71; }
        .info-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #8a8a8a; font-weight: 700; margin-bottom: 8px; display: block; }
        .input-luxury { border-radius: 12px; padding: 12px 18px; border: 1px solid #eee; transition: 0.3s; background: #fafafa; }
        .input-luxury:focus { border-color: #D99485; box-shadow: 0 0 0 4px rgba(217, 148, 133, 0.1); background: #fff; }
        .btn-luxury { border-radius: 12px; font-weight: 600; padding: 10px 24px; transition: 0.3s; }
        .btn-save { background: #D99485; border: none; color: white; }
        .btn-save:hover { background: #c57f71; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(217, 148, 133, 0.3); }
        .side-info-box { background: #fff9f8; border-radius: 15px; padding: 20px; border: 1px solid #f2e4e1; }
      `}</style>

      <CRow className="justify-content-center">
        {/* CỘT BÊN TRÁI - AVATAR */}
        <CCol lg={4}>
          <CCard className="glass-card text-center mb-4">
            <div className="header-gradient"></div>
            <CCardBody className="pt-0">
              <div className="avatar-container mb-3 d-inline-block">
                <img src={previewAvatar} alt="Admin" className="avatar-img" />
                {isEditing && (
                  <label htmlFor="avatar-upload" className="upload-btn-overlay">
                    <CIcon icon={cilCloudUpload} size="sm" />
                    {/* accept="" để cho phép mọi loại file */}
                    <input type="file" id="avatar-upload" hidden onChange={handleImageChange}/>
                  </label>
                )}
              </div>
              <h4 className="fw-bold text-dark mt-2 mb-1">{admin.name}</h4>
              <p className="text-muted small mb-3">{admin.email}</p>
              <CBadge style={{backgroundColor: '#D99485'}} className="px-3 py-2 rounded-pill mb-4">Hệ Thống Quản Trị</CBadge>

              <div className="side-info-box text-start">
                <div className="d-flex align-items-center mb-3">
                    <div className="p-2 rounded-3 bg-white me-3 shadow-sm"><CIcon icon={cilUser} className="text-muted"/></div>
                    <div><span className="info-label mb-0">ID Nhân viên</span><div className="fw-bold">UID-{admin.id}</div></div>
                </div>
                <div className="d-flex align-items-center">
                    <div className="p-2 rounded-3 bg-white me-3 shadow-sm"><CIcon icon={cilCalendar} className="text-muted"/></div>
                    <div><span className="info-label mb-0">Ngày gia nhập</span><div className="fw-bold">{admin.joinDate ? new Date(admin.joinDate).toLocaleDateString('vi-VN') : '---'}</div></div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* CỘT BÊN PHẢI - FORM */}
        <CCol lg={7}>
          <CCard className="glass-card">
            <CCardHeader className="bg-white border-0 p-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold"><CIcon icon={cilUser} className="me-2 text-muted"/>Hồ sơ chi tiết</h5>
              {!isEditing ? (
                <CButton className="btn-luxury btn-save" onClick={handleEditMode}>
                  <CIcon icon={cilPencil} className="me-2" /> Chỉnh sửa
                </CButton>
              ) : (
                <div className="d-flex gap-2">
                  <CButton color="light" className="btn-luxury border" onClick={handleCancel}>Hủy</CButton>
                  <CButton className="btn-luxury btn-save" onClick={handleSave}>
                    <CIcon icon={cilSave} className="me-2" /> Lưu hồ sơ
                  </CButton>
                </div>
              )}
            </CCardHeader>
            <CCardBody className="p-4 pt-0">
              <CRow className="g-4">
                <CCol md={6}>
                  <span className="info-label">Họ và tên</span>
                  <CFormInput name="name" value={admin.name} onChange={handleChange} disabled={!isEditing} className="input-luxury" />
                </CCol>
                
                <CCol md={6}>
                  <span className="info-label">Số điện thoại</span>
                  <CFormInput 
                    name="phone" 
                    value={isEditing ? admin.phone : formatPhoneNumber(admin.phone)} 
                    onChange={handleChange} 
                    disabled={!isEditing} 
                    className="input-luxury" 
                    placeholder="VD: 0912..."
                  />
                </CCol>

                <CCol md={12}>
                  <span className="info-label">Địa chỉ làm việc</span>
                  <div className="position-relative">
                    <CFormInput name="address" value={admin.address} onChange={handleChange} disabled={!isEditing} className="input-luxury" />
                    <CIcon icon={cilMap} className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted opacity-50" />
                  </div>
                </CCol>

                <CCol xs={12}>
                  <span className="info-label">Tiểu sử & Giới thiệu</span>
                  <CFormTextarea name="bio" rows={4} value={admin.bio} onChange={handleChange} disabled={!isEditing} className="input-luxury h-auto" placeholder="Nhập giới thiệu về bạn..." />
                </CCol>

                <CCol md={12}>
                  <div className="p-3 rounded-4 bg-light border-start border-4" style={{borderColor: '#D99485'}}>
                    <span className="info-label">Quyền hạn tài khoản</span>
                    <p className="mb-0 small text-dark">Bạn đang đăng nhập với tư cách <strong>Administrator</strong>. Mọi thay đổi sẽ được ghi lại trong lịch sử hệ thống.</p>
                  </div>
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