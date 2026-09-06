import React from 'react';
import { NavLink } from 'react-router-dom';
import './VictimLayout.css';

export default function VictimSidebar() {
  return (
    <nav className="victim-sidebar">
      <h2 className="sidebar-heading">Quick Navigation</h2>
      <ul className="victim-nav-list">
        <li>
          <NavLink to="/victim/chatbot" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">💬</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">सपोर्ट चैटबॉट</span>
              <span className="nav-label-secondary">Support Chatbot</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/victim/counselor" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">👤</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">सलाहकार परामर्श</span>
              <span className="nav-label-secondary">Counselor Consultation</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/victim/appointment" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📅</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">अपॉइंटमेंट शेड्यूलिंग</span>
              <span className="nav-label-secondary">Appointment Scheduling</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/victim/daily-updates" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📝</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">दैनिक अद्यतन</span>
              <span className="nav-label-secondary">Daily Update</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/victim/helpline" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🆘</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">हेल्पलाइन संपर्क</span>
              <span className="nav-label-secondary">Emergency Helplines</span>
            </div>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
