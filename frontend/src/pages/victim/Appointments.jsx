import React from 'react';
import { Link } from 'react-router-dom';

export default function Appointments() {
  return (
    <div className="dashboard-container">
      <div className="chatbot-top-header">
        <div className="chatbot-header-left">
          <h1>Appointment Scheduling</h1>
        </div>
        <Link to="/victim/dashboard" className="chatbot-back-link">&larr; Back to Dashboard</Link>
      </div>

      <section className="dashboard-section">
        <div className="empty-state-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '1rem' }}>📅</div>
          <h2>Your Appointments</h2>
          <p>No appointments available.</p>
        </div>
      </section>
    </div>
  );
}
