import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001';

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'te-IN', name: 'Telugu (తెలుగు)' },
  { code: 'hi-IN', name: 'Hindi (हिंदी)' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
  { code: 'kn-IN', name: 'Kannada (కన్నడ)' },
  { code: 'ml-IN', name: 'Malayalam (മലയാളം)' },
  { code: 'es-ES', name: 'Spanish (Español)' },
  { code: 'fr-FR', name: 'French (Français)' },
];

export default function FloatingChatboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello, I am MindShield AI. I am here to offer a safe, empathetic, and confidential space. How are you feeling today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [isCrisis, setIsCrisis] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    // Build history
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text
    }));

    try {
      const res = await axios.post(`${API_BASE}/analyze`, {
        case_id: 'WIDGET-' + Date.now(),
        text: text.trim(),
        history: historyPayload
      });

      const data = res.data;
      if (data.crisis_flag) {
        setIsCrisis(true);
      }

      const botReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply || "I am here to support you. Please take a deep breath and share how you feel.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        distressScore: data.distress_score,
        band: data.sentiment_report?.band
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.warn("AI Service call offline/failed, using fallback context response:", err);
      
      const isHelplineReq = /helpline|number|call|phone|emergency/i.test(text);
      const isCrisisReq = /suicide|kill|die|end life/i.test(text);

      if (isCrisisReq) setIsCrisis(true);

      let fallbackText = "I am listening and here to support you. You are not alone, and taking things one moment at a time can help.";
      if (isHelplineReq) {
        fallbackText = "Emergency Helplines (24/7 Toll-Free):\n- Tele-MANAS: 14416 or 1800-891-4416\n- Vandrevala Foundation: +91 9999 666 555\n- KIRAN Helpline: 1800-599-0019";
      }

      const botReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: fallbackText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botReply]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordingStatus('Transcribing voice...');
        try {
          const response = await fetch(`${API_BASE}/transcribe?lang=${selectedLang}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'audio/wav',
              'X-Voice-Lang': selectedLang
            },
            body: audioBlob
          });
          const result = await response.json();
          if (result.success && result.transcript) {
            setInput(result.transcript);
            handleSend(result.transcript);
          } else {
            setRecordingStatus('Could not transcribe audio. Please try speaking again.');
            setTimeout(() => setRecordingStatus(''), 3000);
          }
        } catch (e) {
          console.error("Audio transcription error:", e);
          setRecordingStatus('Transcription service offline.');
          setTimeout(() => setRecordingStatus(''), 3000);
        } finally {
          setIsRecording(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingStatus('Listening... Speak into your microphone');
    } catch (err) {
      alert("Microphone access is required for voice input: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, fontFamily: 'sans-serif' }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4), 0 8px 10px -6px rgba(37, 99, 235, 0.2)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'transform 0.2s ease, background-color 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}>
            💬
          </div>
          <span>MindShield Support Chatboard</span>
        </button>
      )}

      {/* Floating Chat Widget Panel */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            height: '560px',
            maxHeight: '85vh',
            maxWidth: '92vw',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>MindShield AI Chatboard</h3>
                <span style={{ fontSize: '0.7rem', color: '#93c5fd', display: 'block' }}>Empathetic Support & Grounding</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Language Selector */}
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  padding: '2px 4px',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} style={{ color: '#000' }}>
                    {l.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '0 4px',
                  lineHeight: '1'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Crisis Alert Banner inside chat */}
          {isCrisis && (
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderBottom: '1px solid #fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🚨 Crisis Alert: 24/7 Helpline <strong>14416 (Tele-MANAS)</strong></span>
              <a href="tel:14416" style={{ backgroundColor: '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>Call</a>
            </div>
          )}

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            backgroundColor: '#f8fafc'
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '82%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: m.sender === 'user' ? '#2563eb' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: m.sender === 'bot' ? '1px solid #e2e8f0' : 'none',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}>
                  <p style={{ margin: 0 }}>{m.text}</p>
                  <span style={{
                    display: 'block',
                    textAlign: 'right',
                    fontSize: '0.65rem',
                    marginTop: '4px',
                    opacity: 0.7
                  }}>
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '0.5rem 0.85rem', borderRadius: '12px', fontSize: '0.8rem', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  Thinking & analyzing support...
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Recording status prompt */}
          {recordingStatus && (
            <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', padding: '4px 12px', borderTop: '1px solid #bfdbfe', textAlign: 'center' }}>
              {recordingStatus}
            </div>
          )}

          {/* Input Footer */}
          <div style={{ padding: '0.75rem', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                backgroundColor: isRecording ? '#ef4444' : '#f1f5f9',
                color: isRecording ? '#ffffff' : '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                flexShrink: 0
              }}
              title={isRecording ? 'Stop Recording' : 'Voice Input (Microphone)'}
            >
              🎙️
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message or concerns..."
              disabled={loading}
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '0.5rem 0.85rem',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                fontSize: '0.9rem',
                flexShrink: 0
              }}
            >
              ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
