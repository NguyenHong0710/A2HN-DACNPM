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
import { cilPlus, cilPencil, cilTrash, cilSearch, cilSave } from '@coreui/icons'

const API_URL = 'http://localhost:8000/api/categories'

const AdminCategoryManagement = () => {
  const [categories, setCategories] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)
  
  // 1. Đã xóa image và preview khỏi initialForm
  const initialForm = { id: null, name: '', slug: '', status: true }
  const [formData, setFormData] = useState(initialForm)

  const getAuthHeaders = () => ({
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })

  const fetchCategories = async () => {
    try {
      const response = await axios.get(API_URL, getAuthHeaders())
      const result = response.data.data || response.data
      setCategories(Array.isArray(result) ? result : [])
    } catch (error) {
      showToast('Lỗi', 'Không thể tải dữ liệu', 'danger')
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const createSlug = (str) => {
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w ]+/g, '').replace(/ +/g, '-')
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setFormData({ ...formData, name, slug: createSlug(name) })
  }

  const openModal = (item = null) => {
    if (item) {
      setFormData({ 
        id: item.id,
        name: item.name,
        slug: item.slug,
        status: item.status == 1 || item.status === true
      })
    } else {
      setFormData(initialForm)
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return showToast('Cảnh báo', 'Vui lòng nhập tên!', 'warning')

    const data = {
      name: formData.name,
      slug: formData.slug,
      status: formData.status ? 1 : 0
    }

    try {
      if (formData.id) {
        await axios.put(`${API_URL}/${formData.id}`, data, getAuthHeaders())
        showToast('Thành công', 'Đã cập nhật', 'success')
      } else {
        await axios.post(API_URL, data, getAuthHeaders())
        showToast('Thành công', 'Đã thêm mới', 'success')
      }
      setModalVisible(false)
      fetchCategories()
    } catch (error) {
      showToast('Lỗi', 'Thao tác thất bại', 'danger')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Xóa danh mục này?')) {
      try {
        await axios.delete(`${API_URL}/${id}`, getAuthHeaders())
        setCategories(categories.filter(c => c.id !== id))
        showToast('Thông báo', 'Đã xóa thành công', 'info')
      } catch (error) {
        showToast('Lỗi', 'Không thể xóa', 'danger')
      }
    }
  }

  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status == 1 ? 0 : 1
    try {
      await axios.patch(`${API_URL}/${cat.id}/status`, { status: newStatus }, getAuthHeaders())
      setCategories(categories.map(c => c.id === cat.id ? { ...c, status: newStatus } : c))
      showToast('Trạng thái', 'Đã cập nhật', 'success')
    } catch (error) {
      showToast('Lỗi', 'Thất bại', 'danger')
    }
  }

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [categories, searchTerm])

  const showToast = (title, msg, color) => {
    setToast(
      <CToast autohide visible color={color} className="text-white align-items-center">
        <div className="d-flex"><CToastBody><strong>{title}:</strong> {msg}</CToastBody></div>
      </CToast>
    )
  }

  return (
    <div className="admin-category-mgmt pb-5">
      <CToaster push={toast} placement="top-end" />
      
      <CRow className="mb-4 align-items-center">
        <CCol sm={8}>
          <h2 className="fw-bold mb-1">Danh Mục Sản Phẩm</h2>
          <p className="text-muted mb-0">Quản lý và phân loại các nhóm hàng hóa</p>
        </CCol>
        <CCol sm={4} className="text-sm-end mt-3 mt-sm-0">
          <CButton color="primary" className="px-4 py-2 shadow-sm" onClick={() => openModal()}>
            <CIcon icon={cilPlus} className="me-2" /> Thêm Danh Mục
          </CButton>
        </CCol>
      </CRow>

      <CCard className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <CCardHeader className="bg-white border-bottom-0 p-4">
          <CInputGroup style={{ maxWidth: '350px' }}>
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
                  {/* Đã xóa Header ẢNH */}
                  <CTableHeaderCell className="ps-4 py-3">TÊN DANH MỤC</CTableHeaderCell>
                  <CTableHeaderCell className="py-3">SLUG</CTableHeaderCell>
                  <CTableHeaderCell className="py-3 text-center">TRẠNG THÁI</CTableHeaderCell>
                  <CTableHeaderCell className="py-3 text-end pe-4">THAO TÁC</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredCategories.length === 0 ? (
                  <CTableRow><CTableDataCell colSpan="4" className="text-center py-5">Không có dữ liệu</CTableDataCell></CTableRow>
                ) : filteredCategories.map((cat) => (
                  <CTableRow key={cat.id}>
                    {/* Đã xóa DataCell chứa ảnh */}
                    <CTableDataCell className="ps-4 fw-bold">{cat.name}</CTableDataCell>
                    <CTableDataCell><code>/{cat.slug}</code></CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CFormSwitch size="lg" checked={cat.status == 1} onChange={() => handleToggleStatus(cat)} />
                    </CTableDataCell>
                    <CTableDataCell className="text-end pe-4">
                      <CButton color="light" size="sm" className="me-2 text-primary" onClick={() => openModal(cat)}><CIcon icon={cilPencil} /></CButton>
                      <CButton color="light" size="sm" className="text-danger" onClick={() => handleDelete(cat.id)}><CIcon icon={cilTrash} /></CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} alignment="center">
        <CModalHeader className="bg-light border-0">
          <CModalTitle className="fw-bold">{formData.id ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          {/* Đã xóa phần upload ảnh, chỉ giữ lại Tên và Slug */}
          <CFormInput label="Tên danh mục" value={formData.name} onChange={handleNameChange} className="mb-3" />
          <CFormInput label="Slug (Tự động)" value={formData.slug} readOnly className="bg-light mb-4" />
          
          <div className="p-3 bg-light rounded-3 border">
            <CFormSwitch 
              label="Hiển thị danh mục này" 
              checked={formData.status} 
              onChange={(e) => setFormData({...formData, status: e.target.checked})}
              size="lg"
            />
          </div>
        </CModalBody>
        <CModalFooter className="border-0">
          <CButton color="secondary" variant="ghost" onClick={() => setModalVisible(false)}>Hủy</CButton>
          <CButton color="primary" className="px-4" onClick={handleSave}><CIcon icon={cilSave} className="me-2" /> Lưu lại</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default AdminCategoryManagement