import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const normalizePhoneForApi = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.length === 10 ? digits : digits;
};

export default function Login() {
  const [step, setStep] = useState(1); // 1: Enter Case ID & Phone -> Send OTP, 2: Enter OTP -> Verify & Login
  const [caseId, setCaseId] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const { loginVictim, sendVictimOtp, resendVictimOtp, loading } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown timer effect
  useEffect(() => {
    let interval = null;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  // Handle Step 1: Request & Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (sendLoading) return;
    setError('');
    setOtpSentMessage('');

    const trimmedCaseId = caseId.trim().toUpperCase();
    const cleanPhone = normalizePhoneForApi(phone);

    if (!trimmedCaseId) {
      setError('Please enter your Case ID (e.g., ARH-2026-001).');
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit registered phone number.');
      return;
    }

    try {
      setSendLoading(true);
      const res = await sendVictimOtp(trimmedCaseId, cleanPhone);
      setOtpSentMessage(res.message || 'OTP has been sent to your registered mobile number.');
      setCooldown(60); // 60s cooldown before next resend
      setStep(2);
    } catch (err) {
      setError(err.message || 'Unable to send OTP. Please verify your details.');
    } finally {
      setSendLoading(false);
    }
  };

  // Handle Resending OTP while on Step 2
  const handleResendOtp = async () => {
    if (cooldown > 0 || sendLoading) return;
    setError('');
    setOtpSentMessage('');

    try {
      setSendLoading(true);
      const res = await resendVictimOtp(caseId.trim().toUpperCase(), normalizePhoneForApi(phone));
      setOtpSentMessage(res.message || 'A new 6-digit OTP has been sent to your phone.');
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Unable to resend OTP. Please try again.');
    } finally {
      setSendLoading(false);
    }
  };

  // Handle Step 2: Verify OTP & Sign In
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedCaseId = caseId.trim().toUpperCase();
    const cleanPhone = normalizePhoneForApi(phone);
    const cleanOtp = otp.trim().replace(/\D/g, '');

    if (!trimmedCaseId || !cleanPhone) {
      setError('Case ID and Phone Number are required.');
      setStep(1);
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP received via SMS.');
      return;
    }

    try {
      const userData = await loginVictim(trimmedCaseId, cleanPhone, cleanOtp);
      if (userData.role === 'victim') {
        navigate('/victim/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check the OTP.');
    }
  };

  // Mask phone number for display (e.g. ******1234)
  const maskedPhone = phone.length === 10 ? `******${phone.slice(6)}` : phone;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      padding: '1.5rem'
    }}>
      <div style={{ position: 'fixed', top: '1.25rem', left: '1.25rem', zIndex: 20 }}>
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          border: '1px solid #dbeafe',
          borderRadius: '999px',
          padding: '0.6rem 1rem',
          fontSize: '0.8rem',
          fontWeight: '700',
          textDecoration: 'none',
          boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)'
        }}>
          Home
        </Link>
      </div>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        padding: '2.25rem'
      }}>
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: '#eff6ff', borderRadius: '50%', marginBottom: '0.75rem' }}>
            <svg style={{ width: '24px', height: '24px', color: '#1e40af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
            AAROHAN
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.35rem', fontWeight: '500' }}>
            National Victim Support Portal &bull; Sign In
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <svg style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>{error}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {otpSentMessage && step === 2 && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <svg style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>{otpSentMessage}</div>
          </div>
        )}

        {/* STEP 1: Enter Case ID & Phone -> Request OTP */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.375rem' }}>
                Official Case ID <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={caseId}
                onChange={(e) => setCaseId(e.target.value.toUpperCase())}
                placeholder="e.g. ARH-2026-001"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Provided via SMS following administrator approval.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.375rem' }}>
                Registered Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRight: 'none',
                  borderRadius: '6px 0 0 6px',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  +91
                </span>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0 6px 6px 0',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sendLoading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: sendLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.9375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.15s ease',
                marginTop: '0.5rem'
              }}
            >
              {sendLoading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Login OTP</span>
                  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep(2);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Already have an active OTP from SMS? Enter OTP directly &rarr;
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP -> Verify & Login */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Context Summary Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase' }}>
                  Authenticating Case
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                  {caseId || 'Case ID'} &bull; <span style={{ color: '#475569' }}>+91 {maskedPhone || 'Phone'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep(1);
                }}
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.375rem', textAlign: 'center' }}>
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #cbd5e1',
                  fontSize: '1.75rem',
                  letterSpacing: '0.4em',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  color: '#0f172a'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem', display: 'block', textAlign: 'center' }}>
                OTP is valid for 15 minutes. Never share this code.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || sendLoading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: loading || sendLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.9375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.25rem'
              }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying OTP...</span>
                </>
              ) : (
                'Verify & Sign In to Portal'
              )}
            </button>

            {/* Resend OTP & Cooldown Control */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep(1);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                &larr; Back to Details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || sendLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: cooldown > 0 || sendLoading ? '#94a3b8' : '#2563eb',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  cursor: cooldown > 0 || sendLoading ? 'not-allowed' : 'pointer',
                  padding: 0
                }}
              >
                {sendLoading ? 'Sending...' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Footer Navigation Links */}
        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
            Track existing application?{' '}
            <Link to="/track-application" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
              Track Application Status
            </Link>
          </p>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
            New to AAROHAN?{' '}
            <Link to="/register/victim" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
              Register as a Victim
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
