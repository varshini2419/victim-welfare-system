import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles, redirectTo }) {
  const { token, role, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return null;
  }
  
  // Determine appropriate login destination based on path or allowedRoles
  const getLoginRoute = () => {
    if (redirectTo) return redirectTo;
    if (allowedRoles?.includes('admin') || location.pathname.startsWith('/admin')) {
      return '/admin/login';
    }
    if (allowedRoles?.includes('counselor') || location.pathname.startsWith('/counselor')) {
      return '/counselor/login';
    }
    return '/login';
  };

  if (!token) {
    return <Navigate to={getLoginRoute()} replace />;
  }

  const hasAccess = allowedRoles ? allowedRoles.includes(role) : true;
  
  if (!hasAccess) {
    return <Navigate to={getLoginRoute()} replace />;
  }
  
  return children;
}
