import React from 'react';
import { NavLink } from 'react-router-dom';
import './VictimLayout.css';

export default function VictimSidebar() {
  return (
    <nav className="victim-sidebar" aria-label="Victim Portal Navigation">
      {/* 1. TOP BRANDING SECTION: "Quick Navigation" title & tagline */}
      <div className="victim-sidebar-branding">
        <div className="victim-brand-title">Quick Navigation</div>
        <div className="victim-brand-slogan">Safety • Support • Justice</div>
        <div className="victim-brand-tricolor-accent" aria-hidden="true" />
      </div>

      {/* 2. CLEAR SPACING: Sufficient vertical separation below the branding/tagline */}
      <div className="victim-sidebar-spacing" aria-hidden="true" />

      {/* 3. NAVIGATION SECTION: Starts strictly BELOW the "Safety • Support • Justice" tagline */}
      <div className="victim-sidebar-nav-container">
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
            <NavLink to="/victim/daily-updates" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon" aria-hidden="true">📝</span>
              <div className="nav-text-container">
                <span className="nav-label-primary">डेली अपडेट</span>
                <span className="nav-label-secondary">Daily Changes</span>
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
            <NavLink to="/victim/helpline" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon" aria-hidden="true">🆘</span>
              <div className="nav-text-container">
                <span className="nav-label-primary">हेल्पलाइन संपर्क</span>
                <span className="nav-label-secondary">Emergency Helplines</span>
              </div>
            </NavLink>
          </li>
        </ul>
      </div>

      {/* 4. FLEXIBLE EMPTY SPACE: Absorbs leftover viewport height dynamically */}
      <div className="victim-sidebar-flexible-space" aria-hidden="true" />

      {/* 5. BOTTOM GOVERNMENT / DECORATIVE SECTION: Parliament, tricolor wave & Government text */}
      <div className="victim-sidebar-bottom-section" aria-hidden="true" />
    </nav>
  );
}
