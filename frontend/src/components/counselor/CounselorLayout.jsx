import React from 'react';
import { Link, Outlet } from 'react-router-dom';
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

      <Link to="/counselor/dashboard" className="counselor-home-fab" title="Go to home">
        <span aria-hidden="true">🏠</span>
        <span>Home</span>
      </Link>
    </div>
  );
}
