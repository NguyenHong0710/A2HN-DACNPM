import React, { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print';
import { PrintTemplate } from './PrintTemplate'; 
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableHead, 
  CTableHeaderCell, CTableRow, CTableDataCell, CButton, CFormInput, CModal, 
  CModalHeader, CModalTitle, CModalBody, CModalFooter, CBadge, CFormSelect, 
  CFormLabel, CSpinner, CTooltip
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilSearch, cilTruck, cilPencil, cilLocationPin, cilClock, cilSave, cilUser, cilPrint
} from '@coreui/icons'
import { API_BASE as API_BASE_URL } from 'src/config';

const Shipping = () => {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [modalVisible, setModalVisible] = useState(false)
  const [editingShipment, setEditingShipment] = useState(null)
  const [formData, setFormData] = useState({
    method: '',
    status: '',
    estimatedTime: '',
    note: ''
  })

  const fetchShipments = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/get_shipping`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json' 
            }
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            setShipments(result.data);
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu vận chuyển:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleUpdateStatusQuick = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/update_shipping`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify({ id: id, status: newStatus }) 
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert("Đã cập nhật trạng thái vận chuyển!");
        fetchShipments(); 
      }
    } catch (err) {
      alert("Lỗi kết nối khi cập nhật.");
    }
  };

  const handleSave = async () => {
    if (!editingShipment) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/update_shipping`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify({ 
            id: editingShipment.id,
            ...formData 
        })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert("Cập nhật chi tiết vận chuyển thành công!");
        setModalVisible(false);
        fetchShipments(); 
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ.");
    }
  }

  const filteredShipments = shipments.filter(item =>
    (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.hoadon?.customer && item.hoadon.customer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const openEditModal = (shipment) => {
    setEditingShipment(shipment)
    setFormData({
      method: shipment.method || 'Giao hàng nhanh',
      status: shipment.status || 'Đang giao',
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
    setTimeout(() => { handlePrint(); }, 500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã giao': case 'Giao thành công': return 'success'
      case 'Đang giao': return 'warning'
      case 'Chờ lấy hàng': return 'info'
      case 'Giao thất bại': return 'danger'
      default: return 'secondary'
    }
  }

  const formatDateTime = (isoString) => {
    if(!isoString) return 'Chưa xác định';
    return new Date(isoString).toLocaleString('vi-VN');
  }

  return (
    <div className="shipping-page-container">
      <style>{`
        .card-green-theme { background-color: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .table-green-custom thead th { background-color: #f3f4f6; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding: 14px 16px; text-transform: uppercase; font-size: 0.85rem; }
        
        .table-green-custom td { 
          padding: 12px 16px !important; 
          vertical-align: middle !important; 
          height: 70px; 
          position: relative;
        }

        .absolute-center-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .text-info-custom { color: #0ea5e9; font-weight: 600; }
      `}</style>

      <CCard className="card-green-theme mb-4">
        <CCardHeader className="bg-white border-bottom pt-3 pb-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <h5 className="mb-0 fw-bold d-flex align-items-center">
            <CIcon icon={cilTruck} className="me-2 text-warning"/> Quản Lý Vận Chuyển
          </h5>
          <div className="position-relative" style={{ minWidth: '300px' }}>
            <CFormInput 
              className="ps-5"
              placeholder="Tìm mã vận đơn, tên khách..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <CIcon icon={cilSearch} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          </div>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="text-center py-5"><CSpinner color="success"/></div>
          ) : (
            <CTable hover responsive className="table-green-custom mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: '15%' }}>Mã Vận Đơn</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '25%' }}>Khách Hàng</CTableHeaderCell>
                  <CTableHeaderCell className="text-center" style={{ width: '20%' }}>Trạng Thái</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: '20%' }}>Dự Kiến Giao</CTableHeaderCell>
                  <CTableHeaderCell className="text-end" style={{ width: '20%' }}>Hành Động</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredShipments.map((item) => (
                  <CTableRow key={item.id}>
                    <CTableDataCell className="text-info-custom">{item.id}</CTableDataCell>
                    <CTableDataCell>
                      <div className="fw-semibold">{item.hoadon?.customer || 'N/A'}</div>
                      <small className="text-muted">Đơn: #{item.hoadon?.id}</small>
                    </CTableDataCell>
                    
                    <CTableDataCell className="text-center">
                      <div className="absolute-center-wrapper">
                        <CBadge color={getStatusColor(item.status)} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                          {item.status || 'Chờ lấy hàng'}
                        </CBadge>
                      </div>
                    </CTableDataCell>

                    <CTableDataCell>
                        <div className="d-flex align-items-center small text-muted">
                            <CIcon icon={cilClock} className="me-1" size="sm"/>
                            {formatDateTime(item.estimatedTime)}
                        </div>
                    </CTableDataCell>

                    <CTableDataCell className="text-end">
                      <div className="d-flex justify-content-end align-items-center gap-2">
                        <select 
                            className="form-select form-select-sm w-auto"
                            value={item.status || 'Chờ lấy hàng'}
                            onChange={(e) => handleUpdateStatusQuick(item.id, e.target.value)}
                            style={{ fontSize: '0.85rem', height: '31px' }}
                        >
                            <option value="Chờ lấy hàng">Chờ lấy hàng</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Đã giao">Đã giao</option>
                            <option value="Giao thất bại">Giao thất bại</option>
                        </select>
                        
                        <CTooltip content="Chỉnh sửa">
                          <CButton color="link" className="p-1" onClick={() => openEditModal(item)}>
                            <CIcon icon={cilPencil} className="text-primary"/>
                          </CButton>
                        </CTooltip>

                        <CTooltip content="In vận đơn">
                          <CButton color="link" className="p-1" onClick={() => triggerPrint(item)}>
                            <CIcon icon={cilPrint} className="text-dark"/>
                          </CButton>
                        </CTooltip>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* MODAL CẬP NHẬT CHI TIẾT */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} alignment="center" size="sm">
        <CModalHeader className="border-0">
          <CModalTitle className="fw-bold">Cập Nhật Vận Đơn</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">Phương thức</CFormLabel>
            <CFormSelect size="sm" value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value})}>
              <option value="Giao nội thành">Giao nội thành</option>
              <option value="Giao nhanh">Giao nhanh</option>
              <option value="Tự giao">Tự giao</option>
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">Trạng thái</CFormLabel>
            <CFormSelect size="sm" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
              <option value="Chờ lấy hàng">Chờ lấy hàng</option>
              <option value="Đang giao">Đang giao</option>
              <option value="Đã giao">Đã giao</option>
              <option value="Giao thất bại">Giao thất bại</option>
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">Ngày dự kiến</CFormLabel>
            <CFormInput size="sm" type="datetime-local" value={formData.estimatedTime} onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})} />
          </div>
        </CModalBody>
        <CModalFooter className="border-0">
          <CButton color="secondary" size="sm" onClick={() => setModalVisible(false)}>Hủy</CButton>
          <CButton color="success" size="sm" className="text-white fw-bold" onClick={handleSave}>
            <CIcon icon={cilSave} className="me-1"/> Lưu lại
          </CButton>
        </CModalFooter>
      </CModal>

      {/* PHẦN IN ẨN */}
      <div style={{ display: 'none' }}>
        <PrintTemplate ref={componentRef} data={currentPrintItem} />
      </div>
    </div>
  )
}

export default Shipping