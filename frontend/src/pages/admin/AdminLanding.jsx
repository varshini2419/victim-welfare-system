import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLanding.css';

export default function AdminLanding() {
  const { user } = useAuth();

  return (
    <div className="admin-landing">
      {/* 1. GOVERNMENT TOP BAR */}
      <div className="admin-top-bar">
        <div className="admin-top-bar-left">
          <span className="admin-motto-hindi">सत्यमेव जयते</span>
          <span className="admin-top-bar-divider">|</span>
          <span>GOVERNMENT OF INDIA &bull; NATIONAL CRIME RECORDS BUREAU</span>
        </div>
        <div className="admin-top-bar-right">
          <span style={{ color: '#94a3b8' }}>Emergency: <strong style={{ color: '#f87171' }}>112</strong></span>
          <span className="admin-top-bar-divider">|</span>
          <Link to="/" className="admin-top-link">Main Portal</Link>
          <span className="admin-top-bar-divider">|</span>
          <Link to="/track-application" className="admin-top-link">Track Status</Link>
        </div>
      </div>

      {/* 2. MAIN HEADER WITH CENTRAL EMBLEM NOTCH */}
      <header className="admin-main-header">
        <div className="admin-header-corner-left" aria-hidden="true"></div>
        <div className="admin-header-corner-right" aria-hidden="true"></div>

        <div className="admin-header-content-wrapper">
          {/* Left: Branding */}
          <div className="admin-header-left">
            <img src="/images/emblem.png" alt="National Emblem" className="admin-ministry-emblem" />
            <div className="admin-branding-text">
              <h2 className="brand-main-title admin-brand-title">ATROCITIES</h2>
              <span className="admin-brand-subtitle">National Administration Command Center</span>
            </div>
          </div>

          {/* Center Notch: National Emblem + AAROHAN */}
          <div className="admin-center-notch">
            <img src="/images/emblem.png" alt="Emblem of India" className="admin-center-emblem" />
            <span className="admin-center-title">AAROHAN</span>
          </div>

          {/* Right: Login / Logout Button */}
          <div className="admin-header-right">
            {user ? (
              <Link to="/admin/dashboard" className="admin-header-login-btn">
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>GO TO DASHBOARD</span>
              </Link>
            ) : (
              <Link to="/admin/login" className="admin-header-login-btn">
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>ADMIN LOGIN</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO BANNER — TWO COLUMN LAYOUT */}
      <section
        className="admin-hero-section"
        style={{ backgroundImage: `url('/images/public/aarohan-hero-02.jpg')` }}
      >
        <div className="admin-hero-dark-overlay"></div>

        {/* Decorative SVG Swoosh */}
        <svg
          className="admin-hero-swoosh"
          viewBox="0 0 1440 640"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50,250 C350,80 700,500 1500,140 L1500,640 L-50,640 Z"
            fill="url(#adminSwooshGrad1)"
            opacity="0.28"
          />
          <path
            d="M-50,380 C450,220 850,560 1500,300 L1500,640 L-50,640 Z"
            fill="url(#adminSwooshGrad2)"
            opacity="0.42"
          />
          <path
            d="M-50,480 C550,360 950,620 1500,440 L1500,640 L-50,640 Z"
            fill="url(#adminSwooshGrad3)"
            opacity="0.55"
          />
          <defs>
            <linearGradient id="adminSwooshGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="adminSwooshGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="adminSwooshGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>
        </svg>

        {/* Two-Column Hero Grid */}
        <div className="admin-hero-grid">
          {/* LEFT COLUMN: Text Content */}
          <div className="admin-hero-left">
            <h1 className="admin-hero-title">AAROHAN</h1>
            <h2 className="admin-hero-subtitle">
              Centralized Administration &amp; Oversight Portal
            </h2>
            <p className="admin-hero-desc">
              A unified, AI-powered command center for district administrators to manage victim welfare cases, oversee counselor workflows, generate compliance reports, and monitor real-time system health.
            </p>

            {/* Single Login Button */}
            <div className="admin-hero-cta-row">
              <Link to="/admin/login" className="admin-hero-login-btn">
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>LOGIN TO ADMIN PORTAL</span>
              </Link>
            </div>

            {/* 4 Feature Badges — 2x2 Grid */}
            <div className="admin-hero-features-grid">
              {/* Feature 1: Counselor Management */}
              <div className="admin-feature-badge-card">
                <div className="admin-feature-main-content">
                  <div className="admin-feature-icon-box" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="admin-feature-svg">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="admin-feature-v-divider" aria-hidden="true" />
                  <div className="admin-feature-text-group">
                    <h3 className="admin-badge-title">Counselor Management</h3>
                    <p className="admin-badge-desc">Approve, monitor and manage all counselor accounts and case assignments.</p>
                  </div>
                </div>
                <div className="admin-feature-h-divider" aria-hidden="true" />
                <div className="admin-feature-action">
                  <a href="#capabilities" className="admin-feature-view-btn">
                    <span>View Details</span>
                    <span className="action-arrow" aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>

              {/* Feature 2: System Analytics */}
              <div className="admin-feature-badge-card">
                <div className="admin-feature-main-content">
                  <div className="admin-feature-icon-box" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="admin-feature-svg">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                      <line x1="2" y1="20" x2="22" y2="20" />
                    </svg>
                  </div>
                  <div className="admin-feature-v-divider" aria-hidden="true" />
                  <div className="admin-feature-text-group">
                    <h3 className="admin-badge-title">System Analytics</h3>
                    <p className="admin-badge-desc">Real-time dashboards with case resolution metrics and district performance KPIs.</p>
                  </div>
                </div>
                <div className="admin-feature-h-divider" aria-hidden="true" />
                <div className="admin-feature-action">
                  <a href="#capabilities" className="admin-feature-view-btn">
                    <span>View Details</span>
                    <span className="action-arrow" aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>

              {/* Feature 3: Mental Health Monitoring */}
              <div className="admin-feature-badge-card">
                <div className="admin-feature-main-content">
                  <div className="admin-feature-icon-box" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="admin-feature-svg">
                      <path d="M12 3a9 9 0 0 1 9 9c0 3.87-2.45 7.17-5.9 8.44L14 22h-4l-1.1-1.56A8.99 8.99 0 0 1 3 12" />
                      <path d="M3.5 13h3l1.5-3 2.5 6 2-4h2.5" />
                    </svg>
                  </div>
                  <div className="admin-feature-v-divider" aria-hidden="true" />
                  <div className="admin-feature-text-group">
                    <h3 className="admin-badge-title">Mental Health Monitoring</h3>
                    <p className="admin-badge-desc">District-level AI wellbeing trend reports across all active victim cases.</p>
                  </div>
                </div>
                <div className="admin-feature-h-divider" aria-hidden="true" />
                <div className="admin-feature-action">
                  <a href="#capabilities" className="admin-feature-view-btn">
                    <span>View Details</span>
                    <span className="action-arrow" aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>

              {/* Feature 4: Emergency & Escalation */}
              <div className="admin-feature-badge-card">
                <div className="admin-feature-main-content">
                  <div className="admin-feature-icon-box" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="admin-feature-svg">
                      {/* Emergency Shield with Medical Cross in upper-right */}
                      <path d="M17.5 2.5c1.4.6 2.8.8 2.8.8v3.5c0 2.8-1.6 4.4-2.8 5-1.2-.6-2.8-2.2-2.8-5V3.3s1.4-.2 2.8-.8z" />
                      <path d="M17.5 4.8v3.2" />
                      <path d="M15.9 6.4h3.2" />
                      {/* Separate Telephone Handset in lower-left */}
                      <g transform="translate(0.5, 3.2) scale(0.70)" strokeWidth="2.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </g>
                    </svg>
                  </div>
                  <div className="admin-feature-v-divider" aria-hidden="true" />
                  <div className="admin-feature-text-group">
                    <h3 className="admin-badge-title">Emergency &amp; Escalation</h3>
                    <p className="admin-badge-desc">Critical alert command center with priority dispatch and audit trail.</p>
                  </div>
                </div>
                <div className="admin-feature-h-divider" aria-hidden="true" />
                <div className="admin-feature-action">
                  <a href="#capabilities" className="admin-feature-view-btn">
                    <span>View Details</span>
                    <span className="action-arrow" aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Indicator Pills */}
            <div className="admin-hero-indicator-pills">
              <div className="admin-indicator-pill active"></div>
              <div className="admin-indicator-pill"></div>
              <div className="admin-indicator-pill"></div>
              <div className="admin-indicator-pill"></div>
            </div>
          </div>

          {/* RIGHT COLUMN: Dashboard Screenshot */}
          <div className="admin-hero-right">
            <div className="admin-dashboard-frame">
              <img
                src="/images/dashboard-hero.png"
                alt="AAROHAN Admin Dashboard"
                className="admin-dashboard-img"
              />
              <div className="admin-dashboard-live-badge">
                <div className="admin-live-dot"></div>
                LIVE DASHBOARD
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ADMIN'S QUICK LINKS CAPSULE */}
      <div className="admin-quick-links-wrapper">
        <a href="#capabilities" className="admin-quick-links-btn">
          <span>ADMIN&apos;S QUICK LINKS</span>
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>

      {/* 5. ADMIN CAPABILITIES SECTION */}
      <section id="capabilities" className="admin-capabilities-section">
        <div className="admin-section-container">
          <div className="admin-section-header">
            <span className="admin-section-tag">ADMINISTRATION COMMAND ARCHITECTURE</span>
            <h2 className="admin-section-heading">Governing Welfare with Intelligence &amp; Precision</h2>
            <p className="admin-section-subtext">
              A powerful, role-based administrative platform built for district governance, compliance monitoring, and AI-enhanced case oversight across the entire AAROHAN ecosystem.
            </p>
          </div>

          <div className="admin-capabilities-grid">
            <div className="admin-capability-card">
              <div className="admin-capability-icon">📋</div>
              <h3 className="admin-capability-title">Case Registration &amp; Approval</h3>
              <p className="admin-capability-desc">
                Centralized victim registration review, case ID issuance, approval workflow management, and district-level case routing to assigned counselors.
              </p>
            </div>

            <div className="admin-capability-card">
              <div className="admin-capability-icon">👤</div>
              <h3 className="admin-capability-title">User &amp; Role Management</h3>
              <p className="admin-capability-desc">
                Complete administrative control over all system users — create, edit, activate, deactivate, and assign roles with granular permission management.
              </p>
            </div>

            <div className="admin-capability-card">
              <div className="admin-capability-icon">📈</div>
              <h3 className="admin-capability-title">Compliance &amp; Reporting</h3>
              <p className="admin-capability-desc">
                Auto-generated district welfare reports, NCPCR compliance exports, IPC section 498A case analytics, and monthly progress dashboards.
              </p>
            </div>

            <div className="admin-capability-card">
              <div className="admin-capability-icon">🔐</div>
              <h3 className="admin-capability-title">Audit Log &amp; Integrity</h3>
              <p className="admin-capability-desc">
                Immutable system audit trails covering all authentication events, data modifications, and sensitive administrative actions with timestamp verification.
              </p>
            </div>

            <div className="admin-capability-card">
              <div className="admin-capability-icon">🚑</div>
              <h3 className="admin-capability-title">Emergency Alert Command</h3>
              <p className="admin-capability-desc">
                Critical incident management with one-click mass alert dispatch, geofenced notification broadcasts, and inter-agency escalation coordination.
              </p>
            </div>

            <div className="admin-capability-card">
              <div className="admin-capability-icon">⚙️</div>
              <h3 className="admin-capability-title">System Configuration</h3>
              <p className="admin-capability-desc">
                Portal-wide settings, SMS gateway management, OTP policy controls, welfare program toggles, and integration health monitoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. EMERGENCY SUPPORT & HELPLINES SECTION */}
      <section className="emergency-support-section">
        <div className="emergency-support-container">
          {/* Header area */}
          <div className="emergency-support-header">
            <div className="emergency-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="emergency-header-svg">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="emergency-header-divider-vertical" aria-hidden="true" />
            <div className="emergency-header-text">
              <h3 className="emergency-header-title">Emergency Support &amp; Helplines</h3>
              <p className="emergency-header-subtitle">Direct access to national emergency and support services</p>
            </div>
          </div>

          <div className="emergency-green-divider" aria-hidden="true" />

          {/* 4 Cards Grid */}
          <div className="emergency-cards-grid">
            {/* Card 1: Tele-MANAS */}
            <div className="emergency-card">
              <div className="emergency-card-top">
                <div className="emergency-logo-wrap">
                  <img src="/images/helplines/tele-manas.jpg" alt="Tele-MANAS Logo" className="emergency-card-logo" />
                </div>
                <div className="emergency-card-info">
                  <h4 className="emergency-service-name">Tele-MANAS</h4>
                  <p className="emergency-service-desc">National Mental Health Helpline</p>
                </div>
              </div>
              <div className="emergency-card-inner-divider" aria-hidden="true" />
              <div className="emergency-card-bottom">
                <div className="emergency-num-block">
                  <div className="emergency-num-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="emergency-mini-phone-icon" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Helpline Number</span>
                  </div>
                  <span className="emergency-card-number">14416</span>
                </div>
                <a href="tel:14416" className="emergency-contact-btn" title="Contact Tele-MANAS">
                  <span>CONTACT</span>
                  <span className="contact-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Card 2: National Emergency */}
            <div className="emergency-card emergency-card-112">
              <div className="emergency-card-top">
                <div className="emergency-logo-wrap">
                  <img src="/images/helplines/emergency-112.jpg" alt="National Emergency Logo" className="emergency-card-logo" />
                </div>
                <div className="emergency-card-info">
                  <h4 className="emergency-service-name">National Emergency</h4>
                  <p className="emergency-service-desc">Emergency Response Services</p>
                </div>
              </div>
              <div className="emergency-card-inner-divider" aria-hidden="true" />
              <div className="emergency-card-bottom">
                <div className="emergency-num-block">
                  <div className="emergency-num-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="emergency-mini-phone-icon" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Helpline Number</span>
                  </div>
                  <span className="emergency-card-number">112</span>
                </div>
                <a href="tel:112" className="emergency-contact-btn" title="Contact National Emergency 112">
                  <span>CONTACT</span>
                  <span className="contact-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Card 3: Childline */}
            <div className="emergency-card">
              <div className="emergency-card-top">
                <div className="emergency-logo-wrap">
                  <img src="/images/helplines/childline-1098.jpg" alt="Childline Logo" className="emergency-card-logo" />
                </div>
                <div className="emergency-card-info">
                  <h4 className="emergency-service-name">Childline</h4>
                  <p className="emergency-service-desc">Child Protection and Support Services</p>
                </div>
              </div>
              <div className="emergency-card-inner-divider" aria-hidden="true" />
              <div className="emergency-card-bottom">
                <div className="emergency-num-block">
                  <div className="emergency-num-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="emergency-mini-phone-icon" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Helpline Number</span>
                  </div>
                  <span className="emergency-card-number">1098</span>
                </div>
                <a href="tel:1098" className="emergency-contact-btn" title="Contact Childline 1098">
                  <span>CONTACT</span>
                  <span className="contact-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Card 4: Women Helpline */}
            <div className="emergency-card">
              <div className="emergency-card-top">
                <div className="emergency-logo-wrap">
                  <img src="/images/helplines/women-helpline-181.jpg" alt="Women Helpline Logo" className="emergency-card-logo" />
                </div>
                <div className="emergency-card-info">
                  <h4 className="emergency-service-name">Women Helpline</h4>
                  <p className="emergency-service-desc">Women Support and Assistance</p>
                </div>
              </div>
              <div className="emergency-card-inner-divider" aria-hidden="true" />
              <div className="emergency-card-bottom">
                <div className="emergency-num-block">
                  <div className="emergency-num-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="emergency-mini-phone-icon" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Helpline Number</span>
                  </div>
                  <span className="emergency-card-number">181</span>
                </div>
                <a href="tel:181" className="emergency-contact-btn" title="Contact Women Helpline 181">
                  <span>CONTACT</span>
                  <span className="contact-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. APP STORE BADGES */}
      <div className="admin-app-stores-row">
        <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '500', marginRight: '0.5rem' }}>
          Available on Government &amp; Enterprise Platforms:
        </span>
        <a href="#store" className="admin-store-badge admin-store-badge-light">
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 0h11.5v11.5H0V0zm12.5 0H24v11.5H12.5V0zM0 12.5h11.5V24H0V12.5zm12.5 0H24V24H12.5V12.5z"/>
          </svg>
          <span>Microsoft Store</span>
        </a>
        <a href="#store" className="admin-store-badge">
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.87-.9.04-2 .6-2.63 1.34-.56.64-.99 1.7-.86 2.73.99.08 2.02-.51 2.57-1.2z"/>
          </svg>
          <span>App Store</span>
        </a>
        <a href="#store" className="admin-store-badge">
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186c-.198-.182-.319-.44-.319-.738V2.552c0-.298.121-.556.318-.738zm11.23 11.23l2.257 2.257-9.453 5.437 7.196-7.694zm0-2.088L7.643 3.262l9.453 5.437-2.257 2.257zm1.189 1.044l2.973-1.71c.571-.328.571-.864 0-1.192l-2.973-1.71-1.796 1.796 1.796 1.816z"/>
          </svg>
          <span>Google Play</span>
        </a>
      </div>

      {/* 8. OFFICIAL FOOTER */}
      <footer className="admin-footer">
        <div className="admin-footer-inner">
          <div className="admin-footer-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/images/emblem.png" alt="National Emblem" style={{ height: '32px', filter: 'brightness(0) invert(1)', opacity: 0.7 }} />
              <div>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem' }}>AAROHAN ADMINISTRATION PORTAL</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ministry of Home Affairs &bull; National Crime Records Bureau</span>
              </div>
            </div>
            <nav className="admin-footer-nav">
              <Link to="/">Public Portal</Link>
              <Link to="/admin/login">Admin Sign In</Link>
              <Link to="/counselor-portal">Counselor Portal</Link>
              <Link to="/track-application">Track Application</Link>
              <Link to="/login">Victim Login</Link>
            </nav>
          </div>

          <div className="admin-footer-bottom">
            <span>&copy; {new Date().getFullYear()} AAROHAN &bull; National Crime Records Bureau, Ministry of Home Affairs, Government of India. All Rights Reserved.</span>
            <span>Designed for Governance &bull; STQC &amp; CERT-In Compliant Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
