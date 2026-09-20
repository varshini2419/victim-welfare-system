import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import "./TrackApplication.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const TrackApplication = () => {
  const [searchParams] = useSearchParams();
  const [inputId, setInputId] = useState(searchParams.get("registrationId") || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preloaded = searchParams.get("registrationId");
    if (preloaded && preloaded.trim().length > 5) {
      doSearch(preloaded.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = async (id) => {
    const searchId = (id || inputId).trim();
    if (!searchId) {
      setError("Please enter a Registration ID.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await axios.get(
        `${API_BASE}/auth/registration-status/${encodeURIComponent(searchId)}`
      );
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to retrieve registration status. Please check the ID and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    doSearch();
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="track-app-page">
      {/* 1. EXISTING NAVBAR - UNCHANGED */}
      <PublicNavbar />

      {/* 2. HERO / INTRO SECTION */}
      <section className="track-hero-section" aria-label="Page Introduction">
        <div className="track-hero-inner">
          <div className="track-hero-content">
            {/* Breadcrumbs */}
            <nav className="track-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/" className="track-breadcrumb-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                Home
              </Link>
              <span className="track-breadcrumb-sep" aria-hidden="true">&gt;</span>
              <span className="track-breadcrumb-current">Track Application</span>
            </nav>

            <h1 className="track-hero-title">Track Your Application</h1>
            <p className="track-hero-subtitle">
              Enter your registration ID to view the current status of your application. Your ID was provided when you completed registration.
            </p>
          </div>

          {/* Large Parliament Watermark Graphic matching reference design */}
          <div className="track-hero-graphic-wrap" aria-hidden="true">
            <img
              src="/images/tracking-parliament-watermark.png"
              alt=""
              className="track-hero-graphic"
            />
          </div>
        </div>
      </section>

      {/* 3. MAIN TRACKING CONTENT: Two-Column Layout */}
      <main className="track-main-body">
        <div className="track-main-inner">
          <div className="track-grid">
            
            {/* LEFT COLUMN: REGISTRATION SEARCH & HELP CARD */}
            <section className="track-card" aria-labelledby="reg-id-heading">
              {/* Card Header */}
              <div className="track-card-header">
                <div className="track-icon-box" aria-hidden="true">
                  <svg className="track-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <circle cx="11" cy="14" r="3" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <div>
                  <h2 id="reg-id-heading" className="track-card-title">Registration ID</h2>
                  <p className="track-card-desc">Enter the exact registration ID from your confirmation message.</p>
                </div>
              </div>

              {/* Horizontal Input + Check Status Button */}
              <form onSubmit={handleFormSubmit} className="track-form">
                <div className="track-input-wrap">
                  <input
                    type="text"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value.toUpperCase())}
                    placeholder="e.g. ARH-REG-A7F93E1B8C2456D60"
                    className="track-input"
                    aria-label="Registration ID"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="track-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>{loading ? "Checking..." : "Check Status"}</span>
                  <span aria-hidden="true" style={{ fontSize: "1.05rem", lineHeight: 1 }}>&rarr;</span>
                </button>
              </form>

              {/* Example Text */}
              <p className="track-example-text">
                Example: <span className="track-example-code">ARH-REG-A7F93E1B8C2456D60</span>
              </p>

              {/* Error Message */}
              {error && (
                <div className="track-error-alert" role="alert">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Status Results Display */}
              {result && (
                <div className="track-result-wrap" aria-live="polite">
                  {result.status === "pending" && (
                    <div className="track-status-box pending">
                      <div className="track-status-header">
                        <h3 className="track-status-title">Application Status</h3>
                        <span className="track-badge pending">
                          <span className="track-badge-dot" />
                          PENDING REVIEW
                        </span>
                      </div>
                      <div className="track-status-body-card">
                        <span style={{ fontSize: "1.35rem", lineHeight: 1 }} aria-hidden="true">⏳</span>
                        <div>
                          <p className="track-status-message-title">Your application is under review</p>
                          <p className="track-status-message-desc">
                            A support officer is reviewing your registration details and will update your status shortly.
                          </p>
                        </div>
                      </div>
                      <div className="track-details-row">
                        <span className="track-details-label">Registration ID</span>
                        <span className="track-details-value" style={{ fontFamily: "monospace" }}>{result.registrationId}</span>
                      </div>
                    </div>
                  )}

                  {result.status === "approved" && (
                    <div className="track-status-box approved">
                      <div className="track-status-header">
                        <h3 className="track-status-title">Application Status</h3>
                        <span className="track-badge approved">
                          <span className="track-badge-dot" />
                          APPROVED
                        </span>
                      </div>
                      <div className="track-status-body-card">
                        <span style={{ fontSize: "1.35rem", lineHeight: 1 }} aria-hidden="true">✅</span>
                        <div>
                          <p className="track-status-message-title">Your application has been approved</p>
                          <p className="track-status-message-desc">
                            A Case ID has been assigned and your account is active for login.
                          </p>
                        </div>
                      </div>
                      {result.caseId && (
                        <div className="track-details-row">
                          <span className="track-details-label">Assigned Case ID</span>
                          <span className="track-details-value" style={{ fontFamily: "monospace", color: "#15803d" }}>{result.caseId}</span>
                        </div>
                      )}
                      {result.approvedAt && (
                        <div className="track-details-row">
                          <span className="track-details-label">Approved Date</span>
                          <span className="track-details-value">{formatDate(result.approvedAt)}</span>
                        </div>
                      )}
                      <Link to="/login" className="track-login-action-btn">
                        GO TO VICTIM LOGIN &rarr;
                      </Link>
                    </div>
                  )}

                  {result.status === "rejected" && (
                    <div className="track-status-box rejected">
                      <div className="track-status-header">
                        <h3 className="track-status-title">Application Status</h3>
                        <span className="track-badge rejected">
                          <span className="track-badge-dot" />
                          NOT APPROVED
                        </span>
                      </div>
                      <div className="track-status-body-card">
                        <span style={{ fontSize: "1.35rem", lineHeight: 1 }} aria-hidden="true">⚠️</span>
                        <div>
                          <p className="track-status-message-title">Application was not approved</p>
                          <p className="track-status-message-desc">
                            The reviewing team has provided the following status information.
                          </p>
                        </div>
                      </div>
                      {result.rejectionReason && (
                        <div className="track-details-row">
                          <span className="track-details-label">Reason</span>
                          <span className="track-details-value" style={{ color: "#b91c1c" }}>{result.rejectionReason}</span>
                        </div>
                      )}
                      {result.reviewedAt && (
                        <div className="track-details-row">
                          <span className="track-details-label">Reviewed On</span>
                          <span className="track-details-value">{formatDate(result.reviewedAt)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. NEED HELP INFORMATION BOX */}
              <div className="track-help-panel">
                <div className="track-help-header">
                  <svg className="track-help-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Need help?</span>
                </div>
                <ul className="track-help-list">
                  <li className="track-help-item">
                    <span className="track-bullet" aria-hidden="true">&bull;</span>
                    <span>Use the exact registration ID from your confirmation message.</span>
                  </li>
                  <li className="track-help-item">
                    <span className="track-bullet" aria-hidden="true">&bull;</span>
                    <span>Applications are usually reviewed within a short verification window.</span>
                  </li>
                  <li className="track-help-item">
                    <span className="track-bullet" aria-hidden="true">&bull;</span>
                    <span>If you lost the ID, contact the welfare support helpline.</span>
                  </li>
                </ul>

                <hr className="track-help-divider" />

                <h3 className="track-reapply-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span>Need to reapply?</span>
                </h3>
                <p className="track-reapply-desc">
                  Your registration ID was shown after successful submission. If you need to apply again, please start a fresh registration.
                </p>
                <Link to="/register/victim" className="track-reapply-link">
                  Submit a new registration &rarr;
                </Link>
              </div>
            </section>

            {/* RIGHT COLUMN: QUICK SUPPORT CARD */}
            <aside className="track-support-card" aria-labelledby="quick-support-heading">
              <div className="track-support-header">
                <svg className="track-support-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <h2 id="quick-support-heading" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f2b5c", margin: 0 }}>
                  Quick Support
                </h2>
              </div>

              {/* 1. Welfare Support Helpline */}
              <div className="track-support-item">
                <div className="track-support-icon-wrap" aria-hidden="true">
                  <svg className="track-support-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="track-support-content">
                  <p className="track-support-title">Welfare Support Helpline</p>
                  <p className="track-support-subtext">
                    <span className="track-support-phone">1800-XXX-XXXX</span>
                    <span className="track-support-tag">(Toll Free)</span>
                  </p>
                </div>
              </div>

              {/* 2. Email Support */}
              <div className="track-support-item">
                <div className="track-support-icon-wrap" aria-hidden="true">
                  <svg className="track-support-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="track-support-content">
                  <p className="track-support-title">Email Support</p>
                  <a href="mailto:support@aarohan.gov.in" className="track-support-email">
                    support@aarohan.gov.in
                  </a>
                </div>
              </div>

              {/* 3. FAQs */}
              <div className="track-support-item">
                <div className="track-support-icon-wrap" aria-hidden="true">
                  <svg className="track-support-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="track-support-content">
                  <p className="track-support-title">FAQs</p>
                  <p className="track-support-subtext">Find answers to common questions</p>
                </div>
              </div>

              {/* 4. Your Safety Matters */}
              <div className="track-support-item">
                <div className="track-support-icon-wrap" aria-hidden="true">
                  <svg className="track-support-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div className="track-support-content">
                  <p className="track-support-title">Your Safety Matters</p>
                  <p className="track-support-subtext">We are here to support you</p>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </main>

      {/* 4. EXISTING FOOTER - UNCHANGED */}
      <PublicFooter />
    </div>
  );
};

export default TrackApplication;
