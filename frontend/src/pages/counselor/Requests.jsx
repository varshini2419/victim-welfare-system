<<<<<<< HEAD
import React, { useState } from 'react';

const initialRequests = [
  {
    id: 1,
    victim: 'Aarohi S.',
    date: '18 Sep 2026',
    time: '4:30 PM',
    mode: 'Video Call',
    reason: 'Emotional support and anxiety relief',
    urgency: 'High',
    language: 'Telugu',
    status: 'Pending',
    notes: 'Feels anxious and overwhelmed after family stress. Wants calming support and a listening ear.'
  },
  {
    id: 2,
    victim: 'Meera K.',
    date: '20 Sep 2026',
    time: '1:00 PM',
    mode: 'Phone Consultation',
    reason: 'Follow-up after previous session',
    urgency: 'Medium',
    language: 'Hindi',
    status: 'Approved',
    notes: 'Needs follow-up guidance for stress reduction and daily coping techniques.'
  },
  {
    id: 3,
    victim: 'Nandini P.',
    date: '22 Sep 2026',
    time: '11:15 AM',
    mode: 'In-person',
    reason: 'Family support and safety planning',
    urgency: 'Low',
    language: 'English',
    status: 'Pending',
    notes: 'Wants help with home communication and a personal safety plan.'
  }
];

const statusStyles = {
  Pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  Approved: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
};

export default function Requests() {
  const [requests, setRequests] = useState(initialRequests);

  const handleDecision = (id, status) => {
    setRequests((prev) => prev.map((request) => request.id === id ? { ...request, status } : request));
=======
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
>>>>>>> appointment-scheduling
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: 0, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Support Queue</p>
        <h1 style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Consultation Requests</h1>
      </header>

<<<<<<< HEAD
      <div style={{ display: 'grid', gap: '1rem' }}>
        {requests.map((request) => {
          const statusStyle = statusStyles[request.status] || statusStyles.Pending;
          return (
            <div key={request.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.2rem 1.25rem', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Victim</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{request.victim}</div>
                </div>
                <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: '999px', padding: '0.35rem 0.7rem', fontSize: '0.74rem', fontWeight: 800, border: `1px solid ${statusStyle.border}` }}>
                  {request.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', color: '#475569', fontSize: '0.9rem' }}>
                <div><strong>Date:</strong> {request.date}</div>
                <div><strong>Time:</strong> {request.time}</div>
                <div><strong>Mode:</strong> {request.mode}</div>
                <div><strong>Urgency:</strong> {request.urgency}</div>
                <div><strong>Language:</strong> {request.language}</div>
              </div>

              <div style={{ marginTop: '0.9rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem 0.9rem', color: '#334155', lineHeight: 1.6 }}>
                <strong>Reason:</strong> {request.reason}
                <div style={{ marginTop: '0.35rem', color: '#475569' }}>
                  <strong>Notes:</strong> {request.notes}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button type="button" onClick={() => handleDecision(request.id, 'Approved')} style={{ border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#ffffff', padding: '0.8rem 1.25rem', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                <button type="button" onClick={() => handleDecision(request.id, 'Rejected')} style={{ border: '1px solid #fca5a5', borderRadius: '10px', background: '#fff1f2', color: '#be123c', padding: '0.8rem 1.25rem', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
              </div>
            </div>
          );
        })}
=======
      {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>{error}</div>}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {requests.length === 0 ? <p style={{ color: '#6b7280' }}>No pending consultation requests at this time.</p> : requests.map((request) => <AppointmentCard key={request._id} appointment={request} viewer="counselor" actions={<><button type="button" onClick={() => approve(request._id)}>Approve</button><button type="button" onClick={() => reject(request._id)}>Reject</button></>} />)}
>>>>>>> appointment-scheduling
      </div>
    </div>
  );
}
