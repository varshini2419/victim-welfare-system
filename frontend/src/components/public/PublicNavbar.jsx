import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicNavbar() {
  return (
    <nav className="public-navbar">
      <div className="public-navbar-left">
        <img src="/images/emblem.png" alt="Government of India Emblem" className="public-navbar-logo" />
        <span className="public-navbar-title">AAROHAN</span>
      </div>
      <div className="public-navbar-right">
        <Link to="/login" className="public-login-btn">LOGIN</Link>
      </div>
    </nav>
  );
}
