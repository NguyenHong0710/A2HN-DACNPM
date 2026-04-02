import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard, CCardBody, CCol, CRow, CSpinner, 
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CAvatar
} from '@coreui/react'
import { CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilBasket, cilDescription, cilMoney, cilStar, cilUser } from '@coreui/icons'
import { getAuthToken, getStoredUserRole } from '../../../user/utils/authStorage.js'
import { API_BASE as API_BASE_URL } from 'src/config';

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  // Khởi tạo stats theo đúng cấu trúc Backend trả về
  const [dataStats, setDataStats] = useState({ 
    total_gross: 0, 
    pending_count: 0, 
    net_revenue: 0 
  })
  const [chartData, setChartData] = useState(Array(12).fill(0))
  const [chartLabels, setChartLabels] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const authToken = getAuthToken();
    const role = getStoredUserRole();

    if (!authToken || role !== 'admin') {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setIsAuthenticated(true);
      fetchDashboardData(authToken);
    }
  }, [navigate]);

  const fetchDashboardData = async (authToken) => {
    try {
      // GỌI ĐÚNG ROUTE LARAVEL ĐÃ KHAI BÁO TRONG api.php
      const res = await fetch(`${API_BASE_URL}/admin/revenue?filter=Tháng`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      const result = await res.json()
      
      if (result.status === 'success') {
        setDataStats(result.stats)
        setChartData(result.chart_data) // Khớp với key 'chart_data' từ Controller
        setChartLabels(result.labels)
        setRecentOrders(result.orders)
      }
    } catch (err) { 
      console.error('Lỗi kết nối Dashboard:', err) 
    } finally { 
      setLoading(false) 
    }
  }

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)

  if (!isAuthenticated || loading) return <div className="d-flex justify-content-center py-5"><CSpinner color="primary" variant="grow" /></div>

  return (
    <div className="dashboard-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .stat-card { border: none; border-radius: 20px; color: white; transition: 0.3s; padding: 25px; }
        .card-p { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-o { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .card-r { background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); }
        .custom-table-card { border: none; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
      `}} />

      {/* 1. HÀNG WIDGETS - DÙNG DỮ LIỆU THẬT */}
      <CRow className="mb-4">
        <CCol sm={6} lg={4}>
          <CCard className="stat-card card-p mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="small fw-bold opacity-75 mb-1">DOANH THU TỔNG</p>
                <h2 className="fw-bold m-0" style={{fontSize: '1.4rem'}}>{formatCurrency(dataStats.total_gross)}</h2>
              </div>
              <CIcon icon={cilMoney} size="3xl" className="opacity-25" />
            </div>
          </CCard>
        </CCol>
        
        <CCol sm={6} lg={4}>
          <CCard className="stat-card card-o mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="small fw-bold opacity-75 mb-1">ĐƠN ĐANG CHỜ</p>
                <h2 className="fw-bold m-0">{dataStats.pending_count}</h2>
              </div>
              <CIcon icon={cilDescription} size="3xl" className="opacity-25" />
            </div>
          </CCard>
        </CCol>

        <CCol sm={12} lg={4}>
          <CCard className="stat-card card-r mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="small fw-bold opacity-75 mb-1">THỰC NHẬN (Sau phí)</p>
                <h2 className="fw-bold m-0" style={{fontSize: '1.4rem'}}>{formatCurrency(dataStats.net_revenue)}</h2>
              </div>
              <CIcon icon={cilBasket} size="3xl" className="opacity-25" />
            </div>
          </CCard>
        </CCol>
      </CRow>

      {/* 2. BIỂU ĐỒ DOANH THU */}
      <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
        <div className="px-4 pt-4 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold m-0">Biểu đồ tăng trưởng doanh thu</h5>
            <span className="badge bg-light text-dark">Dữ liệu thực tế</span>
        </div>

        <CCardBody className="p-0 d-flex align-items-end" style={{ minHeight: '320px' }}>
          <div className="w-100" style={{ height: '300px' }}>
            <CChartLine
              data={{
                labels: chartLabels,
                datasets: [{
                  label: 'Doanh thu',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  borderColor: '#667eea',
                  pointBackgroundColor: '#fff',
                  pointBorderColor: '#667eea',
                  data: chartData,
                  fill: true,
                  tension: 0.4
                }]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </CCardBody>
      </CCard>

      {/* 3. ĐƠN HÀNG MỚI NHẤT (THAY CHO TOP SẢN PHẨM MẪU) */}
      <CRow>
        <CCol lg={12}>
          <CCard className="custom-table-card mb-4 border-0 shadow-sm">
            <CCardBody className="p-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center">
                <CIcon icon={cilStar} className="me-2 text-warning" />
                Các đơn hàng vừa phát sinh
              </h5>
              <CTable hover responsive align="middle" className="mb-0 border-top">
                <CTableHead>
                  <CTableRow className="text-muted small">
                    <CTableHeaderCell className="border-0">ID</CTableHeaderCell>
                    <CTableHeaderCell className="border-0">KHÁCH HÀNG</CTableHeaderCell>
                    <CTableHeaderCell className="border-0">NGÀY ĐẶT</CTableHeaderCell>
                    <CTableHeaderCell className="border-0 text-center">TRẠNG THÁI</CTableHeaderCell>
                    <CTableHeaderCell className="border-0 text-end">TỔNG TIỀN</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {recentOrders.length > 0 ? recentOrders.map((order) => (
                    <CTableRow key={order.id}>
                      <CTableDataCell className="py-3">#{order.id}</CTableDataCell>
                      <CTableDataCell className="fw-bold">{order.customer}</CTableDataCell>
                      <CTableDataCell>{order.date}</CTableDataCell>
                      <CTableDataCell className="text-center">
                        <span className={`badge ${order.status === 'Đã hủy' ? 'bg-danger' : 'bg-success'} px-2`}>
                          {order.status}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell className="text-end fw-bold text-primary">
                        {formatCurrency(order.amount)}
                      </CTableDataCell>
                    </CTableRow>
                  )) : (
                    <CTableRow>
                      <CTableDataCell colSpan="5" className="text-center py-4 text-muted">
                        Chưa có dữ liệu đơn hàng
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default Dashboard