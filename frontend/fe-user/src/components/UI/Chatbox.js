import React, { useState, useRef, useEffect } from 'react';
import { FaCommentDots, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './Chatbox.css';

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Chào bạn! AgriMarket có thể giúp gì cho bạn hôm nay?', sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    const newUserMsg = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    
    // Simulate bot reply
    setTimeout(() => {
      const botReply = { id: Date.now() + 1, text: 'Cảm ơn bạn đã liên hệ. Nhân viên của chúng tôi sẽ phản hồi trong giây lát.', sender: 'bot' };
      setMessages(prev => [...prev, botReply]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbox-container">
      
      {/* Cửa sổ Chat */}
      <div className={`chat-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <span>Hỗ trợ khách hàng</span>
          <FaTimes className="chat-close-btn" onClick={() => setIsOpen(false)}/>
        </div>
        
        <div className="chat-body">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.sender === 'user' ? 'user' : ''}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-footer">
          <input 
            type="text" 
            className="chat-input"
            placeholder="Nhập tin nhắn..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <div className="chat-send-btn" onClick={handleSend}>
            <FaPaperPlane />
          </div>
        </div>
      </div>

      {/* Nút tròn để bật/tắt */}
      <button 
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat support"
      >
        <FaCommentDots className={`icon ${isOpen ? 'icon-hidden' : 'icon-visible'}`} />
        <FaTimes className={`icon ${isOpen ? 'icon-visible' : 'icon-hidden'}`} />
      </button>
    </div>
  );
};

export default Chatbox;
