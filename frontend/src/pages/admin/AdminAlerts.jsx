import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/alerts');
      setAlerts(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.patch(`/admin/alerts/${id}/${action}`);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return '#991b1b';
      case 'HIGH': return '#dc2626';
      case 'MEDIUM': return '#d97706';
      default: return '#2563eb';
    }
  };

  return (
    <div className="admin-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>
          Alert Center
        </h1>
      </header>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <p>Loading alerts...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.length === 0 ? (
            <p>No alerts found.</p>
          ) : (
            alerts.map(a => (
              <div key={a._id} style={{ border: `1px solid ${getSeverityColor(a.severity)}`, borderLeftWidth: '4px', borderRadius: '8px', padding: '1.5rem', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.25rem' }}>
                      {a.alertType} <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#4b5563', marginLeft: '0.5rem' }}>{a.status}</span>
                    </h3>
                    <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '1rem' }}>{a.description}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>Case: {a.caseId?.caseId || 'Pending'} | Date: {new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {a.status === 'NEW' && (
                      <button onClick={() => handleAction(a._id, 'acknowledge')} style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>Acknowledge</button>
                    )}
                    {a.status !== 'RESOLVED' && (
                      <button onClick={() => handleAction(a._id, 'resolve')} style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}>Mark Resolved</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
