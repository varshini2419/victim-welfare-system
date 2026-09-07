import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Chatbot.css';

export default function Chatbot() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemError, setSystemError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
          isError: m.senderType === 'system' && m.isFlagged
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
    
    // If no active session, create one first
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
      const data = await apiFetch(`/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: trimmedInput })
      });
      
      const aiMsgObj = {
        id: data.data._id,
        role: 'system',
        content: data.data.content,
        timestamp: new Date(data.data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: data.data.isFlagged
      };
      setMessages((prev) => [...prev, aiMsgObj]);
      
      // Update session list title
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
    return <div className="loading-state">Loading support assistant...</div>;
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-top-header">
        <div className="chatbot-header-left">
          <img src="/images/emblem.png" alt="Govt Emblem" className="chatbot-header-logo" />
          <h1>Govt. Victim Support Assistant</h1>
        </div>
        <Link to="/victim/dashboard" className="chatbot-back-link">&larr; Back to Dashboard</Link>
      </div>


      
      {/* System error banner removed per user request */}

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

        {/* Main Interface */}
        <div className="chat-interface">
          <div className="chat-header">
            <div className="chat-status">
              <span className={`status-dot ${systemError ? 'offline' : 'online'}`} aria-hidden="true"></span>
              <span className="status-text">{systemError ? 'Assistant Offline' : 'Assistant Online'}</span>
            </div>
            <div className="chat-actions">
               <button className="btn-action" onClick={() => handleCheckIn('Okay')}>Check-In</button>
               <button className="btn-action" onClick={handleRequestCounselor}>Request Counselor</button>
               {activeSessionId && <button className="btn-action btn-danger" onClick={handleArchive}>Archive</button>}
            </div>
          </div>

          <div className="chat-messages-area" aria-live="polite">
            {messages.length === 0 && !isTyping ? (
              <div className="chat-empty-state">
                <div className="empty-logo-wrapper">
                   <img src="/images/bot-logo.png" alt="Bot Logo" className="chat-bot-logo" />
                </div>
                <p className="empty-main-text">Your conversation will appear here.</p>
                <p className="empty-subtext">Type a message below to start.</p>
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
                    <div className="message-timestamp">
                      {msg.timestamp} {msg.role === 'user' ? '(You)' : '(System)'}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="message-wrapper message-system">
                    <div className="message-content typing-indicator" aria-label="Assistant is typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <label htmlFor="chatInput" className="sr-only">Type your message</label>
            <textarea
              id="chatInput"
              ref={inputRef}
              className="chat-input"
              placeholder="Type a message... (Press Enter to send)"
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
