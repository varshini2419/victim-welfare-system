import React from 'react';
import { Link } from 'react-router-dom';

const recentConsultations = [
  {
    date: '12 Sep 2026',
    counselor: 'Dr. Sreeja Nair',
    mode: 'Video Call',
    focus: 'Stress and emotional support',
    summary: 'Discussed coping strategies for anxiety and reviewed daily progress.'
  },
  {
    date: '05 Sep 2026',
    counselor: 'Ms. Ananya Rao',
    mode: 'In-person Session',
    focus: 'Family support and confidence building',
    summary: 'Reviewed personal safety planning and emotional recovery goals.'
  },
  {
    date: '27 Aug 2026',
    counselor: 'Dr. Sreeja Nair',
    mode: 'Phone Consultation',
    focus: 'Emotional wellbeing check-in',
    summary: 'Checked emotional wellbeing and discussed follow-up steps.'
  }
];

export default function MyCounselor() {
  return (
    <div style={{ padding: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ margin: 0, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Support</p>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Counselor Consultation</h1>
        </div>
        <Link to="/victim/dashboard" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>← Back to Dashboard</Link>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', borderRadius: '18px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Assigned Counselor</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>Dr. Sreeja Nair</div>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '0.8rem 1rem', border: '1px solid #bfdbfe', minWidth: '180px' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Next Session</div>
            <div style={{ color: '#0f172a', fontWeight: 800, marginTop: '0.25rem' }}>18 Sep 2026 • 4:30 PM</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Recent consultation history</h2>
            <span style={{ background: '#ecfeff', color: '#0f766e', border: '1px solid #99f6e4', borderRadius: '999px', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>3 visits</span>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {recentConsultations.map((visit, index) => (
              <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc', padding: '1rem 1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{visit.counselor}</div>
                  <div style={{ color: '#334155', fontSize: '0.82rem', fontWeight: 700 }}>{visit.date}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  <span style={{ background: '#e0f2fe', color: '#075985', borderRadius: '999px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: 700 }}>{visit.mode}</span>
                  <span style={{ background: '#dcfce7', color: '#166534', borderRadius: '999px', padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: 700 }}>{visit.focus}</span>
                </div>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{visit.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
