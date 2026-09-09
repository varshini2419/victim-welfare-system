import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BAND_COLORS = {
  Low: { bg: '#dcfce7', text: '#15803d', border: '#86efac', bar: '#22c55e' },
  Moderate: { bg: '#fef3c7', text: '#b45309', border: '#fde047', bar: '#eab308' },
  High: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74', bar: '#f97316' },
  Severe: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', bar: '#ef4444' }
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

export default function PowerBiDistressDashboard({ analytics, victims, selectedFilter, onFilterChange }) {
  const navigate = useNavigate();

  const {
    totalVictims = 0,
    avgDistressScore = 20,
    overallBand = 'Low',
    highRiskCount = 0,
    moderateRiskCount = 0,
    lowRiskCount = 0,
    combinedEmotions = {}
  } = analytics || {};

  const bandStyle = BAND_COLORS[overallBand] || BAND_COLORS.Low;
  const totalEmotionsCount = Object.values(combinedEmotions).reduce((a, b) => a + b, 0) || 1;

  // Find dominant emotion across all victims
  let dominantEmotion = 'Calm';
  let maxCount = -1;
  Object.entries(combinedEmotions).forEach(([e, cnt]) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      dominantEmotion = e;
    }
  });

  return (
    <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', padding: '1.5rem', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', marginBottom: '2rem' }}>
      {/* 1. POWER BI TOP NAVIGATION & HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#f59e0b', color: '#0f172a', padding: '0.4rem 0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
            Power BI
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff' }}>
              COUNSELOR CASELOAD &amp; VICTIM DISTRESS ANALYTICS DASHBOARD
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Real-time aggregated psychological metric insights for assigned victims
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '0.3rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.3)' }}>
            🟢 LIVE FEED
          </span>
        </div>
      </div>

      {/* 2. POWER BI KPI CARDS TILE ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* KPI 1: Total Victims */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>TOTAL ASSIGNED VICTIMS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ffffff', marginTop: '0.25rem' }}>{totalVictims}</div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active Caseload</span>
        </div>

        {/* KPI 2: Overall Distress Score Index */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1rem', borderLeft: `4px solid ${bandStyle.bar}` }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>OVERALL DISTRESS INDEX</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: bandStyle.bar, marginTop: '0.25rem' }}>
            {avgDistressScore} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 100</span>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: bandStyle.text, backgroundColor: bandStyle.bg, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
            {overallBand.toUpperCase()} RISK
          </span>
        </div>

        {/* KPI 3: High Risk Count */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>HIGH RISK VICTIMS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f87171', marginTop: '0.25rem' }}>{highRiskCount}</div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Require Urgent Counseling</span>
        </div>

        {/* KPI 4: Dominant Emotion */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>DOMINANT EMOTION</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#c084fc', marginTop: '0.5rem' }}>
            {EMOTION_ICONS[dominantEmotion] || dominantEmotion}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Most Frequent Emotional State</span>
        </div>
      </div>

      {/* 3. POWER BI VISUALS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Visual A: Victim Distress Comparative Bar Chart */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊</span> INDIVIDUAL VICTIM DISTRESS RANKING
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto' }}>
            {victims.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No victim records found.</div>
            ) : (
              victims.map((v) => {
                const score = v.distressAnalysis?.distressScore || 20;
                const band = v.distressAnalysis?.distressBand || 'Low';
                const bStyle = BAND_COLORS[band] || BAND_COLORS.Low;

                return (
                  <div
                    key={v._id || v.victimId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/counselor/victims/${v._id || v.victimId}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                      <span style={{ fontWeight: '600', color: '#f1f5f9' }}>
                        {v.name} <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>({v.district || 'District'})</span>
                      </span>
                      <span style={{ fontWeight: 'bold', color: bStyle.bar }}>{score}/100</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(5, score))}%`,
                          height: '100%',
                          backgroundColor: bStyle.bar,
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Visual B: Caseload Emotional Breakdown Chart */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🍩</span> CASELOAD EMOTION DISTRIBUTION
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {Object.entries(combinedEmotions).map(([eName, count]) => {
              const pct = Math.round((count / totalEmotionsCount) * 100);
              return (
                <div key={eName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px', color: '#cbd5e1' }}>
                    <span>{EMOTION_ICONS[eName] || eName}</span>
                    <span>{pct}% ({count})</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: eName === 'Fearful' || eName === 'Angry' ? '#ef4444' : eName === 'Anxious' || eName === 'Sad' ? '#f97316' : '#3b82f6',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. RISK LEVEL INTERACTIVE FILTER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #334155', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Filter Victim Directory:</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'HIGH RISK', 'MODERATE RISK', 'LOW RISK'].map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange && onFilterChange(f)}
              style={{
                backgroundColor: selectedFilter === f ? '#2563eb' : '#0f172a',
                color: selectedFilter === f ? '#ffffff' : '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
