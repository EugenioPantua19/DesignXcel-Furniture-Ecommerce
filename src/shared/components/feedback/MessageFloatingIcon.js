import React, { useState, useRef, useEffect } from 'react';
import './MessageFloatingIcon.css';

const MessageFloatingIcon = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = unknown, false = not logged in, true = logged in
  const [faqs, setFaqs] = useState([]);
  const [showFaqs, setShowFaqs] = useState(true); // Toggle for FAQ section visibility
  const messagesEndRef = useRef(null);
  
  // Message character limit
  const MAX_MESSAGE_LENGTH = 500;

  // Check login status and fetch chat history when chat is opened
  useEffect(() => {
    if (open) {
      // Try multiple authentication endpoints to ensure we get the right status
      const checkAuth = async () => {
        try {
          // First try the customer profile endpoint
          const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          const profileRes = await fetch(`${apiBase}/api/customer/profile`, { credentials: 'include' });
          const profileData = await profileRes.json();
          
          if (profileData.success && profileData.customer) {
            setIsLoggedIn(true);
            // Fetch chat history
            try {
              const chatRes = await fetch(`${apiBase}/api/chat/messages`, { credentials: 'include' });
              const chatData = await chatRes.json();
              
              if (chatData.success && Array.isArray(chatData.messages)) {
                const chatMessages = chatData.messages.map(msg => ({
                  from: msg.SenderType === 'customer' ? 'user' : 'support',
                  text: msg.MessageText,
                  sentAt: msg.SentAt,
                  sent: true // All messages from backend are sent
                }));
                setMessages(chatMessages);
                // Auto-hide FAQs if there are existing messages
                if (chatMessages.length > 0) {
                  setShowFaqs(false);
                }
              } else {
                setMessages([]);
              }
            } catch (chatError) {
              console.error('Error fetching chat messages:', chatError);
              setMessages([]);
            }
          } else {
            // If profile check fails, try a direct chat endpoint check
            try {
              const chatCheckRes = await fetch(`${apiBase}/api/chat/messages`, { credentials: 'include' });
              const chatCheckData = await chatCheckRes.json();
              
              if (chatCheckRes.status === 401) {
                setIsLoggedIn(false);
                setMessages([]);
              } else if (chatCheckData.success) {
                setIsLoggedIn(true);
                if (Array.isArray(chatCheckData.messages)) {
                  const chatMessages = chatCheckData.messages.map(msg => ({
                    from: msg.SenderType === 'customer' ? 'user' : 'support',
                    text: msg.MessageText,
                    sentAt: msg.SentAt,
                    sent: true
                  }));
                  setMessages(chatMessages);
                  if (chatMessages.length > 0) {
                    setShowFaqs(false);
                  }
                } else {
                  setMessages([]);
                }
              } else {
                setIsLoggedIn(false);
                setMessages([]);
              }
            } catch (chatCheckError) {
              console.error('Error checking chat authentication:', chatCheckError);
              setIsLoggedIn(false);
              setMessages([]);
            }
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
          setIsLoggedIn(false);
          setMessages([]);
        }
      };
      
      checkAuth();

      // Fetch FAQs (auto messages)
      const apiBase2 = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      fetch(`${apiBase2}/api/auto-messages`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.items)) {
            setFaqs(data.items.slice(0, 6));
          } else {
            setFaqs([]);
          }
        })
        .catch(() => setFaqs([]));
    }
  }, [open]);

  const handleIconClick = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setInput(value);
    }
  };

  const sendMessage = async (messageToSend) => {
    try {
      console.log('Sending message:', messageToSend, 'isLoggedIn:', isLoggedIn);
      
      // Add user message immediately
      setMessages(prev => [
        ...prev,
        { from: 'user', text: messageToSend, sentAt: new Date().toISOString(), sent: true }
      ]);

      // Choose endpoint based on login status
      const apiBaseSend = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const endpoint = isLoggedIn ? `${apiBaseSend}/api/chat/messages` : `${apiBaseSend}/api/chat/messages/guest`;
      console.log('Using endpoint:', endpoint);
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: messageToSend })
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (data.success) {
        // Handle auto-reply for both authenticated and guest users
        if (data.autoReply) {
          setMessages(prev => [
            ...prev,
            { from: 'support', text: data.autoReply, sentAt: new Date().toISOString(), sent: true }
          ]);
        }
        
        // For authenticated users, refetch to get full conversation
        if (isLoggedIn) {
          setTimeout(() => {
            const apiBase3 = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            fetch(`${apiBase3}/api/chat/messages`, { credentials: 'include' })
              .then(res => res.json())
              .then(data => {
                if (data.success && Array.isArray(data.messages)) {
                  setMessages(data.messages.map(msg => ({
                    from: msg.SenderType === 'customer' ? 'user' : 'support',
                    text: msg.MessageText,
                    sentAt: msg.SentAt,
                    sent: true
                  })));
                }
              })
              .catch((error) => {
                console.error('Error refetching messages:', error);
              });
          }, 300);
        }
      } else {
        console.error('Message send failed:', data.message);
        // Show error message to user
        setMessages(prev => [
          ...prev,
          { from: 'support', text: `Error: ${data.message || 'Failed to send message'}`, sentAt: new Date().toISOString(), sent: true }
        ]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Show error message to user
      setMessages(prev => [
        ...prev,
        { from: 'support', text: 'Error: Failed to send message. Please try again.', sentAt: new Date().toISOString(), sent: true }
      ]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Check message length
    if (input.length > MAX_MESSAGE_LENGTH) {
      setMessages(prev => [
        ...prev,
        { from: 'support', text: `Message too long. Please keep messages under ${MAX_MESSAGE_LENGTH} characters.`, sentAt: new Date().toISOString(), sent: true }
      ]);
      return;
    }

    // Check if user is logged in
    if (isLoggedIn !== true) {
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    const messageToSend = input;
    setInput('');
    await sendMessage(messageToSend);
  };

  const handleFaqClick = async (q) => {
    // Check if FAQ question is within character limit
    if (q.length > MAX_MESSAGE_LENGTH) {
      setMessages(prev => [
        ...prev,
        { from: 'support', text: `FAQ question too long. Please keep questions under ${MAX_MESSAGE_LENGTH} characters.`, sentAt: new Date().toISOString(), sent: true }
      ]);
      return;
    }
    // FAQ messages are allowed for all users (they're auto-messages)
    await sendMessage(q);
  };

  const toggleFaqs = () => {
    setShowFaqs(!showFaqs);
  };

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Auto-hide FAQs when user starts typing
  useEffect(() => {
    if (input.trim().length > 0 && showFaqs) {
      setShowFaqs(false);
    }
  }, [input, showFaqs]);

  return (
    <>
      {!open && (
        <div className="floating-message-icon" onClick={handleIconClick} title="Message Us">
          <div className="chat-icon-container">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="chat-icon-svg">
              <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-3 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor"/>
            </svg>
            <div className="chat-icon-pulse"></div>
          </div>
        </div>
      )}
      {open && (
        <div className="floating-chat-window">
          <div className="chat-header">
          <div className="chat-header-content">
            <div className="chat-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-3 3z" stroke="#2c3e50" strokeWidth="2" strokeLinejoin="round" fill="#F0B21B"/>
              </svg>
            </div>
              <div className="chat-header-text">
                <h3>Chat Support</h3>
                <p>We're here to help!</p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={handleClose} title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">👋</div>
                <div className="chat-welcome-text">
                  <h4>Hi there!</h4>
                  <p>How can we help you today?</p>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.from}`}>
                <div className="chat-message-content">
                  <div className="chat-message-text">{msg.text}</div>
                  {msg.from === 'user' && msg.sent && (
                    <div className="chat-message-status">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17l-5-5" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="chat-message-time">
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* FAQ suggestions */}
          {faqs.length > 0 && (
            <div className="chat-faqs">
              <div className="chat-faqs-header">
                <div className="chat-faqs-title">
                  <svg className="chat-faqs-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Quick questions</span>
                </div>
                <button className="chat-faq-toggle" onClick={toggleFaqs} title={showFaqs ? "Hide FAQs" : "Show FAQs"}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {showFaqs ? (
                      <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    ) : (
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    )}
                  </svg>
                </button>
              </div>
              {showFaqs && (
                <div className="chat-faqs-list">
                  {faqs.map((f) => (
                    <button
                      key={f.id}
                      className="chat-faq-btn"
                      onClick={() => handleFaqClick(f.question)}
                    >
                      {f.question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          
          {/* Authentication Status Indicator */}
          {isLoggedIn === null && (
            <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
              Checking authentication...
            </div>
          )}
          {isLoggedIn === false && (
            <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#e74c3c' }}>
              Please log in to send messages
            </div>
          )}
          {isLoggedIn === true && (
            <div style={{ padding: '5px 10px', textAlign: 'center', fontSize: '11px', color: '#27ae60' }}>
              ✓ Logged in as customer
            </div>
          )}

          <form className="chat-input-area" onSubmit={handleSend}>
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder={isLoggedIn === true ? "Type your message..." : isLoggedIn === false ? "Login required to send messages" : "Checking authentication..."}
                value={input}
                onChange={handleInputChange}
                autoFocus
                disabled={isLoggedIn !== true}
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <button type="submit" className="chat-send-btn" disabled={!input.trim() || isLoggedIn !== true || input.length > MAX_MESSAGE_LENGTH}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {/* Character Counter */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '5px 10px 0 10px',
              fontSize: '11px',
              color: input.length > MAX_MESSAGE_LENGTH * 0.9 ? '#e74c3c' : input.length > MAX_MESSAGE_LENGTH * 0.8 ? '#f39c12' : '#95a5a6'
            }}>
              <span>
                {input.length > MAX_MESSAGE_LENGTH * 0.8 && (
                  <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                    {input.length > MAX_MESSAGE_LENGTH ? 'Message too long!' : 'Approaching limit'}
                  </span>
                )}
              </span>
              <span style={{ 
                color: input.length > MAX_MESSAGE_LENGTH ? '#e74c3c' : input.length > MAX_MESSAGE_LENGTH * 0.8 ? '#f39c12' : '#95a5a6',
                fontWeight: input.length > MAX_MESSAGE_LENGTH * 0.8 ? 'bold' : 'normal'
              }}>
                {input.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default MessageFloatingIcon; 