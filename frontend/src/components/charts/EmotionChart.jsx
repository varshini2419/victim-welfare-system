import React from 'react';

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

export default function EmotionChart({ analysis }) {
  if (!analysis) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
        No distress or emotion analysis data available yet.
      </div>
    );
  }

  const { distressScore = 20, distressBand = 'Low', primaryEmotion = 'Calm', emotionsBreakdown = {}, recentLog = [] } = analysis;
  const bandStyle = BAND_COLORS[distressBand] || BAND_COLORS.Low;

  const totalEmotionCounts = Object.values(emotionsBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', marginTop: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🧠</span> VICTIM DISTRESS &amp; EMOTION ANALYSIS REPORT
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Real-time chat sentiment &amp; psychological risk indicators for counselor quick review</span>
        </div>

        {/* Distress Band Badge */}
        <div style={{ backgroundColor: bandStyle.bg, color: bandStyle.text, border: `1px solid ${bandStyle.border}`, padding: '0.35rem 0.85rem', borderRadius: '9999px', fontWeight: '700', fontSize: '0.85rem' }}>
          RISK LEVEL: {distressBand.toUpperCase()} ({distressScore}/100)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* 1. Distress Score Gauge Card */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>Distress Score Index</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: bandStyle.text }}>{distressScore} / 100</span>
          </div>

          {/* Progress Bar Gauge */}
          <div style={{ height: '14px', backgroundColor: '#e2e8f0', borderRadius: '7px', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ width: `${Math.min(100, Math.max(5, distressScore))}%`, height: '100%', backgroundColor: bandStyle.bar, borderRadius: '7px', transition: 'width 0.5s ease' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>0 (Low Risk)</span>
            <span>50 (Moderate)</span>
            <span>100 (Severe Risk)</span>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Primary Emotional State:</span>
            <span style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '0.95rem' }}>
              {EMOTION_ICONS[primaryEmotion] || primaryEmotion}
            </span>
          </div>
        </div>

        {/* 2. Emotion Breakdown Visual Chart */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>
            📊 Emotion Distribution Breakdown
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {Object.entries(emotionsBreakdown).map(([emotionName, count]) => {
              const pct = Math.round((count / totalEmotionCounts) * 100);
              return (
                <div key={emotionName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px', color: '#475569' }}>
                    <span>{EMOTION_ICONS[emotionName] || emotionName}</span>
                    <span>{pct}% ({count})</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: emotionName === 'Fearful' || emotionName === 'Angry' ? '#ef4444' : emotionName === 'Anxious' || emotionName === 'Sad' ? '#f97316' : '#2563eb',
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

      {/* 3. Recent Chat Interaction Logs */}
      {recentLog && recentLog.length > 0 && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>
            📝 Recent Chat Interaction Log &amp; Sentiment Shift
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
            {recentLog.slice(0, 5).map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span style={{ color: '#334155', fontStyle: 'italic', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{item.message}"
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: '600', color: '#1e3a8a' }}>{EMOTION_ICONS[item.emotion] || item.emotion}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Score: {item.distressScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
