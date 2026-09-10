import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CounselorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginUser, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userData = await loginUser(email.trim(), password);
      
      // Strict role verification: only counselor allowed
      if (userData.role !== 'counselor') {
        logout();
        setError('Access denied: Unauthorized role for Counselor Portal.');
        return;
      }

      navigate('/counselor/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#064e3b',
      padding: '1rem'
    }}>
      <div style={{ position: 'fixed', top: '1.25rem', left: '1.25rem', zIndex: 20 }}>
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          color: '#064e3b',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '999px',
          padding: '0.6rem 1rem',
          fontSize: '0.8rem',
          fontWeight: '700',
          textDecoration: 'none'
        }}>
          Home
        </Link>
      </div>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block', padding: '0.5rem', backgroundColor: '#ecfdf5', borderRadius: '50%', marginBottom: '0.75rem' }}>
            <svg style={{ width: '32px', height: '32px', color: '#047857' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            AAROHAN
          </h1>
          <p style={{ color: '#047857', fontSize: '0.875rem', marginTop: '0.25rem', fontWeight: '600' }}>
            Counselor Portal Sign In
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Counselor Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="counselor@aarohan.org"
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#047857',
              color: '#ffffff',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Counselor Workspace'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/counselor-portal" style={{ color: '#047857', fontSize: '0.8125rem', fontWeight: '600', textDecoration: 'none' }}>
            &larr; Back to Counselor Portal Landing Page
          </Link>
          <Link to="/" style={{ color: '#6b7280', fontSize: '0.75rem', textDecoration: 'none' }}>
            AAROHAN Public Portal Home
          </Link>
        </div>
      </div>
    </div>
  );
}
