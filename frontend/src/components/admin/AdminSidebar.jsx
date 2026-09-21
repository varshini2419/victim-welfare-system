import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminSidebar() {
  return (
    <nav className="admin-sidebar" aria-label="Administration Portal Navigation">
      {/* 1. TOP BRANDING SECTION: Centered Title, Slogan & Subtle Tricolor Accent */}
      <div className="admin-sidebar-branding">
        <Link
          to="/admin/dashboard"
          className="admin-sidebar-brand-link"
          title="Admin Navigation"
        >
          <div className="admin-brand-title" style={{ color: '#ffffff' }}>
            Admin Navigation
          </div>
          <div className="admin-brand-slogan">
            Safety • Support • Justice
          </div>
          <div className="admin-brand-tricolor-accent" aria-hidden="true" />
        </Link>
      </div>

      {/* 2. CLEAR SPACING: Sufficient vertical separation below the tricolor accent */}
      <div className="admin-sidebar-spacing" aria-hidden="true" />

      {/* 3. NAVIGATION SECTION: Exactly the 6 admin options */}
      <div className="admin-sidebar-nav-container">
        <ul className="admin-nav-list">
          <li>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
              end
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </span>
              <span className="nav-label-primary">System Overview</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/victims"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span className="nav-label-primary">Victim Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/counselors"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <polyline points="17 11 19 13 23 9" />
                </svg>
              </span>
              <span className="nav-label-primary">Counselor Management</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/welfare"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="13" y2="16" />
                </svg>
              </span>
              <span className="nav-label-primary">Welfare Oversight</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/alerts"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
              <span className="nav-label-primary">Alert Center</span>
              <span className="admin-nav-dot" title="Active Alerts"></span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/reports"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </span>
              <span className="nav-label-primary">Geographic Reports</span>
            </NavLink>
          </li>
        </ul>
      </div>

      {/* 4. FLEXIBLE EMPTY SPACE: Absorbs leftover viewport height dynamically */}
      <div className="admin-sidebar-flexible-space" aria-hidden="true" />

      {/* 5. BOTTOM GOVERNMENT / DECORATIVE SECTION: Parliament, Tricolor wave & text */}
      <div className="admin-sidebar-bottom-section" aria-hidden="true" />
    </nav>
  );
}
