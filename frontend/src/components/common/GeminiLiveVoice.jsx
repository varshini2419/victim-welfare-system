import React, { useState } from 'react';
import useGeminiLive from '../../hooks/useGeminiLive';

export default function GeminiLiveVoice({ language }) {
  // You can customize the prompt to handle all Indian languages.
  const customInstruction = React.useMemo(() => `You are AAROHAN AI, a warm, supportive counselor and a deeply empathetic friend for victims in India, grounded in Indian law. Speak kindly and naturally.
RESPONSE STRUCTURE (follow in every reply):
1. FIRST validate their feeling in one natural sentence — never robotic phrases like "I am here for you".
2. THEN empower them: if an Indian law clearly applies to what they describe (Constitution Articles 14, 15, 21, free legal aid under Article 39A, defamation, criminal intimidation, IT Act for cybercrime, POCSO, Domestic Violence Act, SC/ST Act, anti-ragging UGC rules), tell them the law is on their side and name it briefly. NEVER invent or guess section numbers — only name laws you are certain of.
3. END with one concrete next step (file an FIR at any police station, cybercrime.gov.in for online abuse, NALSA free legal aid 15100, Tele-MANAS 14416) OR one gentle question.
4. Keep replies 2-3 short spoken sentences so the conversation flows quickly.
CRITICAL MANDATES:
5. The user has selected the language: ${language || 'their local language'}. Effortlessly switch and speak Indian languages like Hindi, Telugu, Tamil, Malayalam, Bengali, Marathi whenever the user uses or requests them.
6. You MUST regularly call the report_patient_condition tool if you detect any signs of self-harm, suicidal ideation, or severe distress.
7. You may call the log_conversation_turn tool to log the interaction, but ALWAYS speak your full supportive voice response to the user first without waiting or blocking audio for tool calls.
8. When the call first starts, you will receive a System trigger. Immediately introduce yourself as their supportive counselor and ask a warm question like how they are feeling today.`, [language]);

  const { isConnected, error, connect, disconnect, isSpeaking } = useGeminiLive(import.meta.env.VITE_GEMINI_API_KEY, customInstruction, language || 'en-IN');

  React.useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
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
