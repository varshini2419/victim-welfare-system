import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './CounselorLayout.css';

export default function CounselorSidebar() {
  const { t } = useLanguage();

  return (
    <nav className="counselor-sidebar" aria-label="Counselor Portal Navigation">
      {/* 1. TOP BRANDING SECTION: Centered Title, Slogan & Subtle Tricolor Accent (No Three Lions emblem) */}
      <div className="counselor-sidebar-branding">
        <Link
          to="/counselor/dashboard"
          className="counselor-sidebar-brand-link"
          title="Victim Welfare & Support Portal - Home"
        >
          <div className="counselor-brand-title">
            <span>Victim Welfare &amp;</span>
            <span>Support Portal</span>
          </div>
          <div className="counselor-brand-slogan">
            Safety • Support • Justice
          </div>
          <div className="counselor-brand-tricolor-accent" aria-hidden="true" />
        </Link>
      </div>

      {/* 2. CLEAR SPACING: Sufficient vertical separation below the tricolor accent */}
      <div className="counselor-sidebar-spacing" aria-hidden="true" />

      {/* 3. NAVIGATION ITEMS: Dashboard starts strictly BELOW the tagline */}
      <div className="counselor-sidebar-nav-container">
        <ul className="counselor-nav-list">
          <li>
            <NavLink
              to="/counselor/dashboard"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
              end
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </span>
              <span className="nav-label-primary">{t('navDashboard') || 'Dashboard'}</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/counselor/requests"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </span>
              <span className="nav-label-primary">{t('navRequests') || 'Consultation Requests'}</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/counselor/appointments"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                </svg>
              </span>
              <span className="nav-label-primary">{t('navAppointments') || 'Appointments'}</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/counselor/victims"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span className="nav-label-primary">{t('navMyVictims') || 'My Victims'}</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/counselor/welfare-portal"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <span className="nav-label-primary">Welfare Portal</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/counselor/follow-ups"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </span>
              <span className="nav-label-primary">{t('navFollowUps') || 'Follow-Ups'}</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/counselor/notifications"
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <span className="nav-label-primary">{t('navNotifications') || 'Notifications'}</span>
              <span className="counselor-nav-dot" title="New Notifications"></span>
            </NavLink>
          </li>
        </ul>
      </div>

      {/* 4. FLEXIBLE EMPTY SPACE: Absorbs available height dynamically */}
      <div className="counselor-sidebar-flexible-space" aria-hidden="true" />

      {/* 5. BOTTOM GOVERNMENT / DECORATIVE SECTION: Parliament, Tricolor wave & Government text */}
      <div className="counselor-sidebar-bottom-section" aria-hidden="true" />
    </nav>
  );
}


