import React from 'react';
import { Link } from 'react-router-dom';

export default function MyCounselor() {
  return (
    <div className="dashboard-container">
      <div className="chatbot-top-header">
        <div className="chatbot-header-left">
          <h1>Counselor Consultation</h1>
        </div>
        <Link to="/victim/dashboard" className="chatbot-back-link">&larr; Back to Dashboard</Link>
      </div>

      <section className="dashboard-section">
        <div className="empty-state-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '1rem' }}>👤</div>
          <h2>Counselor Services</h2>
          <p>No counselor assigned yet. Consultation services will be available once a counselor is assigned to your case.</p>
        </div>
      </section>
    </div>
  );
}
