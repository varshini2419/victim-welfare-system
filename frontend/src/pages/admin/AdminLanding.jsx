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
              <h2 className="admin-brand-title">ATROCITIES</h2>
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
            <div className="admin-portal-badge">
              <span>🏛️ SECURE ADMINISTRATION COMMAND CENTER</span>
            </div>

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
              <div className="admin-feature-badge-card">
                <div className="admin-badge-icon">👥</div>
                <h3 className="admin-badge-title">Counselor Management</h3>
                <p className="admin-badge-desc">Approve, monitor and manage all counselor accounts and case assignments.</p>
              </div>

              <div className="admin-feature-badge-card">
                <div className="admin-badge-icon">📊</div>
                <h3 className="admin-badge-title">System Analytics</h3>
                <p className="admin-badge-desc">Real-time dashboards with case resolution metrics and district performance KPIs.</p>
              </div>

              <div className="admin-feature-badge-card">
                <div className="admin-badge-icon">🧠</div>
                <h3 className="admin-badge-title">Mental Health Monitoring</h3>
                <p className="admin-badge-desc">District-level AI wellbeing trend reports across all active victim cases.</p>
              </div>

              <div className="admin-feature-badge-card">
                <div className="admin-badge-icon">🚨</div>
                <h3 className="admin-badge-title">Emergency &amp; Escalation</h3>
                <p className="admin-badge-desc">Critical alert command center with priority dispatch and audit trail.</p>
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

      {/* 6. EMERGENCY HELPLINES BAR */}
      <section className="admin-helpline-bar">
        <div className="admin-helpline-container">
          <div className="admin-helpline-left">
            <div className="admin-helpline-icon">🆘</div>
            <div className="admin-helpline-text">
              <h4>National Emergency &amp; Crisis Response</h4>
              <p>Direct emergency channels integrated with district command dispatch</p>
            </div>
          </div>
          <div className="admin-helpline-pills">
            <a href="tel:112" className="admin-helpline-pill">
              <span>🚓 National Emergency:</span> <strong>112</strong>
            </a>
            <a href="tel:14416" className="admin-helpline-pill">
              <span>🧠 Tele-MANAS:</span> <strong>14416</strong>
            </a>
            <a href="tel:181" className="admin-helpline-pill">
              <span>👩 Women Helpline:</span> <strong>181</strong>
            </a>
            <a href="tel:1098" className="admin-helpline-pill">
              <span>🧒 Childline:</span> <strong>1098</strong>
            </a>
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
