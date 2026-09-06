import React from 'react';

export default function FollowUps() {
  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Follow-Ups</h1>
      </header>

      <div style={{ backgroundColor: '#ffffff', padding: '3rem 2rem', borderRadius: '8px', border: '1px dashed #d1d5db', textAlign: 'center', color: '#6b7280' }}>
        <p style={{ fontSize: '1.1rem' }}>No pending follow-ups required.</p>
      </div>
    </div>
  );
}
