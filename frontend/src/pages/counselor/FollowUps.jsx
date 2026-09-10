import React from 'react';
import { useNavigate } from 'react-router-dom';

const followUps = [
  {
    id: 'active-aarohi',
    name: 'Aarohi S.',
    status: 'Active',
    lastSession: 'Today, 4:30 PM',
    nextFollowUp: 'Tomorrow, 10:00 AM',
    sessions: 4,
    concern: 'Anxiety and family stress',
    risk: 'Moderate',
    accent: '#2563eb'
  },
  {
    id: 'checkin-meera',
    name: 'Meera K.',
    status: 'Needs Check-in',
    lastSession: 'Yesterday, 1:00 PM',
    nextFollowUp: 'Today, 6:30 PM',
    sessions: 3,
    concern: 'Mood fluctuation and sleep issues',
    risk: 'Low',
    accent: '#f59e0b'
  },
  {
    id: 'inactive-nandini',
    name: 'Nandini P.',
    status: 'Inactive',
    lastSession: '3 days ago',
    nextFollowUp: 'No scheduled follow-up',
    sessions: 2,
    concern: 'Home communication support',
    risk: 'Low',
    accent: '#64748b'
  },
  {
    id: 'completed-rohit',
    name: 'Rohit N.',
    status: 'Completed',
    lastSession: 'Last week',
    nextFollowUp: 'Session completed',
    sessions: 6,
    concern: 'Stress management progress review',
    risk: 'Resolved',
    accent: '#16a34a'
  }
];

const statusStyles = {
  Active: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  'Needs Check-in': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  Inactive: { bg: '#e2e8f0', text: '#475569', border: '#cbd5e1' },
  Completed: { bg: '#dcfce7', text: '#166534', border: '#86efac' }
};

export default function FollowUps() {
  const navigate = useNavigate();
  const activeCount = followUps.filter((item) => item.status === 'Active').length;
  const checkinCount = followUps.filter((item) => item.status === 'Needs Check-in').length;
  const inactiveCount = followUps.filter((item) => item.status === 'Inactive').length;
  const completedCount = followUps.filter((item) => item.status === 'Completed').length;

  const openVictimReport = (victimId) => {
    navigate(`/counselor/victims/${victimId}`);
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1280px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.3rem' }}>
        <p style={{ margin: 0, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Monitoring</p>
        <h1 style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Follow-Ups</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1rem 1.1rem', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
          <div style={{ marginTop: '0.4rem', fontSize: '2rem', fontWeight: 800, color: '#1d4ed8' }}>{activeCount}</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1rem 1.1rem', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check-in</div>
          <div style={{ marginTop: '0.4rem', fontSize: '2rem', fontWeight: 800, color: '#b45309' }}>{checkinCount}</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1rem 1.1rem', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inactive</div>
          <div style={{ marginTop: '0.4rem', fontSize: '2rem', fontWeight: 800, color: '#475569' }}>{inactiveCount}</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1rem 1.1rem', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
          <div style={{ marginTop: '0.4rem', fontSize: '2rem', fontWeight: 800, color: '#166534' }}>{completedCount}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {followUps.map((victim) => {
          const statusStyle = statusStyles[victim.status] || statusStyles.Active;

          return (
            <div key={victim.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.1rem 1.15rem', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Victim</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{victim.name}</div>
                </div>
                <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: '999px', padding: '0.35rem 0.7rem', fontSize: '0.72rem', fontWeight: 800, border: `1px solid ${statusStyle.border}` }}>
                  {victim.status}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '0.5rem', color: '#334155', fontSize: '0.92rem' }}>
                <div><strong>Last session:</strong> {victim.lastSession}</div>
                <div><strong>Next follow-up:</strong> {victim.nextFollowUp}</div>
                <div><strong>Sessions:</strong> {victim.sessions}</div>
                <div><strong>Concern:</strong> {victim.concern}</div>
                <div><strong>Risk level:</strong> {victim.risk}</div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => openVictimReport(victim.id)}
                  style={{ width: '100%', border: 'none', borderRadius: '10px', background: victim.accent, color: '#fff', padding: '0.7rem 0.9rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  View counseling notes
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
