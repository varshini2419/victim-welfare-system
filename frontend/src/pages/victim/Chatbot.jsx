import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Chatbot.css';

export default function Chatbot() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemError, setSystemError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (systemError) setSystemError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    // Append user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setSystemError('');

    // Simulate backend call
    try {
      // Future API call:
      // const response = await api.post('/victim/chatbot', { message: trimmedInput });
      
      // Since it's missing, wait briefly to show loading state, then throw error
      await new Promise(resolve => setTimeout(resolve, 800));
      throw new Error("Backend integration pending. Assistant is currently offline.");
    } catch (err) {
      // Append a system message indicating failure
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
      // Ensure focus returns to input after sending for accessibility
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  if (loading) {
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

      <div className="chatbot-welcome-banner">
        <p>We are here to support you. How can we help today?</p>
      </div>

      <div className="chat-interface">
        <div className="chat-header">
          <div className="chat-status">
            <span className="status-dot offline" aria-hidden="true"></span>
            <span className="status-text">Assistant Offline (Setup Pending)</span>
          </div>
        </div>

        <div className="chat-messages-area" aria-live="polite">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="empty-logo-wrapper">
                 <img src="/images/bot-logo.png" alt="Bot Logo" className="chat-bot-logo" />
              </div>
              <p className="empty-main-text">Your conversation will appear here.</p>
              <p className="empty-subtext">The assistant is currently offline and unable to process messages.</p>
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
            onChange={handleInputChange}
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
  );
}
