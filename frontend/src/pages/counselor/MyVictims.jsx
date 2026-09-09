import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import PowerBiDistressDashboard from '../../components/charts/PowerBiDistressDashboard';

const BAND_COLORS = {
  Low: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  Moderate: { bg: '#fef3c7', text: '#b45309', border: '#fde047' },
  High: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  Severe: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }
};

const EMOTION_ICONS = {
  Fearful: '😨 Fearful',
  Anxious: '😟 Anxious',
  Sad: '😢 Sad',
  Angry: '😠 Angry',
  Calm: '😌 Calm',
  Hopeful: '🌟 Hopeful',
  Neutral: '😐 Neutral'
};

export default function MyVictims() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [victims, setVictims] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;

    const fetchVictims = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/counselor/victims');
        if (mounted) {
          setVictims(response.data.data || []);
          setAnalytics(response.data.overallAnalytics || null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Failed to load assigned victims.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVictims();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredVictims = victims.filter(v => {
    const score = v.distressAnalysis?.distressScore || 20;
    const band = v.distressAnalysis?.distressBand || 'Low';

    if (filter === 'HIGH RISK') {
      return score >= 50 || band === 'High' || band === 'Severe';
    }
    if (filter === 'MODERATE RISK') {
      return (score >= 25 && score < 50) || band === 'Moderate';
    }
    if (filter === 'LOW RISK') {
      return score < 25 || band === 'Low';
    }
    return true;
  });

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>My Assigned Victims Directory</h1>
          <p style={{ color: '#4b5563', margin: '0.25rem 0 0 0' }}>Overall distress score analytics &amp; direct profile access for your assigned caseload.</p>
        </div>
      </header>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading counselor caseload &amp; analytics...</div>}
      {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      {!loading && !error && (
        <>
          {/* POWER BI ANALYTICS DASHBOARD AT TOP */}
          <PowerBiDistressDashboard
            analytics={analytics}
            victims={victims}
            selectedFilter={filter}
            onFilterChange={(f) => setFilter(f)}
          />

          {/* ASSIGNED VICTIMS PROFILES GRID */}
          <section style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              👤 ASSIGNED VICTIM PROFILES ({filteredVictims.length})
            </h2>

            {filteredVictims.length === 0 ? (
              <div style={{ padding: '3rem 2rem', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                No victims match the selected filter.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {filteredVictims.map((victim) => {
                  const analysis = victim.distressAnalysis || {};
                  const score = analysis.distressScore || 20;
                  const band = analysis.distressBand || 'Low';
                  const primaryEmotion = analysis.primaryEmotion || 'Calm';
                  const bStyle = BAND_COLORS[band] || BAND_COLORS.Low;

                  return (
                    <article
                      key={victim._id || victim.victimId}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '1.25rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      className="victim-card"
                    >
                      <div>
                        {/* Card Top Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{victim.name}</h3>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>📍 {victim.district}, {victim.state}</span>
                          </div>
                          <span style={{ backgroundColor: bStyle.bg, color: bStyle.text, border: `1px solid ${bStyle.border}`, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {band.toUpperCase()} RISK
                          </span>
                        </div>

                        {/* Distress Bar */}
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                            <span style={{ color: '#475569', fontWeight: '600' }}>Distress Score:</span>
                            <span style={{ fontWeight: 'bold', color: bStyle.text }}>{score} / 100</span>
                          </div>
                          <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.max(5, score))}%`, height: '100%', backgroundColor: bStyle.text }} />
                          </div>
                          <div style={{ marginTop: '6px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b' }}>Current Emotion:</span>
                            <span style={{ fontWeight: '600', color: '#1e3a8a' }}>{EMOTION_ICONS[primaryEmotion] || primaryEmotion}</span>
                          </div>
                        </div>

                        {/* Contact & Details */}
                        <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div>📞 <strong>Phone:</strong> {victim.phone}</div>
                          <div>✉️ <strong>Email:</strong> {victim.email}</div>
                          <div>📋 <strong>Category:</strong> {victim.category}</div>
                          <div>📅 <strong>Assigned Date:</strong> {new Date(victim.assignedAt).toLocaleDateString()}</div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => navigate(`/counselor/victims/${victim._id || victim.victimId}`)}
                        style={{
                          marginTop: '1.25rem',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.65rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'center',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        VIEW FULL VICTIM PROFILE &rarr;
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
