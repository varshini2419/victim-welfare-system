import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const fmtDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value))
  : 'N/A';

export default function FollowUps() {
  const [victims, setVictims] = useState([]);
  const [selectedVictimId, setSelectedVictimId] = useState('');
  const [followUp, setFollowUp] = useState(null);
  const [actionTaken, setActionTaken] = useState({});
  const [error, setError] = useState('');

  const loadVictims = async () => {
    try {
      const response = await api.get('/counselor/follow-ups');
      setVictims(response.data.data || []);
      if (!selectedVictimId && response.data.data?.[0]) setSelectedVictimId(String(response.data.data[0].victimId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned victims.');
    }
  };

  const loadFollowUp = async (victimId) => {
    if (!victimId) return;
    try {
      const response = await api.get(`/counselor/follow-ups/${victimId}`);
      setFollowUp(response.data.data);
      setError('');
    } catch (err) {
      setFollowUp(null);
      setError(err.response?.data?.message || 'Failed to load follow-up details.');
    }
  };

  useEffect(() => { loadVictims(); }, []);
  useEffect(() => { loadFollowUp(selectedVictimId); }, [selectedVictimId]);

  const updateAlertStatus = async (alertId, status) => {
    try {
      await api.patch(`/counselor/follow-ups/alerts/${alertId}/status`, { status });
      await loadFollowUp(selectedVictimId);
    } catch (err) { setError(err.response?.data?.message || 'Failed to update follow-up status.'); }
  };

  const resolveAlert = async (alertId) => {
    const value = actionTaken[alertId]?.trim();
    if (!value) {
      setError('Action taken is required before resolving an alert.');
      return;
    }
    try {
      await api.patch(`/counselor/follow-ups/alerts/${alertId}/resolve`, { actionTaken: value });
      await loadFollowUp(selectedVictimId);
    } catch (err) { setError(err.response?.data?.message || 'Failed to resolve follow-up.'); }
  };

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Follow-Ups</h1>
      </header>

      {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: 8 }}>{error}</div>}
      <section style={{ background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
        <label>Select assigned victim<select value={selectedVictimId} onChange={(event) => setSelectedVictimId(event.target.value)}><option value="">Select victim</option>{victims.map((victim) => <option key={victim.victimId} value={victim.victimId}>{victim.name} ({victim.caseId})</option>)}</select></label>
      </section>
      {!followUp && <p style={{ color: '#6b7280' }}>Select an assigned victim to view follow-ups.</p>}
      {followUp && <div style={{ display: 'grid', gap: '1rem' }}>
        <section style={{ background: '#fff', padding: '1rem', borderRadius: 8 }}><h2>{followUp.victim.name}</h2><p>Case ID: <strong>{followUp.caseInfo.caseId}</strong></p><p>Location: {followUp.victim.district}, {followUp.victim.state}</p></section>
        <section style={{ background: '#fff', padding: '1rem', borderRadius: 8 }}><h2>Daily Updates</h2>{followUp.dailyUpdates.length === 0 ? <p>No Daily Updates submitted.</p> : followUp.dailyUpdates.map((update) => <article key={update._id} style={{ borderBottom: '1px solid #e5e7eb', padding: '0.75rem 0' }}><p>{update.content || update.feeling}</p><small>{fmtDateTime(update.createdAt)}</small></article>)}</section>
        <section style={{ background: '#fff', padding: '1rem', borderRadius: 8 }}><h2>Emergency / High-Risk Follow-Ups</h2>{followUp.alerts.length === 0 ? <p>No emergency or high-risk follow-ups.</p> : followUp.alerts.map((alert) => <article key={alert._id} style={{ border: '1px solid #e2e8f0', padding: '0.85rem', marginBottom: '0.75rem', borderRadius: 6 }}><p><strong>{alert.alertType}</strong> · {alert.severity} · {alert.source}</p><p>{alert.description}</p><p>Risk: {alert.riskLevel || 'N/A'} {alert.riskScore != null ? `(${alert.riskScore}/100)` : ''}</p><p>Status: <strong>{alert.status}</strong> · Created: {fmtDateTime(alert.createdAt)}</p>{alert.callLogId ? <p>Call: {alert.callLogId.callStatus} · Initiated: {fmtDateTime(alert.callLogId.initiatedAt)}{alert.callLogId.failureReason ? ` · ${alert.callLogId.failureReason}` : ''}</p> : <p>Call record: Not available</p>}{alert.actionTaken && <p>Action taken: {alert.actionTaken}<br />Resolved: {fmtDateTime(alert.resolvedAt)}</p>}{alert.status === 'NEW' && <button type="button" onClick={() => updateAlertStatus(alert._id, 'ACKNOWLEDGED')}>Acknowledge</button>}{alert.status === 'ACKNOWLEDGED' && <button type="button" onClick={() => updateAlertStatus(alert._id, 'IN_PROGRESS')}>Mark In Progress</button>}{alert.status === 'IN_PROGRESS' && <div><textarea placeholder="Action taken" value={actionTaken[alert._id] || ''} onChange={(event) => setActionTaken({ ...actionTaken, [alert._id]: event.target.value })} rows={3} maxLength={2000} /><button type="button" onClick={() => resolveAlert(alert._id)}>Resolve Follow-Up</button></div>}</article>)}</section>
      </div>}
    </div>
  );
}
