import React from 'react';
import { NavLink } from 'react-router-dom';
import './CounselorLayout.css';

export default function CounselorSidebar() {
  return (
    <nav className="counselor-sidebar">
      <h2 className="sidebar-heading">Counselor Navigation</h2>
      <ul className="counselor-nav-list">
        <li>
          <NavLink to="/counselor/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📊</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Dashboard</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/requests" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📥</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Consultation Requests</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/appointments" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📅</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Appointments</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/victims" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">👥</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">My Victims</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/follow-ups" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🔄</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Follow-Ups</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/notifications" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🔔</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Notifications</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">⚙️</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Profile</span>
            </div>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
