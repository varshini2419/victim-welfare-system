import React from 'react';

const formatDateTime = (value) => value
	? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
	: 'Not scheduled';

export default function AppointmentCard({ appointment, viewer = 'victim', actions }) {
	const victimName = appointment.victimId?.name;
	const counselorName = appointment.counselor?.name || appointment.counselorId?.email;
	const caseLabel = appointment.caseId?.caseId || appointment.caseId?._id || 'Case unavailable';

	return (
		<article style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', background: '#fff' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
				<strong>{viewer === 'counselor' ? victimName || 'Assigned victim' : 'Counselor appointment'}</strong>
				<span style={{ fontWeight: 700, color: appointment.status === 'REJECTED' ? '#b91c1c' : '#1d4ed8' }}>{appointment.status}</span>
			</div>
			<div style={{ marginTop: '0.65rem', display: 'grid', gap: '0.3rem', color: '#475569', fontSize: '0.9rem' }}>
				<div><strong>Case:</strong> {caseLabel}</div>
				{viewer === 'victim' && counselorName && <div><strong>Counselor:</strong> {counselorName}</div>}
				<div><strong>Date and time:</strong> {formatDateTime(appointment.scheduledAt)}</div>
				<div><strong>Type:</strong> {appointment.appointmentType}</div>
				<div><strong>Reason:</strong> {appointment.reason}</div>
				{appointment.rejectionReason && <div style={{ color: '#b91c1c' }}><strong>Rejection reason:</strong> {appointment.rejectionReason}</div>}
				{appointment.completedAt && <div><strong>Completed:</strong> {formatDateTime(appointment.completedAt)}</div>}
				{appointment.consultationNotes && <div><strong>Consultation notes:</strong> {appointment.consultationNotes}</div>}
			</div>
			{actions && <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{actions}</div>}
		</article>
	);
}
