import React from 'react';
import { Link } from 'react-router-dom';
import './CounselorLanding.css';

export default function CounselorLanding() {
  return (
    <div className="counselor-landing">
      {/* 1. GOVERNMENT TOP BAR */}
      <div className="counselor-top-bar">
        <div className="counselor-top-bar-left">
          <span className="motto-hindi">सत्यमेव जयते</span>
          <span className="top-bar-divider">|</span>
          <span>GOVERNMENT OF INDIA &bull; NATIONAL CRIME RECORDS BUREAU</span>
        </div>
        <div className="counselor-top-bar-right">
          <span style={{ color: '#94a3b8' }}>Emergency Helpline: <strong style={{ color: '#f87171' }}>14416 (Tele-MANAS)</strong></span>
          <span className="top-bar-divider">|</span>
          <Link to="/" className="top-link">Main Portal</Link>
          <span className="top-bar-divider">|</span>
          <Link to="/track-application" className="top-link">Track Status</Link>
        </div>
      </div>

      {/* 2. MAIN HEADER WITH CENTRAL EMBLEM NOTCH */}
      <header className="counselor-main-header">
        <div className="header-accent-corner-left" aria-hidden="true"></div>
        <div className="header-accent-corner-right" aria-hidden="true"></div>

        <div className="header-content-wrapper">
          {/* Left Sub-Header (Matching Reference: ATROCITIES | A Beacon for Mental Well-being) */}
          <div className="header-left-section">
            <img src="/images/emblem.png" alt="National Emblem" className="header-ministry-emblem" />
            <div className="header-branding-text">
              <h2 className="brand-main-title">ATROCITIES</h2>
              <span className="brand-sub-title">A Beacon for Mental Well-being</span>
            </div>
          </div>

          {/* Center Notch: National Emblem + AAROHAN */}
          <div className="header-center-notch">
            <img src="/images/emblem.png" alt="Emblem of India" className="center-national-emblem" />
            <span className="center-aarohan-title">AAROHAN</span>
          </div>

          {/* Right Header: Single Login CTA */}
          <div className="header-right-section">
            <Link to="/counselor/login" className="header-login-btn">
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>LOGIN TO COUNSELOR PORTAL</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO BANNER SECTION (MATCHING SCREENSHOT LAYOUT & SWOOSH) */}
      <section 
        className="counselor-hero-section" 
        style={{ backgroundImage: `url('/images/public/aarohan-hero-01.png')` }}
      >
        <div className="counselor-hero-dark-overlay"></div>

        {/* Decorative Teal/Blue Swoosh Wave Layer */}
        <svg 
          className="hero-swoosh-layer" 
          viewBox="0 0 1440 600" 
          preserveAspectRatio="none" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M-50,200 C300,50 600,450 1500,100 L1500,600 L-50,600 Z" 
            fill="url(#swooshGrad1)" 
            opacity="0.3"
          />
          <path 
            d="M-50,320 C400,180 800,520 1500,240 L1500,600 L-50,600 Z" 
            fill="url(#swooshGrad2)" 
            opacity="0.45"
          />
          <path 
            d="M-50,420 C500,300 900,580 1500,380 L1500,600 L-50,600 Z" 
            fill="url(#swooshGrad3)" 
            opacity="0.6"
          />
          <defs>
            <linearGradient id="swooshGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="swooshGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#134e4a" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="swooshGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Hero Content */}
        <div className="hero-main-container">
          <h1 className="hero-title-main">AAROHAN</h1>
          <h2 className="hero-subheading-main">
            Empowering Counselors with AI-Assisted Mental Health Support
          </h2>
          <p className="hero-desc-main">
            Access intelligent tools, student insights, wellbeing metrics, and personalized support in one secure, unified clinical platform.
          </p>

          {/* Single Dedicated Login Action Button */}
          <div className="hero-cta-action-area">
            <Link to="/counselor/login" className="hero-main-login-btn">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>LOGIN TO COUNSELOR PORTAL</span>
            </Link>
          </div>

          {/* 4 Feature Badges (Matching Reference Style) */}
          <div className="hero-features-grid">
            {/* Feature 1: Mental Health Tracking & Support */}
            <div className="feature-badge-card">
              <div className="feature-card-main-content">
                <div className="feature-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="feature-card-svg">
                    <path d="M12 3a9 9 0 0 1 9 9c0 3.87-2.45 7.17-5.9 8.44L14 22h-4l-1.1-1.56A8.99 8.99 0 0 1 3 12" />
                    <path d="M3.5 13h3l1.5-3 2.5 6 2-4h2.5" />
                  </svg>
                </div>
                <div className="feature-card-v-divider" aria-hidden="true" />
                <div className="feature-card-text-group">
                  <h3 className="badge-card-title">Mental Health Tracking &amp; Support</h3>
                  <p className="badge-card-desc">Continuous emotional sentiment tracking and early psychological distress detection.</p>
                </div>
              </div>
              <div className="feature-card-h-divider" aria-hidden="true" />
              <div className="feature-card-action">
                <a href="#capabilities" className="feature-card-view-btn">
                  <span>View Details</span>
                  <span className="action-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 2: Student Wellbeing Metrics */}
            <div className="feature-badge-card">
              <div className="feature-card-main-content">
                <div className="feature-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="feature-card-svg">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    <path d="M9 11h6" />
                    <path d="M9 15h6" />
                    <path d="M9 19h4" />
                  </svg>
                </div>
                <div className="feature-card-v-divider" aria-hidden="true" />
                <div className="feature-card-text-group">
                  <h3 className="badge-card-title">Student Wellbeing Metrics</h3>
                  <p className="badge-card-desc">Standardized psychological indicators, PHQ-9 &amp; GAD-7 clinical metric logs.</p>
                </div>
              </div>
              <div className="feature-card-h-divider" aria-hidden="true" />
              <div className="feature-card-action">
                <a href="#capabilities" className="feature-card-view-btn">
                  <span>View Details</span>
                  <span className="action-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 3: AI-Powered Insights */}
            <div className="feature-badge-card">
              <div className="feature-card-main-content">
                <div className="feature-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="feature-card-svg">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
                    <path d="M9 15l1.5-5 1.5 5M9.5 13.5h2M14.5 10v5" />
                  </svg>
                </div>
                <div className="feature-card-v-divider" aria-hidden="true" />
                <div className="feature-card-text-group">
                  <h3 className="badge-card-title">AI-Powered Insights</h3>
                  <p className="badge-card-desc">Automated consultation transcripts, speech sentiment analysis, and risk triggers.</p>
                </div>
              </div>
              <div className="feature-card-h-divider" aria-hidden="true" />
              <div className="feature-card-action">
                <a href="#capabilities" className="feature-card-view-btn">
                  <span>View Details</span>
                  <span className="action-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Feature 4: 24/7 Helpline & Escalation */}
            <div className="feature-badge-card">
              <div className="feature-card-main-content">
                <div className="feature-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="feature-card-svg">
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
                <div className="feature-card-v-divider" aria-hidden="true" />
                <div className="feature-card-text-group">
                  <h3 className="badge-card-title">24/7 Helpline &amp; Escalation</h3>
                  <p className="badge-card-desc">Rapid crisis response protocol with automated emergency triage routing.</p>
                </div>
              </div>
              <div className="feature-card-h-divider" aria-hidden="true" />
              <div className="feature-card-action">
                <a href="#capabilities" className="feature-card-view-btn">
                  <span>View Details</span>
                  <span className="action-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>

          {/* Glowing Indicator Pills (Matching Screenshot) */}
          <div className="hero-indicator-pills">
            <div className="indicator-pill active"></div>
            <div className="indicator-pill"></div>
            <div className="indicator-pill"></div>
            <div className="indicator-pill"></div>
          </div>
        </div>
      </section>

      {/* 4. COUNSELOR'S QUICK LINKS CAPSULE BUTTON */}
      <div className="quick-links-capsule-wrapper">
        <a href="#capabilities" className="quick-links-capsule-btn">
          <span>COUNSELOR'S QUICK LINKS</span>
          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>

      {/* 5. WORKSPACE OVERVIEW / CLINICAL CAPABILITIES SECTION */}
      <section id="capabilities" className="counselor-details-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-tag">CLINICAL WORKSPACE ARCHITECTURE</span>
            <h2 className="section-heading-lg">Providing Informed and Compassionate Care</h2>
            <p className="section-subtext">
              A state-of-the-art digital infrastructure built to empower clinical psychologists, mental health professionals, and caseworkers with privacy-first AI intelligence.
            </p>
          </div>

          <div className="workspace-capabilities-grid">
            <div className="capability-card">
              <div className="capability-icon-box">📋</div>
              <h3 className="capability-title">Automated Case Triage</h3>
              <p className="capability-desc">
                Review verified victim cases assigned by district administration with complete timeline audits, medical records, and FIR documentation.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-icon-box">🎙️</div>
              <h3 className="capability-title">Multimodal Sentiment Analysis</h3>
              <p className="capability-desc">
                Analyze acoustic and linguistic distress features from victim voice check-ins to detect subtle shifts in emotional wellbeing.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-icon-box">🤝</div>
              <h3 className="capability-title">Welfare &amp; Legal Coordination</h3>
              <p className="capability-desc">
                Direct integration with social welfare departments for emergency rehabilitation, financial aid, and legal assistance tracking.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-icon-box">🔒</div>
              <h3 className="capability-title">Confidential Clinical Notes</h3>
              <p className="capability-desc">
                Encrypted clinical documentation with role-based access safeguards and strict compliance with national mental healthcare standards.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-icon-box">📅</div>
              <h3 className="capability-title">Tele-Consultation Scheduler</h3>
              <p className="capability-desc">
                Seamless appointment management, automated SMS appointment reminders, and follow-up consultation tracking.
              </p>
            </div>

            <div className="capability-card">
              <div className="capability-icon-box">⚡</div>
              <h3 className="capability-title">Crisis Escalation Protocol</h3>
              <p className="capability-desc">
                One-click critical alert dispatch to district response officers and nearest emergency healthcare centers during active crises.
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

      {/* 7. APP STORE BADGES (MATCHING SCREENSHOT) */}
      <div className="app-stores-row">
        <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '500', marginRight: '0.5rem' }}>
          Available on Government &amp; Enterprise Platforms:
        </span>
        <a href="#store" className="store-badge-btn store-badge-btn-light">
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 0h11.5v11.5H0V0zm12.5 0H24v11.5H12.5V0zM0 12.5h11.5V24H0V12.5zm12.5 0H24V24H12.5V12.5z"/>
          </svg>
          <span>Microsoft Store</span>
        </a>
        <a href="#store" className="store-badge-btn">
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.87-.9.04-2 .6-2.63 1.34-.56.64-.99 1.7-.86 2.73.99.08 2.02-.51 2.57-1.2z"/>
          </svg>
          <span>App Store</span>
        </a>
        <a href="#store" className="store-badge-btn">
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186c-.198-.182-.319-.44-.319-.738V2.552c0-.298.121-.556.318-.738zm11.23 11.23l2.257 2.257-9.453 5.437 7.196-7.694zm0-2.088L7.643 3.262l9.453 5.437-2.257 2.257zm1.189 1.044l2.973-1.71c.571-.328.571-.864 0-1.192l-2.973-1.71-1.796 1.796 1.796 1.816z"/>
          </svg>
          <span>Google Play</span>
        </a>
      </div>

      {/* 8. OFFICIAL FOOTER */}
      <footer className="counselor-footer">
        <div className="footer-inner-container">
          <div className="footer-top-links">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/images/emblem.png" alt="National Emblem" style={{ height: '32px', filter: 'brightness(0) invert(1)', opacity: 0.7 }} />
              <div>
                <strong style={{ color: '#f1f5f9', display: 'block', fontSize: '0.9rem' }}>AAROHAN COUNSELOR WORKSPACE</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ministry of Home Affairs &bull; National Crime Records Bureau</span>
              </div>
            </div>
            <div className="footer-nav">
              <Link to="/">Public Portal</Link>
              <Link to="/counselor/login">Counselor Sign In</Link>
              <Link to="/track-application">Track Application</Link>
              <Link to="/login">Victim Login</Link>
            </div>
          </div>

          <div className="footer-bottom-copy">
            <span>&copy; {new Date().getFullYear()} AAROHAN &bull; National Crime Records Bureau, Ministry of Home Affairs, Government of India. All Rights Reserved.</span>
            <span>Designed for Clinical Governance &bull; STQC &amp; CERT-In Compliant Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
