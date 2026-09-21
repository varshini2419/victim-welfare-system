import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';

import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminVictims from '../pages/admin/AdminVictims';
import AdminVictimDetails from '../pages/admin/AdminVictimDetails';
import AdminCounselors from '../pages/admin/AdminCounselors';
import AdminCounselorDetails from '../pages/admin/AdminCounselorDetails';
// Admin supervision reuses the counselor's victim dashboard component as-is
import VictimProfile from '../pages/counselor/VictimProfile';
import AdminWelfare from '../pages/admin/AdminWelfare';
import AdminAlerts from '../pages/admin/AdminAlerts';
import AdminReports from '../pages/admin/AdminReports';
import AdminUsers from '../pages/admin/AdminUsers';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        
        <Route path="victims" element={<AdminVictims />} />
        {/* Victim click-through = the SAME mental-health visualizations the
            counselor sees. The registration-approval workflow lives under /manage. */}
        <Route path="victims/:id" element={<VictimProfile />} />
        <Route path="victims/:id/manage" element={<AdminVictimDetails />} />
        
        <Route path="counselors" element={<AdminCounselors />} />
        <Route path="counselors/:id" element={<AdminCounselorDetails />} />
        {/* Same visualizations as the counselor portal, mounted for admin */}
        {/* Kept for counselor-cards deep links; renders the same component */}
        <Route path="counselors/:counselorId/victims/:id" element={<VictimProfile />} />
        
        <Route path="welfare" element={<AdminWelfare />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="users" element={<AdminUsers />} />

        {/* Fallback route for unmatched /admin/* paths */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
