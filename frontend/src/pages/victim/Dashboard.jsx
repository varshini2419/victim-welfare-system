import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        console.log('VICTIM COUNSELOR RAW RESPONSE:', counselorRes.data);
        const counselor = counselorRes.data?.data?.counselor;
        setAssignedCounselor(counselor);
      } catch (err) {
        console.error('FAILED TO LOAD VICTIM COUNSELOR:', err.response?.data || err);
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
    return <div className="loading-state" style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <section style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome, {profile?.name}</h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Case ID: <span style={{ fontWeight: 'bold', color: '#111827', fontFamily: 'monospace' }}>{caseInfo?.caseId}</span></p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Profile Card */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem' }}>My Profile</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>Name</span><span style={{ fontWeight: '500' }}>{profile?.name}</span></div>
            <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>Gender</span><span style={{ fontWeight: '500' }}>{profile?.gender}</span></div>
            <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>Profession</span><span style={{ fontWeight: '500' }}>{profile?.profession}</span></div>
            <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>District</span><span style={{ fontWeight: '500' }}>{profile?.userId?.district}</span></div>
            <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>State</span><span style={{ fontWeight: '500' }}>{profile?.userId?.state}</span></div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Case Info */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Case Details</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>Status</span>
                <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600' }}>
                  {caseInfo?.status.toUpperCase()}
                </span>
              </div>
              <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>Category</span><span style={{ fontWeight: '500' }}>{caseInfo?.category}</span></div>
              <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>Registration Date</span><span style={{ fontWeight: '500' }}>{new Date(caseInfo?.createdAt).toLocaleDateString()}</span></div>
              {caseInfo?.firDetails?.isFiled && (
                <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>FIR Number</span><span style={{ fontWeight: '500', fontFamily: 'monospace' }}>{caseInfo.firDetails.firNumber}</span></div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem' }}>My Documents</h2>
            {caseInfo?.documents && caseInfo.documents.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                {caseInfo.documents.map((doc, idx) => (
                  <li key={idx}>
                    <a 
                      href={`http://localhost:5000/api/v1/victim/documents/${doc.fileName}?token=${localStorage.getItem('token')}`}
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', textDecoration: 'none', color: '#2563eb', fontWeight: '500' }}
                    >
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                      {doc.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No documents uploaded yet.</p>
            )}
          </div>
        </div>

      </div>

      {assignedCounselor ? (
        <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem' }}>YOUR ASSIGNED COUNSELOR</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>👤 {assignedCounselor.name}</span></div>
            <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>Qualification:</span><span style={{ fontWeight: '500' }}>{assignedCounselor.qualification}</span></div>
            <div><span style={{ color: '#6b7280', display: 'block', fontSize: '0.875rem' }}>Phone Number:</span><span style={{ fontWeight: '500' }}>{assignedCounselor.phone}</span></div>
          </div>
        </section>
      ) : (
        <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem' }}>YOUR ASSIGNED COUNSELOR</h2>
          <div style={{ color: '#6b7280' }}>Your request is currently under review.</div>
        </section>
      )}
    </div>
  );
}
