import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Hàm lấy danh sách log
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/admin/logs', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Lấy dữ liệu từ Laravel Paginate (data.data)
            const rawLogs = response.data.data || [];

            /**
             * LOGIC LỌC:
             * Loại bỏ các dòng không có user_id hoặc là Khách vãng lai
             * (Dành cho các dữ liệu cũ còn sót lại trong DB)
             */
            const filteredLogs = rawLogs.filter(log => 
                log.user_id !== null && 
                log.user_name !== "Khách vãng lai"
            );

            setLogs(filteredLogs);
            setLoading(false);
        } catch (error) {
            console.error("Lỗi khi lấy log:", error);
            setLoading(false);
        }
    };

    // 2. Hàm dọn dẹp (Xóa sạch toàn bộ 100%)
    const handleCleanup = async () => {
        const confirmDelete = window.confirm(
            "CẢNH BÁO: Bạn có chắc chắn muốn XÓA SẠCH TOÀN BỘ nhật ký không? Hành động này không thể hoàn tác!"
        );

        if (confirmDelete) {
            try {
                const token = localStorage.getItem('token');
                // Gọi API dọn dẹp
                const response = await axios.delete('http://127.0.0.1:8000/api/admin/logs/cleanup', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                alert(response.data.message || "Đã xóa sạch toàn bộ nhật ký!");
                
                // Sau khi xóa thành công, làm trống danh sách trên giao diện ngay lập tức
                setLogs([]); 
            } catch (error) {
                console.error("Lỗi khi dọn dẹp:", error);
                alert("Không thể xóa nhật ký. Vui lòng kiểm tra lại API.");
            }
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="container-fluid px-4">
            <h1 className="mt-4">Quản lý Nhật ký hệ thống</h1>
            <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item active">Lịch sử hoạt động của thành viên</li>
            </ol>

            <div className="card mb-4 shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center bg-light">
                    <div>
                        <i className="fas fa-history me-1"></i>
                        <b>Danh sách hoạt động</b>
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
                            title="Xóa vĩnh viễn tất cả nhật ký"
                        >
                            <i className="fas fa-trash-alt"></i> Xóa sạch tất cả
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered align-middle">
                                <thead className="table-dark">
                                    <tr>
                                        <th style={{ width: '15%' }}>Thời gian</th>
                                        <th style={{ width: '15%' }}>Người dùng</th>
                                        <th style={{ width: '25%' }}>Hành động</th>
                                        <th style={{ width: '25%' }}>Email tài khoản</th>
                                        <th style={{ width: '20%' }}>Địa chỉ IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <tr key={log.id}>
                                                <td>
                                                    <small className="fw-bold text-secondary">
                                                        {new Date(log.created_at).toLocaleString('vi-VN')}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${log.user_name === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                                                        {log.user_name}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-dark">
                                                        {log.action.includes('Đặt hàng') ? '📦 ' : '🔍 '}
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-primary fw-bold">
                                                        {/* Hiển thị Email từ cột target_name theo Middleware mới */}
                                                        {log.target_name || "N/A"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <code className="small text-muted">{log.ip_address}</code>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5 text-muted">
                                                Không có dữ liệu nhật ký nào được tìm thấy.
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