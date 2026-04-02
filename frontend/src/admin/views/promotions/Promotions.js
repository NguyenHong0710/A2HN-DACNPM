import React, { useState, useEffect } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableHead,
  CTableHeaderCell, CTableRow, CTableDataCell, CButton, CFormInput, CModal,
  CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormSelect, CFormLabel,
  CBadge, CProgress, CFormSwitch, CAvatar
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilPlus, cilPencil, cilTrash, cilSearch, cilTag, cilBasket, cilCalendar, cilUserFollow
} from '@coreui/icons'

// --- CẤU HÌNH API (GIỮ NGUYÊN) ---
import { API_BASE } from 'src/config';
const API_URL = `${API_BASE}/promotions.php`;
const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
const admin_ID = storedUser.id || 1; 

const Promotions = () => {
  const [promotions, setPromotions] = useState([])
  const [adminProducts, setadminProducts] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    code: '', name: '', type: 'percent', value: '', 
    scope: 'order', productId: '', 
    startDate: '', endDate: '', limit: 100
  })

  // --- LOGIC XỬ LÝ (GIỮ NGUYÊN) ---
  const fetchPromotions = async () => {
    try {
      const response = await fetch(`${API_URL}?action=get_all&admin_id=${admin_ID}`);
      const data = await response.json();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); }
  }

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus ? 0 : 1;
    try {
        const response = await fetch(`${API_URL}?action=toggle_status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: newStatus })
        });
        const result = await response.json();
        if (result.status === 'success') {
            setPromotions(promotions.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } else { alert("Lỗi: " + result.message); }
    } catch (error) { console.error("Lỗi kết nối status:", error); }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}?action=get_admin_products&admin_id=${admin_ID}`);
      const data = await response.json();
      setadminProducts(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Lỗi tải sản phẩm:", error); }
  }

  useEffect(() => { 
    fetchPromotions(); 
    fetchProducts(); 
  }, []);

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  const openModal = (item = null) => {
    if (item) {
        setEditingItem(item)
        setFormData({
            ...item,
            startDate: item.start_date, 
            endDate: item.end_date,
            limit: item.usage_limit,
            productId: item.product_id || ''
        })
    } else {
        setEditingItem(null)
        setFormData({
            code: '', name: '', type: 'percent', value: '', 
            scope: 'order', productId: '', 
            startDate: '', endDate: '', limit: 100
        })
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if(!formData.code || !formData.value) return alert("Vui lòng nhập đủ thông tin mã và giá trị!")
    if(formData.scope === 'product' && !formData.productId) return alert("Vui lòng chọn sản phẩm áp dụng!")
    const payload = { id: editingItem ? editingItem.id : null, ...formData, admin_id: admin_ID }
    try {
        const action = editingItem ? 'update' : 'create';
        const response = await fetch(`${API_URL}?action=${action}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if(result.status === 'success') {
            alert("Thành công!");
            fetchPromotions();
            setModalVisible(false);
        } else { alert("Lỗi: " + result.message); }
    } catch (error) { alert("Lỗi kết nối!"); }
  }

  const handleDelete = async (id) => {
      if(window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
          try {
              const response = await fetch(`${API_URL}?action=delete&id=${id}`);
              const result = await response.json();
              if(result.status === 'success') fetchPromotions();
          } catch (error) { alert("Lỗi khi xóa"); }
      }
  }

  const filteredPromotions = promotions.filter(p => 
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="promotions-container pb-5">
      <style>{`
        /* Custom CSS cho giao diện hiện đại */
        .glass-card { 
          border: none; 
          border-radius: 16px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.04); 
          background: #ffffff;
        }
        .header-search {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          transition: 0.3s;
        }
        .header-search:focus-within {
          border-color: #52b788;
          box-shadow: 0 0 0 3px rgba(82, 183, 136, 0.1);
        }
        .table-modern thead th {
          background: #fdfdfd;
          color: #adb5bd;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-top: none;
          padding: 1.25rem 1rem;
        }
        .table-modern td {
          padding: 1.25rem 1rem;
          vertical-align: middle;
          border-bottom: 1px solid #f8f9fa;
        }
        .coupon-tag {
          background: #f0fdf4;
          color: #166534;
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 700;
          font-family: 'Monaco', monospace;
          border: 1px dashed #bbf7d0;
          display: inline-block;
        }
        .discount-value {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1a1a1a;
        }
        .progress-thin {
          border-radius: 10px;
          background-color: #f1f5f9;
        }
        .btn-create {
          background: linear-gradient(135deg, #52b788 0%, #40916c 100%);
          border: none;
          padding: 10px 24px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(82, 183, 136, 0.3);
        }
        .btn-create:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(82, 183, 136, 0.4);
        }
        .status-active { color: #52b788; font-weight: 600; font-size: 0.85rem; }
        .status-inactive { color: #9ca3af; font-weight: 600; font-size: 0.85rem; }
        
        /* Modal styling */
        .modal-modern { border-radius: 20px; overflow: hidden; border: none; }
        .form-label-bold { font-weight: 600; color: #4b5563; margin-bottom: 8px; font-size: 0.9rem; }
        .input-modern { border-radius: 10px; padding: 10px 15px; border: 1px solid #e5e7eb; }
        .input-modern:focus { border-color: #52b788; box-shadow: 0 0 0 3px rgba(82, 183, 136, 0.1); }
      `}</style>

      <CCard className="glass-card mb-4">
        <CCardHeader className="bg-white border-0 pt-4 pb-2 px-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div>
            <h4 className="mb-0 fw-bold text-dark">Voucher & Khuyến mãi</h4>
            <p className="text-muted small mb-0">Quản lý các chương trình ưu đãi cho khách hàng</p>
          </div>
          <div className="d-flex w-100 w-md-auto gap-3">
             <div className="position-relative w-100" style={{minWidth: '280px'}}>
                <CFormInput 
                    className="header-search ps-5 py-2 border-0" 
                    placeholder="Tìm theo mã hoặc tên voucher..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CIcon icon={cilSearch} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
             </div>
             <CButton className="btn-create text-white fw-bold text-nowrap" onClick={() => openModal()}>
                <CIcon icon={cilPlus} className="me-2"/> Tạo mã mới
             </CButton>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <CTable hover responsive className="table-modern mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="ps-4">Thông tin Voucher</CTableHeaderCell>
                <CTableHeaderCell>Mức Giảm</CTableHeaderCell>
                <CTableHeaderCell>Đối Tượng</CTableHeaderCell>
                <CTableHeaderCell>Thời Hạn</CTableHeaderCell>
                <CTableHeaderCell style={{width: '180px'}}>Hiệu Suất Sử Dụng</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Trạng Thái</CTableHeaderCell>
                <CTableHeaderCell className="text-end pe-4">Thao Tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredPromotions.map(item => (
                <CTableRow key={item.id}>
                  <CTableDataCell className="ps-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="coupon-tag">{item.code}</div>
                      <div>
                        <div className="fw-bold text-dark">{item.name}</div>
                        <div className="text-muted small">ID: #{item.id}</div>
                      </div>
                    </div>
                  </CTableDataCell>
                  
                  <CTableDataCell>
                    <div className="discount-value">
                      {item.type === 'percent' ? `${item.value}%` : formatCurrency(item.value)}
                    </div>
                    <div className="small text-muted">Giảm trực tiếp</div>
                  </CTableDataCell>

                  <CTableDataCell>
                    <CBadge 
                      className="py-2 px-3 rounded-pill"
                      style={{ 
                        backgroundColor: item.scope === 'order' ? '#eff6ff' : '#fff7ed', 
                        color: item.scope === 'order' ? '#1d4ed8' : '#c2410c',
                        border: 'none'
                      }}
                    >
                      <CIcon icon={item.scope === 'order' ? cilTag : cilBasket} className="me-1" size="sm"/>
                      {item.scope === 'order' ? 'Toàn cửa hàng' : 'Sản phẩm lẻ'}
                    </CBadge>
                    {item.product_name && (
                      <div className="small text-muted text-truncate mt-1" style={{maxWidth:'150px'}} title={item.product_name}>
                        {item.product_name}
                      </div>
                    )}
                  </CTableDataCell>

                  <CTableDataCell>
                    <div className="d-flex align-items-center gap-2 small text-dark fw-medium">
                      <CIcon icon={cilCalendar} size="sm" className="text-muted"/>
                      <span>{item.start_date}</span>
                    </div>
                    <div className="ps-4 small text-muted">đến {item.end_date}</div>
                  </CTableDataCell>

                  <CTableDataCell>
                    <div className="d-flex justify-content-between align-items-end mb-1">
                      <span className="fw-bold text-dark small">{item.used_count} <span className="text-muted fw-normal">lượt</span></span>
                      <span className="text-muted" style={{fontSize: '10px'}}>{item.usage_limit} tối đa</span>
                    </div>
                    <CProgress 
                      className="progress-thin"
                      color={item.used_count >= item.usage_limit ? 'danger' : 'success'} 
                      value={(item.used_count/item.usage_limit)*100} 
                      height={6} 
                    />
                  </CTableDataCell>

                  <CTableDataCell className="text-center">
                    <div className="d-flex flex-column align-items-center gap-1">
                      <CFormSwitch 
                        size="lg"
                        checked={Number(item.status) === 1} 
                        onChange={() => toggleStatus(item.id, Number(item.status) === 1)} 
                        style={{ cursor: 'pointer' }}
                      />
                      <span className={Number(item.status) === 1 ? 'status-active' : 'status-inactive'}>
                        {Number(item.status) === 1 ? 'Đang chạy' : 'Tạm dừng'}
                      </span>
                    </div>
                  </CTableDataCell>

                  <CTableDataCell className="text-end pe-4">
                    <div className="d-flex justify-content-end gap-2">
                      <CButton 
                        color="light" 
                        size="sm" 
                        className="rounded-8 border-0 shadow-sm"
                        onClick={() => openModal(item)}
                      >
                        <CIcon icon={cilPencil} className="text-primary"/>
                      </CButton>
                      <CButton 
                        color="light" 
                        size="sm" 
                        className="rounded-8 border-0 shadow-sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <CIcon icon={cilTrash} className="text-danger"/>
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
              {filteredPromotions.length === 0 && (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center py-5 text-muted">
                    Không tìm thấy mã giảm giá nào phù hợp.
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* --- MODAL (GIỮ NGUYÊN LOGIC, SỬA GIAO DIỆN) --- */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} size="lg" alignment="center" className="modal-modern">
        <CModalHeader className="bg-light border-0 px-4 pt-4">
          <CModalTitle className="fw-bold h5">
            {editingItem ? '🚀 Cập nhật chương trình' : '✨ Tạo mã giảm giá mới'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="px-4 pb-4">
          <CRow className="g-4">
            <CCol md={6}>
              <CFormLabel className="form-label-bold">Mã Voucher</CFormLabel>
              <CFormInput 
                className="input-modern text-uppercase fw-bold text-primary" 
                placeholder="VD: GIAM30K"
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel className="form-label-bold">Tên Chương Trình</CFormLabel>
              <CFormInput 
                className="input-modern" 
                placeholder="VD: Ưu đãi hè rực rỡ"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </CCol>

            <CCol md={12}>
              <div className="p-3 rounded-4" style={{background: '#f8fafc', border: '1px solid #f1f5f9'}}>
                <CFormLabel className="form-label-bold">Phạm Vi Áp Dụng</CFormLabel>
                <CFormSelect 
                  className="input-modern mb-3" 
                  value={formData.scope} 
                  onChange={(e) => setFormData({...formData, scope: e.target.value, productId: ''})}
                >
                    <option value="order">Áp dụng cho toàn bộ đơn hàng của shop</option>
                    <option value="product">Chỉ áp dụng cho một sản phẩm cụ thể</option>
                </CFormSelect>

                {formData.scope === 'product' && (
                  <div>
                    <CFormLabel className="form-label-bold"><CIcon icon={cilBasket} className="me-1 text-warning"/> Chọn Sản Phẩm Đang Kinh Doanh</CFormLabel>
                    <CFormSelect 
                      className="input-modern" 
                      value={formData.productId} 
                      onChange={(e) => setFormData({...formData, productId: e.target.value})}
                    >
                        <option value="">-- Danh sách sản phẩm của bạn --</option>
                        {adminProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name} - ({formatCurrency(p.price)})</option>
                        ))}
                    </CFormSelect>
                  </div>
                )}
              </div>
            </CCol>

            <CCol md={4}>
              <CFormLabel className="form-label-bold">Loại Giảm</CFormLabel>
              <CFormSelect className="input-modern" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="percent">Theo phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (VNĐ)</option>
              </CFormSelect>
            </CCol>
            <CCol md={5}>
              <CFormLabel className="form-label-bold">Giá Trị Giảm</CFormLabel>
              <CFormInput type="number" className="input-modern fw-bold" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} />
            </CCol>
            <CCol md={3}>
              <CFormLabel className="form-label-bold">Giới hạn mã</CFormLabel>
              <CFormInput type="number" className="input-modern" value={formData.limit} onChange={(e) => setFormData({...formData, limit: e.target.value})} />
            </CCol>

            <CCol md={6}>
              <CFormLabel className="form-label-bold">Ngày Bắt Đầu</CFormLabel>
              <CFormInput type="date" className="input-modern" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            </CCol>
            <CCol md={6}>
              <CFormLabel className="form-label-bold">Ngày Kết Thúc</CFormLabel>
              <CFormInput type="date" className="input-modern" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter className="bg-light border-0 px-4 pb-4">
            <CButton color="light" className="fw-bold px-4 py-2 rounded-10" onClick={() => setModalVisible(false)}>Đóng</CButton>
            <CButton className="btn-create text-white fw-bold px-4 py-2" onClick={handleSave}>
              {editingItem ? 'Lưu thay đổi' : 'Xác nhận tạo mã'}
            </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Promotions