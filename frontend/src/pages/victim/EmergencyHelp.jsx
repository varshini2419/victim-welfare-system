import React from 'react';
import { Link } from 'react-router-dom';

export default function EmergencyHelp() {
  return (
    <div className="dashboard-container">
      <div className="chatbot-top-header">
        <div className="chatbot-header-left">
          <h1 className="text-danger" style={{ color: '#dc2626' }}>Emergency Helplines</h1>
        </div>
        <Link to="/victim/dashboard" className="chatbot-back-link">&larr; Back to Dashboard</Link>
      </div>

      <section className="emergency-section">
        <div className="emergency-card" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🆘</div>
          <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>Immediate Assistance Required?</h2>
          <p style={{ color: '#7f1d1d', marginBottom: '2rem' }}>If you are in immediate danger, please contact emergency services immediately.</p>
          <button 
            className="emergency-button"
            onClick={() => alert("Emergency features will be implemented in a later phase.")}
            style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Access Emergency Help
          </button>
        </div>
      </section>
    </div>
  );
}
