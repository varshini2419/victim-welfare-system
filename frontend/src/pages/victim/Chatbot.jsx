import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, LanguageToggle } from '../../context/LanguageContext';
import GeminiLiveVoice from '../../components/common/GeminiLiveVoice';
import './Chatbot.css';

const LANGUAGES = [
  { code: 'en-US', langKey: 'en', label: 'English (अंग्रेज़ी)' },
  { code: 'hi-IN', langKey: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'te-IN', langKey: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'ta-IN', langKey: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'kn-IN', langKey: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml-IN', langKey: 'ml', label: 'Malayalam (മലയാളം)' },
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
  const { language, setLanguage, t, langCode } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemError, setSystemError] = useState('');
  
  // Multilingual & Audio State
  const [selectedLang, setSelectedLang] = useState(() => (language === 'hi' ? 'hi-IN' : 'en-US'));
  const [isListening, setIsListening] = useState(false);
  const [autoTts, setAutoTts] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [speechNotice, setSpeechNotice] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [showLiveVoice, setShowLiveVoice] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechNoticeTimerRef = useRef(null);

  // Synchronize with global language
  useEffect(() => {
    if (language === 'hi' && selectedLang !== 'hi-IN') {
      setSelectedLang('hi-IN');
    } else if (language === 'en' && selectedLang !== 'en-US') {
      setSelectedLang('en-US');
    }
  }, [language]);

  const handleLangSelect = (code) => {
    setSelectedLang(code);
    if (code.startsWith('hi')) {
      setLanguage('hi');
    } else if (code.startsWith('en')) {
      setLanguage('en');
    }
  };

  // Helper to show dismissible speech notice
  const showSpeechNotice = (msg) => {
    setSpeechNotice(msg);
    if (speechNoticeTimerRef.current) clearTimeout(speechNoticeTimerRef.current);
    speechNoticeTimerRef.current = setTimeout(() => {
      setSpeechNotice('');
    }, 6000);
  };

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

  // Ref to hold final transcript for auto-dispatch on speech completion
  const speechTranscriptRef = useRef('');
  const sendingRef = useRef(false);
  const cachedVoicesRef = useRef([]);

  // Pre-warm SpeechSynthesis Voices to avoid TTS lookup delay
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => {
      cachedVoicesRef.current = window.speechSynthesis.getVoices();
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Setup Web Speech Recognition for Audio Intake (STT) with robust error handling
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = selectedLang;

        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          const transcript = finalTranscript || event.results?.[0]?.[0]?.transcript || '';
          if (transcript.trim()) {
            speechTranscriptRef.current = transcript.trim();
            setInputValue(transcript.trim());
          }
        };

        recognition.onerror = (event) => {
          setIsListening(false);
          speechTranscriptRef.current = '';
          const err = event.error;

          if (err === 'network') {
            showSpeechNotice(t('speechNetError'));
          } else if (err === 'no-speech') {
            showSpeechNotice(t('speechNoSpeech'));
          } else if (err === 'not-allowed' || err === 'service-not-allowed') {
            showSpeechNotice(t('speechMicBlocked'));
          } else if (err !== 'aborted') {
            showSpeechNotice(`Voice input status: ${err}. You can type your message below.`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          // Zero-delay auto-dispatch voice message when victim finishes speaking
          if (speechTranscriptRef.current) {
            const t0 = performance.now();
            const voiceText = speechTranscriptRef.current;
            speechTranscriptRef.current = '';
            handleSendMessage(voiceText, true, t0);
          }
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization notice:', e);
      }
    }

    return () => {
      if (speechNoticeTimerRef.current) clearTimeout(speechNoticeTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [selectedLang, language]);

  // Handle Speech-to-Text Toggle
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showSpeechNotice(language === 'hi' 
        ? 'इस ब्राउज़र में वाणी पहचान समर्थित नहीं है। आप नीचे टाइप कर सकते हैं।' 
        : 'Speech recognition is not supported in this browser. You can type your message below.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
    } else {
      try {
        if (!recognitionRef.current) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognitionRef.current = recognition;
        }
        speechTranscriptRef.current = '';
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        setIsListening(true);
        setSpeechNotice('');
      } catch (err) {
        setIsListening(false);
        if (err.name !== 'InvalidStateError') {
          showSpeechNotice(t('speechNetError'));
        }
      }
    }
  };

  // Active Utterances ref to prevent V8 Garbage Collection from cutting off speech mid-sentence
  const activeUtterancesRef = useRef([]);

  // Pre-warm SpeechSynthesis Voices to avoid TTS lookup delay
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => {
      cachedVoicesRef.current = window.speechSynthesis.getVoices();
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
      activeUtterancesRef.current = [];
    };
  }, []);

  // Text-to-Speech (TTS) Audio Output with stable GC ref lifetime and sentence queuing
  const speakText = (text, msgId = null, isAppendStream = false, t0 = null) => {
    if (!('speechSynthesis' in window) || !text) {
      return;
    }

    // Explicit toggle stop if user clicks the currently speaking message button
    if (speakingMsgId === msgId && msgId !== null && !isAppendStream) {
      window.speechSynthesis.cancel();
      activeUtterancesRef.current = [];
      setSpeakingMsgId(null);
      return;
    }

    // Cancel ongoing speech only when starting a brand new response turn (not appending stream chunks)
    if (!isAppendStream) {
      window.speechSynthesis.cancel();
      activeUtterancesRef.current = [];
    }

    const cleanText = text.trim();
    const sentenceMatches = cleanText.match(/[^.!?\n।]+[.!?\n।]+/g);
    const chunks = (sentenceMatches && sentenceMatches.length > 0)
      ? sentenceMatches.map(s => s.trim()).filter(Boolean)
      : [cleanText];

    const voices = cachedVoicesRef.current.length > 0 ? cachedVoicesRef.current : window.speechSynthesis.getVoices();
    const langPrefix = selectedLang.split('-')[0];
    const langVoice = voices.find(v => v.lang && v.lang.startsWith(langPrefix));

    if (import.meta.env.DEV) {
      console.log(`[TTS-Diagnostic] Queueing ${chunks.length} sentence chunk(s) (append=${isAppendStream}) for message: ${msgId || 'auto'}`);
    }

    let remainingChunks = chunks.length;

    chunks.forEach((chunkText, idx) => {
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = selectedLang;
      utterance.rate = 1.0;
      if (langVoice) utterance.voice = langVoice;

      activeUtterancesRef.current.push(utterance);

      if (idx === 0) {
        utterance.onstart = () => {
          if (msgId) setSpeakingMsgId(msgId);
          const now = performance.now();
          if (t0 !== null && import.meta.env.DEV) {
            console.log(`[Phase3-Instrumentation] ========================================`);
            console.log(`[Phase3-Instrumentation] T9 - T0 FIRST AUDIBLE LATENCY: ${(now - t0).toFixed(1)} ms`);
            console.log(`[Phase3-Instrumentation] Target <= 5000ms achieved: ${now - t0 <= 5000 ? 'SUCCESS ✅' : 'FAIL ❌'}`);
            console.log(`[Phase3-Instrumentation] ========================================`);
          } else if (import.meta.env.DEV) {
            console.log(`[TTS-Diagnostic] Audio playback started for message: ${msgId || 'auto'}`);
          }
        };
      }

      const handleChunkFinish = () => {
        activeUtterancesRef.current = activeUtterancesRef.current.filter(u => u !== utterance);
        remainingChunks -= 1;
        if (remainingChunks <= 0 && activeUtterancesRef.current.length === 0) {
          setSpeakingMsgId(null);
          if (import.meta.env.DEV) {
            console.log(`[TTS-Diagnostic] Audio playback completed for message: ${msgId || 'auto'}`);
          }
        }
      };

      utterance.onend = handleChunkFinish;
      utterance.onerror = (e) => {
        if (import.meta.env.DEV) {
          console.warn(`[TTS-Diagnostic] Utterance error:`, e);
        }
        handleChunkFinish();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  // 1. Fetch Sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await apiFetch('/sessions');
        setSessions(data.data || []);
        if (data.data?.length > 0) {
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

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 2. Fetch Messages when activeSessionId or refreshTrigger changes
  useEffect(() => {
    if (!activeSessionId) return;
    const fetchMessages = async () => {
      try {
        const data = await apiFetch(`/sessions/${activeSessionId}/messages`);
        const formatted = (data.data || []).map(m => ({
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
  }, [activeSessionId, refreshTrigger]);

  // Refresh messages shortly after voice call ends to get the final summary
  useEffect(() => {
    if (!showLiveVoice && activeSessionId) {
      const timer = setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 1500); // 1.5s delay to allow backend to finish saving the voice-end log
      return () => clearTimeout(timer);
    }
  }, [showLiveVoice, activeSessionId]);

  // Refresh messages periodically to catch external updates (e.g., from voice call)
  useEffect(() => {
    if (!activeSessionId) return;
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 10000); // Poll every 10s to get new backend summaries if they exist
    return () => clearInterval(interval);
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
      alert(language === 'hi' ? 'दैनिक चेक-इन सफलतापूर्वक दर्ज किया गया।' : 'Check-in submitted successfully.');
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
      alert(language === 'hi' ? 'परामर्शदाता सहायता का अनुरोध दर्ज किया गया है।' : 'Counselor support requested successfully.');
    } catch (err) {
      alert(err.message || 'Failed to request counselor support.');
    }
  };

  const handleArchive = async () => {
    if (!activeSessionId) return;
    const confirmMsg = language === 'hi' ? 'क्या आप इस बातचीत को हटाना चाहते हैं?' : 'Are you sure you want to archive this conversation?';
    if (!window.confirm(confirmMsg)) return;
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

  const handleSendMessage = async (overrideText = null, isVoice = false, startTime = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : inputValue;
    const trimmedInput = textToSend.trim();
    if (!trimmedInput || isTyping || sendingRef.current) return;

    sendingRef.current = true;
    const t0 = startTime || performance.now();
    const t1 = performance.now();

    let currentSessionId = activeSessionId;
    
    if (!currentSessionId) {
      try {
        const data = await apiFetch('/sessions', { method: 'POST' });
        currentSessionId = data.data._id;
        setSessions([data.data, ...sessions]);
        setActiveSessionId(currentSessionId);
      } catch (err) {
        setSystemError('Failed to start conversation.');
        sendingRef.current = false;
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

    const token = localStorage.getItem('token') || '';
    const t2 = performance.now();

    try {
      const response = await fetch(`/api/v1/chatbot/sessions/${currentSessionId}/messages?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ 
          content: trimmedInput,
          language: currentLangObj.label
        })
      });

      if (!response.ok || !response.body) {
        // Step 7 Fallback to non-streaming if stream endpoint fails
        console.warn('[Chatbot] Stream response failed or unreadable, falling back');
        const fallbackData = await apiFetch(`/sessions/${currentSessionId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content: trimmedInput, language: currentLangObj.label })
        });
        const aiData = fallbackData.data;
        if (fallbackData.analysis) setLatestAnalysis(fallbackData.analysis);
        const aiMsgObj = {
          id: aiData._id || Date.now().toString(),
          role: 'system',
          content: aiData.content,
          timestamp: new Date(aiData.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: aiData.isFlagged
        };
        setMessages(prev => [...prev, aiMsgObj]);
        if (autoTts && aiData.content) speakText(aiData.content, aiMsgObj.id, false, t0);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let isFirstChunk = true;
      let fullAiText = '';
      let streamDoneData = null;
      let t7FirstChunk = null;

      const streamMsgId = 'stream-' + Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'chunk' && parsed.text) {
              if (isFirstChunk) {
                t7FirstChunk = performance.now();
                if (import.meta.env.DEV) {
                  console.log(`[Phase3-Instrumentation] STT Latency (T1-T0): ${(t1 - t0).toFixed(1)}ms`);
                  console.log(`[Phase3-Instrumentation] Network Latency (T2-T1): ${(t2 - t1).toFixed(1)}ms`);
                  console.log(`[Phase3-Instrumentation] Stream First Chunk (T7-T2): ${(t7FirstChunk - t2).toFixed(1)}ms`);
                }
              }

              fullAiText += (fullAiText ? ' ' : '') + parsed.text;

              // Step 4 & 6: Feed phrase chunk directly into existing Phase 2 speakText / TTS queue!
              if (autoTts || isVoice) {
                const t8 = performance.now();
                if (isFirstChunk && import.meta.env.DEV) {
                  console.log(`[Phase3-Instrumentation] Stream Transit to TTS Queue (T8-T7): ${(t8 - t7FirstChunk).toFixed(1)}ms`);
                }
                speakText(parsed.text, streamMsgId, !isFirstChunk, isFirstChunk ? t0 : null);
              }

              const wasFirst = isFirstChunk;
              isFirstChunk = false;

              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.id === streamMsgId) {
                  return [...prev.slice(0, -1), { ...last, content: fullAiText }];
                } else {
                  return [...prev, {
                    id: streamMsgId,
                    role: 'system',
                    content: fullAiText,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isStreaming: true
                  }];
                }
              });
            } else if (parsed.type === 'done') {
              streamDoneData = parsed;
            }
          } catch (_) {}
        }
      }

      if (streamDoneData) {
        if (streamDoneData.analysis) setLatestAnalysis(streamDoneData.analysis);
        const aiData = streamDoneData.data;
        setMessages(prev => prev.map(m => m.id === streamMsgId ? {
          id: aiData._id || streamMsgId,
          role: 'system',
          content: aiData.content || fullAiText,
          timestamp: new Date(aiData.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: aiData.isFlagged,
          emotion: streamDoneData.analysis?.primary_emotion || null,
          sentiment: streamDoneData.analysis?.sentiment?.label || null,
          crisis: streamDoneData.analysis?.crisis_flag || false
        } : m));
      }

    } catch (err) {
      console.error('[Chatbot] Stream send error:', err);
      setSystemError('Failed to send message.');
    } finally {
      setIsTyping(false);
      sendingRef.current = false;
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
    return <div className="loading-state">{language === 'hi' ? 'सहायक लोड हो रहा है...' : 'Loading victim support assistant...'}</div>;
  }

  return (
    <div className="chatbot-container">
      {/* 1. TOP HEADER WITH MULTILINGUAL CONTROLS */}
      <div className="chatbot-top-header">
        <div className="chatbot-header-left">
          <img src="/images/emblem.png" alt="Govt Emblem" className="chatbot-header-logo" />
          <div>
            <h1>{t('chatbotTitle')}</h1>
            <span className="chatbot-subtitle">{t('chatbotSubtitle')}</span>
          </div>
        </div>

        <div className="chatbot-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Quick Dual Language Toggle */}
          <LanguageToggle />

          {/* Detailed Language Selector Dropdown */}
          <div className="lang-selector-wrapper">
            <span className="lang-label">🌐</span>
            <select
              className="lang-select-dropdown"
              value={selectedLang}
              onChange={(e) => handleLangSelect(e.target.value)}
              title="Select Speech & Chat Language"
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
            {autoTts ? t('audioResponseOn') : t('audioResponseOff')}
          </button>

          <button
            className={`btn-action-pill ${showLiveVoice ? 'active' : ''}`}
            onClick={() => setShowLiveVoice(!showLiveVoice)}
            style={{ backgroundColor: showLiveVoice ? '#ef4444' : '#10b981', color: '#fff', border: 'none' }}
          >
            {showLiveVoice ? 'End Voice Call' : 'Start Voice Call'}
          </button>

          <Link to="/victim/dashboard" className="chatbot-back-link">{t('dashboardBack')}</Link>
        </div>
      </div>
      
      {showLiveVoice && (
        <div style={{ padding: '0 1rem', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <GeminiLiveVoice language={LANGUAGES.find(l => l.code === selectedLang)?.label} />
        </div>
      )}

      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <button className="btn-new-chat" onClick={handleCreateSession}>{t('newConversation')}</button>
          <div className="sessions-list">
            {sessions.map(s => (
              <div 
                key={s._id} 
                className={`session-item ${activeSessionId === s._id ? 'active' : ''}`}
                onClick={() => setActiveSessionId(s._id)}
              >
                {s.title || (language === 'hi' ? 'बातचीत' : 'Conversation')}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="chat-interface">
          <div className="chat-header">
            <div className="chat-status">
              <span className={`status-dot ${systemError ? 'offline' : 'online'}`} aria-hidden="true"></span>
              <span className="status-text">
                {systemError 
                  ? (language === 'hi' ? 'सहायक ऑफ़लाइन' : 'Assistant Offline') 
                  : (language === 'hi' ? 'सहायक ऑनलाइन एवं सहानुभूतिपूर्ण श्रोता' : 'Assistant Online & Empathetic Listener')}
              </span>
            </div>
            <div className="chat-actions">
              <button className="btn-action" onClick={() => handleCheckIn('Okay')}>
                {language === 'hi' ? 'चेक-इन' : 'Check-In'}
              </button>
              <button className="btn-action" onClick={handleRequestCounselor}>
                {language === 'hi' ? 'परामर्शदाता अनुरोध' : 'Request Counselor'}
              </button>
              {activeSessionId && (
                <button className="btn-action btn-danger" onClick={handleArchive}>
                  {language === 'hi' ? 'हटाएं' : 'Archive'}
                </button>
              )}
            </div>
          </div>

          {/* Speech / Network Error Notice Banner */}
          {speechNotice && (
            <div 
              style={{
                background: '#fff8e6',
                border: '1px solid #fde047',
                color: '#92400e',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                margin: '0.75rem 1rem 0 1rem',
                fontSize: '0.84rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                animation: 'fadeIn 0.2s ease-in'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💡</span>
                <span>{speechNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechNotice('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#92400e',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0 0.25rem'
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div className="chat-messages-area" aria-live="polite">
            {messages.length === 0 && !isTyping ? (
              <div className="chat-empty-state">
                <div className="empty-logo-wrapper">
                  <img src="/images/bot-logo.png" alt="Bot Logo" className="chat-bot-logo" />
                </div>
                <p className="empty-main-text">
                  {language === 'hi' ? 'आरोहण सहानुभूतिपूर्ण सहायता में आपका स्वागत है' : 'Welcome to AAROHAN Empathetic Support'}
                </p>
                <p className="empty-subtext">
                  {language === 'hi' 
                    ? 'आप अपनी पसंद की भाषा (हिंदी या अंग्रेज़ी) में टाइप कर सकते हैं या माइक से बोल सकते हैं।' 
                    : 'You can type or speak into your microphone in English or Hindi.'}
                </p>
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
                        {msg.timestamp} {msg.role === 'user' ? (language === 'hi' ? '(आप)' : '(You)') : '(AAROHAN AI)'}
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
                          ⚠️ {language === 'hi' ? 'संकट चेतावनी' : 'CRISIS'}
                        </span>
                      )}

                      {/* Audio Playback Button (TTS) */}
                      {msg.role !== 'user' && (
                        <button
                          className={`btn-tts-speaker ${speakingMsgId === msg.id ? 'speaking' : ''}`}
                          onClick={() => speakText(msg.content, msg.id)}
                          title="Listen to response audio"
                        >
                          {speakingMsgId === msg.id 
                            ? (language === 'hi' ? '⏹️ रोकें' : '⏹️ Stop') 
                            : (language === 'hi' ? '🔊 सुनें' : '🔊 Listen Audio')}
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

          {/* Voice Input Prompt when listening */}
          {isListening && (
            <div className="listening-banner">
              <span className="listening-pulse">🔴</span> {t('listening')}
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-area">
            {/* Microphone Button (Audio Intake STT) */}
            <button
              className={`btn-mic ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? t('stopMicTitle') : t('speakMicTitle')}
              type="button"
            >
              🎙️
            </button>

            <label htmlFor="chatInput" className="sr-only">{t('typeMessagePlaceholder')}</label>
            <textarea
              id="chatInput"
              ref={inputRef}
              className="chat-input"
              placeholder={t('typeMessagePlaceholder')}
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
              {t('send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
