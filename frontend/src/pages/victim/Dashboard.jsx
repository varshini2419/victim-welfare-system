import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './Dashboard.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [caseInfo, setCaseInfo] = useState(null);
  const [assignedCounselor, setAssignedCounselor] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, caseRes] = await Promise.all([
          api.get('/victim/my-profile'),
          api.get('/victim/my-case')
        ]);

        setProfile(profileRes.data.data);
        setCaseInfo(caseRes.data.data);

        const counselorRes = await api.get('/victim/counselor');
        const counselor = counselorRes.data?.data?.counselor;
        setAssignedCounselor(counselor);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading-state">Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="loading-state error-state">{error}</div>;
  }

  const statusLabel = caseInfo?.status ? caseInfo.status.toUpperCase() : 'ACTIVE';

  return (
    <div className="victim-dashboard">
      <section className="victim-dashboard-hero">
        <div className="victim-greeting-block">
          <span className="eyebrow">Your support portal</span>
          <h1>Welcome, {profile?.name || 'Victim'}</h1>
          <p>
            Case ID: <span className="case-id">{caseInfo?.caseId || 'N/A'}</span>
          </p>
        </div>
        <div className="victim-case-chip">{statusLabel}</div>
      </section>

      <div className="victim-overview-grid">
        <div className="info-card profile-card">
          <h2>My Profile</h2>
          <div className="profile-grid">
            <div className="field-row">
              <span className="field-label">Name</span>
              <span className="field-value">{profile?.name}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Gender</span>
              <span className="field-value">{profile?.gender}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Profession</span>
              <span className="field-value">{profile?.profession}</span>
            </div>
            <div className="field-row">
              <span className="field-label">District</span>
              <span className="field-value">{profile?.userId?.district}</span>
            </div>
            <div className="field-row">
              <span className="field-label">State</span>
              <span className="field-value">{profile?.userId?.state}</span>
            </div>
          </div>
        </div>

        <div className="side-stack">
          <div className="info-card case-card">
            <h2>Case Details</h2>
            <div className="case-list">
              <div className="info-item">
                <span className="field-label">Status</span>
                <span className="status-badge">{statusLabel}</span>
              </div>
              <div className="info-item">
                <span className="field-label">Category</span>
                <span className="field-value">{caseInfo?.category}</span>
              </div>
              <div className="info-item">
                <span className="field-label">Registration Date</span>
                <span className="field-value">{caseInfo?.createdAt ? new Date(caseInfo.createdAt).toLocaleDateString() : '—'}</span>
              </div>
              {caseInfo?.firDetails?.isFiled && (
                <div className="info-item">
                  <span className="field-label">FIR Number</span>
                  <span className="field-value mono">{caseInfo.firDetails.firNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="info-card documents-card">
            <h2>My Documents</h2>
            {caseInfo?.documents && caseInfo.documents.length > 0 ? (
              <ul className="document-list">
                {caseInfo.documents.map((doc, idx) => (
                  <li key={idx}>
                    <a
                      href={`http://localhost:5000/api/v1/victim/documents/${doc.fileName}?token=${localStorage.getItem('token')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="document-link"
                    >
                      <span className="doc-icon">📄</span>
                      {doc.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-muted">No documents uploaded yet.</p>
            )}
          </div>
        </div>
      </div>

      {assignedCounselor ? (
        <section className="info-card counselor-card">
          <h2>Your Assigned Counselor</h2>
          <div className="counselor-info">
            <div className="counselor-avatar">👤</div>
            <div className="counselor-details">
              <div className="counselor-name">{assignedCounselor.name}</div>
              <div className="counselor-meta">Qualification: {assignedCounselor.qualification}</div>
              <div className="counselor-meta">Phone Number: {assignedCounselor.phone}</div>
            </div>
          </div>
        </section>
      ) : (
        <section className="info-card counselor-card">
          <h2>Your Assigned Counselor</h2>
          <div className="empty-muted">Your request is currently under review.</div>
        </section>
      )}
    </div>
  );
}
