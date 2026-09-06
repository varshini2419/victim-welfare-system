import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DailyUpdates.css';

export default function DailyUpdates() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [formState, setFormState] = useState('idle'); // idle | editing | submitting | success | error
  const [validationError, setValidationError] = useState('');
  
  // Real data state placeholders
  const [previousUpdates, setPreviousUpdates] = useState([]);

  const MAX_LENGTH = 1000;
  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_LENGTH) {
      setContent(text);
      if (formState === 'error') {
        setFormState('editing');
        setValidationError('');
      }
    }
  };

  const handleClear = () => {
    setContent('');
    setFormState('idle');
    setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setValidationError('Your update cannot be empty.');
      setFormState('error');
      return;
    }

    if (formState === 'submitting') return;

    setFormState('submitting');
    setValidationError('');

    // Simulate the attempt to contact a backend API.
    // As instructed, we do not fake success because the real backend endpoint does not exist.
    try {
      // Future API call would go here: await api.post('/victim/daily-updates', { content })
      
      // Since it's missing:
      throw new Error("Backend integration pending. Service currently unavailable.");
    } catch (err) {
      setFormState('error');
      setValidationError(err.message || 'An error occurred while saving your update.');
    }
  };

  if (loading) {
    return <div className="loading-state">Loading your daily updates...</div>;
  }

  return (
    <div className="daily-updates-container">
      <div className="updates-header">
        <div className="header-top">
          <h1>Daily Update</h1>
          <Link to="/victim/dashboard" className="back-link">&larr; Back to Dashboard</Link>
        </div>
        <p className="privacy-notice">
          Share your thoughts, feelings, or events of the day. This information is kept strictly confidential and is only accessible by your authorized counselor and support team to provide you with better care.
        </p>
        <p className="current-date">{currentDate}</p>
      </div>

      <div className="updates-main-grid">
        <section className="form-section">
          <h2>Write Today's Update</h2>
          <form className="update-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="updateContent" className="sr-only">Your update</label>
              <textarea
                id="updateContent"
                className={`update-textarea ${validationError ? 'has-error' : ''}`}
                placeholder="How are you feeling today? What happened?"
                value={content}
                onChange={handleChange}
                disabled={formState === 'submitting'}
                rows={8}
                aria-invalid={!!validationError}
              />
              <div className="form-meta">
                <span className="char-counter">
                  {content.length} / {MAX_LENGTH} characters
                </span>
                {validationError && (
                  <span className="validation-error" role="alert">
                    {validationError}
                  </span>
                )}
              </div>
            </div>

            {formState === 'success' && (
              <div className="success-message" role="alert">
                Your update was securely saved.
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-clear" 
                onClick={handleClear}
                disabled={formState === 'submitting' || !content}
              >
                Clear
              </button>
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={formState === 'submitting' || !content.trim()}
              >
                {formState === 'submitting' ? 'Saving securely...' : 'Submit Update'}
              </button>
            </div>
          </form>
        </section>

        <section className="history-section">
          <h2>Previous Updates</h2>
          {previousUpdates.length > 0 ? (
            <div className="history-list">
              {/* Structure for future real data */}
            </div>
          ) : (
            <div className="empty-state-card">
              <p>No previous updates available.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
