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

const QUICK_PROMPTS = [
  'I feel overwhelmed today',
  'I want to talk about what happened',
  'I feel hopeful and calm right now',
  'I need support and guidance'
];

const QUICK_PROMPT_RESPONSES = {
  'I feel overwhelmed today': {
    en: 'I am really sorry you are feeling overwhelmed. Please take three slow breaths and focus on just one small step at a time. You do not have to carry everything at once. If it helps, tell me what feels heaviest right now.',
    te: 'మీకు ఎంత బరువుగా ఉందో నాకు తెలుసు. మూడు నెమ్మదిగా శ్వాసలు తీసుకోండి. ఒక్క చిన్న అడుగు మాత్రమే examine చేయండి. అన్నీ ఒకేసారి తట్టుకోవలసిన అవసరం లేదు. ఏది మీకు ఎక్కువ బరువుగా ఉంది అని చెప్పగలరో, అప్పుడు నేను మీకు సహాయం చేసేదాన్ని.',
    hi: 'मैं समझता हूँ कि आप बहुत overwhelmed महसूस कर रहे हैं। तीन गहरी साँस लें और बस एक छोटा कदम उठाएँ। आपको सब कुछ एक साथ संभालने की जरूरत नहीं है। अगर मदद मिले, तो बताइए कि अभी सबसे ज़्यादा क्या भारी लग रहा है।'
  },
  'I want to talk about what happened': {
    en: 'Thank you for trusting me. You can tell me what happened, one part at a time, and I will listen without judgment. You do not need to explain everything perfectly. Start with the part that feels hardest to carry.',
    te: 'నాకు నమ్మినందుకు ధన్యవాదాలు. మీరు ఏమి జరిగింది చెప్పవచ్చు, ఒక్కొక్క భాగంగా. నేను మీకు తీర్పు లేకుండా వినేదాన్ని. అన్నీ సరైపోవాలనే అవసరం లేదు. మీకు ఎక్కువ బరువుగా ఉన్న భాగం నుంచి మొదలుపెట్టండి.',
    hi: 'ऐसा साझा करने के लिए धन्यवाद। आप मुझे घटना के बारे में एक-एक हिस्सा बताकर बता सकते हैं, मैं बिना न्याय किए सुनूँगा। आपको सब कुछ सही तरीके से समझाने की ज़रूरत नहीं है। सबसे कठिन हिस्सा से शुरू करें।'
  },
  'I feel hopeful and calm right now': {
    en: 'That is a very positive sign. It is okay to notice and hold on to this calm moment. You can keep this feeling by taking a quiet breath, noticing one good thing around you, and allowing yourself to feel safe for a little while.',
    te: 'ఇది మంచి సంకేతం. ఈ ప్రశాంతతను గుర్తించి, దాన్ని నిలుపుకోవడం మంచిది. నెమ్మదిగా శ్వాస తీసుకోండి, మీ చుట్టూ ఉన్న ఒక్క మంచి విషయం పరిగణించండి, మరియు మీరు కొంతకాలం భద్రతగా ఉందనే భావాన్ని అనుభవించండి.',
    hi: 'यह बहुत अच्छी बात है। इस शांति के पल को पहचानें और उसे संभालकर रखें। एक गहरी साँस लें, चारों ओर एक अच्छी चीज़ देखें, और कुछ देर के लिए खुद को सुरक्षित महसूस करने दें।'
  },
  'I need support and guidance': {
    en: 'I am here with you. We can take this one step at a time. First, pause and breathe. Then choose one small action that can help you feel safer or more stable today. I will stay with you through it.',
    te: 'నేను మీతో ఉన్నాను. ఈ సమస్యను ఒక అడుగు씩 మాత్రమే పరిష్కరిద్దాం. ముందుగా నిశ్చలంగా శ్వాస తీసుకోండి. ఆ తరువాత, ఈరోజు మీకు భద్రత లేదా స్థిరత్వం ఇవ్వగల ఒక చిన్న చర్యను ఎంచుకోండి. నేను మీకు సహాయం చేస్తూ ఉన్నట్లే.',
    hi: 'मैं आपके साथ हूँ। हम इसे एक कदम씩 संभालेंगे। पहले थोड़ी देर रुककर साँस लें। फिर आज आपको सुरक्षित और स्थिर महसूस कराने वाला एक छोटा कदम चुनें। मैं आपके साथ हूँ।'
  }
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
  const [showDashboard, setShowDashboard] = useState(false);

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

  const getReplyForQuickPrompt = (prompt) => {
    const langKey = selectedLang.startsWith('te') ? 'te' : selectedLang.startsWith('hi') ? 'hi' : 'en';
    const preset = QUICK_PROMPT_RESPONSES[prompt];
    return preset?.[langKey] || preset?.en || 'I am here to support you.';
  };

  const handleQuickPrompt = (prompt) => {
    const userMessage = {
      id: `quick-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const responseText = getReplyForQuickPrompt(prompt);
    const aiMessage = {
      id: `quick-ai-${Date.now()}`,
      role: 'system',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sentiment: 'positive',
      emotion: 'Calm'
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInputValue('');
    if (autoTts) {
      speakText(responseText, aiMessage.id);
    }
    if (inputRef.current) {
      inputRef.current.focus();
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
          <div className="chatbot-header-icon">💬</div>
          <div>
            <h1>Victim Support Chat</h1>
            <span className="chatbot-subtitle">Private, supportive, and easy to use</span>
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
                <div className="quick-prompts">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="quick-prompt"
                      onClick={() => handleQuickPrompt(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="quick-prompts messages-quick-prompts">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="quick-prompt"
                      onClick={() => handleQuickPrompt(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
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
              </>
            )}
          </div>

          {/* Analysis panel intentionally hidden from the victim chat UI.
              Emotional insights are kept for counselor-side victim profiles and daily/session reports only. */}

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
