import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminDashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="admin-page" style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>
            AAROHAN Administration Dashboard {id && <span>(ID: {id})</span>}
          </h1>
          <p style={{ color: '#4b5563' }}>State: {data?.state || 'Loading...'} | Role: State Admin</p>
        </div>
      </header>

      {error ? (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: '#991b1b', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Unable to load dashboard data</h3>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={fetchDashboard}
            style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Loading dashboard metrics...</p>
        </div>
      ) : (
        <>
          {/* TOP SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Victims</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{data.summary.totalVictims}</p>
                <span style={{ fontSize: '0.875rem', color: '#d97706', fontWeight: '500' }}>{data.summary.pendingVictims} Pending</span>
              </div>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Counselors</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{data.summary.totalCounselors}</p>
                <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>{data.summary.activeCounselors} Active</span>
              </div>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Welfare Staff</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{data.summary.totalWelfareStaff}</p>
                <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>{data.summary.activeWelfareStaff} Active</span>
              </div>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Requests</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b45309', marginTop: '0.5rem' }}>{data.summary.pendingRequests}</p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Cases</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1d4ed8', marginTop: '0.5rem' }}>{data.summary.activeCases}</p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Alerts</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', marginTop: '0.5rem' }}>{data.summary.openAlerts}</p>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <Link to="/admin/victims?status=pending" style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontWeight: '500', fontSize: '0.875rem' }}>Review Pending Victims</Link>
            <Link to="/admin/counselors" style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontWeight: '500', fontSize: '0.875rem' }}>Manage Counselors</Link>
            <Link to="/admin/alerts" style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontWeight: '500', fontSize: '0.875rem' }}>View Alerts</Link>
            <Link to="/admin/reports/geographic" style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontWeight: '500', fontSize: '0.875rem' }}>View Reports</Link>
          </div>

          {/* LATEST REQUESTS */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '2rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Pending Victim Requests</h2>
            </div>
            
            {data.latestRequests?.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Registration ID</th>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Victim</th>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>FIR Number</th>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.latestRequests.map((req) => (
                    <tr key={req._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: '#111827' }}>{req.registrationId || 'N/A'}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#4b5563' }}>{req.victimName || 'N/A'} ({req.category})</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#4b5563' }}>{req.firNumber || 'N/A'}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#4b5563' }}>{new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500', backgroundColor: '#fef3c7', color: '#92400e' }}>
                          Pending
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <Link to={`/admin/victims/${req.victimId}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500', fontSize: '0.875rem' }}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                <p>No pending requests at this time.</p>
              </div>
            )}
          </div>

          {/* BOTTOM HALF: PENDING ACTIONS & RECENT ACTIVITY */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Pending Actions</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {data.pendingActions?.pendingVictims > 0 && (
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '50%', fontWeight: 'bold', fontSize: '0.75rem' }}>{data.pendingActions.pendingVictims}</span>
                      <span style={{ color: '#374151' }}>Victim registrations awaiting approval</span>
                    </div>
                    <Link to="/admin/victims" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}>[Review]</Link>
                  </li>
                )}
                {data.pendingActions?.pendingCounselors > 0 && (
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '50%', fontWeight: 'bold', fontSize: '0.75rem' }}>{data.pendingActions.pendingCounselors}</span>
                      <span style={{ color: '#374151' }}>Counselors pending verification</span>
                    </div>
                    <Link to="/admin/counselors" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}>[Review]</Link>
                  </li>
                )}
                {data.pendingActions?.pendingAssignments > 0 && (
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '50%', fontWeight: 'bold', fontSize: '0.75rem' }}>{data.pendingActions.pendingAssignments}</span>
                      <span style={{ color: '#374151' }}>Counselor assignments pending</span>
                    </div>
                    <Link to="/admin/counselors" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}>[View]</Link>
                  </li>
                )}
                {data.pendingActions?.highPriorityAlerts > 0 && (
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', backgroundColor: '#fecaca', color: '#991b1b', borderRadius: '50%', fontWeight: 'bold', fontSize: '0.75rem' }}>{data.pendingActions.highPriorityAlerts}</span>
                      <span style={{ color: '#374151', fontWeight: '500' }}>High-priority alerts</span>
                    </div>
                    <Link to="/admin/alerts" style={{ color: '#dc2626', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 'bold' }}>[View Alerts]</Link>
                  </li>
                )}
                {(data.pendingActions?.pendingVictims === 0 && data.pendingActions?.pendingCounselors === 0 && data.pendingActions?.pendingAssignments === 0 && data.pendingActions?.highPriorityAlerts === 0) && (
                  <p style={{ color: '#10b981', fontSize: '0.875rem' }}>✓ All caught up! No pending actions required.</p>
                )}
              </ul>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Recent Activity</h2>
              {data.recentActivity?.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {data.recentActivity.map(activity => (
                    <li key={activity._id} style={{ marginBottom: '0.75rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>{activity.action}</span>
                      {activity.caseId && <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>({activity.caseId})</span>}
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        {new Date(activity.createdAt).toLocaleString()} by {activity.actorEmail}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem' }}>No recent administrative activity.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
