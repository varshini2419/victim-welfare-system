import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CounselorLayout from '../components/counselor/CounselorLayout';
import Dashboard from '../pages/counselor/Dashboard';
import Requests from '../pages/counselor/Requests';
import Appointments from '../pages/counselor/Appointments';
import MyVictims from '../pages/counselor/MyVictims';
import VictimProfile from '../pages/counselor/VictimProfile';
import FollowUps from '../pages/counselor/FollowUps';
import Notifications from '../pages/counselor/Notifications';
import ConsultationWorkspace from '../pages/counselor/ConsultationWorkspace';
import Profile from '../pages/counselor/Profile';

export default function CounselorRoutes() {
  return (
    <Routes>
      <Route element={<CounselorLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="requests" element={<Requests />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="victims" element={<MyVictims />} />
        <Route path="victims/:id" element={<VictimProfile />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="consultation/:id" element={<ConsultationWorkspace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
