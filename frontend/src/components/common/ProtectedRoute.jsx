import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  // Authentication will be implemented in a future phase.
  // For now, we simulate a user with victim, counselor, and admin roles
  // so we can test all portals during development without an actual auth system.
  // In a real system, the user would only have their designated role.
  const userRoles = ['victim', 'counselor', 'admin']; 
  const isAuthenticated = true;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  
  const hasAccess = allowedRoles ? allowedRoles.some(role => userRoles.includes(role)) : true;
  
  if (!hasAccess) {
    // If they don't have the required role, redirect them to a safe default.
    // For this demo, we'll just redirect to the root which handles default routing.
    return <Navigate to="/" replace />;
  }
  
  return children;
}
