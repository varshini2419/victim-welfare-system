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
      setError(
        err.response?.data?.message ||
          'Failed to load appointment requests.'
      );
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const approve = async (id) => {
    try {
      await api.patch(`/counselor/appointments/${id}/approve`);
      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to approve appointment.'
      );
    }
  };

  const reject = async (id) => {
    const rejectionReason =
      window.prompt('Reason for rejection (optional):') || '';

    try {
      await api.patch(`/counselor/appointments/${id}/reject`, {
        rejectionReason,
      });

      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to reject appointment.'
      );
    }
  };

  return (
    <div
      style={{
        padding: '1.25rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <header style={{ marginBottom: '1.5rem' }}>
        <p
          style={{
            margin: 0,
            color: '#2563eb',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
          }}
        >
          Support Queue
        </p>

        <h1
          style={{
            margin: '0.25rem 0 0',
            fontSize: '2rem',
            fontWeight: 800,
            color: '#0f172a',
          }}
        >
          Consultation Requests
        </h1>
      </header>

      {error && (
        <div
          style={{
            color: '#991b1b',
            backgroundColor: '#fee2e2',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: '0.75rem',
        }}
      >
        {requests.length === 0 ? (
          <p style={{ color: '#6b7280' }}>
            No pending consultation requests at this time.
          </p>
        ) : (
          requests.map((request) => (
            <AppointmentCard
              key={request._id}
              appointment={request}
              viewer="counselor"
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => approve(request._id)}
                    style={{
                      border: 'none',
                      borderRadius: '10px',
                      background:
                        'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: '#ffffff',
                      padding: '0.8rem 1.25rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => reject(request._id)}
                    style={{
                      border: '1px solid #fca5a5',
                      borderRadius: '10px',
                      background: '#fff1f2',
                      color: '#be123c',
                      padding: '0.8rem 1.25rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </>
              }
            />
          ))
        )}
      </div>
    </div>
  );
}