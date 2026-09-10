import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import AppointmentCard from '../../components/victim/AppointmentCard';

const initialForm = { victimId: '', scheduledAt: '', appointmentType: 'Initial Consultation', reason: '' };

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [victims, setVictims] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState('');

  const loadData = async () => {
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
    }
  };

  useEffect(() => { loadData(); }, []);

  const createAppointment = async (event) => {
    event.preventDefault();
    try {
      await api.post('/counselor/appointments', { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() });
      setForm(initialForm);
      await loadData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to schedule appointment.'); }
  };

  const complete = async (id) => {
    try { await api.patch(`/counselor/appointments/${id}/complete`); await loadData(); } catch (err) { setError(err.response?.data?.message || 'Failed to complete appointment.'); }
  };

  const saveNotes = async (id) => {
    try { await api.patch(`/counselor/appointments/${id}/notes`, { consultationNotes: notes[id] || '' }); await loadData(); } catch (err) { setError(err.response?.data?.message || 'Failed to save consultation notes.'); }
  };

  const confirmed = appointments.filter((appointment) => appointment.status === 'CONFIRMED');
  const completed = appointments.filter((appointment) => appointment.status === 'COMPLETED');

  return (
    <div className="counselor-page" style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Appointments</h1>
      </header>

      {error && <div style={{ color: '#991b1b', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>{error}</div>}
      <section style={{ background: '#fff', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: '1rem' }}>
        <h2>Schedule Appointment</h2>
        <form onSubmit={createAppointment} style={{ display: 'grid', gap: '0.75rem', maxWidth: 620 }}>
          <label>Assigned victim<select required value={form.victimId} onChange={(event) => setForm({ ...form, victimId: event.target.value })}><option value="">Select victim</option>{victims.map((victim) => <option key={victim._id || victim.victimId} value={victim._id || victim.victimId}>{victim.name} ({victim.caseId?.caseId || victim.caseId || 'Case'})</option>)}</select></label>
          <label>Date and time<input required type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></label>
          <label>Appointment type<select value={form.appointmentType} onChange={(event) => setForm({ ...form, appointmentType: event.target.value })}><option>Initial Consultation</option><option>Follow-up</option><option>Individual Counseling</option><option>Other</option></select></label>
          <label>Reason or details<textarea required maxLength={2000} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} rows={3} /></label>
          <button type="submit">Schedule Confirmed Appointment</button>
        </form>
      </section>
      <section style={{ display: 'grid', gap: '0.75rem' }}><h2>Upcoming Appointments</h2>{confirmed.length === 0 ? <p>No upcoming appointments.</p> : confirmed.map((appointment) => <AppointmentCard key={appointment._id} appointment={appointment} viewer="counselor" actions={<button type="button" onClick={() => complete(appointment._id)}>Mark Appointment Done</button>} />)}</section>
      <section style={{ display: 'grid', gap: '0.75rem', marginTop: '1.5rem' }}><h2>Completed Appointments</h2>{completed.length === 0 ? <p>No completed appointments.</p> : completed.map((appointment) => <div key={appointment._id}><AppointmentCard appointment={appointment} viewer="counselor" /><textarea placeholder="Consultation notes" value={notes[appointment._id] ?? appointment.consultationNotes ?? ''} onChange={(event) => setNotes({ ...notes, [appointment._id]: event.target.value })} rows={4} maxLength={5000} /><button type="button" onClick={() => saveNotes(appointment._id)}>Save Notes</button></div>)}</section>
    </div>
  );
}
