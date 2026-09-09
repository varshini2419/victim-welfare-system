import React from 'react';
import { Outlet } from 'react-router-dom';
import VictimNavbar from './VictimNavbar';
import VictimSidebar from './VictimSidebar';
import FloatingChatboard from '../common/FloatingChatboard';
import './VictimLayout.css';

export default function VictimLayout() {
  return (
    <div className="victim-layout">
      <VictimNavbar />
      <div className="victim-body">
        <VictimSidebar />
        <main className="victim-main-content">
          <Outlet />
        </main>
      </div>

      {/* Floating Chatbot Widget on entire Victim Portal */}
      <FloatingChatboard />
    </div>
  );
}
