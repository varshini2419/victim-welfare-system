import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const notifications = [
  {
    id: 1,
    type: 'Emergency',
    title: 'SOS escalation triggered',
    description: 'Aarohi S. reported a high-risk message and an emergency alert was sent to the counselor immediately.',
    time: 'Just now',
    unread: true,
    accent: '#dc2626'
  },
  {
    id: 2,
    type: 'Appointment',
    title: 'Consultation request raised',
    description: 'Meera K. requested a counseling appointment for stress and sleep issues for today at 6:30 PM.',
    time: '12 min ago',
    unread: true,
    accent: '#2563eb'
  },
  {
    id: 3,
    type: 'Follow-up',
    title: 'Follow-up reminder scheduled',
    description: 'Nandini P. has an inactive counseling status and a follow-up was scheduled for review.',
    time: '1 hour ago',
    unread: false,
    accent: '#f59e0b'
  },
  {
    id: 4,
    type: 'Session',
    title: 'Session note updated',
    description: 'Rohit N. completed the latest session and the counselor summary was added to the victim report.',
    time: '4 hours ago',
    unread: false,
    accent: '#16a34a'
  },
  {
    id: 5,
    type: 'Request',
    title: 'Victim consultation request approved',
    description: 'Aarohi S. was approved for a video consultation and a confirmation was sent to the victim.',
    time: 'Yesterday',
    unread: false,
    accent: '#7c3aed'
  }
];

const typeStyles = {
  Emergency: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  Appointment: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  'Follow-up': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  Session: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Request: { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' }
};

export default function Notifications() {
<<<<<<< HEAD
  const unreadCount = notifications.filter((n) => n.unread).length;
=======
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      const response = await api.get('/counselor/notifications');
      setNotifications(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    await api.patch(`/counselor/notifications/${id}/read`);
    loadNotifications();
  };
>>>>>>> appointment-scheduling

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1280px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <p style={{ margin: 0, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Center</p>
        <h1 style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Notifications</h1>
      </header>

<<<<<<< HEAD
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1rem 1rem 0.5rem', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            {unreadCount} unread notifications
          </div>
          <button
            type="button"
            style={{
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#0f172a',
              borderRadius: '10px',
              padding: '0.65rem 0.9rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Mark all as read
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {notifications.map((notification) => {
            const typeStyle = typeStyles[notification.type] || typeStyles.Request;

            return (
              <div
                key={notification.id}
                style={{
                  background: notification.unread ? '#f8fafc' : '#ffffff',
                  border: `1px solid ${notification.unread ? '#dbeafe' : '#e2e8f0'}`,
                  borderLeft: `5px solid ${notification.accent}`,
                  borderRadius: '14px',
                  padding: '1rem 1.1rem',
                  display: 'grid',
                  gap: '0.7rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: typeStyle.bg,
                      color: typeStyle.text,
                      border: `1px solid ${typeStyle.border}`,
                      borderRadius: '999px',
                      padding: '0.3rem 0.7rem',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {notification.type}
                  </span>

                  {notification.unread && (
                    <span style={{ background: '#2563eb', color: '#fff', borderRadius: '999px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>
                      New
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                      {notification.title}
                    </div>
                    <div style={{ lineHeight: 1.6, color: '#475569', fontSize: '0.92rem' }}>
                      {notification.description}
                    </div>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {notification.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
=======
      {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>{error}</div>}
      <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
        {notifications.length === 0 ? (
          <p style={{ color: '#6b7280' }}>You have no notifications.</p>
        ) : notifications.map((notification) => (
          <article key={notification._id} style={{ padding: '1rem 0', borderBottom: '1px solid #e5e7eb', opacity: notification.isRead ? 0.65 : 1 }}>
            <div style={{ fontWeight: 600, color: '#111827' }}>{notification.message}</div>
            {notification.alertId && (
              <div style={{ marginTop: '0.35rem', color: '#4b5563', fontSize: '0.85rem' }}>
                Risk: {notification.alertId.riskLevel || notification.alertId.severity} · Call: {notification.callLogId?.callStatus || notification.alertId.callStatus || 'PENDING'}
              </div>
            )}
            {!notification.isRead && (
              <button type="button" onClick={() => markRead(notification._id)} style={{ marginTop: '0.5rem', padding: '0.35rem 0.65rem', cursor: 'pointer' }}>
                Mark as read
              </button>
            )}
          </article>
        ))}
>>>>>>> appointment-scheduling
      </div>
    </div>
  );
}
