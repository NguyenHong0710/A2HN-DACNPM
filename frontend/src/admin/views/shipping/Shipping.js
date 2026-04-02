import React, { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print';
import { PrintTemplate } from './PrintTemplate'; 
import { cilPrint } from '@coreui/icons';
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableHead, 
  CTableHeaderCell, CTableRow, CTableDataCell, CButton, CFormInput, CModal, 
  CModalHeader, CModalTitle, CModalBody, CModalFooter, CBadge, CFormSelect, 
  CFormLabel, CFormTextarea, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilSearch, cilTruck, cilPencil, cilLocationPin, cilClock, cilSave, cilUser
} from '@coreui/icons'
import { API_BASE as API_BASE_URL } from 'src/config';

const Shipping = () => {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // State Modal Cập Nhật
  const [modalVisible, setModalVisible] = useState(false)
  const [editingShipment, setEditingShipment] = useState(null)
  const [formData, setFormData] = useState({
    method: '',
    status: '',
    estimatedTime: '',
    note: ''
  })

  // --- 1. LOAD DỮ LIỆU TỪ DATABASE ---
  useEffect(() => {
    // Ép kiểu an toàn để không bị lỗi nếu localStorage null
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (storedUser && storedUser.id) {
      fetchShipments(storedUser, token);
    } else {
      console.warn("Không tìm thấy User ID. Vòng xoay đã được tắt.");
      setLoading(false); // Tắt ngay vòng xoay nếu không có user
    }
  }, []);

  // Tìm hàm fetch dữ liệu vận chuyển của ông
// --- 1. LOAD DỮ LIỆU TỪ DATABASE ---
const fetchShipments = async () => { // Đổi tên cho khớp với useEffect
    setLoading(true);
    try {
        const response = await fetch("http://127.0.0.1:8000/api/get_shipping");
        const result = await response.json();
        
        if (result.status === 'success') {
            setShipments(result.data); // Sửa thành setShipments (khớp với State shipments)
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
    } finally {
        setLoading(false); // Tắt vòng xoay sau khi load xong
    }
};

// Sửa lại useEffect để gọi đúng hàm trên
useEffect(() => {
    fetchShipments();
}, []);

  // --- 2. LƯU CẬP NHẬT VÀO DATABASE ---
  const handleSave = async () => {
    if (!editingShipment) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/update_shipping`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
            id: editingShipment.id,
            ...formData 
        })
      });
      const result = await res.json();
if (result.status === 'success') {
        alert("Cập nhật trạng thái vận chuyển thành công!");
        setModalVisible(false);
        // Lấy lại user để truyền vào fetchShipments
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        fetchShipments(storedUser, token); 
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ khi cập nhật.");
    }
  }

  // Logic Tìm kiếm
  const filteredShipments = shipments.filter(item =>
    item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customer?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Mở Modal Cập Nhật
  const openEditModal = (shipment) => {
    setEditingShipment(shipment)
    setFormData({
      method: shipment.method || '',
      status: shipment.status || '',
      estimatedTime: shipment.estimatedTime ? shipment.estimatedTime.replace(" ", "T").substring(0, 16) : '',
      note: shipment.note || ''
    })
    setModalVisible(true)
  }

  const componentRef = useRef();
  const [currentPrintItem, setCurrentPrintItem] = useState(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef, 
  });

  const triggerPrint = (item) => {
    setCurrentPrintItem(item);
    setTimeout(() => {
      handlePrint();
    }, 500);
  };

  // Màu sắc Badge Trạng Thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'Giao thành công': return 'success'
      case 'Đang giao hàng': return 'warning'
      case 'Chờ lấy hàng': return 'info'
      case 'Giao thất bại': return 'danger'
      case 'Đã hủy': return 'secondary'
      default: return 'light'
    }
  }

  // Màu sắc Badge Phương Thức
  const getMethodColor = (method) => {
    switch (method) {
        case 'Giao nhanh': return 'danger'
        case 'Giao nội thành': return 'success'
        case 'Tự giao': return 'primary'
        default: return 'secondary'
    }
  }

  // Format ngày giờ hiển thị
  const formatDateTime = (isoString) => {
    if(!isoString) return 'Chưa xác định';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', { 
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
    });
  }

  if (loading) return <div className="text-center py-5"><CSpinner color="success"/></div>;

  return (
    <div className="shipping-page-container">
      <style>{`
  .card-green-theme { 
    background-color: #ffffff; 
    color: #111827; 
    border: 1px solid #e5e7eb; 
    border-radius: 12px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.05); 
  }

  .modal-green-content { 
    background-color: #ffffff; 
    color: #111827; 
    border: 1px solid #e5e7eb; 
    border-radius: 12px;
  }

  .modal-header, 
  .modal-footer { 
    border-color: #e5e7eb; 
  }

  .table-green-custom { 
    --cui-table-color: #111827;
--cui-table-bg: #ffffff; 
    --cui-table-border-color: #e5e7eb; 
    --cui-table-hover-bg: #f9fafb; 
  }

  .table-green-custom thead th { 
    background-color: #f3f4f6; 
    color: #374151; 
    font-weight: 700; 
    border-bottom: 2px solid #e5e7eb; 
    padding: 14px 16px; 
    text-transform: uppercase; 
    font-size: 0.85rem; 
    letter-spacing: 0.5px;
  }

  .table-green-custom td { 
    padding: 16px; 
    vertical-align: middle; 
    border-bottom: 1px solid #f1f1f1; 
    color: #111827;
  }

  .form-control-green, 
  .form-select-green { 
    background-color: #ffffff; 
    border: 1px solid #d1d5db; 
    color: #111827; 
    border-radius: 8px;
  }

  .form-control-green:focus, 
  .form-select-green:focus { 
    background-color: #ffffff; 
    border-color: #9ca3af; 
    color: #111827; 
    box-shadow: 0 0 0 0.2rem rgba(156,163,175,0.2); 
  }

  .text-id { 
    color: #374151; 
    font-weight: 700; 
  }

  .text-sub { 
    color: #6b7280; 
    font-size: 0.85rem; 
  }

  .mobile-card { 
    background-color: #ffffff; 
    border: 1px solid #e5e7eb; 
    border-radius: 12px; 
    padding: 15px; 
    margin-bottom: 15px; 
    box-shadow: 0 4px 10px rgba(0,0,0,0.04);
  }

  .mobile-card-row { 
    display: flex; 
    justify-content: space-between; 
    margin-bottom: 8px; 
    font-size: 0.95rem; 
    color: #111827;
  }
`}</style>

      <CCard className="card-green-theme mb-4">
        <CCardHeader className="border-bottom border-secondary pt-3 pb-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <h5 className="mb-0 fw-bold d-flex align-items-center" style={{color: '#000000'}}>
            <CIcon icon={cilTruck} className="me-2 text-warning"/> Quản Lý Vận Chuyển
          </h5>
          <div className="d-flex w-100 w-md-auto">
            <div className="position-relative w-100" style={{ minWidth: '250px' }}>
                <CFormInput className="form-control-green ps-5 w-100" placeholder="Tìm mã vận đơn, đơn hàng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <CIcon icon={cilSearch} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          {/* DESKTOP VIEW */}
          <div className="d-none d-md-block">
            <CTable hover responsive className="table-green-custom mb-0">
                <CTableHead>
                <CTableRow>
                    <CTableHeaderCell>Mã Vận Đơn</CTableHeaderCell>
                    <CTableHeaderCell>Đơn Hàng</CTableHeaderCell>
                    <CTableHeaderCell>Phương Thức</CTableHeaderCell>
                    <CTableHeaderCell>Trạng Thái</CTableHeaderCell>
                    <CTableHeaderCell>Dự Kiến Giao</CTableHeaderCell>
                    <CTableHeaderCell>Ghi Chú</CTableHeaderCell>
<CTableHeaderCell className="text-end">Cập Nhật</CTableHeaderCell>
                </CTableRow>
                </CTableHead>
                <CTableBody>
                {filteredShipments.length > 0 ? filteredShipments.map((item) => (
                    <CTableRow key={item.id}>
                        <CTableDataCell className="text-id">{item.id}</CTableDataCell>
                        <CTableDataCell>
                           <div className="fw-bold">{item.orderId}</div> {/* Sửa orderid thành orderId (chữ I hoa) */}
    <div className="text-sub small">{item.customer}</div>
                        </CTableDataCell>
                        <CTableDataCell><CBadge color={getMethodColor(item.method)}>{item.method}</CBadge></CTableDataCell>
                        <CTableDataCell><CBadge color={getStatusColor(item.status)} shape="rounded-pill">{item.status}</CBadge></CTableDataCell>
                        <CTableDataCell>
                            <div className="d-flex align-items-center small">
                                <CIcon icon={cilClock} size="sm" className="me-2 text-warning"/>
                                {formatDateTime(item.estimatedTime)}
                            </div>
                        </CTableDataCell>
                        <CTableDataCell className="text-sub small text-truncate" style={{maxWidth: '150px'}}>{item.note}</CTableDataCell>
                        <CTableDataCell className="text-end">
                        {/* Nút Sửa */}
                        <CButton 
                          color="link" 
                          className="p-1 text-dark"
                          onClick={() => openEditModal(item)}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>

                        {/* Nút In */}
                        <CButton onClick={() => triggerPrint(item)}>
                        <CIcon icon={cilPrint} />
                      </CButton>
                      </CTableDataCell>
                    </CTableRow>
                )) : (
                    <CTableRow><CTableDataCell colSpan="7" className="text-center py-4 text-muted">Không có dữ liệu vận chuyển.</CTableDataCell></CTableRow>
                )}
                </CTableBody>
            </CTable>
          </div>

          {/* MOBILE VIEW */}
          <div className="d-block d-md-none">
            {filteredShipments.length > 0 ? filteredShipments.map((item) => (
                <div key={item.id} className="mobile-card">
                    <div className="d-flex justify-content-between mb-3 pb-2 border-bottom border-secondary">
                        <div className="fw-bold text-id">{item.id}</div>
                        <CBadge color={getStatusColor(item.status)}>{item.status}</CBadge>
                    </div>
                    <div className="mobile-card-row">
<span className="text-sub">Khách hàng:</span>
                        <span className="fw-semibold">{item.customer}</span>
                    </div>
                    <div className="mobile-card-row">
                        <span className="text-sub">Mã đơn:</span>
                        <span>{item.orderId}</span>
                    </div>
                    <div className="mobile-card-row">
                        <span className="text-sub">Dự kiến:</span>
                        <span className="text-warning small">{formatDateTime(item.estimatedTime)}</span>
                    </div>
                   <div className="mt-3 d-flex gap-2 border-top border-secondary pt-2">
                    <CButton size="sm" color="info" variant="outline" className="flex-grow-1" onClick={() => openEditModal(item)}>Cập nhật</CButton>
                    {/* Nút In trên Mobile */}
                    <CButton size="sm" color="primary" variant="outline" onClick={() => triggerPrint(item)}>
                        <CIcon icon={cilPrint} />
                    </CButton>
                </div>
                </div>
            )) : (
                <div className="text-center py-4 text-muted">Không có dữ liệu vận chuyển.</div>
            )}
          </div>
        </CCardBody>
      </CCard>

      {/* MODAL CẬP NHẬT */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} size="lg" alignment="center">
        <div className="modal-green-content">
          <CModalHeader><CModalTitle>Cập Nhật Vận Đơn {editingShipment?.id}</CModalTitle></CModalHeader>
          <CModalBody>
            <CRow>
                <CCol md={12} className="mb-4">
                    <div className="p-3 rounded" style={{backgroundColor: '#1E3923', border: '1px solid #558b6e'}}>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-white"><CIcon icon={cilUser} size="sm" className="me-1"/> {editingShipment?.customer}</span>
                            <span className="text-warning fw-bold">{editingShipment?.orderId}</span>
                        </div>
                        <div className="small text-white"><CIcon icon={cilLocationPin} className="me-1 text-danger"/> {editingShipment?.address}</div>
                    </div>
                </CCol>
                <CCol md={6} className="mb-3">
                    <CFormLabel>Phương Thức Giao</CFormLabel>
                    <CFormSelect className="form-select-green" value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value})}>
                        <option value="Giao nội thành">Giao nội thành</option>
                        <option value="Giao nhanh">Giao nhanh</option>
                        <option value="Tự giao">Tự giao</option>
                    </CFormSelect>
                </CCol>
                <CCol md={6} className="mb-3">
<CFormLabel>Trạng Thái</CFormLabel>
                    <CFormSelect className="form-select-green" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <option value="Chờ lấy hàng">Chờ lấy hàng</option>
                        <option value="Đang giao hàng">Đang giao hàng</option>
                        <option value="Giao thành công">Giao thành công</option>
                        <option value="Giao thất bại">Giao thất bại</option>
                    </CFormSelect>
                </CCol>
                <CCol md={6} className="mb-3">
                    <CFormLabel>Thời Gian Dự Kiến</CFormLabel>
                    <CFormInput type="datetime-local" className="form-control-green" value={formData.estimatedTime} onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})} />
                </CCol>
                <CCol md={6} className="mb-3">
                    <CFormLabel>Ghi Chú</CFormLabel>
                    <CFormTextarea className="form-control-green" rows={3} value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
                </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setModalVisible(false)}>Đóng</CButton>
            <CButton style={{backgroundColor: '#52b788', color: 'white', border: 'none'}} onClick={handleSave}><CIcon icon={cilSave} className="me-1"/> Lưu Thay Đổi</CButton>
          </CModalFooter>
        </div>
      </CModal>
      <div style={{ display: 'none' }}>
        <PrintTemplate ref={componentRef} data={currentPrintItem} />
      </div>
    </div>
  )
}

export default Shipping
