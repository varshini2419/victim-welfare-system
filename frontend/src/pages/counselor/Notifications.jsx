import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShellSummary } from '../../context/ShellSummaryContext';
import './Notifications.css';

const fmtWhen = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60 * 1000) return 'Just now';
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 1000))} min ago`;
  if (diffMs < 24 * 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 60 * 1000))} h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    + ', ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const KIND_STYLES = {
  alert: {
    CRITICAL: { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', label: 'CRITICAL' },
    HIGH: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74', label: 'HIGH' },
    MEDIUM: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', label: 'MEDIUM' },
    LOW: { bg: '#dcfce7', text: '#15803d', border: '#86efac', label: 'LOW' },
  },
  appointment: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd', label: 'REQUEST' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, notificationsLoaded, refreshNotifications, acknowledgeAlert, summary } = useShellSummary();

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.kind === 'alert' ? n.status === 'NEW' : true).length,
    [notifications]
  );

  const handleAcknowledge = async (item) => {
    if (item.kind !== 'alert') return;
    try {
      await acknowledgeAlert(item.refId);
    } catch {
      // Acknowledge failures are non-fatal; the list refreshes on next poll
    }
  };

  return (
    <div className="notif-page">
      <header className="notif-header">
        <div>
          <p className="notif-kicker">Center</p>
          <h1 className="notif-title">Notifications</h1>
        </div>
        <div className="notif-header-actions">
          <span className="notif-count-pill">
            {unreadCount} unread
          </span>
          <button
            type="button"
            className="notif-refresh-btn"
            onClick={refreshNotifications}
            title="Reload notifications"
          >
            ⟳ Refresh
          </button>
        </div>
      </header>

      <div className="notif-card">
        {!notificationsLoaded ? (
          <div className="notif-empty">Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            ✓ You're all caught up — no alerts or pending requests.
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map((n) => {
              const styles = n.kind === 'alert'
                ? (KIND_STYLES.alert[n.severity] || KIND_STYLES.alert.MEDIUM)
                : KIND_STYLES.appointment;
              const unread = n.kind === 'alert' ? n.status === 'NEW' : true;
              const isCritical = n.kind === 'alert' && n.severity === 'CRITICAL' && n.status === 'NEW';

              return (
                <div
                  key={n._id}
                  className={`notif-item ${unread ? 'is-unread' : ''} ${isCritical ? 'is-critical' : ''}`}
                >
                  <div className="notif-item-top">
                    <span className="notif-type-pill" style={{ background: styles.bg, color: styles.text, borderColor: styles.border }}>
                      {styles.label}
                    </span>
                    <span className="notif-when">{fmtWhen(n.createdAt)}</span>
                  </div>

                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-desc">{n.description}</div>
                    {n.kind === 'alert' && n.callStatus && (
                      <div className={`notif-call-status ${n.callStatus === 'FAILED' ? 'call-failed' : ''}`}>
                        Automatic call: <strong>{n.callStatus}</strong>
                        {n.callFailureReason ? ` (${n.callFailureReason})` : ''}
                      </div>
                    )}
                  </div>

                  <div className="notif-item-actions">
                    {n.kind === 'alert' && n.status === 'NEW' && (
                      <button type="button" className="notif-ack-btn" onClick={() => handleAcknowledge(n)}>
                        ✓ Acknowledge
                      </button>
                    )}
                    {n.kind === 'alert' && n.status !== 'NEW' && (
                      <span className="notif-acked-tag">Acknowledged</span>
                    )}
                    {n.kind === 'appointment' && (
                      <button
                        type="button"
                        className="notif-review-btn"
                        onClick={() => navigate('/counselor/requests')}
                      >
                        Review Request →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="notif-footnote">
        Live counts across the portal: {summary.victims} victims · {summary.pendingRequests} pending requests · {summary.newAlerts} new alerts
      </p>
    </div>
  );
}
