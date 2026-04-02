import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Eye, Edit2, Lock, Trash2, X, Search, UserCog, ShieldAlert, 
  Mail, Phone, User, CheckCircle2, Loader2, KeyRound, ShieldCheck
} from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:8000/api"; 

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customer'); // customer hoặc admin
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState({ type: null, user: null });
  const [editData, setEditData] = useState({});

  // 1. Hàm lấy Token và cấu hình Header (Sửa lỗi 401)
  const getHeaders = useCallback(() => {
    // Thử lấy token từ cả 2 key phổ biến
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token'); 
    
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
  }, []);

  // 2. Lấy danh sách thành viên
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const config = getHeaders();
      
      // Kiểm tra nếu không có token thì báo lỗi ngay thay vì gọi API để bị 401
      if (!config.headers.Authorization.split(' ')[1]) {
          console.error("No token found");
          setLoading(false);
          return;
      }

      const response = await axios.get(`${API_BASE_URL}/users`, {
        ...config,
        params: { 
          role: activeTab, // Gửi tab hiện tại (customer/admin) về server lọc
          search: searchTerm 
        }
      });

      // Xử lý dữ liệu trả về linh hoạt theo cấu trúc Laravel/Node
      const data = response.data;
      const finalUsers = Array.isArray(data) ? data : (data.users || data.data || []);
      setUsers(finalUsers);

    } catch (error) {
      console.error("Lỗi API:", error);
      if (error.response?.status === 401) {
          alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, getHeaders]);

  useEffect(() => { 
    fetchUsers(); 
  }, [fetchUsers]);

  // 3. Xử lý Modal
  const closeModal = () => { 
    setModal({ type: null, user: null }); 
    setEditData({}); 
  };

  const openModal = (type, user) => {
    setModal({ type, user });
    setEditData({ 
      ...user, 
      password: '', 
      password_confirmation: '', 
      role: user.role || 'customer' 
    }); 
  };

  // 4. Xử lý các hành động (Edit, Change Pass, Change Role, Delete)
  const handleAction = async () => {
    if (!modal.user) return;
    const userId = modal.user.id; 
    const config = getHeaders();

    try {
      if (modal.type === 'edit') {
        await axios.put(`${API_BASE_URL}/users/${userId}`, {
          name: editData.name, 
          email: editData.email, 
          phone: editData.phone
        }, config);
      } 
      else if (modal.type === 'password') {
        await axios.put(`${API_BASE_URL}/users/${userId}/change-password`, {
          password: editData.password,
          password_confirmation: editData.password_confirmation
        }, config);
      }
      else if (modal.type === 'role') {
        await axios.put(`${API_BASE_URL}/users/${userId}/change-role`, {
          role: editData.role
        }, config);
      }
      else if (modal.type === 'delete') {
        await axios.delete(`${API_BASE_URL}/users/${userId}`, config);
      }

      alert("Thao tác thành công!");
      closeModal();
      fetchUsers(); // Tải lại danh sách mới
    } catch (error) {
      const errMsg = error.response?.data?.message || "Lỗi thao tác hệ thống!";
      alert("Thất bại: " + errMsg);
    }
  };

  const renderModalContent = () => {
    const { type, user } = modal;
    if (!user) return null;

    switch (type) {
      case 'edit':
        return (
          <div className="modal-form">
            <div className="input-group">
              <label><User size={16}/> Họ và tên</label>
              <input type="text" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label><Mail size={16}/> Email</label>
              <input type="email" value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})} />
            </div>
            <div className="input-group">
              <label><Phone size={16}/> Số điện thoại</label>
              <input type="text" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} />
            </div>
          </div>
        );
      case 'password':
        return (
          <div className="modal-form">
            <div className="warning-box" style={{background: '#fff7ed', color: '#c2410c', padding: '12px', borderRadius: '12px', marginBottom: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <ShieldAlert size={18}/> Bảo mật: Mật khẩu ít nhất 8 ký tự
            </div>
            <div className="input-group">
              <label><Lock size={16}/> Mật khẩu mới</label>
              <input type="password" placeholder="••••••••" onChange={e => setEditData({...editData, password: e.target.value})} />
            </div>
            <div className="input-group">
              <label><CheckCircle2 size={16}/> Xác nhận lại mật khẩu</label>
              <input type="password" placeholder="••••••••" onChange={e => setEditData({...editData, password_confirmation: e.target.value})} />
            </div>
          </div>
        );
      case 'role':
        return (
          <div className="modal-form role-selector">
             <p style={{fontSize: '14px', color: '#64748b', marginBottom: '15px'}}>Chọn quyền hạn mới cho <b>{user.name}</b>:</p>
             <div className="role-options">
                <label className={editData.role === 'customer' ? 'active' : ''}>
                  <input type="radio" name="role" value="customer" checked={editData.role === 'customer'} onChange={e => setEditData({...editData, role: e.target.value})} />
                  <User size={20}/> Khách hàng
                </label>
                <label className={editData.role === 'admin' ? 'active' : ''}>
                  <input type="radio" name="role" value="admin" checked={editData.role === 'admin'} onChange={e => setEditData({...editData, role: e.target.value})} />
                  <ShieldCheck size={20}/> Quản trị viên
                </label>
             </div>
          </div>
        );
      case 'delete':
        return (
          <div className="delete-confirm" style={{textAlign: 'center', padding: '10px 0'}}>
             <div className="danger-icon" style={{color: '#ef4444', marginBottom: '15px'}}><Trash2 size={48} style={{margin: '0 auto'}}/></div>
             <h3 style={{fontSize: '18px', fontWeight: 800, color: '#1e293b'}}>Xác nhận xóa tài khoản?</h3>
             <p style={{color: '#64748b', fontSize: '14px', marginTop: '8px'}}>Dữ liệu của <b>{user.name}</b> sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
          </div>
        );
      default:
        return (
          <div className="view-details" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div className="detail-item"><span>Email:</span> <strong>{user.email}</strong></div>
            <div className="detail-item"><span>SĐT:</span> <strong>{user.phone || 'Chưa cập nhật'}</strong></div>
            <div className="detail-item"><span>Quyền hạn:</span> <b style={{background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontSize: '12px'}}>{user.role}</b></div>
            <div className="detail-item"><span>ID Hệ thống:</span> <code>{user.id}</code></div>
          </div>
        );
    }
  };

  return (
    <div className="admin-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { padding: 30px; background: #f0f2f5; min-height: 100vh; font-family: 'Inter', sans-serif; color: #1a1f36; }
        .header-section { margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .header-section h1 { font-size: 28px; font-weight: 800; margin: 0; color: #1e293b; letter-spacing: -0.5px; }
        
        .glass-toolbar { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); padding: 15px; border-radius: 20px; display: flex; justify-content: space-between; margin-bottom: 25px; border: 1px solid #fff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .tab-buttons { display: flex; gap: 8px; }
        .tab-buttons button { padding: 10px 24px; border: none; background: transparent; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; color: #64748b; }
        .tab-buttons button.active { background: #4f46e5; color: white; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
        
        .search-wrapper { position: relative; }
        .search-wrapper input { padding: 10px 15px 10px 40px; border-radius: 12px; border: 1px solid #e2e8f0; width: 320px; outline: none; transition: 0.3s; background: #fff; }
        .search-wrapper input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .search-wrapper svg { position: absolute; left: 12px; top: 11px; color: #94a3b8; }

        .table-container { background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8fafc; padding: 18px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 1px solid #f1f5f9; }
        td { padding: 18px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        tr:hover { background: #f8fafc; }

        .avatar-circle { width: 40px; height: 40px; border-radius: 12px; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
        .badge { padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #dcfce7; color: #166534; }
        
        .actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-icon { width: 36px; height: 36px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; background: #f1f5f9; color: #475569; }
        .btn-icon:hover { transform: translateY(-2px); background: #e2e8f0; color: #1e293b; }
        .btn-icon.delete:hover { background: #fee2e2; color: #dc2626; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-card { background: white; width: 480px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; }
        .modal-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
        .modal-body { padding: 24px; }
        .modal-footer { padding: 20px 24px; background: #f8fafc; display: flex; gap: 12px; justify-content: flex-end; }
        
        .input-group { margin-bottom: 18px; }
        .input-group label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #475569; }
        .input-group input { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; outline: none; transition: 0.2s; }
        .input-group input:focus { border-color: #4f46e5; }
        
        .role-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .role-options label { border: 2px solid #f1f5f9; padding: 15px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; font-weight: 600; color: #64748b; }
        .role-options label.active { border-color: #4f46e5; background: #f5f3ff; color: #4f46e5; }
        .role-options input { display: none; }

        .btn-main { padding: 12px 24px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 14px; }
        .btn-main.primary { background: #4f46e5; color: white; }
        .btn-main.danger { background: #ef4444; color: white; }
        .btn-main.cancel { background: #fff; border: 1px solid #e2e8f0; color: #64748b; }
        .btn-main:hover { opacity: 0.9; transform: translateY(-1px); }
      `}} />

      <div className="header-section">
        <div>
          <h1>Quản lý thành viên</h1>
          <p style={{color: '#64748b', marginTop: '5px'}}>Điều chỉnh quyền hạn và bảo mật người dùng hệ thống</p>
        </div>
      </div>

      <div className="glass-toolbar">
        <div className="tab-buttons">
          <button className={activeTab === 'customer' ? 'active' : ''} onClick={() => setActiveTab('customer')}>Khách hàng</button>
          <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => setActiveTab('admin')}>Quản trị viên</button>
        </div>
        <div className="search-wrapper">
          <Search size={18} />
          <input 
            placeholder="Tìm theo tên hoặc email..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{padding: '80px', textAlign: 'center'}}><Loader2 className="animate-spin" size={40} color="#4f46e5" style={{margin: '0 auto'}}/></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Thông tin liên hệ</th>
                <th>Trạng thái</th>
                <th style={{textAlign: 'right'}}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <div className="avatar-circle">{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</div>
                      <div>
                        <div style={{fontWeight: 700, color: '#1e293b'}}>{u.name}</div>
                        <div style={{fontSize: '11px', color: '#94a3b8'}}>ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{fontWeight: 500}}>{u.email}</div>
                    <div style={{fontSize: '12px', color: '#64748b'}}>{u.phone || 'Chưa cập nhật'}</div>
                  </td>
                  <td><span className="badge">Đang hoạt động</span></td>
                  <td className="actions">
                    <button className="btn-icon" onClick={() => openModal('view', u)}><Eye size={16}/></button>
                    <button className="btn-icon" onClick={() => openModal('edit', u)}><Edit2 size={16}/></button>
                    <button className="btn-icon" style={{color: '#d97706'}} onClick={() => openModal('password', u)}><KeyRound size={16}/></button>
                    <button className="btn-icon" style={{color: '#4f46e5'}} onClick={() => openModal('role', u)}><UserCog size={16}/></button>
                    <button className="btn-icon delete" onClick={() => openModal('delete', u)}><Trash2 size={16}/></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '60px', color: '#94a3b8'}}>Không tìm thấy thành viên nào</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal.type && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b'}}>
                {modal.type === 'view' ? 'Hồ sơ người dùng' : 
                 modal.type === 'edit' ? 'Chỉnh sửa thông tin' : 
                 modal.type === 'password' ? 'Thiết lập mật khẩu' : 
                 modal.type === 'role' ? 'Phân quyền tài khoản' : 'Cảnh báo hệ thống'}
              </h2>
              <X size={20} style={{cursor: 'pointer', color: '#94a3b8'}} onClick={closeModal} />
            </div>
            <div className="modal-body">
              {renderModalContent()}
            </div>
            <div className="modal-footer">
              <button className="btn-main cancel" onClick={closeModal}>Hủy bỏ</button>
              {modal.type !== 'view' && (
                <button className={`btn-main ${modal.type === 'delete' ? 'danger' : 'primary'}`} onClick={handleAction}>
                  {modal.type === 'delete' ? 'Xác nhận xóa' : 'Lưu dữ liệu'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser;