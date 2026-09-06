import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import VictimLayout from '../components/victim/VictimLayout';
import Dashboard from '../pages/victim/Dashboard';
import DailyUpdates from '../pages/victim/DailyUpdates';
import VoiceUpdates from '../pages/victim/VoiceUpdates';
import Chatbot from '../pages/victim/Chatbot';
import MyCounselor from '../pages/victim/MyCounselor';
import Appointments from '../pages/victim/Appointments';
import EmergencyHelp from '../pages/victim/EmergencyHelp';

export default function VictimRoutes() {
  return (
    <Routes>
      <Route element={<VictimLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="daily-updates" element={<DailyUpdates />} />
        <Route path="voice-updates" element={<VoiceUpdates />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="counselor" element={<MyCounselor />} />
        <Route path="appointment" element={<Appointments />} />
        <Route path="helpline" element={<EmergencyHelp />} />
        <Route path="*" element={<Navigate to="chatbot" replace />} />
      </Route>
    </Routes>
  );
}
