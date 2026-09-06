import React from 'react';
import { Outlet } from 'react-router-dom';
import VictimNavbar from './VictimNavbar';
import VictimSidebar from './VictimSidebar';
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
    </div>
  );
}
