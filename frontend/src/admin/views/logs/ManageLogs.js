import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hàm lấy danh sách log
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/admin/logs', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Laravel paginate trả về data.data
            setLogs(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error("Lỗi khi lấy log:", error);
            setLoading(false);
        }
    };

    // Hàm dọn dẹp log cũ (> 30 ngày)
    const handleCleanup = async () => {
        const confirmDelete = window.confirm(
            "Bạn có chắc chắn muốn dọn dẹp các bản ghi cũ hơn 30 ngày để làm nhẹ hệ thống không?"
        );

        if (confirmDelete) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.delete('http://127.0.0.1:8000/api/admin/logs/cleanup', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                alert(response.data.message || "Đã dọn dẹp log thành công!");
                fetchLogs(); // Tải lại danh sách sau khi xóa
            } catch (error) {
                console.error("Lỗi khi dọn dẹp:", error);
                alert("Không thể dọn dẹp log. Vui lòng kiểm tra lại quyền Admin.");
            }
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="container-fluid px-4">
            <h1 className="mt-4">Nhật ký hoạt động</h1>
            <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item active">Hệ thống ghi lại mọi tương tác của người dùng</li>
            </ol>

            <div className="card mb-4 shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center bg-light">
                    <div>
                        <i className="fas fa-history me-1"></i>
                        <b>Danh sách Log mới nhất</b>
                    </div>
                    <div>
                        <button 
                            onClick={fetchLogs} 
                            className="btn btn-sm btn-outline-primary me-2"
                            disabled={loading}
                        >
                            <i className="fas fa-sync-alt"></i> {loading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                        <button 
                            onClick={handleCleanup} 
                            className="btn btn-sm btn-danger"
                            title="Xóa log cũ hơn 30 ngày"
                        >
                            <i className="fas fa-broom"></i> Dọn dẹp log cũ
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2">Đang xử lý dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered align-middle">
                                <thead className="table-dark">
                                    <tr>
                                        <th style={{ width: '15%' }}>Thời gian</th>
                                        <th style={{ width: '15%' }}>Người dùng</th>
                                        <th style={{ width: '20%' }}>Hành động</th>
                                        <th style={{ width: '25%' }}>Chi tiết đối tượng</th>
                                        <th style={{ width: '25%' }}>IP & Thiết bị</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <tr key={log.id}>
                                                <td>
                                                    <small className="fw-bold">
                                                        {new Date(log.created_at).toLocaleString('vi-VN')}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${log.user_name === 'admin' ? 'bg-danger' : 'bg-success'}`}>
                                                        {log.user_name}
                                                    </span>
                                                </td>
                                                <td>
    <span className="text-dark">
        {`${log.action.includes('Đặt hàng') ? '🔴' : '🔵'} ${log.action}`}
    </span>
</td>
                                                <td>
                                                    <span className="text-primary fw-medium">
                                                        {log.target_name || <em className="text-muted small">Không có</em>}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="small text-muted">
                                                        <strong>IP:</strong> {log.ip_address}
                                                    </div>
                                                    <div 
                                                        className="small text-muted text-truncate" 
                                                        style={{ maxWidth: '200px' }} 
                                                        title={log.user_agent}
                                                    >
                                                        {log.user_agent}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-muted">
                                                Chưa có dữ liệu nhật ký nào.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogs;