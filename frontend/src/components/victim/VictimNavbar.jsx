import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './VictimLayout.css';

export default function VictimNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="victim-navbar">
      <div className="navbar-left">
        <img src="/images/emblem.png" alt="Government of India Emblem" className="navbar-logo" />
        <div className="brand-text">
          <span className="brand-title">Government of India |</span>
          <span className="brand-subtitle">National Crime Records Bureau</span>
        </div>
      </div>
      
      <div className="navbar-center">
        <h1>AAROHAN (Victim Support Portal)</h1>
      </div>
      
      <div className="navbar-right">
        <div className="user-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" className="profile-svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <div className="user-details">
          <span className="logged-in-text">Logged in as:</span>
          <span className="user-name">{user?.name || 'Victim Session'}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="victim-logout-btn"
          title="Sign Out"
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
