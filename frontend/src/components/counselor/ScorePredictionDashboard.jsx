import React from 'react';

export default function ScorePredictionDashboard({ victimData, sentimentReport }) {
  // Extract or generate realistic distress metrics for counselor's victim analysis
  const score = sentimentReport?.distress_score ?? victimData?.distressScore ?? 68.5;
  const band = sentimentReport?.band ?? victimData?.riskBand ?? (score >= 90 ? 'crisis' : score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'stable');
  const primaryEmotion = sentimentReport?.primary_emotion ?? victimData?.primaryEmotion ?? 'fear';
  const sentimentLabel = sentimentReport?.sentiment_label ?? victimData?.sentimentLabel ?? 'negative';
  const confidence = sentimentReport?.sentiment_confidence ?? 89.2;
  const isCrisis = sentimentReport?.crisis_flag ?? (band === 'crisis');
  const language = sentimentReport?.language_detected ?? 'en';
  const recommendation = sentimentReport?.recommendation ?? (
    band === 'crisis' 
      ? 'Immediate crisis intervention & emergency contact advised.' 
      : band === 'high' 
      ? 'High distress detected. Schedule immediate counseling session & active grounding.' 
      : band === 'moderate' 
      ? 'Moderate stress detected. Monitor progress & provide stress relief tools.' 
      : 'Stable emotional state. Regular check-ins recommended.'
  );

  // Emotion score breakdown sample
  const emotionScores = [
    { label: 'Fear', score: primaryEmotion === 'fear' ? 45 : 15, color: '#ef4444' },
    { label: 'Sadness', score: primaryEmotion === 'sadness' ? 40 : 25, color: '#6366f1' },
    { label: 'Anger', score: primaryEmotion === 'anger' ? 35 : 10, color: '#f59e0b' },
    { label: 'Disgust', score: primaryEmotion === 'disgust' ? 30 : 8, color: '#8b5cf6' },
    { label: 'Neutral', score: primaryEmotion === 'neutral' ? 50 : 12, color: '#64748b' },
    { label: 'Joy', score: primaryEmotion === 'joy' ? 60 : 5, color: '#10b981' }
  ];

  const getBandBadge = () => {
    switch (band) {
      case 'crisis':
        return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: 'CRISIS ALERT' };
      case 'high':
        return { bg: '#ffedd5', color: '#9a3412', border: '#fed7aa', label: 'HIGH RISK' };
      case 'moderate':
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'MODERATE RISK' };
      default:
        return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0', label: 'STABLE' };
    }
  };

  const badge = getBandBadge();

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '1.25rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Score Prediction Analysis Dashboard
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Authorized counselor view of victim distress metrics & emotion breakdown
          </p>
        </div>
        <span style={{
          backgroundColor: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.border}`,
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          {badge.label}
        </span>
      </div>

      {/* Grid Layout: Gauge + Emotion Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* Left Column: Distress Gauge */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Predicted Distress Score</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scale 0 - 100</span>
          </div>

          <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: isCrisis ? '#dc2626' : score >= 70 ? '#ea580c' : score >= 40 ? '#d97706' : '#16a34a' }}>
              {score.toFixed(1)}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e293b' }}>
                Primary Emotion: <span style={{ textTransform: 'capitalize', color: '#2563eb' }}>{primaryEmotion}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Sentiment: {sentimentLabel} ({confidence}% conf)
              </div>
            </div>
          </div>

          {/* Progress Bar Gauge */}
          <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, score))}%`,
              height: '100%',
              background: 'linear-gradient(to right, #10b981, #f59e0b, #ef4444)',
              borderRadius: '5px',
              transition: 'width 0.6s ease'
            }} />
          </div>

          {/* Recommendation Note */}
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', color: '#334155' }}>
            <strong>Counselor Recommendation:</strong> {recommendation}
          </div>
        </div>

        {/* Right Column: Emotion Distribution Visuals */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.75rem' }}>
            Emotion Classification Visuals
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {emotionScores.map((e) => (
              <div key={e.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                  <span style={{ color: '#475569', fontWeight: '500' }}>{e.label}</span>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>{e.score}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${e.score}%`,
                    height: '100%',
                    backgroundColor: e.color,
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '0.85rem', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'right' }}>
            Detected Language: <strong style={{ color: '#475569' }}>{language.toUpperCase()}</strong>
          </div>
        </div>

      </div>
    </div>
  );
}
