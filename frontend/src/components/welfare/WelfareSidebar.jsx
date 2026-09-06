import React from 'react';
import { NavLink } from 'react-router-dom';
import './WelfareLayout.css';

export default function WelfareSidebar() {
  // Simulating role check
  const userRoles = ['victim', 'counselor']; 
  const isCounselor = userRoles.includes('counselor');
  // For demo, we just show both or switch based on a toggle. 
  // Let's actually show both sets but distinctly grouped for testing,
  // or just render dynamically. For this test phase, I'll render the counselor block if counselor.

  return (
    <nav className="welfare-sidebar">
      <h2 className="sidebar-heading">Welfare Navigation</h2>
      <ul className="welfare-nav-list">
        
        {/* Victim Links */}
        {!isCounselor && (
          <>
            <li>
              <NavLink to="/welfare/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
                <span className="nav-icon" aria-hidden="true">📊</span>
                <div className="nav-text-container">
                  <span className="nav-label-primary">Dashboard</span>
                </div>
              </NavLink>
            </li>
            <li>
              <NavLink to="/welfare/services" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="nav-icon" aria-hidden="true">📋</span>
                <div className="nav-text-container">
                  <span className="nav-label-primary">Available Services</span>
                </div>
              </NavLink>
            </li>
            <li>
              <NavLink to="/welfare/request-support" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="nav-icon" aria-hidden="true">✍️</span>
                <div className="nav-text-container">
                  <span className="nav-label-primary">Request Support</span>
                </div>
              </NavLink>
            </li>
            <li>
              <NavLink to="/welfare/requests" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
                <span className="nav-icon" aria-hidden="true">📂</span>
                <div className="nav-text-container">
                  <span className="nav-label-primary">My Requests</span>
                </div>
              </NavLink>
            </li>
          </>
        )}

        {/* Counselor Links */}
        {isCounselor && (
          <>
            <li>
              <NavLink to="/welfare/counselor/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
                <span className="nav-icon" aria-hidden="true">📈</span>
                <div className="nav-text-container">
                  <span className="nav-label-primary">Counselor Overview</span>
                </div>
              </NavLink>
            </li>
            <li>
              <NavLink to="/welfare/counselor/requests" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="nav-icon" aria-hidden="true">📥</span>
                <div className="nav-text-container">
                  <span className="nav-label-primary">Assigned Requests</span>
                </div>
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
