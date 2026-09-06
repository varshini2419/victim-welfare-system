import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  
  // Real data state placeholders (to be populated by real API later)
  const [user, setUser] = useState(null);
  const [supportOverview, setSupportOverview] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Simulate an API check. In a real scenario, this would fetch from the backend.
    // Since no backend exists, we stop loading and leave data as null/empty.
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="loading-state">Loading your dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* 1. Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-hero-image">
          <img src="/images/dashboard-hero.png" alt="Aarohan Support Services" />
          <div className="welcome-hero-overlay">Aarohan Support Services</div>
        </div>
        <div className="welcome-text-content">
          <h1>Welcome to AAROHAN Support Dashboard{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="welcome-subtitle">
            This official portal is here to provide you with secure, confidential support. 
            Access critical resources and tracking tools.
          </p>
        </div>
      </section>

      {/* 2. Quick Actions */}
      <section className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <Link to="/victim/daily-updates" className="quick-action-card">
            <div className="action-icon">📝</div>
            <h3>Daily Update</h3>
            <p>Share how you're feeling today.</p>
          </Link>
          <Link to="/victim/voice-updates" className="quick-action-card">
            <div className="action-icon">🎙️</div>
            <h3>Voice Update</h3>
            <p>Record a private voice journal.</p>
          </Link>
          <Link to="/victim/chatbot" className="quick-action-card">
            <div className="action-icon">💬</div>
            <h3>Support Assistant</h3>
            <p>Chat securely for immediate guidance.</p>
          </Link>
        </div>
      </section>

      <div className="dashboard-main-grid">
        <div className="main-column">
          {/* 3. Support Overview */}
          <section className="dashboard-section">
            <h2 className="section-title">Support Overview</h2>
            {supportOverview ? (
              <div className="support-overview-content">
                {/* Structure for future real data */}
              </div>
            ) : (
              <div className="empty-state-card">
                <p>Support status information is currently unavailable.</p>
              </div>
            )}
          </section>

          {/* 4. Recent Activity */}
          <section className="dashboard-section">
            <h2 className="section-title">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="activity-list">
                {/* Structure for future real data */}
              </div>
            ) : (
              <div className="empty-state-card">
                <p>No recent activity to display.</p>
              </div>
            )}
          </section>
        </div>

        <div className="side-column">
          {/* 5. Notifications Preview */}
          <section className="dashboard-section">
            <h2 className="section-title">Notifications</h2>
            {notifications.length > 0 ? (
              <div className="notifications-list">
                {/* Structure for future real data */}
              </div>
            ) : (
              <div className="empty-state-card">
                <p>You have no new notifications.</p>
              </div>
            )}
          </section>

          {/* 6. Emergency Help */}
          <section className="emergency-section">
            <h2 className="section-title text-danger">Emergency Help</h2>
            <div className="emergency-card">
              <p>If you are in immediate danger, please contact emergency services.</p>
              <button 
                className="emergency-button"
                onClick={() => alert("Emergency features will be implemented in a later phase.")}
              >
                Access Emergency Help
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
