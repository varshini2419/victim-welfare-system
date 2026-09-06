import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import VictimRoutes from './VictimRoutes';
import CounselorRoutes from './CounselorRoutes';
import WelfareRoutes from './WelfareRoutes';
import AdminRoutes from './AdminRoutes';
import PublicRoutes from './PublicRoutes';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Portal takes over the root */}
        <Route path="/*" element={<PublicRoutes />} />
        
        {/* Protected Victim Portal Routes */}
        <Route 
          path="/victim/*" 
          element={
            <ProtectedRoute allowedRoles={['victim']}>
              <VictimRoutes />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Counselor Portal Routes */}
        <Route 
          path="/counselor/*" 
          element={
            <ProtectedRoute allowedRoles={['counselor']}>
              <CounselorRoutes />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Welfare Support Routes */}
        <Route 
          path="/welfare/*" 
          element={
            <ProtectedRoute allowedRoles={['victim', 'counselor']}>
              <WelfareRoutes />
            </ProtectedRoute>
          } 
        />

        {/* Protected Administration Portal Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRoutes />
            </ProtectedRoute>
          } 
        />
        
        {/* Placeholder for future authentication route */}
        <Route path="/login" element={<div>Login Page (To be implemented)</div>} />
      </Routes>
    </BrowserRouter>
  );
}
