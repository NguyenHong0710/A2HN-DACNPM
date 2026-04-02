import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken, getStoredUser, getStoredUserRole } from '../utils/authStorage';

const ProtectedAdminRoute = ({ element, allowedRoles = ['admin'] }) => {
  const token = getAuthToken();
  const userData = getStoredUser() || {};
  const storedRole = String(getStoredUserRole() || userData.role || '').trim().toLowerCase();
  const normalizedAllowedRoles = (allowedRoles || []).map((role) => String(role).toLowerCase());

  // Check if user is logged in.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!normalizedAllowedRoles.includes(storedRole)) {
    return (
      <div style={{
        padding: '50px',
        textAlign: 'center',
        minHeight: '80vh',
        backgroundColor: '#f5f5f5'
      }}>
        <h1>Truy cập bị từ chối</h1>
        <p>Bạn không có quyền truy cập trang này.</p>
        <a href="/" style={{
          color: '#667eea',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>← Quay lại trang chủ</a>
      </div>
    );
  }

  return element;
};

export default ProtectedAdminRoute;
