import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WelfareLayout from '../components/welfare/WelfareLayout';

// Victim Pages
import VictimWelfareDashboard from '../pages/welfare/VictimWelfareDashboard';
import AvailableServices from '../pages/welfare/AvailableServices';
import RequestSupportForm from '../pages/welfare/RequestSupportForm';
import MyWelfareRequests from '../pages/welfare/MyWelfareRequests';
import RequestDetails from '../pages/welfare/RequestDetails';

// Counselor Pages
import CounselorWelfareDashboard from '../pages/welfare/CounselorWelfareDashboard';
import CounselorWelfareRequests from '../pages/welfare/CounselorWelfareRequests';
import CounselorRequestReview from '../pages/welfare/CounselorRequestReview';

export default function WelfareRoutes() {
  // Simulating role check to render appropriate routes
  // In a real application, this would come from a secure context/state
  const userRoles = ['victim', 'counselor']; 
  const isCounselor = userRoles.includes('counselor');
  // For demo testing, we let the user access both based on URL path

  return (
    <Routes>
      <Route element={<WelfareLayout />}>
        {/* Victim Namespace */}
        <Route path="dashboard" element={<VictimWelfareDashboard />} />
        <Route path="services" element={<AvailableServices />} />
        <Route path="request-support" element={<RequestSupportForm />} />
        <Route path="requests" element={<MyWelfareRequests />} />
        <Route path="requests/:id" element={<RequestDetails />} />
        
        {/* Counselor Namespace */}
        <Route path="counselor/dashboard" element={<CounselorWelfareDashboard />} />
        <Route path="counselor/requests" element={<CounselorWelfareRequests />} />
        <Route path="counselor/requests/:id" element={<CounselorRequestReview />} />

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to={isCounselor ? "counselor/dashboard" : "dashboard"} replace />} />
      </Route>
    </Routes>
  );
}
