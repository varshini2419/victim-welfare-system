import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import api from '../../utils/api';

export default function EmergencyHelp() {
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');

  const handleEmergencyRequest = async () => {
    if (requesting) return;

    setRequesting(true);
    setMessage('Requesting emergency assistance...');
    try {
      const response = await api.post('/emergency/request-help');
      setMessage(response.data.message);
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message || '';
      setMessage(status === 503
        ? 'Emergency calling service is currently not configured.'
        : status === 409 && serverMessage.includes('assigned counselor')
          ? 'No assigned counselor is currently available. Emergency assistance fallback will be required.'
          : status === 429
            ? 'Emergency request already received. Please wait before trying again.'
            : 'Emergency assistance could not be initiated. Please contact emergency services immediately.');
    } finally {
      setRequesting(false);
    }
  };

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
            onClick={handleEmergencyRequest}
            disabled={requesting}
            aria-busy={requesting}
            style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {requesting ? 'Requesting...' : 'Access Emergency Help'}
          </button>
          {message && <p role="status" style={{ color: '#7f1d1d', marginTop: '1rem' }}>{message}</p>}
        </div>
      </section>
    </div>
  );
}
