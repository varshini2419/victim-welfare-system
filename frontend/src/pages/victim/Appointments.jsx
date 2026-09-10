<<<<<<< HEAD
import React, { useState } from 'react';
=======
import React, { useEffect, useState } from 'react';
>>>>>>> appointment-scheduling
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

const initialRequest = {
  preferredDate: '',
  preferredTime: '',
  mode: 'Video Call',
  reason: 'Emotional support',
  urgency: 'Normal',
  language: 'English',
  notes: ''
};

const sentRequests = [
  {
    date: '18 Sep 2026',
    time: '4:30 PM',
    mode: 'Video Call',
    reason: 'Emotional support',
    urgency: 'Medium',
    status: 'Pending review',
    counselor: 'Dr. Sreeja Nair'
  },
  {
    date: '12 Sep 2026',
    time: '10:00 AM',
    mode: 'Phone Consultation',
    reason: 'Follow-up session',
    urgency: 'Low',
    status: 'Approved',
    counselor: 'Ms. Ananya Rao'
  }
];

export default function Appointments() {
<<<<<<< HEAD
  const [form, setForm] = useState(initialRequest);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
=======
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
>>>>>>> appointment-scheduling
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ margin: 0, color: '#2563eb', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>Booking</p>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Appointment Scheduling</h1>
        </div>
        <Link to="/victim/dashboard" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>← Back to Dashboard</Link>
      </div>

<<<<<<< HEAD
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', color: '#0f172a' }}>Request a consultation</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={styles.label}>Preferred date</label>
                <input type="date" name="preferredDate" value={form.preferredDate} onChange={handleChange} style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>Preferred time</label>
                <input type="time" name="preferredTime" value={form.preferredTime} onChange={handleChange} style={styles.input} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={styles.label}>Session mode</label>
                <select name="mode" value={form.mode} onChange={handleChange} style={styles.input}>
                  <option>Video Call</option>
                  <option>Phone Consultation</option>
                  <option>In-person</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Urgency</label>
                <select name="urgency" value={form.urgency} onChange={handleChange} style={styles.input}>
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={styles.label}>Reason</label>
                <select name="reason" value={form.reason} onChange={handleChange} style={styles.input}>
                  <option>Emotional support</option>
                  <option>Family related guidance</option>
                  <option>Stress and anxiety support</option>
                  <option>Follow-up session</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Preferred language</label>
                <select name="language" value={form.language} onChange={handleChange} style={styles.input}>
                  <option>English</option>
                  <option>Telugu</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>

            <div>
              <label style={styles.label}>Additional notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} placeholder="Add any situation details you would like the counselor to know." style={{ ...styles.input, resize: 'vertical', minHeight: '110px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="submit" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.8rem 1.2rem', fontWeight: 700, cursor: 'pointer' }}>
                Submit request
              </button>
              {submitted && (
                <span style={{ color: '#166534', fontWeight: 700, background: '#dcfce7', border: '1px solid #86efac', borderRadius: '999px', padding: '0.4rem 0.75rem' }}>
                  Request sent successfully
                </span>
              )}
            </div>
          </form>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', color: '#0f172a' }}>Your request history</h2>
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            {sentRequests.map((item, index) => (
              <div key={index} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#0f172a' }}>{item.date}</strong>
                  <span style={{ background: item.status === 'Approved' ? '#dcfce7' : '#fef3c7', color: item.status === 'Approved' ? '#166534' : '#92400e', borderRadius: '999px', padding: '0.25rem 0.55rem', fontSize: '0.7rem', fontWeight: 700 }}>{item.status}</span>
                </div>
                <div style={{ marginTop: '0.5rem', color: '#475569', lineHeight: 1.5, fontSize: '0.9rem' }}>
                  <div><strong>Time:</strong> {item.time}</div>
                  <div><strong>Mode:</strong> {item.mode}</div>
                  <div><strong>Reason:</strong> {item.reason}</div>
                  <div><strong>Counselor:</strong> {item.counselor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
=======
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
>>>>>>> appointment-scheduling
    </div>
  );
}

const styles = {
  label: {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: '#334155',
    marginBottom: '0.5rem'
  },
  input: {
    width: '100%',
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '0.78rem 0.9rem',
    fontSize: '0.95rem',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  }
};
