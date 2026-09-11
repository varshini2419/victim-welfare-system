import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import AppointmentCard from '../../components/victim/AppointmentCard';

const initialForm = { victimId: '', scheduledAt: '', appointmentType: 'Initial Consultation', reason: '' };

const DAILY_ROUTINE = [
  { time: '08:00 AM', label: 'Morning Review', desc: 'Review overnight alerts, pending cases, and new victim registrations.', icon: '☀️', color: '#0ea5e9' },
  { time: '09:00 AM', label: 'Team Briefing', desc: 'Short stand-up with fellow counselors — share updates and flag crises.', icon: '👥', color: '#8b5cf6' },
  { time: '10:00 AM', label: 'Victim Sessions', desc: 'Scheduled tele / in-person counseling sessions (Block 1 of 3).', icon: '🤝', color: '#0d9488' },
  { time: '12:30 PM', label: 'Documentation Break', desc: 'Complete clinical notes, update case records and risk assessments.', icon: '📋', color: '#f59e0b' },
  { time: '01:30 PM', label: 'Lunch & Rest', desc: 'Mandatory wellness break — step away from screens.', icon: '🌿', color: '#16a34a' },
  { time: '02:30 PM', label: 'Victim Sessions', desc: 'Scheduled counseling sessions (Block 2 of 3).', icon: '🤝', color: '#0d9488' },
  { time: '04:30 PM', label: 'Welfare Coordination', desc: 'Coordinate with welfare officers for support referrals and legal aid.', icon: '⚖️', color: '#dc2626' },
  { time: '05:30 PM', label: 'Follow-Up Calls', desc: 'Check-in calls for discharged or high-risk victims.', icon: '📞', color: '#2563eb' },
  { time: '06:30 PM', label: 'End-of-Day Report', desc: 'Submit daily summary — cases handled, escalations raised, risk flags.', icon: '📊', color: '#7c3aed' },
];

const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [victims, setVictims] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appointmentsResponse, victimsResponse] = await Promise.all([
        api.get('/counselor/appointments'),
        api.get('/counselor/victims'),
      ]);
      setAppointments(appointmentsResponse.data.data || []);
      setVictims(victimsResponse.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const createAppointment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/counselor/appointments', {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      setForm(initialForm);
      setShowForm(false);
      setMessage('Appointment scheduled successfully.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule appointment.');
    } finally {
      setSaving(false);
    }
  };

  const complete = async (id) => {
    try {
      await api.patch(`/counselor/appointments/${id}/complete`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete appointment.');
    }
  };

  const saveNotes = async (id) => {
    try {
      await api.patch(`/counselor/appointments/${id}/notes`, { consultationNotes: notes[id] || '' });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save consultation notes.');
    }
  };

  const confirmed = appointments.filter((appointment) => appointment.status === 'CONFIRMED');
  const completed = appointments.filter((appointment) => appointment.status === 'COMPLETED');

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#f5f6fa', minHeight: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>Appointments</h1>
        </div>
        <button type="button" onClick={() => setShowForm((visible) => !visible)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.7rem 1.1rem', fontWeight: 700, cursor: 'pointer' }}>
          {showForm ? 'Close' : 'Schedule Appointment'}
        </button>
      </header>

      {message && <div style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      {showForm && (
        <section style={{ background: '#fff', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0 }}>Schedule Appointment</h2>
          <form onSubmit={createAppointment} style={{ display: 'grid', gap: '0.75rem', maxWidth: 620 }}>
            <label>
              Assigned victim
              <select required value={form.victimId} onChange={(event) => setForm({ ...form, victimId: event.target.value })} style={{ display: 'block', width: '100%', marginTop: '0.3rem', padding: '0.6rem', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                <option value="">Select victim</option>
                {victims.map((victim) => (
                  <option key={victim._id || victim.victimId} value={victim._id || victim.victimId}>
                    {victim.name} ({victim.caseId?.caseId || victim.caseId || 'Case'})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date and time
              <input required type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} style={{ display: 'block', width: '100%', marginTop: '0.3rem', padding: '0.6rem', borderRadius: 6, border: '1px solid #cbd5e1' }} />
            </label>
            <label>
              Appointment type
              <select value={form.appointmentType} onChange={(event) => setForm({ ...form, appointmentType: event.target.value })} style={{ display: 'block', width: '100%', marginTop: '0.3rem', padding: '0.6rem', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                <option>Initial Consultation</option>
                <option>Follow-up</option>
                <option>Individual Counseling</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Reason or details
              <textarea required maxLength={2000} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} rows={3} style={{ display: 'block', width: '100%', marginTop: '0.3rem', padding: '0.6rem', borderRadius: 6, border: '1px solid #cbd5e1', resize: 'vertical' }} />
            </label>
            <button type="submit" disabled={saving} style={{ backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '0.75rem 1rem', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Scheduling...' : 'Schedule Confirmed Appointment'}
            </button>
          </form>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '1rem' }}>🕐 Counselor Daily Routine</div>
          <p style={{ color: '#64748b', margin: '0 0 1rem' }}>Recommended structured schedule for effective case management.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {DAILY_ROUTINE.map((routine, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: routine.color, marginTop: '0.4rem' }} />
                <span style={{ minWidth: '72px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>{routine.time}</span>
                <span style={{ fontSize: '1.3rem', minWidth: '28px' }}>{routine.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b', borderLeft: `3px solid ${routine.color}`, paddingLeft: '0.5rem' }}>{routine.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{routine.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '1rem' }}>📋 My Appointments</div>
          {loading ? (
            <div style={{ color: '#64748b', padding: '2rem', textAlign: 'center' }}>Loading appointments…</div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <section>
                <h3 style={{ marginBottom: '0.75rem' }}>Upcoming Appointments</h3>
                {confirmed.length === 0 ? <p>No upcoming appointments.</p> : confirmed.map((appointment) => (
                  <div key={appointment._id} style={{ marginBottom: '0.75rem' }}>
                    <AppointmentCard appointment={appointment} viewer="counselor" actions={<button type="button" onClick={() => complete(appointment._id)} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 0.75rem', fontWeight: 700, cursor: 'pointer' }}>Mark Appointment Done</button>} />
                  </div>
                ))}
              </section>

              <section>
                <h3 style={{ marginBottom: '0.75rem' }}>Completed Appointments</h3>
                {completed.length === 0 ? <p>No completed appointments.</p> : completed.map((appointment) => (
                  <div key={appointment._id} style={{ marginBottom: '0.75rem' }}>
                    <AppointmentCard appointment={appointment} viewer="counselor" />
                    <textarea
                      placeholder="Consultation notes"
                      value={notes[appointment._id] ?? appointment.consultationNotes ?? ''}
                      onChange={(event) => setNotes({ ...notes, [appointment._id]: event.target.value })}
                      rows={4}
                      maxLength={5000}
                      style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem', borderRadius: 6, border: '1px solid #cbd5e1', resize: 'vertical' }}
                    />
                    <button type="button" onClick={() => saveNotes(appointment._id)} style={{ marginTop: '0.5rem', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                      Save Notes
                    </button>
                  </div>
                ))}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
