import React from 'react';

export default function Dashboard() {
  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Welcome, Dr. Counselor</h1>
        <p style={{ color: '#4b5563' }}>Here is your overview for today.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Metric Card 1 */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Pending Requests</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>0</p>
        </div>
        
        {/* Metric Card 2 */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Today's Appointments</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>0</p>
        </div>

        {/* Metric Card 3 */}
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Follow-Ups Due</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>0</p>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280' }}>
        <p>No recent activity to display.</p>
      </div>
    </div>
  );
}
