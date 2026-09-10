import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

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

const EMOTION_COLORS = {
  Fearful: '#ef4444',
  Anxious: '#f97316',
  Sad: '#f59e0b',
  Angry: '#dc2626',
  Calm: '#22c55e',
  Hopeful: '#10b981',
  Neutral: '#38bdf8'
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

  let dominantEmotion = 'Calm';
  let maxCount = -1;
  Object.entries(combinedEmotions).forEach(([e, cnt]) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      dominantEmotion = e;
    }
  });

  const emotionData = Object.entries(combinedEmotions).map(([name, value]) => ({
    name,
    value,
    fill: EMOTION_COLORS[name] || '#38bdf8'
  }));

  const riskData = [
    { name: 'Low Risk', value: lowRiskCount, fill: '#22c55e' },
    { name: 'Moderate Risk', value: moderateRiskCount, fill: '#eab308' },
    { name: 'High Risk', value: highRiskCount, fill: '#ef4444' }
  ];

  const distressRanking = victims
    .slice(0, 6)
    .map((v) => ({
      name: v.name ? v.name.split(' ').slice(0, 2).join(' ') : 'Victim',
      score: v.distressAnalysis?.distressScore || 0,
      band: v.distressAnalysis?.distressBand || 'Low'
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', padding: '1.5rem', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', marginBottom: '2rem' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>TOTAL ASSIGNED VICTIMS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ffffff', marginTop: '0.25rem' }}>{totalVictims}</div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active Caseload</span>
        </div>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1rem', borderLeft: `4px solid ${bandStyle.bar}` }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>OVERALL DISTRESS INDEX</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: bandStyle.bar, marginTop: '0.25rem' }}>
            {avgDistressScore} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 100</span>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: bandStyle.text, backgroundColor: bandStyle.bg, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
            {overallBand.toUpperCase()} RISK
          </span>
        </div>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>HIGH RISK VICTIMS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f87171', marginTop: '0.25rem' }}>{highRiskCount}</div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Require Urgent Counseling</span>
        </div>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>DOMINANT EMOTION</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#c084fc', marginTop: '0.5rem' }}>
            {EMOTION_ICONS[dominantEmotion] || dominantEmotion}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Most Frequent Emotional State</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#38bdf8', fontWeight: '700' }}>📊 EMOTION DISTRIBUTION</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={emotionData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2}>
                  {emotionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Victims']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#38bdf8', fontWeight: '700' }}>📈 RISK BAND DISTRIBUTION</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer>
              <BarChart data={riskData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {riskData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#38bdf8', fontWeight: '700' }}>📉 DISTRESS RANKING</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer>
              <BarChart data={distressRanking} layout="vertical" margin={{ top: 10, right: 16, left: 8, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={72} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {distressRanking.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={BAND_COLORS[entry.band]?.bar || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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
