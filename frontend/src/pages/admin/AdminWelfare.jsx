import React from 'react';

export default function AdminWelfare() {
  return (
    <div className="admin-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>
          Welfare Oversight
        </h1>
        <p style={{ color: '#6b7280' }}>Monitor welfare activities and support staff</p>
      </header>
      
      <div style={{ backgroundColor: '#ffffff', padding: '3rem 2rem', borderRadius: '8px', border: '1px dashed #d1d5db', textAlign: 'center', color: '#6b7280' }}>
        <p style={{ fontSize: '1.1rem' }}>Welfare tracking implementation coming in Phase 2.</p>
      </div>
    </div>
  );
}
