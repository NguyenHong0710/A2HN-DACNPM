import React, { useState, useEffect } from 'react'
import {
  CCard, CCardBody, CCol, CRow, CButton, CFormInput, CModal,
  CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormSelect, CFormLabel,
  CBadge, CFormSwitch, CFormCheck
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilPlus, cilPencil, cilTrash, cilGift, cilSearch, cilCalendar
} from '@coreui/icons'

// Cấu hình URL
const API_URL = 'http://127.0.0.1:8000/api/promotions';
const ADMIN_API = 'http://127.0.0.1:8000/api/admin';

const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
const admin_ID = storedUser.id || 1; 

const Promotions = () => {
  const [promotions, setPromotions] = useState([])
  const [adminProducts, setadminProducts] = useState([])
  const [membershipTiers, setMembershipTiers] = useState([]) 
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // --- STATE TÍNH NĂNG TẶNG VOUCHER ---
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [customers, setCustomers] = useState([])
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [selectedTierId, setSelectedTierId] = useState('') 
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [sendToAll, setSendToAll] = useState(false)

  const [formData, setFormData] = useState({
    code: '', name: '', type: 'percent', value: '', 
    scope: 'order', productId: '', 
    startDate: '', endDate: '', limit: 100,
    min_tier_id: 1 
  })

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); 
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    };
  };

  const fetchPromotions = async () => {
    try {
      const response = await fetch(`${API_URL}?admin_id=${admin_ID}`);
      const data = await response.json();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products?admin_id=${admin_ID}`);
      const data = await response.json();
      setadminProducts(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Lỗi tải sản phẩm:", error); }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${ADMIN_API}/users-for-assignment`);
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : (data.users || []));
    } catch (error) { console.error("Lỗi fetch khách hàng:", error); }
  }

  const fetchMembershipTiers = async () => {
    try {
      const response = await fetch(`${API_URL}/membership-tiers`);
      const data = await response.json();
      setMembershipTiers(data);
    } catch (error) { console.error("Lỗi fetch hạng:", error); }
  }

  useEffect(() => { 
    fetchPromotions(); 
    fetchProducts(); 
    fetchCustomers();
    fetchMembershipTiers();
  }, []);

  // --- LOGIC XỬ LÝ CHỌN LỰA TRONG MODAL TẶNG QUÀ ---

  // 1. Khi tick "Tặng cho toàn bộ"
  const handleToggleSendToAll = (checked) => {
    setSendToAll(checked);
    if (checked) {
      setSelectedTierId(''); 
      const allIds = customers.map(u => u.id);
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds([]);
    }
  }

  // 2. Khi chọn "Hạng thành viên" -> ĐÃ FIX: RESET DANH SÁCH CŨ TRƯỚC KHI CHỌN MỚI
  const handleSelectTier = (tierId) => {
    setSelectedTierId(tierId);
    setSendToAll(false);
    
    if (tierId !== '') {
      // Tìm tên hạng từ ID
      const selectedTier = membershipTiers.find(t => String(t.id) === String(tierId));
      if (selectedTier) {
        // Lọc danh sách người dùng thuộc hạng này
        const idsInTier = customers
          .filter(user => user.tier_name === selectedTier.name)
          .map(user => user.id);
        
        // Cập nhật lại mảng ID (Xóa sạch những ID cũ không thuộc hạng này)
        setSelectedUserIds(idsInTier);
      }
    } else {
      // Nếu chọn về mặc định "-- Chọn hạng --", reset mảng chọn
      setSelectedUserIds([]);
    }
  }

  // 3. Khi chọn cá nhân
  const handleToggleUser = (userId) => {
    setSendToAll(false); 
    setSelectedTierId(''); 
    
    const ids = selectedUserIds.includes(userId) 
                ? selectedUserIds.filter(id => id !== userId) 
                : [...selectedUserIds, userId];
    setSelectedUserIds(ids);
  }

  const openAssignModal = (item) => {
    setSelectedVoucher(item);
    setSelectedTierId('');
    setUserSearchTerm('');
    // Khi mở modal, lấy danh sách user đang có voucher này từ item (nếu có)
    if (item.users && item.users.length > 0) {
        setSelectedUserIds(item.users.map(u => u.id));
        setSendToAll(false);
    } else {
        setSelectedUserIds([]);
        setSendToAll(false);
    }
    setAssignModalVisible(true);
  }

  const handleAssignVoucher = async () => {
    if (!sendToAll && selectedUserIds.length === 0 && !selectedTierId) {
      return alert("Vui lòng chọn đối tượng tặng!");
    }
    
    try {
      const response = await fetch(`${ADMIN_API}/assign-voucher`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          promotion_id: selectedVoucher.id,
          user_ids: selectedUserIds,
          tier_id: selectedTierId || null, 
          send_to_all: sendToAll
        })
      });
      const result = await response.json();
      if (result.status === 'success' || response.ok) {
        alert("✅ Cập nhật danh sách tặng thành công!");
        setAssignModalVisible(false);
        fetchPromotions();
      } else {
        alert("Lỗi: " + (result.message || "Không thể tặng voucher"));
      }
    } catch (error) { alert("Lỗi khi kết nối server!"); }
  }

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus ? 0 : 1;
    try {
        const response = await fetch(`${API_URL}/toggle-status`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: id, status: newStatus })
        });
        if (response.ok) {
            setPromotions(promotions.map(p => p.id === id ? { ...p, status: newStatus } : p));
        }
    } catch (error) { console.error(error); }
  }

  const openModal = (item = null) => {
    if (item) {
        setEditingItem(item)
        setFormData({
            ...item,
            startDate: item.start_date || '', 
            endDate: item.end_date || '',
            limit: item.usage_limit || 100,
            productId: item.product_id || '',
            min_tier_id: item.min_tier_id || 1 
        })
    } else {
        setEditingItem(null)
        setFormData({
            code: '', name: '', type: 'percent', value: '', 
            scope: 'order', productId: '', 
            startDate: '', endDate: '', limit: 100,
            min_tier_id: 1
        })
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if(!formData.code || !formData.value) return alert("Thiếu thông tin!")
    const payload = { id: editingItem ? editingItem.id : null, ...formData, admin_id: admin_ID }
    try {
        const action = editingItem ? 'update' : 'store';
        const response = await fetch(`${API_URL}/${action}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if(response.ok) {
            alert(editingItem ? "✅ Cập nhật thành công!" : "✨ Tạo mới thành công!");
            fetchPromotions();
            setModalVisible(false);
        } else {
            alert("❌ Có lỗi xảy ra!");
        }
    } catch (error) { alert("Lỗi kết nối!"); }
  }

  const handleDelete = async (id) => {
    if(window.confirm('Xóa mã này?')) {
        try {
            await fetch(`${API_URL}/delete?id=${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            fetchPromotions();
        } catch (error) { console.error(error); }
    }
  }

  const filteredPromotions = promotions.filter(p => 
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="promotions-container p-4" style={{ backgroundColor: '#fcfcfd' }}>
      <style>{`
        .brand-bronze { background-color: #b1885f !important; color: white !important; border: none; }
        .text-bronze { color: #b1885f !important; }
        .btn-create-promo { background-color: #b1885f; border-color: #b1885f; color: white; border-radius: 12px; font-weight: 600; }
        .promo-search-bar { border-radius: 12px; border: 1px solid #ddd; padding-left: 45px; height: 48px; }
        .promo-search-icon { position: absolute; left: 16px; top: 14px; color: #aaa; }
        .voucher-grid-card { border: none; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.03); background: white; margin-bottom: 24px; transition: 0.3s; }
        .voucher-tag-code { background: #eef2ff; color: #4338ca; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-family: 'Monaco', monospace; }
        .voucher-grid-header { padding: 1.5rem 1.5rem 0.5rem; display: flex; justify-content: space-between; align-items: center; }
        .voucher-grid-body { padding: 0 1.5rem 1rem; }
        .voucher-name { font-weight: 700; font-size: 1.1rem; color: #1e1e1e; margin-bottom: 0.5rem; }
        .voucher-value { font-weight: 800; font-size: 1.2rem; color: #28a745; margin-bottom: 1rem;}
        .voucher-info-row { display: flex; justify-content: space-between; color: #666; font-size: 0.85rem; margin-bottom: 0.4rem; }
        .voucher-footer { padding: 1rem 1.5rem; border-top: 1px solid #f5f5f5; display: flex; justify-content: space-between; align-items: center; }
        .modal-compact .modal-content { border-radius: 18px; border: none; overflow: hidden; }
        .modal-compact .modal-body { padding: 1.25rem !important; }
        .modal-compact .form-label { font-size: 0.75rem; font-weight: 700; color: #777; text-transform: uppercase; margin-bottom: 4px; }
      `}</style>

      <div className="promo-page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Chiến dịch Ưu đãi</h2>
          <p className="text-muted">Quản lý mã giảm giá hệ thống Lumina Jewelry</p>
        </div>
        <div className="d-flex gap-3 align-items-center mt-3 mt-md-0">
          <div className="position-relative">
            <CIcon icon={cilSearch} className="promo-search-icon" size="xl" />
            <CFormInput 
              className="promo-search-bar shadow-sm" 
              placeholder="Tìm kiếm mã..." 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '280px' }}
            />
          </div>
          <CButton className="btn-create-promo px-4 h-100 fw-bold d-flex align-items-center shadow-sm" onClick={() => openModal()}>
            <CIcon icon={cilPlus} className="me-2"/> Tạo mới
          </CButton>
        </div>
      </div>

      <CRow>
        {filteredPromotions.map(item => (
          <CCol lg={6} xl={4} key={item.id}>
            <CCard className="voucher-grid-card shadow-sm border-0">
                <div className="voucher-grid-header">
                    <div className="voucher-tag-code">{item.code}</div>
                    <div className="d-flex align-items-center gap-2">
                        <CBadge color="light" variant="outline" className="text-dark border">
                             Hạng: {membershipTiers.find(t => t.id === item.min_tier_id)?.name || 'Mới'}
                        </CBadge>
                        <CFormSwitch 
                            checked={Number(item.status) === 1} 
                            onChange={() => toggleStatus(item.id, Number(item.status) === 1)} 
                        />
                    </div>
                </div>

                <div className="voucher-grid-body">
                    <div className="voucher-name">{item.name}</div>
                    <div className="voucher-value">
                        {item.type === 'percent' ? `Giảm ${item.value}%` : `Giảm ${Number(item.value).toLocaleString()}đ`}
                    </div>
                    <div className="voucher-info-row">
                        <span>Giới hạn sử dụng</span>
                        <span className="fw-bold text-dark">{item.usage_limit || 'Không giới hạn'}</span>
                    </div>
                    <div className="voucher-info-row">
                        <span>Đối tượng nhận</span>
                        <span className="fw-bold text-dark">{item.users?.length > 0 ? `${item.users.length} khách hàng` : 'Công khai'}</span>
                    </div>
                </div>

                <div className="voucher-footer">
                    <div className="voucher-date text-muted small">
                        <CIcon icon={cilCalendar} className="me-1"/>
                        {item.start_date} - {item.end_date}
                    </div>
                    <div className="d-flex gap-1">
                        <CButton color="light" size="sm" onClick={() => openAssignModal(item)}><CIcon icon={cilGift} className="text-bronze" /></CButton>
                        <CButton color="light" size="sm" onClick={() => openModal(item)}><CIcon icon={cilPencil} className="text-primary"/></CButton>
                        <CButton color="light" size="sm" onClick={() => handleDelete(item.id)}><CIcon icon={cilTrash} className="text-danger"/></CButton>
                    </div>
                </div>
            </CCard>
          </CCol>
        ))}
      </CRow>

      {/* Modal Chỉnh sửa */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} alignment="center" className="modal-compact">
        <CModalHeader className="brand-bronze py-2">
          <CModalTitle className="fs-6 fw-bold">
            {editingItem ? '🚀 Cập nhật mã ưu đãi' : '✨ Thiết lập mã mới'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CRow className="g-2">
            <CCol md={6}>
              <CFormLabel>Mã Voucher</CFormLabel>
              <CFormInput value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="VD: LUMINA10" />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Tên chương trình</CFormLabel>
              <CFormInput value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="VD: Ưu đãi hè" />
            </CCol>
            <CCol md={4}>
              <CFormLabel>Loại</CFormLabel>
              <CFormSelect value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="percent">%</option>
                <option value="fixed">Tiền mặt</option>
              </CFormSelect>
            </CCol>
            <CCol md={4}>
              <CFormLabel>Giá trị</CFormLabel>
              <CFormInput type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} />
            </CCol>
            <CCol md={4}>
              <CFormLabel>Hạng tối thiểu</CFormLabel>
              <CFormSelect value={formData.min_tier_id} onChange={(e) => setFormData({...formData, min_tier_id: e.target.value})}>
                {membershipTiers.map(tier => <option key={tier.id} value={tier.id}>{tier.name}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={12}>
              <CFormLabel>Phạm vi</CFormLabel>
              <CFormSelect value={formData.scope} onChange={(e) => setFormData({...formData, scope: e.target.value})}>
                <option value="order">Toàn đơn hàng</option>
                <option value="product">Sản phẩm cụ thể</option>
              </CFormSelect>
            </CCol>
            {formData.scope === 'product' && (
              <CCol md={12}>
                <CFormLabel>Chọn sản phẩm</CFormLabel>
                <CFormSelect value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})}>
                  <option value="">-- Danh sách sản phẩm --</option>
                  {adminProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </CFormSelect>
              </CCol>
            )}
            <CCol md={6}>
              <CFormLabel>Bắt đầu</CFormLabel>
              <CFormInput type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Kết thúc</CFormLabel>
              <CFormInput type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
            </CCol>
            <CCol md={12}>
              <CFormLabel>Giới hạn lượt dùng</CFormLabel>
              <CFormInput type="number" value={formData.limit} onChange={(e) => setFormData({...formData, limit: e.target.value})} />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter className="border-0 py-2">
          <CButton color="light" size="sm" className="rounded-pill px-3" onClick={() => setModalVisible(false)}>Đóng</CButton>
          <CButton className="brand-bronze rounded-pill px-4 fw-bold shadow-sm" size="sm" onClick={handleSave}>Lưu thông tin</CButton>
        </CModalFooter>
      </CModal>

      {/* Modal Gửi tặng */}
      <CModal visible={assignModalVisible} onClose={() => setAssignModalVisible(false)} alignment="center" className="modal-compact">
        <CModalHeader className="brand-bronze py-2">
          <CModalTitle className="fs-6 fw-bold">🎁 Gửi tặng: {selectedVoucher?.code}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className={`p-3 rounded-3 mb-3 border ${sendToAll ? 'bg-primary text-white border-primary shadow-sm' : 'bg-light'}`}>
            <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold small">Tặng cho toàn bộ khách hàng</span>
                <CFormSwitch 
                    checked={sendToAll} 
                    onChange={(e) => handleToggleSendToAll(e.target.checked)} 
                />
            </div>
          </div>

          <CFormLabel className="text-muted small fw-bold mt-2">HOẶC CHỌN THEO HẠNG THÀNH VIÊN</CFormLabel>
          <CFormSelect 
            className="mb-3 shadow-sm" 
            value={selectedTierId} 
            onChange={(e) => handleSelectTier(e.target.value)}
          >
              <option value="">-- Chọn hạng thành viên --</option>
              {membershipTiers.map(tier => <option key={tier.id} value={tier.id}>Tất cả thành viên {tier.name}</option>)}
          </CFormSelect>

          <CFormLabel className="text-muted small fw-bold">HOẶC CHỌN KHÁCH HÀNG CỤ THỂ</CFormLabel>
          <CFormInput 
            placeholder="Tìm theo tên hoặc email..." 
            className="mb-2 shadow-sm" 
            onChange={(e) => setUserSearchTerm(e.target.value)} 
          />
          <div className="border rounded-3 overflow-auto shadow-sm" style={{ maxHeight: '180px', backgroundColor: '#fff' }}>
            <table className="table table-sm mb-0 table-hover">
              <tbody className="small">
                {customers.filter(u => u.name?.toLowerCase().includes(userSearchTerm.toLowerCase())).map(user => (
                  <tr key={user.id} style={{ cursor: 'pointer' }}>
                    <td width="35" className="text-center align-middle">
                        <CFormCheck 
                            checked={selectedUserIds.includes(user.id)} 
                            onChange={() => handleToggleUser(user.id)} 
                        />
                    </td>
                    <td className="py-2" onClick={() => handleToggleUser(user.id)}>
                        {user.name} <span className="text-muted" style={{fontSize: '0.7rem'}}>({user.tier_name})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CModalBody>
        <CModalFooter className="border-0 py-2">
          <CButton color="light" size="sm" className="rounded-pill px-3" onClick={() => setAssignModalVisible(false)}>Hủy</CButton>
          <CButton className="brand-bronze rounded-pill px-4 fw-bold shadow-sm" size="sm" onClick={handleAssignVoucher}>Xác nhận tặng</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Promotions;