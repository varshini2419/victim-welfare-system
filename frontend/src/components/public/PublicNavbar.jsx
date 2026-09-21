import React from 'react';
import { NavLink } from 'react-router-dom';
import './PublicNavbar.css';

export default function PublicNavbar() {
  return (
    <nav className="public-navbar">
      <div className="public-navbar-left">
        <img src="/images/emblem.png" alt="Government of India Emblem" className="public-navbar-logo" />
        <span className="public-navbar-title">AAROHAN</span>
      </div>
      <div className="public-navbar-right">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? 'public-nav-button active' : 'public-nav-button')}
          end
        >
          HOME
        </NavLink>
        <NavLink
          to="/register/victim"
          className={({ isActive }) => (isActive ? 'public-nav-button active' : 'public-nav-button')}
        >
          REGISTER
        </NavLink>
        <NavLink
          to="/track-application"
          className={({ isActive }) => (isActive ? 'public-nav-button active' : 'public-nav-button')}
        >
          TRACK APPLICATION
        </NavLink>
        <NavLink
          to="/login"
          className={({ isActive }) => (isActive ? 'public-nav-button active' : 'public-nav-button')}
        >
          VICTIM LOGIN
        </NavLink>
        <NavLink
          to="/counselor-portal"
          className={({ isActive }) => (isActive ? 'public-nav-button active' : 'public-nav-button')}
        >
          COUNSELOR PORTAL
        </NavLink>
        <NavLink
          to="/admin-portal"
          className={({ isActive }) => (isActive ? 'public-nav-button active' : 'public-nav-button')}
        >
          ADMIN PORTAL
        </NavLink>
      </div>
    </nav>
  );
}
