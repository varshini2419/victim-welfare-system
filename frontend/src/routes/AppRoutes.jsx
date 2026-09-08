import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import VictimRoutes from './VictimRoutes';
import CounselorRoutes from './CounselorRoutes';
import WelfareRoutes from './WelfareRoutes';
import AdminRoutes from './AdminRoutes';
import PublicRoutes from './PublicRoutes';
import Login from '../pages/auth/Login';
import AdminLogin from '../pages/admin/AdminLogin';
import CounselorLogin from '../pages/counselor/CounselorLogin';
import CounselorLanding from '../pages/counselor/CounselorLanding';
import AdminLanding from '../pages/admin/AdminLanding';
import TrackApplication from '../pages/public/TrackApplication';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dedicated Public Authentication Routes by Role */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/counselor/login" element={<CounselorLogin />} />
        <Route path="/counselor-portal" element={<CounselorLanding />} />
        <Route path="/counselor/landing" element={<CounselorLanding />} />
        <Route path="/admin-portal" element={<AdminLanding />} />
        <Route path="/admin/landing" element={<AdminLanding />} />
        <Route path="/track-application" element={<TrackApplication />} />

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
        
        {/* Public Portal takes over root and unmatched routes */}
        <Route path="/*" element={<PublicRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
