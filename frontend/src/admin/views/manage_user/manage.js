import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Eye, Edit2, Trash2, X, Search, UserCog, ShieldAlert, 
  Mail, Phone, User, CheckCircle2, Loader2, KeyRound, 
  ShieldCheck, Users, UserPlus, Filter, MoreHorizontal
} from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:8000/api"; 

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customer'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState({ type: null, user: null });
  const [editData, setEditData] = useState({});

  // --- LOGIC GIỮ NGUYÊN ---
  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token'); 
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const config = getHeaders();
      const response = await axios.get(`${API_BASE_URL}/users`, {
        ...config,
        params: { role: activeTab, search: searchTerm }
      });
      const data = response.data;
      const finalUsers = Array.isArray(data) ? data : (data.users || data.data || []);
      setUsers(finalUsers);
    } catch (error) {
      console.error("Lỗi API:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, getHeaders]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const closeModal = () => { setModal({ type: null, user: null }); setEditData({}); };
  const openModal = (type, user) => {
    setModal({ type, user });
    setEditData({ ...user, password: '', password_confirmation: '', role: user.role || 'customer' }); 
  };

  const handleAction = async () => {
    if (!modal.user) return;
    const userId = modal.user.id; 
    const config = getHeaders();
    try {
      if (modal.type === 'edit') {
        await axios.put(`${API_BASE_URL}/users/${userId}`, {
          name: editData.name, email: editData.email, phone: editData.phone
        }, config);
      } else if (modal.type === 'password') {
        await axios.put(`${API_BASE_URL}/users/${userId}/change-password`, {
          password: editData.password, password_confirmation: editData.password_confirmation
        }, config);
      } else if (modal.type === 'role') {
        await axios.put(`${API_BASE_URL}/users/${userId}/change-role`, { role: editData.role }, config);
      } else if (modal.type === 'delete') {
        await axios.delete(`${API_BASE_URL}/users/${userId}`, config);
      }
      alert("Thành công!");
      closeModal();
      fetchUsers(); 
    } catch (error) {
      alert("Thất bại: " + (error.response?.data?.message || "Lỗi hệ thống"));
    }
  };

  // --- UI RENDER ---
  return (
    <div className="new-admin-ui">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .new-admin-ui { 
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f8fafc;
          padding: 40px;
          min-height: 100vh;
          color: #0f172a;
        }

        /* Stats Cards */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 24px; border-radius: 24px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 16px; }
        .icon-box { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }

        /* Custom Table */
        .main-card { background: white; border-radius: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 25px rgba(0,0,0,0.03); overflow: hidden; }
        .card-header { padding: 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
        
        .search-container { position: relative; width: 400px; }
        .search-container input { width: 100%; padding: 14px 20px 14px 48px; border-radius: 16px; border: 1px solid #e2e8f0; background: #f8fafc; outline: none; transition: 0.3s; }
        .search-container input:focus { border-color: #6366f1; background: white; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        .search-container svg { position: absolute; left: 16px; top: 15px; color: #94a3b8; }

        .tabs-nav { display: flex; background: #f1f5f9; padding: 6px; border-radius: 14px; gap: 4px; }
        .tabs-nav button { padding: 8px 20px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; color: #64748b; background: transparent; }
        .tabs-nav button.active { background: white; color: #6366f1; shadow: 0 2px 4px rgba(0,0,0,0.05); }

        table { width: 100%; border-collapse: collapse; }
        th { padding: 20px 30px; text-align: left; background: #f8fafc; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        td { padding: 20px 30px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
        tr:hover { background: #fcfdff; }

        /* Fix Cột Trạng Thái */
        .status-badge { 
          display: inline-flex; align-items: center; gap: 6px; 
          padding: 6px 12px; border-radius: 10px; 
          font-size: 12px; font-weight: 700;
          background: #dcfce7; color: #15803d; /* Xanh lá đậm trên nền nhạt */
        }

        .user-info { display: flex; align-items: center; gap: 14px; }
        .user-avatar { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        
        .action-btns { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-tool { width: 38px; height: 38px; border-radius: 12px; border: 1px solid #f1f5f9; background: white; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s; }
        .btn-tool:hover { background: #f8fafc; border-color: #6366f1; color: #6366f1; transform: translateY(-2px); }
        .btn-tool.del:hover { background: #fff1f2; border-color: #f43f5e; color: #f43f5e; }

        /* Modal Modern */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .modal-box { background: white; width: 500px; border-radius: 30px; padding: 35px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.25); position: relative; }
        .input-field { margin-bottom: 20px; }
        .input-field label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #475569; }
        .input-field input { width: 100%; padding: 14px; border-radius: 14px; border: 1px solid #e2e8f0; outline: none; box-sizing: border-box; }
        .input-field input:focus { border-color: #6366f1; }

        .btn-confirm { width: 100%; padding: 16px; border-radius: 16px; border: none; background: #6366f1; color: white; font-weight: 700; cursor: pointer; margin-top: 10px; }
      `}} />

      {/* Header & Stats */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Quản lý người dùng</h1>
        <p style={{ color: '#64748b', marginTop: '8px' }}>Giám sát và điều chỉnh quyền truy cập hệ thống Lumina</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon-box" style={{ background: '#e0e7ff', color: '#6366f1' }}><Users /></div>
          <div><div style={{ fontSize: '14px', color: '#64748b' }}>Tổng thành viên</div><div style={{ fontSize: '24px', fontWeight: 800 }}>{users.length}</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-box" style={{ background: '#dcfce7', color: '#22c55e' }}><CheckCircle2 /></div>
          <div><div style={{ fontSize: '14px', color: '#64748b' }}>Đang hoạt động</div><div style={{ fontSize: '24px', fontWeight: 800 }}>{users.length}</div></div>
        </div>
        <div className="stat-card">
          <div className="icon-box" style={{ background: '#fef3c7', color: '#f59e0b' }}><ShieldCheck /></div>
          <div><div style={{ fontSize: '14px', color: '#64748b' }}>Cấp độ quản trị</div><div style={{ fontSize: '24px', fontWeight: 800 }}>{activeTab === 'admin' ? users.length : '1'}</div></div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="main-card">
        <div className="card-header">
          <div className="tabs-nav">
            <button className={activeTab === 'customer' ? 'active' : ''} onClick={() => setActiveTab('customer')}>Khách hàng</button>
            <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => setActiveTab('admin')}>Quản trị viên</button>
          </div>
          
          <div className="search-container">
            <Search size={20} />
            <input 
              placeholder="Tìm kiếm theo tên hoặc email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Liên hệ</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="#6366f1" style={{ margin: '0 auto' }} /></td></tr>
            ) : users.length > 0 ? (
              users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">{u.name?.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.email}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{u.phone && u.phone !== '1' ? u.phone : 'Chưa có SĐT'}</div>
                  </td>
                  <td>
                    <div className="status-badge">
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
                      HOẠT ĐỘNG
                    </div>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-tool" onClick={() => openModal('view', u)}><Eye size={16}/></button>
                      <button className="btn-tool" onClick={() => openModal('edit', u)}><Edit2 size={16}/></button>
                      <button className="btn-tool" style={{color: '#f59e0b'}} onClick={() => openModal('password', u)}><KeyRound size={16}/></button>
                      <button className="btn-tool" style={{color: '#6366f1'}} onClick={() => openModal('role', u)}><UserCog size={16}/></button>
                      <button className="btn-tool del" onClick={() => openModal('delete', u)}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>Dữ liệu trống</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Modal */}
      {modal.type && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} style={{ position: 'absolute', right: '25px', top: '25px', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X /></button>
            
            <h2 style={{ marginTop: 0, marginBottom: '25px', fontSize: '22px', fontWeight: 800 }}>
              {modal.type === 'edit' ? 'Cập nhật thông tin' : modal.type === 'password' ? 'Đổi mật khẩu' : modal.type === 'delete' ? 'Xác nhận xóa' : 'Chi tiết người dùng'}
            </h2>

            {modal.type === 'edit' && (
              <>
                <div className="input-field">
                  <label>HỌ VÀ TÊN</label>
                  <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                </div>
                <div className="input-field">
                  <label>EMAIL</label>
                  <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                </div>
                <button className="btn-confirm" onClick={handleAction}>Cập nhật ngay</button>
              </>
            )}

            {modal.type === 'password' && (
              <>
                <div className="input-field">
                  <label>MẬT KHẨU MỚI</label>
                  <input type="password" onChange={e => setEditData({...editData, password: e.target.value})} placeholder="Ít nhất 8 ký tự..." />
                </div>
                <button className="btn-confirm" style={{ background: '#f59e0b' }} onClick={handleAction}>Thay đổi mật khẩu</button>
              </>
            )}

            {modal.type === 'delete' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: '#fff1f2', color: '#f43f5e', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
                  Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa tài khoản này?
                </div>
                <button className="btn-confirm" style={{ background: '#f43f5e' }} onClick={handleAction}>Vâng, Xóa tài khoản</button>
              </div>
            )}

            {modal.type === 'view' && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px' }}>
                <p><strong>ID:</strong> {modal.user.id}</p>
                <p><strong>Họ tên:</strong> {modal.user.name}</p>
                <p><strong>Email:</strong> {modal.user.email}</p>
                <p><strong>Vai trò:</strong> {modal.user.role}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser;