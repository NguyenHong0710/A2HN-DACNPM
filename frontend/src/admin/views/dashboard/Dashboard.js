import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard, CCardBody, CCol, CRow, CSpinner, 
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CFormSelect
} from '@coreui/react'
import { CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilBasket, cilDescription, cilMoney, cilStar, cilGraph } from '@coreui/icons'
import { getAuthToken, getStoredUserRole } from '../../../user/utils/authStorage.js'
import { API_BASE as API_BASE_URL } from 'src/config';

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const [dataStats, setDataStats] = useState({ total_gross: 0, pending_count: 0, net_revenue: 0 })
  const [chartData, setChartData] = useState([])
  const [chartLabels, setChartLabels] = useState([])
  const [recentOrders, setRecentOrders] = useState([])

  // State bộ lọc đồng bộ với Revenue (mặc định là 'Tháng')
  const [filterType, setFilterType] = useState('Tháng')

  useEffect(() => {
    const authToken = getAuthToken();
    const role = getStoredUserRole();

    if (!authToken || role !== 'admin') {
      const timer = setTimeout(() => navigate('/login', { replace: true }), 200);
      return () => clearTimeout(timer);
    } else {
      setIsAuthenticated(true);
      fetchDashboardData(authToken);
    }
  }, [navigate, filterType]);

  const fetchDashboardData = async (authToken) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/revenue?filter=${filterType}`, {
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
        setChartLabels(Array.isArray(result.labels) ? result.labels : Object.values(result.labels || {}));
        setChartData(Array.isArray(result.chart_data) ? result.chart_data : Object.values(result.chart_data || {}));
        setRecentOrders(result.orders || []);
      }
    } catch (err) { 
      console.error('Lỗi kết nối Dashboard:', err) 
    } finally { 
      setLoading(false) 
    }
  }

  /**
   * LOGIC XỬ LÝ DỮ LIỆU BIỂU ĐỒ - COPY TỪ TRANG REVENUE CỦA BẠN
   */
  const processedChartData = useMemo(() => {
    if (!chartLabels || chartLabels.length === 0) return { labels: [], values: [] };

    if (filterType === 'Ngày') {
      return { labels: chartLabels.slice(-1), values: chartData.slice(-1) };
    }

    if (filterType === 'Tuần') {
      const now = new Date();
      const dayOfWeek = now.getDay(); 
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const mondayString = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`;
      const mondayIdx = chartLabels.findIndex(label => label === mondayString);
      if (mondayIdx !== -1) {
        return { labels: chartLabels.slice(mondayIdx), values: chartData.slice(mondayIdx) };
      }
      return { labels: chartLabels.slice(-7), values: chartData.slice(-7) };
    }

    if (filterType === 'Tháng') {
      const firstDayIdx = chartLabels.findIndex(label => label.startsWith('01/'));
      if (firstDayIdx !== -1) {
        return { labels: chartLabels.slice(firstDayIdx), values: chartData.slice(firstDayIdx) };
      }
    }
    return { labels: chartLabels, values: chartData };
  }, [chartLabels, chartData, filterType]);

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)

  if (!isAuthenticated || loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <CSpinner color="primary" variant="grow" />
    </div>
  )

  return (
    <div className="dashboard-wrapper pb-5">
      <style dangerouslySetInnerHTML={{ __html: `
        .stat-card { border: none; border-radius: 20px; color: white; padding: 25px; }
        .card-p { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-o { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .card-r { background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); }
        .glass-card { border: none; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background: #fff; }
      `}} />

      {/* 1. HÀNG WIDGETS GRADIENT (GIỮ NGUYÊN STYLE DASHBOARD) */}
      <CRow className="mb-4">
        <CCol sm={6} lg={4}>
          <CCard className="stat-card card-p mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="small fw-bold opacity-75 mb-1 text-uppercase">Doanh thu tổng</p>
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
                <p className="small fw-bold opacity-75 mb-1 text-uppercase">Đơn đang chờ</p>
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
                <p className="small fw-bold opacity-75 mb-1 text-uppercase">Thực nhận (Sau phí)</p>
                <h2 className="fw-bold m-0" style={{fontSize: '1.4rem'}}>{formatCurrency(dataStats.net_revenue)}</h2>
              </div>
              <CIcon icon={cilBasket} size="3xl" className="opacity-25" />
            </div>
          </CCard>
        </CCol>
      </CRow>

      {/* 2. BIỂU ĐỒ - SỬA Y CHANG TRANG REVENUE CỦA BẠN */}
      <CCard className="glass-card mb-4 overflow-hidden">
        <div className="p-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold m-0"><CIcon icon={cilGraph} className="me-2 text-primary"/>Xu Hướng Doanh Thu</h5>
          <div style={{width: '180px'}}>
            <CFormSelect 
              size="sm" 
              className="border-0 bg-light fw-bold" 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
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
              labels: processedChartData.labels,
              datasets: [{
                label: 'Doanh thu',
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                borderColor: '#4e73df',
                data: processedChartData.values,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#4e73df',
                pointBorderWidth: 2,
                pointRadius: 4,
              }]
            }}
            options={{ 
              maintainAspectRatio: false, 
              plugins: { legend: { display: false } },
              layout: { padding: { right: 40 } },
              scales: {
                x: { grid: { display: false } },
                y: { 
                    beginAtZero: true,
                    grid: { color: '#f1f1f1' },
                    ticks: { callback: (v) => v.toLocaleString() } 
                }
              }
            }}
          />
        </CCardBody>
      </CCard>

      {/* 3. BẢNG ĐƠN HÀNG VỪA PHÁT SINH */}
      <CCard className="glass-card border-0">
        <CCardBody className="p-4">
          <h5 className="fw-bold mb-4 d-flex align-items-center">
            <CIcon icon={cilStar} className="me-2 text-warning" />
            Các đơn hàng vừa phát sinh
          </h5>
          <CTable hover responsive align="middle" className="mb-0 border-top">
            <CTableHead>
              <CTableRow className="text-muted small text-uppercase">
                <CTableHeaderCell className="border-0">ID</CTableHeaderCell>
                <CTableHeaderCell className="border-0">KHÁCH HÀNG</CTableHeaderCell>
                <CTableHeaderCell className="border-0">NGÀY ĐẶT</CTableHeaderCell>
                <CTableHeaderCell className="border-0 text-center">TRẠNG THÁI</CTableHeaderCell>
                <CTableHeaderCell className="border-0 text-end">TỔNG TIỀN</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {recentOrders.map((order) => (
                <CTableRow key={order.id}>
                  <CTableDataCell className="py-3 fw-bold">#{order.id}</CTableDataCell>
                  <CTableDataCell>{order.customer}</CTableDataCell>
                  <CTableDataCell>{order.date}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <span className={`badge ${order.status === 'Đã hủy' ? 'bg-danger' : 'bg-success'} px-3 py-2 rounded-pill`}>
                      {order.status}
                    </span>
                  </CTableDataCell>
                  <CTableDataCell className="text-end fw-bold text-primary">
                    {formatCurrency(order.amount)}
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default Dashboard