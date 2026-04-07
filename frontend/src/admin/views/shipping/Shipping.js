import React, { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print';
import { PrintTemplate } from './PrintTemplate'; 
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableHead, 
  CTableHeaderCell, CTableRow, CTableDataCell, CButton, CFormInput, CModal, 
  CModalHeader, CModalTitle, CModalBody, CModalFooter, CBadge, CFormSelect, 
  CFormLabel, CSpinner
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
    item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.hoadon?.customer?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Cập nhật màu sắc khớp với text thực tế
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

  if (loading) return <div className="text-center py-5"><CSpinner color="success"/></div>;

  return (
    <div className="shipping-page-container">
      <CCard className="card-green-theme mb-4 shadow-sm">
        <CCardHeader className="bg-white pt-3 pb-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold"><CIcon icon={cilTruck} className="me-2 text-warning"/> Quản Lý Vận Chuyển</h5>
          <CFormInput 
            style={{ width: '250px' }} 
            placeholder="Tìm mã vận đơn..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </CCardHeader>

        <CCardBody>
          <CTable hover responsive className="table-green-custom">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Mã Vận Đơn</CTableHeaderCell>
                <CTableHeaderCell>Khách Hàng</CTableHeaderCell>
                <CTableHeaderCell>Trạng Thái</CTableHeaderCell>
                <CTableHeaderCell>Dự Kiến Giao</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Hành Động</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredShipments.map((item) => (
                <CTableRow key={item.id}>
                  <CTableDataCell className="fw-bold">{item.id}</CTableDataCell>
                  <CTableDataCell>
                    <div>{item.hoadon?.customer}</div>
                    <small className="text-muted">Đơn: {item.hoadon?.id}</small>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={getStatusColor(item.status)}>{item.status}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell className="small">{formatDateTime(item.estimatedTime)}</CTableDataCell>
                  <CTableDataCell className="text-end">
                    <div className="d-flex justify-content-end gap-2">
                        {/* SỬA LẠI VALUE CÁC OPTION ĐỂ KHỚP VỚI DATABASE */}
                        <select 
                            className="form-select form-select-sm w-auto"
                            value={item.status}
                            onChange={(e) => handleUpdateStatusQuick(item.id, e.target.value)}
                        >
                            <option value="Chờ lấy hàng">Chờ lấy hàng</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Đã giao">Đã giao</option>
                            <option value="Giao thất bại">Giao thất bại</option>
                        </select>
                        <CButton color="light" size="sm" onClick={() => openEditModal(item)}><CIcon icon={cilPencil}/></CButton>
                        <CButton color="primary" size="sm" onClick={() => triggerPrint(item)}><CIcon icon={cilPrint}/></CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* MODAL CẬP NHẬT - CŨNG CẦN KHỚP OPTION */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} alignment="center">
        <CModalHeader><CModalTitle>Cập Nhật Vận Đơn</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>Phương thức</CFormLabel>
            <CFormSelect value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value})}>
              <option value="Giao nội thành">Giao nội thành</option>
              <option value="Giao nhanh">Giao nhanh</option>
              <option value="Tự giao">Tự giao</option>
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel>Trạng thái</CFormLabel>
            <CFormSelect value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
              <option value="Chờ lấy hàng">Chờ lấy hàng</option>
              <option value="Đang giao">Đang giao</option>
              <option value="Đã giao">Đã giao</option>
              <option value="Giao thất bại">Giao thất bại</option>
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel>Ngày dự kiến</CFormLabel>
            <CFormInput type="datetime-local" value={formData.estimatedTime} onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})} />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>Đóng</CButton>
          <CButton color="success" className="text-white" onClick={handleSave}>Lưu thay đổi</CButton>
        </CModalFooter>
      </CModal>

      <div style={{ display: 'none' }}>
        <PrintTemplate ref={componentRef} data={currentPrintItem} />
      </div>
    </div>
  )
}

export default Shipping