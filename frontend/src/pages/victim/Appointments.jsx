import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import AppointmentCard from '../../components/victim/AppointmentCard';

const initialForm = { scheduledAt: '', appointmentType: 'Initial Consultation', reason: '' };

const groups = [
  ['CONFIRMED', 'Confirmed / Upcoming'],
  ['PENDING', 'Pending Requests'],
  ['COMPLETED', 'Completed'],
  ['REJECTED', 'Request History'],
];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAppointments = async () => {
    try {
      const response = await api.get('/victim/appointments');
      setAppointments(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, []);

  const submitRequest = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/victim/appointments', {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      setForm(initialForm);
      setShowForm(false);
      setMessage('Appointment request sent to your counselor.');
      await loadAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send appointment request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="chatbot-top-header">
        <div className="chatbot-header-left">
          <h1>Appointment Scheduling</h1>
        </div>
        <Link to="/victim/dashboard" className="chatbot-back-link">&larr; Back to Dashboard</Link>
      </div>

      <section className="dashboard-section" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div><h2>Your Appointments</h2><p>Request and track consultations with your assigned counselor.</p></div>
          <button type="button" onClick={() => setShowForm((visible) => !visible)}>{showForm ? 'Close' : 'Request Appointment'}</button>
        </div>
        {message && <div style={{ color: '#166534', background: '#dcfce7', padding: '0.75rem', borderRadius: 6 }}>{message}</div>}
        {error && <div style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: 6 }}>{error}</div>}
        {showForm && <form onSubmit={submitRequest} style={{ display: 'grid', gap: '0.75rem', maxWidth: 560, border: '1px solid #e2e8f0', padding: '1rem', borderRadius: 8 }}>
          <label>Date and time<input required type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></label>
          <label>Appointment type<select value={form.appointmentType} onChange={(event) => setForm({ ...form, appointmentType: event.target.value })}><option>Initial Consultation</option><option>Follow-up</option><option>Individual Counseling</option><option>Other</option></select></label>
          <label>Reason or details<textarea required maxLength={2000} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} rows={4} /></label>
          <button disabled={saving} type="submit">{saving ? 'Sending...' : 'Send Request'}</button>
        </form>}
        {loading && <p>Loading appointments...</p>}
        {!loading && groups.map(([status, title]) => {
          const items = appointments.filter((appointment) => appointment.status === status);
          return <div key={status} style={{ display: 'grid', gap: '0.65rem' }}><h3>{title}</h3>{items.length === 0 ? <p>No {title.toLowerCase()}.</p> : items.map((appointment) => <AppointmentCard key={appointment._id} appointment={appointment} />)}</div>;
        })}
      </section>
    </div>
  );
}
