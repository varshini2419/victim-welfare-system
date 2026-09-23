import React, { useState } from 'react';
import useGeminiLive from '../../hooks/useGeminiLive';

export default function GeminiLiveVoice({ language }) {
  const { isConnected, error, connect, disconnect, isSpeaking } = useGeminiLive(
    import.meta.env.VITE_GEMINI_API_KEY,
    language || 'en'
  );

  React.useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Suppress stale error display if connection is actively established and healthy
  const displayError = !isConnected ? error : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: '#f8fafc',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      {displayError && (
        <div style={{ color: '#ef4444', fontSize: '0.75rem', marginRight: '0.5rem' }}>
          {displayError}
        </div>
      )}
      
      <div style={{ fontSize: '0.85rem', color: isConnected ? '#10b981' : '#64748b', fontWeight: 'bold' }}>
        {isConnected ? (
          isSpeaking ? '🔊 Agent is speaking...' : '🎙️ Listening... Speak now.'
        ) : (
          'Connecting to Live Voice...'
        )}
      </div>

      {isConnected && isSpeaking && (
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '20px',
          backgroundColor: '#10b981',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          animation: 'pulse 1.5s infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          🔊
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
