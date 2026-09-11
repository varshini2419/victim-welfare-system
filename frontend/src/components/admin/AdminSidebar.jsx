import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminSidebar() {
  return (
    <nav className="admin-sidebar">
      <h2 className="sidebar-heading">Admin Navigation</h2>
      <ul className="admin-nav-list">
        <li>
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
            <span className="nav-icon" aria-hidden="true">📊</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">System Overview</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/victims" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">👥</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Victim Management</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/counselors" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">👥</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Counselor Management</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/welfare" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📋</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Welfare Oversight</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/alerts" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🚨</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Alert Center</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/reports" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📈</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">Geographic Reports</span>
            </div>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
