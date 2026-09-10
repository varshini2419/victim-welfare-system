import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Notifications() {
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

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Notifications</h1>
      </header>

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
      </div>
    </div>
  );
}
