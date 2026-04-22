import React, { useState, useEffect } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableHead, 
  CTableHeaderCell, CTableRow, CTableDataCell, CButton, CFormTextarea, CModal, 
  CModalHeader, CModalTitle, CModalBody, CModalFooter, CBadge, CFormSelect, 
  CFormLabel, CNav, CNavItem, CNavLink, CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilStar, cilCommentSquare, cilWarning, cilCheckCircle, cilTrash
} from '@coreui/icons'
import { API_BASE as API_BASE_URL } from 'src/config';

const Reviews = () => {
  const [reviews, setReviews] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('All') 
  
  const [replyModal, setReplyModal] = useState(false)
  const [currentReview, setCurrentReview] = useState(null)
  const [replyText, setReplyText] = useState('')

  const [reportModal, setReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const token = localStorage.getItem('token');

  // --- 1. LẤY DỮ LIỆU TỪ LARAVEL ---
  // Lưu ý: Vì trang Admin cần xem TẤT CẢ đánh giá, bạn nên tạo thêm 1 route GET /admin/reviews ở Laravel
  // Ở đây tôi giả định bạn dùng API lấy danh sách tổng quát
  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Gọi đến API Laravel (Sửa lại endpoint tùy theo route admin của bạn)
      const res = await fetch(`${API_BASE_URL}/all-reviews-admin`, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const result = await res.json();
      if (res.ok) {
        setReviews(result.data || result); 
      }
    } catch (err) {
      console.error("Lỗi tải đánh giá:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // --- 2. LOGIC ĐIỀU KHIỂN MODAL ---
  const openReplyModal = (item) => {
    setCurrentReview(item);
    setReplyText(item.reply || '');
    setReplyModal(true);
  };

  const openReportModal = (item) => {
    setCurrentReview(item);
    setReportReason('');
    setReportModal(true);
  };

  // --- 3. XỬ LÝ API ---
  const handleSaveReply = async () => {
    if (!replyText.trim()) return alert("Vui lòng nhập nội dung phản hồi!");
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${currentReview.id}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reply: replyText })
      });
      if (res.ok) {
        alert("Đã gửi phản hồi thành công!");
        setReplyModal(false);
        fetchReviews(); 
      }
    } catch (err) {
      alert("Lỗi kết nối server.");
    }
  };

  const handleDeleteReview = async (id) => {
    if(!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            alert("Xóa thành công");
            fetchReviews();
        }
    } catch (err) { alert("Lỗi xóa dữ liệu"); }
  }

  const handleConfirmReport = async () => {
    if (!reportReason) return alert("Vui lòng chọn lý do báo cáo!");
    // Logic báo cáo thường sẽ update status đánh giá thành 'reported'
    alert("Tính năng báo cáo đã được ghi nhận hệ thống.");
    setReportModal(false);
  };

  const filteredReviews = reviews.filter(item => {
    if (filterType === 'All') return true;
    // Kiểm tra theo loại đối tượng
    if (filterType === 'Product') return item.product_id !== null;
    return true;
  });

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <CIcon 
        key={i} 
        icon={cilStar} 
        size="sm" 
        className={i < parseInt(rating) ? "text-warning" : "text-secondary opacity-25"} 
      />
    ));
  }

  if (loading) return <div className="text-center py-5"><CSpinner color="success"/></div>;

  return (
    <div className="reviews-page-container">
      <style>{`
        .reviews-page-container { color: #000000; }
        .card-green-theme { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.05); }
        .modal-green-content { background-color: #ffffff; color: #000000; border: 1px solid #e5e7eb; }
        .table-green-custom { --cui-table-color: #000000; --cui-table-bg: #ffffff; }
        .table-green-custom thead th { background-color: #f3f4f6; color: #000000; font-weight: 600; padding: 14px 16px; font-size: 0.85rem; border-bottom: 2px solid #e5e7eb; }
        .table-green-custom td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #f1f1f1; }
        .nav-pills .nav-link { color: #000000; cursor: pointer; border-radius: 8px; }
        .nav-pills .nav-link.active { background-color: #374151 !important; color: #ffffff !important; }
        .reply-box { background-color: #f9fafb; border-left: 3px solid #52b788; padding: 10px; margin-top: 8px; border-radius: 6px; font-size: 0.9rem; }
        .mobile-card { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 15px; margin-bottom: 15px; }
      `}</style>

      <CCard className="card-green-theme mb-4">
        <CCardHeader className="border-bottom pt-3 pb-3">
          <CRow className="align-items-center">
            <CCol md={6}>
              <h5 className="mb-0 fw-bold">
                <CIcon icon={cilStar} className="me-2 text-warning"/> Quản Lý Đánh Giá & Phản Hồi
              </h5>
            </CCol>
            <CCol md={6} className="text-md-end mt-3 mt-md-0">
                <CNav variant="pills" className="justify-content-md-end">
                    <CNavItem><CNavLink active={filterType === 'All'} onClick={() => setFilterType('All')}>Tất cả</CNavLink></CNavItem>
                    <CNavItem><CNavLink active={filterType === 'Product'} onClick={() => setFilterType('Product')}>Sản phẩm</CNavLink></CNavItem>
                </CNav>
            </CCol>
          </CRow>
        </CCardHeader>
        
        <CCardBody>
          <div className="d-none d-md-block">
            <CTable hover responsive className="table-green-custom mb-0">
                <CTableHead>
                    <CTableRow>
                        <CTableHeaderCell>Khách Hàng</CTableHeaderCell>
                        <CTableHeaderCell>Sản Phẩm</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Đánh Giá</CTableHeaderCell>
                        <CTableHeaderCell style={{width: '35%'}}>Nội Dung</CTableHeaderCell>
                        <CTableHeaderCell>Ngày</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Hành Động</CTableHeaderCell>
                    </CTableRow>
                </CTableHead>
                <CTableBody>
                    {filteredReviews.length > 0 ? filteredReviews.map(item => (
                        <CTableRow key={item.id}>
                            <CTableDataCell><strong>{item.user?.name || 'Ẩn danh'}</strong></CTableDataCell>
                            <CTableDataCell>
                                <div className="fw-semibold text-truncate" style={{maxWidth: '150px'}}>{item.product?.name || 'Sản phẩm đã xóa'}</div>
                                <CBadge color="success" size="sm">ID: #{item.product_id}</CBadge>
                            </CTableDataCell>
                            <CTableDataCell className="text-center">{renderStars(item.rating)}</CTableDataCell>
                            <CTableDataCell>
                                <div className="mb-1">"{item.comment}"</div>
                                {item.reply && (
                                    <div className="reply-box">
                                        <div className="fw-bold text-success mb-1 small"><CIcon icon={cilCheckCircle} size="sm" className="me-1"/>Shop phản hồi:</div>
                                        <div className="text-muted fst-italic">{item.reply}</div>
                                    </div>
                                )}
                            </CTableDataCell>
                            <CTableDataCell>{item.created_at}</CTableDataCell>
                            <CTableDataCell className="text-end">
                                <CButton color="link" className="text-primary p-1" title="Phản hồi" onClick={() => openReplyModal(item)}><CIcon icon={cilCommentSquare} /></CButton>
                                <CButton color="link" className="text-danger p-1 ms-1" title="Xóa" onClick={() => handleDeleteReview(item.id)}><CIcon icon={cilTrash} /></CButton>
                            </CTableDataCell>
                        </CTableRow>
                    )) : <CTableRow><CTableDataCell colSpan="6" className="text-center py-4">Không có đánh giá nào.</CTableDataCell></CTableRow>}
                </CTableBody>
            </CTable>
          </div>

          {/* Giao diện Mobile */}
          <div className="d-block d-md-none">
            {filteredReviews.map(item => (
                <div key={item.id} className="mobile-card">
                    <div className="d-flex justify-content-between mb-2">
                        <div className="fw-bold">{item.user?.name}</div>
                        <div>{renderStars(item.rating)}</div>
                    </div>
                    <div className="small text-muted mb-2">{item.product?.name}</div>
                    <div className="fst-italic border-start border-3 border-success ps-2 mb-3">"{item.comment}"</div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <small className="text-muted">{item.created_at}</small>
                        <div>
                            <CButton size="sm" color="success" variant="outline" className="me-2" onClick={() => openReplyModal(item)}>Trả lời</CButton>
                            <CButton size="sm" color="danger" variant="outline" onClick={() => handleDeleteReview(item.id)}>Xóa</CButton>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        </CCardBody>
      </CCard>

      {/* MODAL PHẢN HỒI */}
      <CModal visible={replyModal} onClose={() => setReplyModal(false)} alignment="center">
        <div className="modal-green-content rounded">
            <CModalHeader closeButton><CModalTitle>Phản Hồi Khách Hàng</CModalTitle></CModalHeader>
            <CModalBody>
                {currentReview && (
                    <>
                        <div className="mb-3">
                            <label className="small text-muted">Nội dung đánh giá:</label> 
                            <div className="p-2 bg-light rounded mt-1">"{currentReview.comment}"</div>
                        </div>
                        <CFormLabel>Câu trả lời của Shop:</CFormLabel>
                        <CFormTextarea rows={4} className="form-control-green" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Cảm ơn khách đã ủng hộ..."/>
                    </>
                )}
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={() => setReplyModal(false)}>Hủy</CButton>
                <CButton style={{backgroundColor: '#52b788', border: 'none', color: 'white'}} onClick={handleSaveReply}>Lưu Phản Hồi</CButton>
            </CModalFooter>
        </div>
      </CModal>

      {/* MODAL BÁO CÁO */}
      <CModal visible={reportModal} onClose={() => setReportModal(false)} alignment="center">
        <div className="modal-green-content rounded">
            <CModalHeader><CModalTitle className="text-danger"><CIcon icon={cilWarning} className="me-2"/>Báo Cáo Vi Phạm</CModalTitle></CModalHeader>
            <CModalBody>
                <p>Bạn muốn báo cáo đánh giá này không phù hợp?</p>
                <CFormSelect className="form-select-green" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                    <option value="">-- Chọn lý do --</option>
                    <option value="spam">Spam / Quảng cáo</option>
                    <option value="rude">Ngôn từ thô tục</option>
                    <option value="fake">Đánh giá sai sự thật</option>
                </CFormSelect>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" onClick={() => setReportModal(false)}>Hủy</CButton>
                <CButton color="danger" onClick={handleConfirmReport}>Gửi Báo Cáo</CButton>
            </CModalFooter>
        </div>
      </CModal>
    </div>
  )
}

export default Reviews;