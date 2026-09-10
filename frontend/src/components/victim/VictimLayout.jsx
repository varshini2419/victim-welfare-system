import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import VictimNavbar from './VictimNavbar';
import VictimSidebar from './VictimSidebar';
import FloatingChatboard from '../common/FloatingChatboard';
import './VictimLayout.css';

export default function VictimLayout() {
  const location = useLocation();
  const isChatbotRoute = location.pathname.includes('/victim/chatbot');

  return (
    <div className="victim-layout">
      <VictimNavbar />
      <div className="victim-body">
        <VictimSidebar />
        <main className="victim-main-content">
          <Outlet />
        </main>
      </div>

      {/* Floating Chatbot Widget on entire Victim Portal except Chatbot page */}
      {!isChatbotRoute && <FloatingChatboard />}
    </div>
  );
}
