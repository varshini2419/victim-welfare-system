import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicNavbar() {
  return (
    <nav className="public-navbar">
      <div className="public-navbar-left">
        <img src="/images/emblem.png" alt="Government of India Emblem" className="public-navbar-logo" />
        <span className="public-navbar-title">AAROHAN</span>
      </div>
      <div className="public-navbar-right" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#1d4ed8', backgroundColor: '#eff6ff', textDecoration: 'none', padding: '0.5rem 0.875rem', borderRadius: '999px', border: '1px solid #bfdbfe' }}>HOME</Link>
        <Link to="/register/victim" className="public-register-btn" style={{ fontWeight: 'bold', color: '#111827', textDecoration: 'none' }}>REGISTER</Link>
        <Link to="/track-application" style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#1d4ed8', textDecoration: 'none', padding: '0.375rem 0.75rem', borderRadius: '4px', border: '1px solid #bfdbfe' }}>TRACK APPLICATION</Link>
        <Link to="/login" className="public-login-btn" style={{ backgroundColor: '#2563eb', color: 'white' }}>VICTIM LOGIN</Link>
        <Link to="/counselor-portal" style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#047857', backgroundColor: '#ecfdf5', textDecoration: 'none', padding: '0.375rem 0.75rem', borderRadius: '4px', border: '1px solid #a7f3d0' }}>COUNSELOR PORTAL</Link>
        <Link to="/admin-portal" style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#475569', textDecoration: 'none', padding: '0.375rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>ADMIN PORTAL</Link>
      </div>
    </nav>
  );
}
