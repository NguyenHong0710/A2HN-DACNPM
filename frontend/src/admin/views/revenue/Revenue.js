import React, { useState, useEffect } from 'react'
import {
  CCard, CCardBody, CCol, CRow, CTable, CTableBody, CTableHead, CTableHeaderCell, CTableRow, CTableDataCell,
  CButton, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormSelect, CFormInput, CFormLabel, CSpinner, CAvatar
} from '@coreui/react'
import { CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import {
  cilMoney, cilCart, cilGraph, cilList, cilStorage, cilPlus, cilArrowTop
} from '@coreui/icons'
import { getAuthToken } from '../../../user/utils/authStorage.js' // Đảm bảo đường dẫn này đúng
import { API_BASE as API_BASE_URL } from 'src/config';

const Revenue = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ net_revenue: 0, platform_fee: 0, pending_count: 0 });
  const [chartData, setChartData] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [detailModal, setDetailModal] = useState(false)
  const [inventoryModal, setInventoryModal] = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [filterType, setFilterType] = useState('Tháng')
  const [importData, setImportData] = useState({ productId: '', quantity: '' })

  useEffect(() => {
    fetchAllData();
  }, [filterType]);

  const fetchAllData = async () => {
    const token = getAuthToken();
    try {
        setLoading(true);
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        const [revenueRes, inventoryRes, topProdRes] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/revenue?filter=${filterType}`, { headers }),
            fetch(`${API_BASE_URL}/admin/inventory`, { headers }),
            fetch(`${API_BASE_URL}/admin/top-products`, { headers }),
        ]);

        const revenueData = await revenueRes.json();
        const inventoryData = await inventoryRes.json();
        const topProdData = await topProdRes.json();

        if (revenueData.status === 'success') {
            setInvoices(revenueData.orders || []); 
            setStats(revenueData.stats);
            setChartData(revenueData.chart_data);
            setChartLabels(revenueData.labels);
        }
        if (inventoryData.status === 'success') setInventory(inventoryData.data);
        if (topProdData.status === 'success') setTopProducts(topProdData.data);
    } catch (error) { 
        console.error("Lỗi fetch dữ liệu Revenue:", error); 
    } finally { 
        setLoading(false); 
    }
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0)

  const getStockStatus = (stock) => {
      const s = parseInt(stock);
      if (s === 0) return { label: 'Hết hàng', color: 'danger', bg: '#fff5f5' };
      if (s <= 10) return { label: 'Sắp hết', color: 'warning', bg: '#fffbeb' };
      return { label: 'Còn hàng', color: 'success', bg: '#f0fff4' };
  }

  const handleImportStock = async () => {
    const token = getAuthToken();
    if (!importData.productId || !importData.quantity) return alert("Vui lòng điền đủ thông tin!");
    
    try {
        const res = await fetch(`${API_BASE_URL}/admin/update-stock`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              product_id: parseInt(importData.productId),
              quantity_added: parseInt(importData.quantity)
            })
        });

        const result = await res.json();
        if (result.status === 'success') {
            alert('Cập nhật kho thành công!');
            setImportModal(false);
            setImportData({ productId: '', quantity: '' });
            fetchAllData(); 
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (err) {
        alert('Lỗi kết nối server!');
    }
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{height: '80vh'}}><CSpinner color="primary" variant="grow"/></div>;

  return (
    <div className="revenue-container pb-5">
      <style>{`
        .glass-card { border: none; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: 0.3s; background: #fff; }
        .glass-card:hover { transform: translateY(-5px); }
        .stat-icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .table-custom thead th { background: #f8fafc; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border: none; padding: 15px; }
        .table-custom td { padding: 15px; vertical-align: middle; border-top: 1px solid #f1f5f9; font-size: 14px; }
        .badge-soft { padding: 6px 12px; border-radius: 10px; font-weight: 700; font-size: 11px; }
      `}</style>

      {/* --- WIDGETS --- */}
      <CRow className="mb-4">
        <CCol sm={6} lg={4}>
          <CCard className="glass-card mb-4 p-4 border-start border-primary border-5">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="small fw-bold text-uppercase text-muted mb-1">Thực Nhận (Sau phí)</div>
                <h3 className="fw-bold mb-0 text-dark">{formatCurrency(stats.net_revenue)}</h3>
              </div>
              <div className="stat-icon-box bg-light"><CIcon icon={cilMoney} className="text-primary" size="xl" /></div>
            </div>
          </CCard>
        </CCol>
        <CCol sm={6} lg={4}>
          <CCard className="glass-card mb-4 p-4 border-start border-info border-5">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="small fw-bold text-uppercase text-muted mb-1">Phí Nền Tảng (8%)</div>
                <h3 className="fw-bold mb-0 text-dark">{formatCurrency(stats.platform_fee)}</h3>
              </div>
              <div className="stat-icon-box bg-light"><CIcon icon={cilGraph} className="text-info" size="xl" /></div>
            </div>
          </CCard>
        </CCol>
        <CCol sm={12} lg={4}>
          <CCard className="glass-card mb-4 p-4 border-start border-warning border-5">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="small fw-bold text-uppercase text-muted mb-1">Chờ Thanh Toán</div>
                <h3 className="fw-bold mb-0 text-dark">{stats.pending_count} Đơn hàng</h3>
              </div>
              <div className="stat-icon-box bg-light"><CIcon icon={cilCart} className="text-warning" size="xl" /></div>
            </div>
          </CCard>
        </CCol>
      </CRow>

      {/* --- BIỂU ĐỒ & TOP SẢN PHẨM --- */}
      <CRow className="mb-4">
        <CCol lg={8} className="mb-4">
          <CCard className="glass-card h-100 overflow-hidden">
            <div className="p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold m-0"><CIcon icon={cilGraph} className="me-2 text-primary"/>Xu Hướng Doanh Thu</h5>
              <div style={{width: '180px'}}>
                <CFormSelect size="sm" className="border-0 bg-light fw-bold" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="Ngày">Hôm nay</option>
                  <option value="Tuần">Tuần này</option>
                  <option value="Tháng">Tháng này</option>
                  <option value="Năm">Năm nay</option>
                </CFormSelect>
              </div>
            </div>
            <CCardBody>
              <CChartLine
                style={{ height: '300px' }}
                data={{
                  labels: chartLabels,
                  datasets: [{
                    label: 'Doanh thu',
                    backgroundColor: 'rgba(78, 115, 223, 0.05)',
                    borderColor: '#4e73df',
                    data: chartData,
                    tension: 0.4,
                    fill: true
                  }]
                }}
                options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
              />
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4} className="mb-4">
          <CCard className="glass-card h-100">
            <div className="p-4 border-bottom">
              <h5 className="fw-bold m-0"><CIcon icon={cilArrowTop} className="me-2 text-success"/>Bán Chạy Nhất</h5>
            </div>
            <CCardBody className="p-0 overflow-auto" style={{maxHeight: '340px'}}>
               <CTable hover className="table-custom mb-0">
                  <CTableBody>
                    {topProducts.map((prod, idx) => (
                      <CTableRow key={idx}>
                        <CTableDataCell className="ps-4">
                          <CAvatar color="primary" textColor="white" size="sm">{idx + 1}</CAvatar>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-bold">{prod.name}</div>
                          <div className="small text-muted">Bán: {prod.total_sold}</div>
                        </CTableDataCell>
                        <CTableDataCell className="text-end pe-4">
                          <span className="fw-bold text-primary">{formatCurrency(prod.total_revenue)}</span>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
               </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* --- TÌNH TRẠNG KHO --- */}
      <CCard className="glass-card mb-4">
        <div className="p-4 d-flex justify-content-between align-items-center border-bottom">
          <h5 className="fw-bold m-0"><CIcon icon={cilStorage} className="me-2 text-info"/>Tình Trạng Kho Hàng</h5>
          <CButton color="primary" size="sm" className="rounded-pill px-3" onClick={() => setImportModal(true)}>
            <CIcon icon={cilPlus} className="me-1"/> Nhập Hàng
          </CButton>
        </div>
        <CCardBody className="p-0">
          <CTable hover responsive className="table-custom mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="ps-4">ID</CTableHeaderCell>
                <CTableHeaderCell>Tên Sản Phẩm</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Tồn Kho</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Trạng Thái</CTableHeaderCell>
                <CTableHeaderCell className="text-end pe-4">Thao Tác</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {inventory.map((item) => {
                const status = getStockStatus(item.stock);
                return (
                  <CTableRow key={item.id}>
                    <CTableDataCell className="ps-4 text-muted">#{item.id}</CTableDataCell>
                    <CTableDataCell className="fw-bold">{item.name}</CTableDataCell>
                    <CTableDataCell className="text-center fw-bold">{item.stock}</CTableDataCell>
                    <CTableDataCell className="text-center">
                      <span className={`badge-soft text-${status.color}`} style={{backgroundColor: status.bg}}>{status.label}</span>
                    </CTableDataCell>
                    <CTableDataCell className="text-end pe-4">
                      <CButton color="link" size="sm" onClick={() => { setSelectedInventoryItem(item); setInventoryModal(true); }}>Chi tiết</CButton>
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* --- GIAO DỊCH GẦN ĐÂY --- */}
      <CCard className="glass-card mb-4">
        <div className="p-4 border-bottom bg-white">
          <h5 className="fw-bold m-0"><CIcon icon={cilList} className="me-2 text-primary"/>Giao Dịch Đã Hoàn Thành</h5>
        </div>
        <CCardBody className="p-0">
          <CTable hover responsive className="table-custom mb-0">
            <CTableHead><CTableRow>
                <CTableHeaderCell className="ps-4">Mã Đơn</CTableHeaderCell>
                <CTableHeaderCell>Thời Gian</CTableHeaderCell>
                <CTableHeaderCell>Tổng Tiền</CTableHeaderCell>
                <CTableHeaderCell>Thực Nhận (92%)</CTableHeaderCell>
                <CTableHeaderCell className="text-end pe-4">Chi Tiết</CTableHeaderCell>
            </CTableRow></CTableHead>
            <CTableBody>
              {invoices.map((item) => (
                <CTableRow key={item.id}>
                  <CTableDataCell className="ps-4 fw-bold text-primary">#{item.id}</CTableDataCell>
                  <CTableDataCell>{item.date}</CTableDataCell>
                  <CTableDataCell>{formatCurrency(item.amount)}</CTableDataCell>
                  <CTableDataCell className="fw-bold text-success">{formatCurrency(item.amount * 0.92)}</CTableDataCell>
                  <CTableDataCell className="text-end pe-4">
                    <CButton color="info" variant="outline" size="sm" className="rounded-pill" onClick={() => { setSelectedInvoice(item); setDetailModal(true); }}>
                      Dòng tiền
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* MODAL CHI TIẾT DÒNG TIỀN */}
      <CModal visible={detailModal} onClose={() => setDetailModal(false)} size="lg">
        <CModalHeader closeButton><CModalTitle>Phân Tích Dòng Tiền Đơn #{selectedInvoice?.id}</CModalTitle></CModalHeader>
        <CModalBody>
          {selectedInvoice && (
            <div className="bg-light p-4 rounded-4">
              <div className="text-center mb-4">
                <h4 className="fw-bold">LUMINA JEWELRY</h4>
                <div className="small text-muted">Ngày giao dịch: {selectedInvoice.date}</div>
              </div>
              <div className="border-bottom mb-3 pb-3">
                <div className="fw-bold mb-2">Thông tin thanh toán:</div>
                <div className="d-flex justify-content-between small mb-1">
                  <span>Tổng giá trị đơn hàng:</span>
                  <span>{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="d-flex justify-content-between small text-danger">
                  <span>Phí sàn áp dụng (8%):</span>
                  <span>-{formatCurrency(selectedInvoice.amount * 0.08)}</span>
                </div>
              </div>
              <div className="p-3 bg-white border rounded mt-3 d-flex justify-content-between align-items-center">
                <span className="fw-bold">Số dư thực cộng vào ví:</span>
                <span className="fw-bold text-success fs-4">{formatCurrency(selectedInvoice.amount * 0.92)}</span>
              </div>
              <div className="mt-4 small text-muted text-center italic">
                * Tiền đã được cộng vào số dư khả dụng sau khi đơn hàng hoàn tất.
              </div>
            </div>
          )}
        </CModalBody>
      </CModal>

      {/* MODAL NHẬP HÀNG */}
      <CModal visible={importModal} onClose={() => setImportModal(false)}>
        <CModalHeader closeButton><CModalTitle>Phiếu Nhập Kho Nhanh</CModalTitle></CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>Chọn Sản Phẩm</CFormLabel>
            <CFormSelect 
              value={importData.productId} 
              onChange={(e) => setImportData({...importData, productId: e.target.value})}
            >
              <option value="">-- Chọn sản phẩm cần nhập --</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>{item.name} (Hiện có: {item.stock})</option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel>Số Lượng Nhập Thêm</CFormLabel>
            <CFormInput 
              type="number" 
              placeholder="Ví dụ: 50" 
              value={importData.quantity}
              onChange={(e) => setImportData({...importData, quantity: e.target.value})}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setImportModal(false)}>Hủy</CButton>
          <CButton color="primary" onClick={handleImportStock}>Xác nhận nhập kho</CButton>
        </CModalFooter>
      </CModal>
      
    </div>
  )
}

export default Revenue