import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import './WelfarePortal.css';

// ── Helpers ─────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return 'N/A';
  const parsed = new Date(d);
  return isNaN(parsed.getTime())
    ? 'N/A'
    : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? age : null;
};

const display = (v) => (v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : 'N/A');

export default function WelfarePortal() {
  const { id: routeVictimId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryVictimId = searchParams.get('victimId');

  const [assignedVictims, setAssignedVictims] = useState([]);
  const [selectedVictimId, setSelectedVictimId] = useState(routeVictimId || queryVictimId || null);
  const [victimDetails, setVictimDetails] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch counselor's assigned victims
  const fetchAssignedVictims = useCallback(async () => {
    try {
      setLoadingList(true);
      setError('');
      const res = await api.get('/counselor/victims');
      const list = res.data?.data || [];
      setAssignedVictims(list);

      // Determine initial victim
      const currentTargetId = routeVictimId || queryVictimId;
      if (currentTargetId && list.some(v => (v._id || v.victimId) === currentTargetId)) {
        setSelectedVictimId(currentTargetId);
      } else if (list.length > 0) {
        const firstId = list[0]._id || list[0].victimId;
        setSelectedVictimId(firstId);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load assigned victims.');
    } finally {
      setLoadingList(false);
    }
  }, [routeVictimId, queryVictimId]);

  useEffect(() => {
    fetchAssignedVictims();
  }, [fetchAssignedVictims]);

  // 2. Fetch full registered victim profile & case data
  const fetchVictimRegistrationData = useCallback(async (vId) => {
    if (!vId) return;
    try {
      setLoadingDetails(true);
      setError('');
      const res = await api.get(`/counselor/victims/${vId}`);
      setVictimDetails(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch registered victim details.');
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVictimId) {
      fetchVictimRegistrationData(selectedVictimId);
    }
  }, [selectedVictimId, fetchVictimRegistrationData]);

  // Handle victim selection change
  const handleSelectVictim = (e) => {
    const newId = e.target.value;
    setSelectedVictimId(newId);
    setSearchParams({ victimId: newId });
  };

  // Extract structured details
  const profile = victimDetails?.profile || {};
  const userAccount = profile?.userId && typeof profile.userId === 'object' ? profile.userId : {};
  const cases = victimDetails?.cases || [];
  const primaryCase = cases[0] || {};
  const fir = primaryCase?.firDetails || {};
  const docs = primaryCase?.documents || [];
  const emergencyContacts = profile?.emergencyContacts || [];
  const supportList = primaryCase?.supportRequired || [];
  const counselorInfo = primaryCase?.assignedCounselorId || {};

  const victimName = profile?.name || 'Assigned Victim';
  const registrationId = userAccount?.registrationId || 'N/A';
  const caseId = primaryCase?.caseId || 'Pending Assignment';
  const userStatus = userAccount?.status || 'Active';
  const age = calculateAge(profile?.dob);

  return (
    <div className="welfare-portal-page">
      {/* ── 1. GOVERNMENT PORTAL TOP BANNER ────────────────────────────────────────── */}
      <header className="welfare-header-banner">
        <div className="welfare-header-content">
          <h1>
            <span aria-hidden="true">🏛️</span>
            <span>National Victim Welfare Portal</span>
          </h1>
          <p className="welfare-header-subtitle">
            Official Integrated Welfare &amp; Clinical Command Center &bull; Ministry of Home Affairs &bull; National Crime Records Bureau
          </p>
        </div>
        <div className="welfare-header-badge-group">
          <span className="welfare-gov-badge">
            <span aria-hidden="true">🔒</span>
            <span>Single Source of Truth: Registration DB</span>
          </span>
        </div>
      </header>

      {/* ── 2. INTERACTIVE ASSIGNED VICTIM SELECTOR ─────────────────────────────────── */}
      <section className="welfare-victim-selector-bar" aria-label="Victim Selector">
        <div className="victim-selector-label-wrap">
          <div className="selector-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="selector-title">Select Registered Victim Dossier</div>
            <div className="selector-subtitle">
              {assignedVictims.length} assigned victim{assignedVictims.length === 1 ? '' : 's'} linked to your counselor profile
            </div>
          </div>
        </div>

        <div className="victim-dropdown-container">
          <select
            className="victim-select-input"
            value={selectedVictimId || ''}
            onChange={handleSelectVictim}
            disabled={loadingList || assignedVictims.length === 0}
            aria-label="Select Victim"
          >
            {assignedVictims.length === 0 ? (
              <option value="">No assigned victims found</option>
            ) : (
              assignedVictims.map((v) => {
                const vid = v._id || v.victimId;
                return (
                  <option key={vid} value={vid}>
                    {v.name || 'Assigned Victim'} &bull; Case: {v.caseId || 'Pending'} ({v.district || 'AP'})
                  </option>
                );
              })
            )}
          </select>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '1rem', color: '#991b1b', marginBottom: '1.5rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loadingList || loadingDetails ? (
        <div className="welfare-loading-state">
          <div className="welfare-loading-spinner" aria-hidden="true">⏳</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
            Reading Registered Victim Dossier...
          </div>
          <p style={{ margin: '0.4rem 0 0', color: '#64748b' }}>
            Directly retrieving stored registration and case records from official database.
          </p>
        </div>
      ) : assignedVictims.length === 0 ? (
        /* Empty assigned victims */
        <div className="welfare-empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">📭</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem' }}>
            No Assigned Victims Found
          </div>
          <p style={{ maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.6, color: '#64748b' }}>
            There are currently no victim cases assigned to your counselor account. Once district administrators assign a case to you, their full registered dossier and welfare records will appear here automatically.
          </p>
          <Link
            to="/counselor/dashboard"
            style={{ display: 'inline-flex', padding: '0.6rem 1.25rem', background: '#0d9488', color: '#ffffff', borderRadius: 6, fontWeight: 700, textDecoration: 'none' }}
          >
            Return to Dashboard
          </Link>
        </div>
      ) : (
        /* ── 3. MAIN TWO-COLUMN VIEW ─────────────────────────────────────────────────── */
        <div className="welfare-main-grid">
          {/* ═════════ LEFT / MAIN COLUMN: COMPLETE REGISTERED VICTIM DOSSIER ═════════ */}
          <main className="victim-dossier-column">
            {/* Top Identity Card */}
            <div className="dossier-hero-card">
              <div className="dossier-avatar-wrap">
                {userAccount?.profileImage ? (
                  <img
                    src={userAccount.profileImage}
                    alt={victimName}
                    className="dossier-avatar-img"
                  />
                ) : (
                  <div className="dossier-avatar-fallback">
                    {victimName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="dossier-hero-info">
                <div className="dossier-hero-title-row">
                  <h2 className="dossier-victim-name">{victimName}</h2>
                  <span className={`badge-status ${String(userStatus).toLowerCase()}`}>
                    {userStatus}
                  </span>
                  {primaryCase?.status && (
                    <span className="badge-status assigned">
                      Case: {primaryCase.status}
                    </span>
                  )}
                </div>
                <div className="dossier-hero-meta-row">
                  <span className="dossier-meta-item">
                    <span>Reg ID:</span>
                    <strong>{registrationId}</strong>
                  </span>
                  <span className="dossier-meta-item">
                    <span>Case ID:</span>
                    <strong>{caseId}</strong>
                  </span>
                  <span className="dossier-meta-item">
                    <span>Registered:</span>
                    <strong>{fmtDate(userAccount?.createdAt || profile?.createdAt)}</strong>
                  </span>
                  {counselorInfo?.name && (
                    <span className="dossier-meta-item">
                      <span>Counselor:</span>
                      <strong>{counselorInfo.name}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 1: Personal Details */}
            <section className="dossier-section-card" aria-labelledby="personal-details-heading">
              <div className="dossier-section-header">
                <h3 id="personal-details-heading" className="dossier-section-title">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
                  </svg>
                  <span>1. Personal Information</span>
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>From Registration Form Step 1</span>
              </div>
              <div className="dossier-grid-fields">
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Full Name</span>
                  <span className="dossier-field-val">{display(profile.name)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Date of Birth</span>
                  <span className="dossier-field-val">
                    {fmtDate(profile.dob)} {age ? `(${age} years old)` : ''}
                  </span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Gender</span>
                  <span className="dossier-field-val">{display(profile.gender)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Social Category</span>
                  <span className="dossier-field-val">{display(profile.socialCategory)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Profession / Occupation</span>
                  <span className="dossier-field-val">{display(profile.profession)}</span>
                </div>
              </div>
            </section>

            {/* Section 2: Identification Details */}
            <section className="dossier-section-card" aria-labelledby="ident-details-heading">
              <div className="dossier-section-header">
                <h3 id="ident-details-heading" className="dossier-section-title">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="7" y1="8" x2="17" y2="8" />
                    <line x1="7" y1="12" x2="13" y2="12" />
                  </svg>
                  <span>2. Official Identification &amp; Verification</span>
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>STQC Masked / Encrypted at Rest</span>
              </div>
              <div className="dossier-grid-fields">
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Aadhaar Number</span>
                  <span className="dossier-field-val masked">
                    {profile.aadhaarNumber ? profile.aadhaarNumber : 'Not Provided / Encrypted'}
                  </span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">PAN Number</span>
                  <span className="dossier-field-val masked">
                    {profile.panNumber ? profile.panNumber : 'Not Provided / Encrypted'}
                  </span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Registration / Public Tracking ID</span>
                  <span className="dossier-field-val highlight">{display(registrationId)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Verification Status</span>
                  <span className="dossier-field-val">
                    {userAccount?.status === 'active' ? '✓ Verified & Approved' : display(userAccount?.status)}
                  </span>
                </div>
              </div>
            </section>

            {/* Section 3: Contact Details */}
            <section className="dossier-section-card" aria-labelledby="contact-details-heading">
              <div className="dossier-section-header">
                <h3 id="contact-details-heading" className="dossier-section-title">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>3. Contact &amp; Communication Details</span>
                </h3>
              </div>
              <div className="dossier-grid-fields">
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Primary Mobile Number</span>
                  <span className="dossier-field-val">{display(profile.phone)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Registered Email Address</span>
                  <span className="dossier-field-val">{display(userAccount?.email || profile?.email)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Preferred Notification Channel</span>
                  <span className="dossier-field-val">SMS &amp; In-Portal Alerts</span>
                </div>
              </div>
            </section>

            {/* Section 4: Address & Location Details */}
            <section className="dossier-section-card" aria-labelledby="address-details-heading">
              <div className="dossier-section-header">
                <h3 id="address-details-heading" className="dossier-section-title">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>4. Residential &amp; Location Details</span>
                </h3>
              </div>
              <div className="dossier-grid-fields">
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Complete Residential Address</span>
                  <span className="dossier-field-val">{display(profile.address)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">District</span>
                  <span className="dossier-field-val">{display(profile.district || userAccount?.district)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">State</span>
                  <span className="dossier-field-val">{display(userAccount?.state || profile?.state || 'Andhra Pradesh')}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">PIN Code</span>
                  <span className="dossier-field-val">{display(profile.pinCode)}</span>
                </div>
              </div>
            </section>

            {/* Section 5: Emergency & Family Contacts */}
            <section className="dossier-section-card" aria-labelledby="emergency-details-heading">
              <div className="dossier-section-header">
                <h3 id="emergency-details-heading" className="dossier-section-title">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>5. Emergency &amp; Family Contacts</span>
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {emergencyContacts.length} Contact{emergencyContacts.length === 1 ? '' : 's'} Registered
                </span>
              </div>
              {emergencyContacts.length === 0 ? (
                <div style={{ padding: '1.25rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.88rem' }}>
                  No secondary emergency contacts were registered during submission.
                </div>
              ) : (
                <div className="emergency-contacts-grid">
                  {emergencyContacts.map((c, idx) => (
                    <div key={idx} className="emergency-contact-card">
                      <div className="emergency-contact-name">{display(c.name)}</div>
                      <div className="emergency-contact-rel">Relationship: {display(c.relationship)}</div>
                      <div className="emergency-contact-phone">
                        <span aria-hidden="true">📞</span>
                        <strong>{display(c.phone)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 6: Case & Incident Registration Details */}
            <section className="dossier-section-card" aria-labelledby="case-details-heading">
              <div className="dossier-section-header">
                <h3 id="case-details-heading" className="dossier-section-title">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>6. Case &amp; Incident Registration Details</span>
                </h3>
                <span className="badge-status assigned">
                  Status: {display(primaryCase.status)}
                </span>
              </div>
              <div className="dossier-grid-fields">
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Official Case ID</span>
                  <span className="dossier-field-val highlight">{display(primaryCase.caseId)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Incident Category</span>
                  <span className="dossier-field-val">{display(primaryCase.category)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Case Registration Date</span>
                  <span className="dossier-field-val">{fmtDate(primaryCase.createdAt)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Assigned Counselor</span>
                  <span className="dossier-field-val">
                    {counselorInfo?.name || 'Assigned to Your Counselor Account'}
                  </span>
                </div>
              </div>

              {/* Support Requested Chips */}
              <div style={{ padding: '0 1.25rem 1rem' }}>
                <span className="dossier-field-label">Support Types Requested During Registration</span>
                <div className="tag-chip-group">
                  {supportList.length === 0 ? (
                    <span style={{ fontSize: '0.84rem', color: '#64748b' }}>None specifically checked</span>
                  ) : (
                    supportList.map((item, i) => (
                      <span key={i} className="tag-chip">&bull; {item}</span>
                    ))
                  )}
                </div>
              </div>

              {/* Full Incident Description */}
              <div className="dossier-full-field">
                <span className="dossier-field-label">Official Incident Narrative / Victim Statement</span>
                <div className="dossier-description-box">
                  {display(primaryCase.description)}
                </div>
              </div>
            </section>

            {/* Section 7: Police FIR Details */}
            <section className="dossier-section-card" aria-labelledby="fir-details-heading">
              <div className="dossier-section-header">
                <h3 id="fir-details-heading" className="dossier-section-title">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>7. Police &amp; FIR Records</span>
                </h3>
                <span className={`badge-status ${fir.isFiled ? 'active' : 'pending'}`}>
                  {fir.isFiled ? 'FIR Filed' : 'FIR Not Yet Filed'}
                </span>
              </div>
              <div className="dossier-grid-fields">
                <div className="dossier-field-item">
                  <span className="dossier-field-label">FIR Status</span>
                  <span className="dossier-field-val">{fir.isFiled ? 'Yes, Officially Registered' : 'No'}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">FIR Number</span>
                  <span className="dossier-field-val">{display(fir.firNumber)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Police Station</span>
                  <span className="dossier-field-val">{display(fir.policeStation)}</span>
                </div>
                <div className="dossier-field-item">
                  <span className="dossier-field-label">Jurisdiction District &amp; State</span>
                  <span className="dossier-field-val">
                    {display(fir.firDistrict)} {fir.firState ? `, ${fir.firState}` : ''}
                  </span>
                </div>
              </div>
            </section>

            {/* Section 8: Attached Registration Documents */}
            <section className="dossier-section-card" aria-labelledby="docs-details-heading">
              <div className="dossier-section-header">
                <h3 id="docs-details-heading" className="dossier-section-title">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                  <span>8. Attached Registration Documents</span>
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {docs.length} File{docs.length === 1 ? '' : 's'} Uploaded
                </span>
              </div>
              {docs.length === 0 ? (
                <div style={{ padding: '1.25rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.88rem' }}>
                  No supporting documents were uploaded during registration.
                </div>
              ) : (
                <div className="docs-list-wrap">
                  {docs.map((doc, idx) => (
                    <div key={idx} className="doc-item-row">
                      <div className="doc-name-side">
                        <span aria-hidden="true">📄</span>
                        <div>
                          <div>{doc.originalName || doc.fileName || `Document #${idx + 1}`}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>
                            Uploaded: {fmtDate(doc.uploadedAt)}
                          </div>
                        </div>
                      </div>
                      {doc.fileName && (
                        <a
                          href={`/api/v1/counselor/documents/${doc.fileName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-view-link"
                        >
                          <span>View Securely</span>
                          <span aria-hidden="true">&rarr;</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>

          {/* ═════════ RIGHT COLUMN: SEPARATE WELFARE SERVICES SECTION ═════════ */}
          <aside className="welfare-services-column" aria-label="Welfare Services & Schemes">
            <div className="welfare-services-header-card">
              <h2>
                <span aria-hidden="true">🛡️</span>
                <span>Welfare Services &amp; Schemes</span>
              </h2>
              <p>
                Integrated government rehabilitation, financial relief, legal assistance, and institutional support portals for this victim.
              </p>
            </div>

            {/* Scheme 1: Financial Relief */}
            <div className="welfare-scheme-card">
              <div className="scheme-card-top">
                <div className="scheme-icon-box financial" aria-hidden="true">₹</div>
                <div className="scheme-title-area">
                  <h3>Direct Benefit Financial Relief</h3>
                  <span>PoA Act Schedule Relief</span>
                </div>
              </div>
              <p className="scheme-desc">
                Government direct compensation and ex-gratia relief based on FIR registration, medical disability assessment, and charge-sheet progress.
              </p>
              <div className="scheme-status-pill ready">
                <span className="dot" />
                <span>Portal Integration Ready</span>
              </div>
            </div>

            {/* Scheme 2: Medical & Trauma Support */}
            <div className="welfare-scheme-card">
              <div className="scheme-card-top">
                <div className="scheme-icon-box medical" aria-hidden="true">🏥</div>
                <div className="scheme-title-area">
                  <h3>Medical &amp; Trauma Healthcare</h3>
                  <span>Clinical Governance Network</span>
                </div>
              </div>
              <p className="scheme-desc">
                Authorized government hospital linkages, physical trauma rehabilitation, psychiatric consultations, and medical expense vouchers.
              </p>
              <div className="scheme-status-pill ready">
                <span className="dot" />
                <span>Portal Integration Ready</span>
              </div>
            </div>

            {/* Scheme 3: Legal Aid & Protection */}
            <div className="welfare-scheme-card">
              <div className="scheme-card-top">
                <div className="scheme-icon-box legal" aria-hidden="true">⚖️</div>
                <div className="scheme-title-area">
                  <h3>Legal Aid &amp; Witness Protection</h3>
                  <span>NALSA / DLSA Linkage</span>
                </div>
              </div>
              <p className="scheme-desc">
                Free district legal services counsel assignment, FIR fast-tracking, court escort security, and witness threat monitoring protocols.
              </p>
              <div className="scheme-status-pill ready">
                <span className="dot" />
                <span>Portal Integration Ready</span>
              </div>
            </div>

            {/* Scheme 4: Shelter & Housing */}
            <div className="welfare-scheme-card">
              <div className="scheme-card-top">
                <div className="scheme-icon-box shelter" aria-hidden="true">🏡</div>
                <div className="scheme-title-area">
                  <h3>Shelter &amp; Safe Relocation</h3>
                  <span>Swadhar Greh &amp; Transit Home</span>
                </div>
              </div>
              <p className="scheme-desc">
                Emergency temporary shelter accommodation, safe house relocation for high-risk families, and district transit housing assistance.
              </p>
              <div className="scheme-status-pill ready">
                <span className="dot" />
                <span>Portal Integration Ready</span>
              </div>
            </div>

            {/* Scheme 5: Skill & Livelihood */}
            <div className="welfare-scheme-card">
              <div className="scheme-card-top">
                <div className="scheme-icon-box skill" aria-hidden="true">💼</div>
                <div className="scheme-title-area">
                  <h3>Livelihood &amp; Social Reintegration</h3>
                  <span>National Skill Mission</span>
                </div>
              </div>
              <p className="scheme-desc">
                Vocational skill development enrollment, self-employment micro-credit grants, and long-term socio-economic rehabilitation.
              </p>
              <div className="scheme-status-pill ready">
                <span className="dot" />
                <span>Portal Integration Ready</span>
              </div>
            </div>

            {/* Integration Notice Placeholder */}
            <div className="welfare-integration-notice">
              <div style={{ fontSize: '1.25rem' }} aria-hidden="true">🔌</div>
              <p>
                <strong>Welfare Portals Expansion Slot</strong><br />
                Specific welfare portals and direct application links will be activated and connected here as provided.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
