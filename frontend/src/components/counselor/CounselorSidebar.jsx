import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useShellSummary } from '../../context/ShellSummaryContext';
import './CounselorLayout.css';

export default function CounselorSidebar() {
  const { t } = useLanguage();
  const { summary } = useShellSummary();

  return (
    <nav className="counselor-sidebar" aria-label="Counselor Portal Navigation">
      {/* 1. TOP BRANDING SECTION: Centered Title, Slogan & Subtle Tricolor Accent */}
      <div className="counselor-sidebar-branding">
        <Link
          to="/counselor/dashboard"
          className="counselor-sidebar-brand-link"
          title="Counselor Navigation"
        >
          <div className="counselor-brand-title">Counselor Navigation</div>
          <div className="counselor-brand-slogan">Care • Listen • Support • Prevent</div>
          <div className="counselor-brand-tricolor-accent" aria-hidden="true" />
        </Link>
      </div>

      {/* 2. CLEAR SPACING below the tricolor accent */}
      <div className="counselor-sidebar-spacing" aria-hidden="true" />

      {/* 3. NAVIGATION SECTION */}
      <div className="counselor-sidebar-nav-container">
        <ul className="counselor-nav-list">
          <li>
            <NavLink to="/counselor/dashboard" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </span>
              <div className="nav-text-container">
                <span className="nav-label-primary">{t('navDashboard')}</span>
              </div>
            </NavLink>
          </li>
          <li>
            <NavLink to="/counselor/requests" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="13" y2="16" />
                </svg>
              </span>
              <div className="nav-text-container">
                <span className="nav-label-primary">{t('navRequests')}</span>
                {summary.pendingRequests > 0 && (
                  <span className="nav-item-badge">{summary.pendingRequests > 9 ? '9+' : summary.pendingRequests}</span>
                )}
              </div>
            </NavLink>
          </li>
          <li>
            <NavLink to="/counselor/appointments" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <div className="nav-text-container">
                <span className="nav-label-primary">{t('navAppointments')}</span>
              </div>
            </NavLink>
          </li>
          <li>
            <NavLink to="/counselor/victims" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <div className="nav-text-container">
                <span className="nav-label-primary">{t('navMyVictims')}</span>
                {summary.victims > 0 && <span className="nav-item-badge badge-neutral">{summary.victims}</span>}
              </div>
            </NavLink>
          </li>
          <li>
            <NavLink to="/counselor/welfare-portal" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </span>
              <div className="nav-text-container">
                <span className="nav-label-primary">Welfare Portal</span>
              </div>
            </NavLink>
          </li>
          <li>
            <NavLink to="/counselor/follow-ups" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </span>
              <div className="nav-text-container">
                <span className="nav-label-primary">{t('navFollowUps')}</span>
                {summary.followUps > 0 && <span className="nav-item-badge badge-neutral">{summary.followUps}</span>}
              </div>
            </NavLink>
          </li>
          <li>
            <NavLink to="/counselor/notifications" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon-wrap" aria-hidden="true">
                <svg className="counselor-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <div className="nav-text-container">
                <span className="nav-label-primary">{t('navNotifications')}</span>
                {summary.newAlerts > 0 && (
                  <span className="nav-item-badge">{summary.newAlerts > 9 ? '9+' : summary.newAlerts}</span>
                )}
              </div>
            </NavLink>
          </li>
        </ul>
      </div>

      {summary.liveCalls > 0 && (
        <NavLink to="/counselor/victims" className="sidebar-livecall-note">
          <span className="live-dot" aria-hidden="true" />
          {summary.liveCalls} live call{summary.liveCalls !== 1 ? 's' : ''} in progress
        </NavLink>
      )}

      {/* 4. FLEXIBLE EMPTY SPACE: absorbs leftover viewport height */}
      <div className="counselor-sidebar-flexible-space" aria-hidden="true" />

      {/* 5. BOTTOM GOVERNMENT / DECORATIVE SECTION */}
      <div className="counselor-sidebar-bottom-section" aria-hidden="true" />
    </nav>
  );
}
