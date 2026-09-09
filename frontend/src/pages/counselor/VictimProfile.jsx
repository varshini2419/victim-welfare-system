import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import EmotionChart from '../../components/charts/EmotionChart';

const display = (val) => val || 'N/A';

export default function VictimProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [victimData, setVictimData] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!id) {
        setError('Victim ID is required.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/counselor/victims/${id}`);
        if (mounted) {
          setVictimData(res.data.data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Failed to load victim profile.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [id]);

  const profile = victimData?.profile;
  const cases = victimData?.cases || [];
  const distressAnalysis = victimData?.distressAnalysis;

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Victim Profile: {profile?.name || 'Assigned Victim'}
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Assigned victim profile, case records, and psychological distress metrics</span>
        </div>

        <Link to="/counselor/victims" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
          &larr; Back to Victims Directory
        </Link>
      </header>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading victim profile data...</div>}
      {!loading && error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Individual Distress Score & Emotion Analysis Visual Chart */}
          <EmotionChart analysis={distressAnalysis} />

          {/* Victim Demographic & Personal Details Card */}
          <section style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              👤 Victim Personal &amp; Demographic Information
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 2px 0' }}>Full Name</p>
                <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{display(profile?.name)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 2px 0' }}>Phone Number</p>
                <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{display(profile?.phone)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 2px 0' }}>Email Address</p>
                <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{display(profile?.email)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 2px 0' }}>Gender</p>
                <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{display(profile?.gender)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 2px 0' }}>State</p>
                <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{display(profile?.state)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 2px 0' }}>District</p>
                <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{display(profile?.district)}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 2px 0' }}>Residential Address</p>
                <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{display(profile?.address)}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 4px 0' }}>Emergency Contacts</p>
                {profile?.emergencyContacts?.length ? (
                  profile.emergencyContacts.map((c, i) => (
                    <p key={i} style={{ fontWeight: '500', color: '#1e293b', margin: '2px 0' }}>
                      {display(c.name)} ({display(c.relationship)}) &bull; 📞 {display(c.phone)}
                    </p>
                  ))
                ) : (
                  <p style={{ fontWeight: '500', color: '#64748b' }}>No emergency contacts listed.</p>
                )}
              </div>
            </div>
          </section>

          {/* Associated Cases & Support Requests */}
          <section style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              📋 Assigned Case History &amp; Reports ({cases.length})
            </h2>

            {cases.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No case records directly linked to this victim profile.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {cases.map((c) => (
                  <div key={c._id} style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>CASE ID: #{c.caseId || c._id}</div>
                      <div style={{ color: '#475569', fontSize: '0.85rem', marginTop: '4px' }}>Category: {c.category || 'Support'}</div>
                      <div style={{ color: '#475569', fontSize: '0.85rem' }}>Status: {c.status}</div>
                    </div>
                    <button
                      onClick={() => navigate(`/counselor/case-report/${c._id}`)}
                      style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.6rem 1rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      VIEW CASE REPORT &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
