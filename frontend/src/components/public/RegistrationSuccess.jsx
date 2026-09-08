import React from 'react';
import { Link } from 'react-router-dom';

export default function RegistrationSuccess({ registrationId }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', backgroundColor: '#ffffff', padding: '3rem 2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg style={{ width: '32px', height: '32px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>Registration Submitted Successfully</h1>
        <p style={{ color: '#4b5563', fontSize: '1.125rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Your registration has been submitted for verification. Please wait for approval from the concerned administrator.
        </p>

        {registrationId && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', display: 'inline-block', minWidth: '80%' }}>
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Registration ID — Keep this safe
            </span>
            <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {registrationId}
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#4ade80', marginTop: '0.5rem' }}>
              Use this ID to track your application status
            </span>
          </div>
        )}

        <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '6px' }}>
          An administrator will carefully review your submitted information and documents.
          Upon approval, a Case ID will be generated, and you will receive login credentials via SMS to access the Victim Portal.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          {registrationId && (
            <Link
              to={`/track-application?registrationId=${encodeURIComponent(registrationId)}`}
              style={{ display: 'inline-block', backgroundColor: '#2563eb', color: 'white', padding: '0.75rem 2rem', borderRadius: '6px', fontWeight: '600', textDecoration: 'none', width: '100%', maxWidth: '320px', textAlign: 'center' }}
            >
              TRACK APPLICATION STATUS
            </Link>
          )}
          <Link to="/" style={{ display: 'inline-block', backgroundColor: '#1e293b', color: 'white', padding: '0.75rem 2rem', borderRadius: '6px', fontWeight: '600', textDecoration: 'none', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

