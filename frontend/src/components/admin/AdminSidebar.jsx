import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminSidebar() {
  return (
    <nav className="admin-sidebar">
      {/* Top Header Branding Section matching Image 1 */}
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand">
          <img
            src="/images/emblem.png"
            alt="Government of India Emblem"
            className="admin-sidebar-emblem"
          />
          <div className="admin-sidebar-brand-text">
            <span className="admin-sidebar-title-main">Victim Welfare &amp;</span>
            <span className="admin-sidebar-title-sub">Support Portal</span>
            <span className="admin-sidebar-tagline">Safety &bull; Support &bull; Justice</span>
          </div>
        </div>
      </div>

      {/* Navigation Links - Retaining existing routes, labels and functionality */}
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="10" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" />
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
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 14l2 2 4-4" />
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
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </span>
              <span className="nav-label-primary">Geographic Reports</span>
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Bottom Decorative Section matching Image 1 */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-artwork-container">
          <svg
            className="admin-sidebar-artwork"
            viewBox="0 0 260 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Architectural Parliament / Rashtrapati Bhavan Silhouette */}
            <g opacity="0.22" stroke="#60a5fa" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              {/* Central Dome and spire */}
              <line x1="130" y1="12" x2="130" y2="2" />
              <circle cx="130" cy="2" r="1.5" fill="#60a5fa" />
              <path d="M118 26 C118 16 142 16 142 26 Z" fill="#60a5fa" fillOpacity="0.1" />
              <rect x="115" y="26" width="30" height="5" />
              <rect x="110" y="31" width="40" height="4" />

              {/* Pediment & Entablature */}
              <polygon points="130,35 106,44 154,44" fill="#60a5fa" fillOpacity="0.15" />
              <line x1="60" y1="44" x2="200" y2="44" strokeWidth="1.5" />

              {/* Colonnade / Pillars */}
              <line x1="70" y1="44" x2="70" y2="68" />
              <line x1="78" y1="44" x2="78" y2="68" />
              <line x1="86" y1="44" x2="86" y2="68" />
              <line x1="94" y1="44" x2="94" y2="68" />
              <line x1="102" y1="44" x2="102" y2="68" />
              <line x1="110" y1="44" x2="110" y2="68" />
              <line x1="118" y1="44" x2="118" y2="68" />
              <line x1="126" y1="44" x2="126" y2="68" />
              <line x1="134" y1="44" x2="134" y2="68" />
              <line x1="142" y1="44" x2="142" y2="68" />
              <line x1="150" y1="44" x2="150" y2="68" />
              <line x1="158" y1="44" x2="158" y2="68" />
              <line x1="166" y1="44" x2="166" y2="68" />
              <line x1="174" y1="44" x2="174" y2="68" />
              <line x1="182" y1="44" x2="182" y2="68" />
              <line x1="190" y1="44" x2="190" y2="68" />

              {/* Plinth and stairs */}
              <rect x="56" y="68" width="148" height="4" />
              <line x1="48" y1="72" x2="212" y2="72" />
              <line x1="40" y1="75" x2="220" y2="75" />
            </g>

            {/* Indian Tricolor Wave Swoosh matching Image 1 */}
            <path
              d="M-10 88 C40 76 110 94 170 70 C205 56 240 60 270 54"
              stroke="#ff9933"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.95"
            />
            <path
              d="M-10 94 C40 82 110 100 170 76 C205 62 240 66 270 60"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
            <path
              d="M-10 100 C40 88 110 106 170 82 C205 68 240 72 270 66"
              stroke="#138808"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.95"
            />
          </svg>
        </div>

        <div className="admin-sidebar-footer-text">
          <span className="footer-govt-title">GOVERNMENT OF INDIA</span>
          <span className="footer-govt-subtitle">SERVICES FOR A SAFER TOMORROW</span>
        </div>
      </div>
    </nav>
  );
}

