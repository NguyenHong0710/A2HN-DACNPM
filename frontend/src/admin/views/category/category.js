import React, { useState, useMemo, useEffect } from 'react'
import axios from 'axios'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CButton,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CFormInput, CFormSwitch, CModal, CModalHeader, 
  CModalTitle, CModalBody, CModalFooter, CInputGroup, CInputGroupText,
  CToast, CToastBody, CToaster
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilSearch, cilImage, cilSave, cilCloudUpload } from '@coreui/icons'

// Cấu hình URL backend Laravel
const API_URL = 'http://localhost:8000/api/categories'

const AdminCategoryManagement = () => {
  // --- STATE QUẢN LÝ ---
  const [categories, setCategories] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)
  
  const initialForm = { id: null, name: '', slug: '', status: true, image: null, preview: '' }
  const [formData, setFormData] = useState(initialForm)

  // --- HELPER: LẤY HEADER XÁC THỰC ---
  const getAuthHeaders = (isMultipart = false) => {
    const token = localStorage.getItem('token'); // Đảm bảo key này khớp với lúc bạn lưu khi Login
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json'
      }
    }
  }

  // --- KẾT NỐI API ---

  // 1. Fetch dữ liệu
  const fetchCategories = async () => {
    try {
      const response = await axios.get(API_URL, getAuthHeaders())
      // Laravel thường trả về data trong response.data.data hoặc response.data tùy resource
      const result = response.data.data || response.data
      setCategories(Array.isArray(result) ? result : [])
    } catch (error) {
      console.error(error)
      if (error.response?.status === 401) {
        showToast('Hết hạn', 'Vui lòng đăng nhập lại để xem dữ liệu.', 'danger')
      } else {
        showToast('Lỗi kết nối', 'Không thể tải danh sách danh mục.', 'danger')
      }
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 2. Logic tạo Slug tự động
  const createSlug = (str) => {
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w ]+/g, '').replace(/ +/g, '-')
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setFormData({ ...formData, name, slug: createSlug(name) })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, image: file, preview: URL.createObjectURL(file) })
    }
  }

  const openModal = (item = null) => {
    if (item) {
      const imagePreview = item.image && !item.image.startsWith('http') 
        ? `http://localhost:8000/storage/${item.image}` 
        : item.image;

      setFormData({ 
        id: item.id,
        name: item.name,
        slug: item.slug,
        status: item.status == 1 || item.status === true,
        image: null,
        preview: imagePreview || '' 
      })
    } else {
      setFormData(initialForm)
    }
    setModalVisible(true)
  }

  // 3. Xử lý Thêm mới / Cập nhật
  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Cảnh báo', 'Vui lòng nhập tên danh mục!', 'warning')
      return
    }

    const payload = new FormData()
    payload.append('name', formData.name)
    payload.append('slug', formData.slug)
    payload.append('status', formData.status ? 1 : 0)
    
    if (formData.image instanceof File) {
      payload.append('image', formData.image)
    }

    try {
      if (formData.id) {
        // SỬA LỖI 405/500: Laravel yêu cầu POST + _method=PUT khi upload file
        payload.append('_method', 'PUT')
        await axios.post(`${API_URL}/${formData.id}`, payload, getAuthHeaders(true))
        showToast('Thành công', 'Cập nhật danh mục hoàn tất', 'success')
      } else {
        await axios.post(API_URL, payload, getAuthHeaders(true))
        showToast('Thành công', 'Đã thêm danh mục mới', 'success')
      }
      
      setModalVisible(false)
      fetchCategories() 

    } catch (error) {
      console.error(error)
      const status = error.response?.status;
      if (status === 401) {
        showToast('Lỗi xác thực', 'Bạn không có quyền thực hiện hoặc hết hạn phiên!', 'danger')
      } else if (status === 422) {
        const errors = Object.values(error.response.data.errors).flat()
        showToast('Lỗi kiểm tra', errors[0], 'danger')
      } else {
        showToast('Lỗi Server', 'Có lỗi xảy ra (500). Kiểm tra log Laravel!', 'danger')
      }
    }
  }

  // 4. Xử lý Xóa
  const handleDelete = async (id) => {
    if (window.confirm('Bạn chắc chắn muốn xóa danh mục này?')) {
      try {
        await axios.delete(`${API_URL}/${id}`, getAuthHeaders())
        setCategories(categories.filter(c => c.id !== id))
        showToast('Đã xóa', 'Danh mục đã được xóa thành công', 'info')
      } catch (error) {
        showToast('Lỗi', 'Không thể xóa danh mục này.', 'danger')
      }
    }
  }

  // 5. Toggle trạng thái (SỬA LỖI 401/500)
  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status == 1 ? 0 : 1;
    
    // UI Phản hồi nhanh
    const oldCategories = [...categories];
    setCategories(categories.map(c => c.id === cat.id ? { ...c, status: newStatus } : c));

    try {
      // Cách 1: Gọi PATCH riêng (Nếu Backend đã viết Route riêng như mình hướng dẫn trước đó)
      await axios.patch(`${API_URL}/${cat.id}/status`, { status: newStatus }, getAuthHeaders());
      
      // Cách 2: Nếu Backend chưa viết Route status riêng, dùng Update chung:
      // await axios.put(`${API_URL}/${cat.id}`, { ...cat, status: newStatus }, getAuthHeaders());
      
      showToast('Trạng thái', `Đã cập nhật danh mục "${cat.name}"`, 'success')
    } catch (error) {
      setCategories(oldCategories); // Hoàn tác nếu lỗi
      showToast('Lỗi', 'Không thể thay đổi trạng thái. Kiểm tra lại Backend Route!', 'danger')
    }
  }

  const filteredCategories = useMemo(() => {
    return Array.isArray(categories) ? categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())) : []
  }, [categories, searchTerm])

  const showToast = (title, msg, color) => {
    setToast(
      <CToast autohide={true} delay={3000} visible={true} color={color} className="text-white align-items-center">
        <div className="d-flex">
          <CToastBody>
            <strong>{title}:</strong> {msg}
          </CToastBody>
        </div>
      </CToast>
    )
  }

  return (
    <div className="admin-category-mgmt pb-5">
      <CToaster push={toast} placement="top-end" />
      
      <style>{`
        .image-upload-wrapper { border: 2px dashed #cbd5e1; background-color: #f8fafc; border-radius: 12px; height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; overflow: hidden; position: relative; }
        .image-upload-wrapper:hover { border-color: #3b82f6; background-color: #eff6ff; }
        .preview-image { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; }
        .hover-row:hover { background-color: #f8fafc !important; }
        .table-shadow { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      `}</style>

      <CRow className="mb-4 align-items-center">
        <CCol sm={8}>
          <h2 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Danh Mục Sản Phẩm</h2>
          <p className="text-muted mb-0">Quản lý và phân loại các nhóm hàng hóa của bạn</p>
        </CCol>
        <CCol sm={4} className="text-sm-end mt-3 mt-sm-0">
          <CButton color="primary" className="px-4 py-2 text-white shadow-sm" onClick={() => openModal()} style={{ borderRadius: '8px' }}>
            <CIcon icon={cilPlus} className="me-2" /> Thêm Danh Mục
          </CButton>
        </CCol>
      </CRow>

      <CCard className="border-0 table-shadow" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <CCardHeader className="bg-white border-bottom-0 p-4 pb-3">
          <CInputGroup className="shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden', maxWidth: '350px' }}>
            <CInputGroupText className="bg-white border-end-0 text-muted"><CIcon icon={cilSearch} /></CInputGroupText>
            <CFormInput 
              placeholder="Tìm kiếm danh mục..." 
              className="border-start-0 ps-0 shadow-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CInputGroup>
        </CCardHeader>

        <CCardBody className="p-0">
          <div className="table-responsive">
            <CTable align="middle" hover className="mb-0 border-top">
              <CTableHead style={{ backgroundColor: '#f1f5f9' }}>
                <CTableRow>
                  <CTableHeaderCell className="ps-4 py-3" style={{ width: '100px' }}>ẢNH</CTableHeaderCell>
                  <CTableHeaderCell className="py-3">TÊN DANH MỤC</CTableHeaderCell>
                  <CTableHeaderCell className="py-3 d-none d-md-table-cell">SLUG</CTableHeaderCell>
                  <CTableHeaderCell className="py-3 text-center">TRẠNG THÁI</CTableHeaderCell>
                  <CTableHeaderCell className="py-3 text-end pe-4" style={{ width: '120px' }}>THAO TÁC</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredCategories.length === 0 ? (
                  <CTableRow><CTableDataCell colSpan="5" className="text-center py-5 text-muted">Không có dữ liệu</CTableDataCell></CTableRow>
                ) : filteredCategories.map((cat) => {
                  const imgSrc = cat.image && !cat.image.startsWith('http') 
                    ? `http://localhost:8000/storage/${cat.image}` : cat.image;

                  return (
                    <CTableRow key={cat.id} className="hover-row">
                      <CTableDataCell className="ps-4 py-3">
                        {imgSrc ? (
                          <img src={imgSrc} alt="" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
                        ) : (
                          <div className="bg-light border d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', borderRadius: '10px' }}>
                            <CIcon icon={cilImage} className="text-secondary opacity-50"/>
                          </div>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="fw-bold text-dark">{cat.name}</CTableDataCell>
                      <CTableDataCell className="d-none d-md-table-cell"><code className="small">/{cat.slug}</code></CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CFormSwitch 
                          size="lg"
                          checked={cat.status == 1}
                          onChange={() => handleToggleStatus(cat)}
                        />
                      </CTableDataCell>
                      <CTableDataCell className="text-end pe-4">
                        <CButton color="light" size="sm" className="me-2 text-primary shadow-sm" onClick={() => openModal(cat)}><CIcon icon={cilPencil} /></CButton>
                        <CButton color="light" size="sm" className="text-danger shadow-sm" onClick={() => handleDelete(cat.id)}><CIcon icon={cilTrash} /></CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} alignment="center" backdrop="static">
        <CModalHeader className="bg-light border-0"><CModalTitle className="fw-bold">{formData.id ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</CModalTitle></CModalHeader>
        <CModalBody className="p-4">
          <CRow className="mb-4">
            <CCol sm={4} className="text-center">
              <label htmlFor="cat-image-upload" className="image-upload-wrapper w-100">
                {formData.preview ? <img src={formData.preview} alt="preview" className="preview-image" /> : <CIcon icon={cilCloudUpload} size="xl" className="text-primary" />}
              </label>
              <input type="file" id="cat-image-upload" hidden onChange={handleFileChange} accept="image/*" />
            </CCol>
            <CCol sm={8}>
              <CFormInput label="Tên danh mục" value={formData.name} onChange={handleNameChange} className="mb-3" />
              <CFormInput label="Slug (Tự động)" value={formData.slug} readOnly className="bg-light text-muted" />
            </CCol>
          </CRow>
          <div className="p-3 bg-light rounded-3 border">
            <CFormSwitch 
              label="Hiển thị danh mục này" 
              checked={formData.status} 
              onChange={(e) => setFormData({...formData, status: e.target.checked})}
              size="lg"
            />
          </div>
        </CModalBody>
        <CModalFooter className="border-0 pb-4">
          <CButton color="secondary" variant="ghost" onClick={() => setModalVisible(false)}>Hủy</CButton>
          <CButton color="primary" className="px-4 text-white shadow-sm" onClick={handleSave}><CIcon icon={cilSave} className="me-2" /> Lưu lại</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default AdminCategoryManagement