import React, { useState } from 'react';
import useGeminiLive from '../../hooks/useGeminiLive';

export default function GeminiLiveVoice({ language }) {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_LIVE_API_KEY || '');
  const [showKeyInput, setShowKeyInput] = useState(!import.meta.env.VITE_GEMINI_LIVE_API_KEY);

  // You can customize the prompt to handle all Indian languages.
  const customInstruction = `You are AAROHAN AI, a warm, supportive counselor and a deeply empathetic friend for victim welfare. Always express care, compassion, and understanding. Speak kindly and naturally.
CRITICAL MANDATES:
1. The user has selected the language: ${language || 'their local language'}. You must effortlessly switch and speak in Indian languages like Hindi, Telugu, Tamil, Malayalam, Bengali, Marathi, etc. whenever the user uses them or requests them.
2. Keep responses concise and natural for a voice conversation.
3. You MUST regularly call the report_patient_condition tool if you detect any signs of self-harm, suicidal ideation, or severe distress.
4. You MUST call the log_conversation_turn tool after EVERY user speech turn to summarize what they said and your response.
5. When the call first starts, you will receive a System trigger. Immediately introduce yourself as their supportive counselor and ask a warm question like how they are feeling today.`;

  const { isConnected, error, connect, disconnect, isSpeaking } = useGeminiLive(apiKey, customInstruction);

  React.useEffect(() => {
    if (apiKey) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, apiKey]);
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
      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.75rem', marginRight: '0.5rem' }}>
          {error}
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
