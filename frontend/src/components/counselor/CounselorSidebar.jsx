import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useShellSummary } from '../../context/ShellSummaryContext';
import './CounselorLayout.css';

export default function CounselorSidebar() {
  const { t } = useLanguage();
  const { summary } = useShellSummary();

  return (
    <nav className="counselor-sidebar">
      <h2 className="sidebar-heading">Navigation</h2>
      <ul className="counselor-nav-list">
        <li>
          <NavLink to="/counselor/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🏠</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navDashboard')}</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/requests" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📝</span>
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
            <span className="nav-icon" aria-hidden="true">📅</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navAppointments')}</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/victims" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">👥</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navMyVictims')}</span>
              {summary.victims > 0 && <span className="nav-item-badge badge-neutral">{summary.victims}</span>}
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/welfare-portal" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🤝</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Welfare Portal</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/follow-ups" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🔄</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navFollowUps')}</span>
              {summary.followUps > 0 && <span className="nav-item-badge badge-neutral">{summary.followUps}</span>}
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/notifications" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🔔</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navNotifications')}</span>
              {summary.newAlerts > 0 && (
                <span className="nav-item-badge">{summary.newAlerts > 9 ? '9+' : summary.newAlerts}</span>
              )}
            </div>
          </NavLink>
        </li>
      </ul>

      {summary.liveCalls > 0 && (
        <NavLink to="/counselor/victims" className="sidebar-livecall-note">
          <span className="live-dot" aria-hidden="true" />
          {summary.liveCalls} live call{summary.liveCalls !== 1 ? 's' : ''} in progress
        </NavLink>
      )}

      <div className="sidebar-bottom">
        <div className="sidebar-quote">
          <span className="quote-leaf" aria-hidden="true">🌿</span>
          &ldquo;A safer India is a kinder India.&rdquo;
        </div>
        <div className="sidebar-help-card">
          <span className="help-icon" aria-hidden="true">🎧</span>
          <div>
            <div className="help-title">Need Help?</div>
            <div className="help-sub">Support Desk<br />1800-XXX-XXXX</div>
          </div>
        </div>
        <div className="sidebar-sync-note">Live counts · refresh 30s</div>
      </div>
    </nav>
  );
}
