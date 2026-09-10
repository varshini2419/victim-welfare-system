import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import AppointmentCard from '../../components/victim/AppointmentCard';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      const response = await api.get('/counselor/appointments/pending');
      setRequests(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointment requests.');
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const approve = async (id) => {
    try { await api.patch(`/counselor/appointments/${id}/approve`); await loadRequests(); } catch (err) { setError(err.response?.data?.message || 'Failed to approve appointment.'); }
  };

  const reject = async (id) => {
    const rejectionReason = window.prompt('Reason for rejection (optional):') || '';
    try { await api.patch(`/counselor/appointments/${id}/reject`, { rejectionReason }); await loadRequests(); } catch (err) { setError(err.response?.data?.message || 'Failed to reject appointment.'); }
  };

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Consultation Requests</h1>
      </header>

      {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>{error}</div>}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {requests.length === 0 ? <p style={{ color: '#6b7280' }}>No pending consultation requests at this time.</p> : requests.map((request) => <AppointmentCard key={request._id} appointment={request} viewer="counselor" actions={<><button type="button" onClick={() => approve(request._id)}>Approve</button><button type="button" onClick={() => reject(request._id)}>Reject</button></>} />)}
      </div>
    </div>
  );
}
