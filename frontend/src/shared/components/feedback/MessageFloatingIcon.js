import React, { useState, useRef, useEffect } from 'react';

const MessageFloatingIcon = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = unknown, false = not logged in, true = logged in
  const [faqs, setFaqs] = useState([]);
  const messagesEndRef = useRef(null);

  // Check login status and fetch chat history when chat is opened
  useEffect(() => {
    if (open) {
      fetch('/api/customer/profile', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          const loggedIn = data.success === true && data.customer;
          setIsLoggedIn(loggedIn);
          if (loggedIn) {
            // Fetch chat history
            fetch('/api/chat/messages', { credentials: 'include' })
              .then(res => res.json())
              .then(data => {
                if (data.success && Array.isArray(data.messages)) {
                  setMessages(data.messages.map(msg => ({
                    from: msg.SenderType === 'customer' ? 'user' : 'support',
                    text: msg.MessageText,
                    sentAt: msg.SentAt,
                    sent: true // All messages from backend are sent
                  })));
                } else {
                  setMessages([]);
                }
              })
              .catch(() => setMessages([]));
          } else {
            setMessages([]);
          }
        })
        .catch(() => {
          setIsLoggedIn(false);
          setMessages([]);
        });

      // Fetch FAQs (auto messages)
      fetch('/api/auto-messages')
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

  const handleInputChange = (e) => setInput(e.target.value);

  const sendMessage = async (messageToSend) => {
    try {
      // Add user message immediately
      setMessages(prev => [
        ...prev,
        { from: 'user', text: messageToSend, sentAt: new Date().toISOString(), sent: true }
      ]);

      // Choose endpoint based on login status
      const endpoint = isLoggedIn ? '/api/chat/messages' : '/api/chat/messages/guest';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: messageToSend })
      });
      const data = await res.json();
      
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
            fetch('/api/chat/messages', { credentials: 'include' })
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
              .catch(() => {});
          }, 300);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Optionally show error
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    const messageToSend = input;
    setInput('');
    await sendMessage(messageToSend);
  };

  const handleFaqClick = async (q) => {
    await sendMessage(q);
  };

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  return (
    <>
      {!open && (
        <div className="floating-message-icon" onClick={handleIconClick} title="Message Us">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="#F0B21B"/>
            <path d="M12 26V14C12 12.8954 12.8954 12 14 12H26C27.1046 12 28 12.8954 28 14V22C28 23.1046 27.1046 24 26 24H16L12 28V26Z" stroke="#2c3e50" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      {open && (
        <div className="floating-chat-window">
          <div className="chat-header">
            {/* Message icon SVG */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-3 3z" stroke="#2c3e50" strokeWidth="2" strokeLinejoin="round" fill="#F0B21B"/>
              </svg>
              Chat Support
            </span>
            <button className="chat-close-btn" onClick={handleClose} title="Close">×</button>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-message support">Hi there! How can we help you today?</div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.from}`}>{msg.text}
                {msg.from === 'user' && msg.sent && (
                  <span style={{ marginLeft: 8, color: '#27ae60', fontSize: '1.1em', verticalAlign: 'middle' }} title="Sent">✔</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* FAQ suggestions */}
          {faqs.length > 0 && (
            <div className="chat-faqs" style={{ padding: '8px 12px', borderTop: '1px solid #eee', background: '#fafafa' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Quick questions:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {faqs.map((f) => (
                  <button
                    key={f.ID}
                    onClick={() => handleFaqClick(f.Question)}
                    style={{
                      border: '1px solid #ddd',
                      background: 'white',
                      padding: '6px 10px',
                      borderRadius: 14,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >{f.Question}</button>
                ))}
              </div>
            </div>
          )}

          {isLoggedIn === false && (
            <div className="chat-login-required" style={{ padding: '16px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}>💬 Chat with us! We'll help you with common questions.</div>
              <div style={{ fontSize: '12px', color: '#999' }}>For personalized support, please log in.</div>
            </div>
          )}
          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              placeholder={isLoggedIn ? "Type your message..." : "Ask a question..."}
              value={input}
              onChange={handleInputChange}
              autoFocus
            />
            <button type="submit" className="chat-send-btn">Send</button>
          </form>
        </div>
      )}
    </>
  );
};

export default MessageFloatingIcon; 