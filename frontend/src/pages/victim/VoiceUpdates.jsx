import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './VoiceUpdates.css';

export default function VoiceUpdates() {
  const [loading, setLoading] = useState(true);
  
  // Recording states: 'idle' | 'requesting' | 'recording' | 'recorded' | 'submitting' | 'error'
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Real data state placeholders
  const [previousUpdates, setPreviousUpdates] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup object URLs and streams on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    setErrorMessage('');
    
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setStatus('error');
      setErrorMessage('Your browser does not support audio recording.');
      return;
    }

    setStatus('requesting');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        stopStream();
        setStatus('recorded');
      };

      mediaRecorder.start();
      setStatus('recording');
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions to record.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('No microphone was found on this device.');
      } else {
        setErrorMessage('An unexpected error occurred while trying to access the microphone.');
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleDelete = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setErrorMessage('');
    setStatus('idle');
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Future backend API call:
      // const formData = new FormData();
      // formData.append('audio', audioBlob, 'voice-update.webm');
      // await api.post('/victim/voice-updates', formData);
      
      throw new Error("Backend integration pending. Voice upload service is currently unavailable.");
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred while uploading your recording.');
    }
  };

  if (loading) {
    return <div className="loading-state">Loading voice updates...</div>;
  }

  return (
    <div className="voice-updates-container">
      <div className="updates-header">
        <div className="header-top">
          <h1>Voice Update</h1>
          <Link to="/victim/dashboard" className="back-link">&larr; Back to Dashboard</Link>
        </div>
        <p className="privacy-notice">
          Record a private voice journal about your day. Audio is never automatically analyzed or uploaded without your explicit permission.
        </p>
      </div>

      <div className="updates-main-grid">
        <section className="recorder-section">
          <h2>Record Audio</h2>
          <div className="recorder-card">
            
            {status === 'error' && (
              <div className="recorder-error" role="alert">
                <p>{errorMessage}</p>
                <button className="btn-secondary" onClick={handleDelete}>Try Again</button>
              </div>
            )}

            {(status === 'idle' || status === 'requesting') && (
              <div className="recorder-idle">
                <div className="mic-icon-large">🎙️</div>
                <p>Click below to start recording your voice update.</p>
                <button 
                  className="btn-primary start-btn" 
                  onClick={startRecording}
                  disabled={status === 'requesting'}
                >
                  {status === 'requesting' ? 'Requesting Access...' : 'Start Recording'}
                </button>
              </div>
            )}

            {status === 'recording' && (
              <div className="recorder-active">
                <div className="recording-indicator">
                  <div className="pulse-dot"></div>
                  <span>Recording...</span>
                </div>
                <div className="recording-timer">{formatTime(recordingTime)}</div>
                <button className="btn-danger stop-btn" onClick={stopRecording}>
                  Stop Recording
                </button>
              </div>
            )}

            {(status === 'recorded' || status === 'submitting') && (
              <div className="recorder-preview">
                <div className="preview-header">
                  <h3>Preview Recording</h3>
                  <span className="duration-badge">{formatTime(recordingTime)}</span>
                </div>
                <audio src={audioUrl} controls className="audio-player" />
                
                <div className="preview-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={handleDelete}
                    disabled={status === 'submitting'}
                  >
                    Delete & Re-record
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleSubmit}
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Uploading securely...' : 'Submit Recording'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </section>

        <section className="history-section">
          <h2>Previous Voice Updates</h2>
          {previousUpdates.length > 0 ? (
            <div className="history-list">
              {/* Structure for future real data */}
            </div>
          ) : (
            <div className="empty-state-card">
              <p>No previous voice updates available.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
