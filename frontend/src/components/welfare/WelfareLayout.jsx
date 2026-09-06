import React from 'react';
import { Outlet } from 'react-router-dom';
import WelfareNavbar from './WelfareNavbar';
import WelfareSidebar from './WelfareSidebar';
import './WelfareLayout.css';

export default function WelfareLayout() {
  return (
    <div className="welfare-layout">
      <WelfareNavbar />
      <div className="welfare-body">
        <WelfareSidebar />
        <main className="welfare-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
