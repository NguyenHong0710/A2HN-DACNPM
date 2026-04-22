import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiRefreshCw, FiTrash2, FiClock, FiUser, FiActivity, FiMail, FiGlobe } from 'react-icons/fi';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Hàm lấy danh sách log (Giữ nguyên logic kết nối của bạn)
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/admin/logs', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const rawLogs = response.data.data || [];
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

    // 2. Hàm dọn dẹp (Giữ nguyên logic kết nối của bạn)
    const handleCleanup = async () => {
        const confirmDelete = window.confirm(
            "CẢNH BÁO: Bạn có chắc chắn muốn XÓA SẠCH TOÀN BỘ nhật ký không? Hành động này không thể hoàn tác!"
        );

        if (confirmDelete) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.delete('http://127.0.0.1:8000/api/admin/logs/cleanup', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert(response.data.message || "Đã xóa sạch toàn bộ nhật ký!");
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

    // Hệ thống Style mới để fix lỗi UI nhảy chữ
    const styles = {
        container: { padding: '30px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
        headerSection: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', // Fix lỗi nhảy chữ bằng cách căn giữa theo trục dọc
            marginBottom: '30px',
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        },
        title: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 },
        subtitle: { color: '#666', fontSize: '14px', margin: '5px 0 0 0' },
        card: { 
            backgroundColor: '#fff', 
            borderRadius: '12px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
            border: 'none'
        },
        table: { width: '100%', borderCollapse: 'collapse' },
        th: { 
            padding: '15px 20px', 
            textAlign: 'left', 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#888', 
            textTransform: 'uppercase',
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #eee'
        },
        td: { padding: '15px 20px', fontSize: '14px', borderBottom: '1px solid #f5f5f5', color: '#333' },
        badgeAdmin: { 
            padding: '4px 10px', 
            borderRadius: '6px', 
            backgroundColor: '#fff5f5', 
            color: '#e53935', 
            fontSize: '12px', 
            fontWeight: 'bold',
            border: '1px solid #ffcdd2'
        },
        badgeUser: { 
            padding: '4px 10px', 
            borderRadius: '6px', 
            backgroundColor: '#f0f7ff', 
            color: '#007bff', 
            fontSize: '12px' 
        },
        btnRefresh: {
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            backgroundColor: '#fff',
            cursor: 'pointer',
            marginRight: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500'
        },
        btnDelete: {
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#1a1a1a', // Đổi sang màu tối sang trọng
            color: '#c5a059', // Màu vàng Lumina
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
        }
    };

    return (
        <div style={styles.container}>
            {/* Header Mới - Đã fix lỗi đè button */}
            <div style={styles.headerSection}>
                <div>
                    <h1 style={styles.title}>Quản lý Nhật ký hệ thống</h1>
                    <p style={styles.subtitle}>Lịch sử hoạt động chi tiết của thành viên</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={styles.btnRefresh} onClick={fetchLogs} disabled={loading}>
                        <FiRefreshCw spin={loading} /> Làm mới
                    </button>
                    <button style={styles.btnDelete} onClick={handleCleanup}>
                        <FiTrash2 /> Xóa sạch tất cả
                    </button>
                </div>
            </div>

            {/* Danh sách log */}
            <div style={styles.card}>
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <div className="spinner-border text-dark" role="status"></div>
                            <p style={{ marginTop: '10px' }}>Đang đồng bộ dữ liệu...</p>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}><FiClock /> Thời gian</th>
                                    <th style={styles.th}><FiUser /> Người dùng</th>
                                    <th style={styles.th}><FiActivity /> Hành động</th>
                                    <th style={styles.th}><FiMail /> Email</th>
                                    <th style={styles.th}><FiGlobe /> Địa chỉ IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id}>
                                            <td style={styles.td}>
                                                <span style={{ fontWeight: '500' }}>
                                                    {new Date(log.created_at).toLocaleString('vi-VN')}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                {log.user_name === 'admin' ? (
                                                    <span style={styles.badgeAdmin}>ADMIN</span>
                                                ) : (
                                                    <span style={styles.badgeUser}>{log.user_name}</span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ color: log.action.includes('Xóa') ? '#d32f2f' : '#333' }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ color: '#007bff' }}>{log.target_name || "N/A"}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <code style={{ background: '#f8f9fa', padding: '2px 5px' }}>{log.ip_address}</code>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                            Không tìm thấy lịch sử hoạt động nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogs;