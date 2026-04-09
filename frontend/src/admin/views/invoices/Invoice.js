import React, { useState, useEffect } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableHead, 
  CTableHeaderCell, CTableRow, CTableDataCell, CButton, CFormInput, CModal, 
  CModalHeader, CModalTitle, CModalBody, CModalFooter, CBadge, CTooltip, 
  CFormTextarea, CFormLabel, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilSearch, cilPrint, cilInfo, cilCloudDownload, cilDescription, cilBan, 
  cilCreditCard, cilWallet, cilCheckCircle, cilUser, cilLocationPin, cilPhone
} from '@coreui/icons'
import * as XLSX from 'xlsx'

// --- CẤU HÌNH API ---
import { API_BASE as API_BASE_URL } from 'src/config';

const Invoice = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // State Modal
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const [invoiceToCancel, setInvoiceToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  // --- 1. LẤY DỮ LIỆU TỪ API ---
  const fetchInvoices = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/get_invoices`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const result = await res.json();
      if (result.status === 'success') {
        setInvoices(result.data);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error("Lỗi kết nối API lấy hóa đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // --- 2. XỬ LÝ CẬP NHẬT TRẠNG THÁI NHANH ---
  const handleUpdateStatus = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/update_order_status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: id,      
          status: newStatus 
        })
      
      });
      const result = await res.json();

      if (result.status === 'success') {
        alert("Cập nhật trạng thái thành công!");
        fetchInvoices(); 
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (err) {
      alert("Lỗi kết nối Server.");
    }
  };

  // --- 3. XỬ LÝ HỦY ĐƠN HÀNG QUA MODAL ---
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn hàng!');
      return;
    }
    
    await handleUpdateStatus(invoiceToCancel.id, 'Hủy đơn');
    setCancelModalVisible(false);
  }

  // --- LOGIC TÌM KIẾM ---
  const filteredInvoices = invoices.filter(item =>
    (item.id && item.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.customer && item.customer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const openInvoiceDetail = (invoice) => {
    setSelectedInvoice(invoice)
    setModalVisible(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã giao': case 'delivered': return 'success';
      case 'Chờ xử lý': case 'pending': return 'warning';
      case 'Đang giao': case 'shipping': return 'info';
      case 'Đã xác nhận': return 'primary'; 
      case 'Hủy đơn': case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const renderPaymentMethod = (method) => {
    if (method === 'Chuyển khoản' || method === 'Online') {
      return (
        <span className="text-info d-flex align-items-center fw-semibold">
          <CIcon icon={cilCreditCard} className="me-1"/> Online
        </span>
      )
    }
    return (
      <span className="text-warning d-flex align-items-center fw-semibold">
        <CIcon icon={cilWallet} className="me-1"/> Tiền mặt
      </span>
    )
  }

  const handlePrint = () => { window.print(); }

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const dataToExport = filteredInvoices.map(inv => ({
        "Mã HĐ": inv.id,
        "Khách Hàng": inv.customer,
        "Ngày Tạo": inv.date,
        "Tổng Tiền (VNĐ)": inv.amount,
        "Phương Thức": inv.payment_method || 'Tiền mặt',
        "Vận Chuyển": inv.deliveryStatus,
        "Địa Chỉ": inv.address,
        "Số Điện Thoại": inv.phone
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHoaDon");
    XLSX.writeFile(workbook, "Danh_Sach_Hoa_Don.xlsx");
  }

  return (
    <div className="invoice-page-container">
      <style>{`
        .card-green-theme { background-color: #ffffff; color: #2c2c2c; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .table-green-custom thead th { background-color: #f3f4f6; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding: 14px 16px; text-transform: uppercase; font-size: 0.85rem; }
        .table-green-custom td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f1f1; }
        .text-price { color: #dc2626; font-weight: 700; }
        .invoice-box { border: 1px solid #e5e7eb; padding: 20px; border-radius: 10px; background-color: #ffffff; color: #333; }
        .info-label { color: #6b7280; font-size: 0.9rem; margin-bottom: 2px; }
        .info-value { color: #111827; font-weight: 600; margin-bottom: 10px; }
      `}</style>

      <CCard className="card-green-theme mb-4">
        <CCardHeader className="border-bottom pt-3 pb-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <h5 className="mb-0 fw-bold d-flex align-items-center" style={{color: '#000000'}}>
            <CIcon icon={cilDescription} className="me-2 text-warning"/> Quản Lý Hóa Đơn
          </h5>
          <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
            <div className="position-relative w-100">
                <CFormInput className="ps-5 w-100" placeholder="Tìm mã đơn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <CIcon icon={cilSearch} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            </div>
            <CButton style={{backgroundColor: '#D99485', border: 'none'}} className="fw-semibold text-white w-100 w-sm-auto" onClick={handleExportExcel}>
                <CIcon icon={cilCloudDownload} className="me-2"/> Xuất Excel
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="text-center py-5"><CSpinner color="success"/></div>
          ) : (
            <CTable hover responsive className="table-green-custom mb-0">
                <CTableHead>
                    <CTableRow>
                        <CTableHeaderCell>Mã HĐ</CTableHeaderCell>
                        <CTableHeaderCell>Khách Hàng</CTableHeaderCell>
                        <CTableHeaderCell>Tổng Tiền</CTableHeaderCell>
                        <CTableHeaderCell>Phương Thức</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Vận Chuyển</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Hành Động</CTableHeaderCell>
                    </CTableRow>
                </CTableHead>
                <CTableBody>
                {filteredInvoices.map((item) => (
                  <CTableRow key={item.id}>
                    <CTableDataCell className="fw-bold text-info">{item.id}</CTableDataCell>
                    <CTableDataCell>{item.customer || 'N/A'}</CTableDataCell>
                    <CTableDataCell className="text-price">{formatCurrency(item.amount)}</CTableDataCell>
                    <CTableDataCell>{renderPaymentMethod(item.payment_method)}</CTableDataCell>
                    <CTableDataCell className="text-center">
                        <CBadge color={getStatusColor(item.deliveryStatus)}>{item.deliveryStatus}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                            <select 
                                className="form-select form-select-sm w-auto me-2"
                                value={item.deliveryStatus}
                                onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                style={{ fontSize: '0.8rem', borderColor: '#e5e7eb' }}
                            >
                                <option value="Chờ xử lý">Chờ xử lý</option>
                                <option value="Đã xác nhận">Đã xác nhận</option> 
                                
                            </select>

                            <CTooltip content="Chi tiết"><CButton color="link" className="p-1" onClick={() => openInvoiceDetail(item)}><CIcon icon={cilInfo} /></CButton></CTooltip>
                            <CTooltip content="In"><CButton color="link" className="p-1 ms-1" onClick={handlePrint}><CIcon icon={cilPrint} /></CButton></CTooltip>
                        </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
                </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* MODAL CHI TIẾT HÓA ĐƠN */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} size="lg" alignment="center">
          <CModalHeader className="border-0"><CModalTitle className="fw-bold">Chi Tiết Hóa Đơn</CModalTitle></CModalHeader>
          <CModalBody className="pt-0">
            {selectedInvoice && (
              <div className="invoice-box shadow-none border-0 pt-0">
                {/* Phần Header Modal */}
                <CRow className="mb-4 align-items-center border-bottom pb-3">
                    <CCol xs={6}>
                      <h4 className="fw-bold mb-0" style={{ color: "#D99485" }}>Lumina Jewelry</h4>
                      <div className="text-muted small">Cửa hàng trang sức cao cấp</div>
                    </CCol>
                    <CCol xs={6} className="text-end">
                      <div className="fw-bold fs-5">Mã HĐ: #{selectedInvoice.id}</div>
                      <div className="small text-muted">Ngày đặt: {selectedInvoice.date}</div>
                    </CCol>
                </CRow>

                {/* THÊM MỚI: THÔNG TIN NGƯỜI ĐẶT */}
                <CRow className="mb-4 bg-light p-3 rounded mx-0">
                    <CCol md={6}>
                      <div className="info-label"><CIcon icon={cilUser} className="me-1"/> Người đặt hàng</div>
                      <div className="info-value">{selectedInvoice.customer || 'N/A'}</div>
                      
                      <div className="info-label"><CIcon icon={cilPhone} className="me-1"/> Số điện thoại</div>
                      <div className="info-value">{selectedInvoice.phone || 'Chưa cung cấp'}</div>
                    </CCol>
                    <CCol md={6}>
                      <div className="info-label"><CIcon icon={cilLocationPin} className="me-1"/> Địa chỉ giao hàng</div>
                      <div className="info-value">{selectedInvoice.address || 'Chưa cập nhật địa chỉ'}</div>
                      
                      <div className="info-label">Phương thức thanh toán</div>
                      <div className="info-value">{selectedInvoice.payment_method || 'Tiền mặt'}</div>
                    </CCol>
                </CRow>

                {/* Danh sách sản phẩm */}
                <div className="mb-2 fw-bold"><CIcon icon={cilDescription} className="me-1"/> Danh sách sản phẩm</div>
                <CTable hover responsive bordered className="mb-3">
                    <CTableHead className="table-light">
                      <CTableRow>
                        <CTableHeaderCell>Sản phẩm</CTableHeaderCell>
                        <CTableHeaderCell className="text-center" style={{width: '60px'}}>SL</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Đơn giá</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Thành tiền</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                        {selectedInvoice.items && selectedInvoice.items.map((item, idx) => (
                            <CTableRow key={idx}>
                                <CTableDataCell>{item.name}</CTableDataCell>
                                <CTableDataCell className="text-center">{item.qty}</CTableDataCell>
                                <CTableDataCell className="text-end">{formatCurrency(item.price)}</CTableDataCell>
                                <CTableDataCell className="text-end fw-bold">{formatCurrency(item.price * item.qty)}</CTableDataCell>
                            </CTableRow>
                        ))}
                    </CTableBody>
                </CTable>

                <div className="text-end mt-3 border-top pt-3">
                    <div className="text-muted small">Thanh toán thực tế</div>
                    <span className="fs-4 text-danger fw-bold">Tổng: {formatCurrency(selectedInvoice.amount)}</span>
                </div>
              </div>
            )}
          </CModalBody>
          <CModalFooter className="border-0">
            <CButton color="secondary" onClick={() => setModalVisible(false)}>Đóng</CButton>
            <CButton color="success" onClick={handlePrint} className="text-white">
              <CIcon icon={cilPrint} className="me-2"/> In hóa đơn
            </CButton>
          </CModalFooter>
      </CModal>
    </div>
  )
}

export default Invoice