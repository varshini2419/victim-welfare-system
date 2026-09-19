import React from 'react';
import { Outlet } from 'react-router-dom';
import CounselorNavbar from './CounselorNavbar';
import CounselorSidebar from './CounselorSidebar';
import './CounselorLayout.css';

export default function CounselorLayout() {
  return (
    <div className="counselor-layout">
      <CounselorNavbar />
      <div className="counselor-body">
        <CounselorSidebar />
        <main className="counselor-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
