import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Chatbot.css';

const LANGUAGES = [
  { code: 'en-US', langKey: 'en', label: 'English' },
  { code: 'te-IN', langKey: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'hi-IN', langKey: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'ta-IN', langKey: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'kn-IN', langKey: 'kn', label: 'Kannada (కన్నడ)' },
  { code: 'ml-IN', langKey: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'es-ES', langKey: 'es', label: 'Spanish (Español)' },
  { code: 'fr-FR', langKey: 'fr', label: 'French (Français)' },
  { code: 'mr-IN', langKey: 'mr', label: 'Marathi (मराठी)' },
  { code: 'bn-IN', langKey: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'gu-IN', langKey: 'gu', label: 'Gujarati (ગુજરાતી)' },
];

const EMOTION_ICONS = {
  Fearful: '😨 Fearful',
  Anxious: '😟 Anxious',
  Sad: '😢 Sad',
  Angry: '😠 Angry',
  Calm: '😌 Calm',
  Hopeful: '🌟 Hopeful',
  Neutral: '😐 Neutral'
};

export default function Chatbot() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemError, setSystemError] = useState('');
  
  // Multilingual & Audio State
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  const [autoTts, setAutoTts] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Helper to fetch with auth
  const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(`/api/v1/chatbot${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API Error');
    }
    return data;
  };

  // Setup Web Speech Recognition for Audio Intake (STT)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLang;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLang]);

  // Handle Speech-to-Text Toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your message below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = selectedLang;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition start failed:', err);
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech (TTS) Audio Output
  const speakText = (text, msgId = null) => {
    if (!('speechSynthesis' in window)) {
      alert('Audio playback is not supported in your browser.');
      return;
    }

    window.speechSynthesis.cancel(); // Stop ongoing speech

    if (speakingMsgId === msgId && msgId !== null) {
      setSpeakingMsgId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;
    utterance.rate = 0.95;

    // Try to match voice for selected language if available
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(selectedLang.split('-')[0]));
    if (langVoice) {
      utterance.voice = langVoice;
    }

    utterance.onstart = () => {
      if (msgId) setSpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // 1. Fetch Sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await apiFetch('/sessions');
        setSessions(data.data);
        if (data.data.length > 0) {
          setActiveSessionId(data.data[0]._id);
        }
      } catch (err) {
        setSystemError('Failed to connect to backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // 2. Fetch Messages when activeSessionId changes
  useEffect(() => {
    if (!activeSessionId) return;
    const fetchMessages = async () => {
      try {
        const data = await apiFetch(`/sessions/${activeSessionId}/messages`);
        const formatted = data.data.map(m => ({
          id: m._id,
          role: m.senderType === 'victim' ? 'user' : 'system',
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: m.senderType === 'system' && m.isFlagged,
          emotion: m.metadata?.emotion || null,
          sentiment: m.metadata?.sentiment?.label || null,
          crisis: m.metadata?.crisis_flag || false
        }));
        setMessages(formatted);
      } catch (err) {
        setSystemError('Failed to load messages.');
      }
    };
    fetchMessages();
  }, [activeSessionId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/sessions', { method: 'POST' });
      setSessions([data.data, ...sessions]);
      setActiveSessionId(data.data._id);
    } catch (err) {
      setSystemError('Failed to create new conversation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (feeling) => {
    try {
      await apiFetch('/checkin', {
        method: 'POST',
        body: JSON.stringify({ feeling })
      });
      alert('Check-in submitted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to submit check-in.');
    }
  };

  const handleRequestCounselor = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/victim/request-support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('Counselor support requested successfully.');
    } catch (err) {
      alert(err.message || 'Failed to request counselor support.');
    }
  };

  const handleArchive = async () => {
    if (!activeSessionId) return;
    if (!window.confirm("Are you sure you want to archive this conversation?")) return;
    try {
      await apiFetch(`/sessions/${activeSessionId}`, { method: 'DELETE' });
      const updatedSessions = sessions.filter(s => s._id !== activeSessionId);
      setSessions(updatedSessions);
      setActiveSessionId(updatedSessions.length > 0 ? updatedSessions[0]._id : null);
      if (updatedSessions.length === 0) setMessages([]);
    } catch (err) {
      alert('Failed to archive conversation.');
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    let currentSessionId = activeSessionId;
    
    if (!currentSessionId) {
      try {
        const data = await apiFetch('/sessions', { method: 'POST' });
        currentSessionId = data.data._id;
        setSessions([data.data, ...sessions]);
        setActiveSessionId(currentSessionId);
      } catch (err) {
        setSystemError('Failed to start conversation.');
        return;
      }
    }

    const currentLangObj = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

    const userMsgObj = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setInputValue('');
    setIsTyping(true);
    setSystemError('');

    try {
      const responseData = await apiFetch(`/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: trimmedInput,
          language: currentLangObj.label
        })
      });
      
      const aiData = responseData.data;

      // Read REAL analysis from backend Gemini response
      let msgEmotion = null;
      let msgSentiment = null;
      let isCrisis = false;

      if (responseData.analysis) {
        setLatestAnalysis(responseData.analysis);
        msgEmotion = responseData.analysis.primary_emotion || null;
        msgSentiment = responseData.analysis.sentiment?.label || null;
        isCrisis = responseData.analysis.crisis_flag || false;
      }

      const aiMsgObj = {
        id: aiData._id || Date.now().toString(),
        role: 'system',
        content: aiData.content,
        timestamp: new Date(aiData.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: aiData.isFlagged,
        emotion: msgEmotion,
        sentiment: msgSentiment,
        crisis: isCrisis
      };

      setMessages((prev) => [...prev, aiMsgObj]);

      // Auto-TTS Response Speech if enabled
      if (autoTts && aiData.content) {
        speakText(aiData.content, aiMsgObj.id);
      }
      
      if (messages.length === 0) {
        const updatedSessions = sessions.map(s => {
          if (s._id === currentSessionId) {
            return { ...s, title: trimmedInput.substring(0, 30) };
          }
          return s;
        });
        setSessions(updatedSessions);
      }

    } catch (err) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: err.message || "An error occurred while connecting to the assistant.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading && !activeSessionId && sessions.length === 0) {
    return <div className="loading-state">Loading victim support assistant...</div>;
  }

  return (
    <div className="chatbot-container">
      {/* 1. TOP HEADER WITH MULTILINGUAL CONTROLS */}
      <div className="chatbot-top-header">
        <div className="chatbot-header-left">
          <img src="/images/emblem.png" alt="Govt Emblem" className="chatbot-header-logo" />
          <div>
            <h1>Govt. Victim Support Assistant (AAROHAN)</h1>
            <span className="chatbot-subtitle">Empathetic AI Support &amp; Emotion Analysis Portal</span>
          </div>
        </div>

        <div className="chatbot-header-right">
          {/* Language Selector */}
          <div className="lang-selector-wrapper">
            <span className="lang-label">🌐 Language:</span>
            <select
              className="lang-select-dropdown"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-TTS Speech Toggle */}
          <button
            className={`btn-action-pill ${autoTts ? 'active' : ''}`}
            onClick={() => setAutoTts(!autoTts)}
            title="Toggle automatic audio response reading"
          >
            {autoTts ? '🔊 Audio Response: ON' : '🔇 Audio Response: OFF'}
          </button>

          <Link to="/victim/dashboard" className="chatbot-back-link">&larr; Dashboard</Link>
        </div>
      </div>

      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <button className="btn-new-chat" onClick={handleCreateSession}>+ New Conversation</button>
          <div className="sessions-list">
            {sessions.map(s => (
              <div 
                key={s._id} 
                className={`session-item ${activeSessionId === s._id ? 'active' : ''}`}
                onClick={() => setActiveSessionId(s._id)}
              >
                {s.title || 'Conversation'}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="chat-interface">
          <div className="chat-header">
            <div className="chat-status">
              <span className={`status-dot ${systemError ? 'offline' : 'online'}`} aria-hidden="true"></span>
              <span className="status-text">{systemError ? 'Assistant Offline' : 'Assistant Online &amp; Empathetic Listener'}</span>
            </div>
            <div className="chat-actions">
              <button className="btn-action" onClick={() => handleCheckIn('Okay')}>Check-In</button>
              <button className="btn-action" onClick={handleRequestCounselor}>Request Counselor</button>
              {activeSessionId && <button className="btn-action btn-danger" onClick={handleArchive}>Archive</button>}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages-area" aria-live="polite">
            {messages.length === 0 && !isTyping ? (
              <div className="chat-empty-state">
                <div className="empty-logo-wrapper">
                  <img src="/images/bot-logo.png" alt="Bot Logo" className="chat-bot-logo" />
                </div>
                <p className="empty-main-text">Welcome to AAROHAN Empathetic Support</p>
                <p className="empty-subtext">You can type or speak into your microphone in your preferred language.</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message-wrapper ${msg.role === 'user' ? 'message-user' : 'message-system'} ${msg.isError ? 'message-error' : ''}`}
                  >
                    <div className="message-content">
                      {msg.content}
                    </div>

                    <div className="message-meta-row">
                      <span className="message-timestamp">
                        {msg.timestamp} {msg.role === 'user' ? '(You)' : '(AAROHAN AI)'}
                      </span>

                      {/* Sentiment Badge */}
                      {msg.sentiment && (
                        <span className={`emotion-badge sentiment-${msg.sentiment}`} style={{
                          backgroundColor: msg.sentiment === 'negative' ? '#fecaca' : msg.sentiment === 'positive' ? '#bbf7d0' : '#fef3c7',
                          color: msg.sentiment === 'negative' ? '#991b1b' : msg.sentiment === 'positive' ? '#166534' : '#92400e',
                          textTransform: 'capitalize'
                        }}>
                          {msg.sentiment}
                        </span>
                      )}

                      {/* Emotion Tag */}
                      {msg.emotion && (
                        <span className="emotion-badge">{EMOTION_ICONS[msg.emotion] || msg.emotion}</span>
                      )}

                      {/* Crisis Badge */}
                      {msg.crisis && (
                        <span className="emotion-badge" style={{ backgroundColor: '#fecaca', color: '#991b1b', fontWeight: '700' }}>
                          ⚠️ CRISIS
                        </span>
                      )}

                      {/* Audio Playback Button (TTS) */}
                      {msg.role !== 'user' && (
                        <button
                          className={`btn-tts-speaker ${speakingMsgId === msg.id ? 'speaking' : ''}`}
                          onClick={() => speakText(msg.content, msg.id)}
                          title="Listen to response audio"
                        >
                          {speakingMsgId === msg.id ? '⏹️ Stop' : '🔊 Listen Audio'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message-wrapper message-system">
                    <div className="message-content typing-indicator" aria-label="Assistant is analyzing and typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Live Distress Dashboard Panel */}
          {showDashboard && latestAnalysis && (
            <div className="distress-dashboard-panel" style={{
              borderTop: '2px solid #e2e8f0',
              padding: '0.75rem 1rem',
              backgroundColor: latestAnalysis.crisis_flag ? '#fef2f2' : '#f1f5f9',
              fontSize: '0.78rem'
            }}>
              {/* Crisis Alert */}
              {latestAnalysis.crisis_flag && (
                <div style={{
                  backgroundColor: '#dc2626', color: '#fff', padding: '6px 10px',
                  borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                  marginBottom: '8px', textAlign: 'center'
                }}>
                  ⚠️ CRISIS DETECTED — Immediate helplines: 112 | Tele-MANAS: 14416 | Women: 181
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Distress Gauge */}
                <div style={{ flex: '1 1 160px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>Distress Score</span>
                    <span style={{
                      backgroundColor: latestAnalysis.distress_score >= 75 ? '#ef4444' :
                        latestAnalysis.distress_score >= 50 ? '#f97316' :
                        latestAnalysis.distress_score >= 25 ? '#eab308' : '#22c55e',
                      color: '#fff', padding: '2px 8px', borderRadius: '10px',
                      fontWeight: '700', fontSize: '0.72rem'
                    }}>
                      {Math.round(latestAnalysis.distress_score)} — {
                        latestAnalysis.distress_score >= 75 ? 'SEVERE' :
                        latestAnalysis.distress_score >= 50 ? 'HIGH RISK' :
                        latestAnalysis.distress_score >= 25 ? 'MODERATE' : 'STABLE'
                      }
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, latestAnalysis.distress_score)}%`,
                      height: '100%',
                      backgroundColor: latestAnalysis.distress_score >= 75 ? '#ef4444' :
                        latestAnalysis.distress_score >= 50 ? '#f97316' :
                        latestAnalysis.distress_score >= 25 ? '#eab308' : '#22c55e',
                      borderRadius: '5px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: '2px', marginTop: '3px', height: '4px' }}>
                    <div style={{ flex: 1, backgroundColor: '#22c55e', borderRadius: '2px' }} />
                    <div style={{ flex: 1, backgroundColor: '#eab308', borderRadius: '2px' }} />
                    <div style={{ flex: 1, backgroundColor: '#f97316', borderRadius: '2px' }} />
                    <div style={{ flex: 1, backgroundColor: '#ef4444', borderRadius: '2px' }} />
                  </div>
                </div>

                {/* Emotion Bars */}
                <div style={{ flex: '1 1 180px' }}>
                  <span style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>Emotions</span>
                  {(latestAnalysis.emotions || []).slice(0, 4).map((em, i) => {
                    const emotionColors = { fear: '#ef4444', sadness: '#3b82f6', anger: '#f97316', joy: '#22c55e', disgust: '#a855f7', surprise: '#eab308', neutral: '#94a3b8' };
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                        <span style={{ width: '60px', textTransform: 'capitalize', color: '#475569', fontSize: '0.72rem' }}>
                          {em.label}
                        </span>
                        <div style={{ flex: 1, height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.round((em.score || 0) * 100)}%`,
                            height: '100%',
                            backgroundColor: emotionColors[em.label] || '#94a3b8',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                        <span style={{ width: '30px', textAlign: 'right', color: '#64748b', fontSize: '0.7rem' }}>
                          {Math.round((em.score || 0) * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Info Chips */}
                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                  {latestAnalysis.sentiment && (
                    <span style={{
                      backgroundColor: latestAnalysis.sentiment.label === 'negative' ? '#fecaca' :
                        latestAnalysis.sentiment.label === 'positive' ? '#bbf7d0' : '#fef3c7',
                      color: latestAnalysis.sentiment.label === 'negative' ? '#991b1b' :
                        latestAnalysis.sentiment.label === 'positive' ? '#166534' : '#92400e',
                      padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem',
                      fontWeight: '600', textTransform: 'capitalize', textAlign: 'center'
                    }}>
                      {latestAnalysis.sentiment.label} ({Math.round((latestAnalysis.sentiment.score || 0) * 100)}%)
                    </span>
                  )}
                  {latestAnalysis.language_detected && (
                    <span style={{
                      backgroundColor: '#e0f2fe', color: '#0369a1',
                      padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem',
                      fontWeight: '600', textAlign: 'center'
                    }}>
                      🌐 {latestAnalysis.language_detected.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowDashboard(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.7rem', cursor: 'pointer', marginTop: '4px', padding: 0 }}
              >
                ▲ Hide analysis panel
              </button>
            </div>
          )}

          {!showDashboard && latestAnalysis && (
            <button
              onClick={() => setShowDashboard(true)}
              style={{
                width: '100%', background: '#f1f5f9', border: 'none', borderTop: '1px solid #e2e8f0',
                color: '#64748b', fontSize: '0.72rem', cursor: 'pointer', padding: '4px 0', fontWeight: '500'
              }}
            >
              ▼ Show distress analysis panel
            </button>
          )}

          {/* Voice Input Prompt when listening */}
          {isListening && (
            <div className="listening-banner">
              <span className="listening-pulse">🔴</span> Listening in {LANGUAGES.find(l => l.code === selectedLang)?.label}... Speak into your microphone.
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-area">
            {/* Microphone Button (Audio Intake STT) */}
            <button
              className={`btn-mic ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop Voice Recording' : 'Start Voice Input (Microphone)'}
              type="button"
            >
              🎙️
            </button>

            <label htmlFor="chatInput" className="sr-only">Type your message</label>
            <textarea
              id="chatInput"
              ref={inputRef}
              className="chat-input"
              placeholder={`Type or speak in ${LANGUAGES.find(l => l.code === selectedLang)?.label || 'your language'}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              rows={1}
            />

            <button 
              className="btn-send"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
