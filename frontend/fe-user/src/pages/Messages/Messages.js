import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiSearch, FiMoreVertical } from 'react-icons/fi';
import './Messages.css';

const Messages = () => {
  const [activeChat, setActiveChat] = useState(1);
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef(null);

  const [vendor] = useState([
    { id: 1, name: 'Nông Trại Đà Lạt', avatar: 'N', lastMsg: 'Chào bạn, sản phẩm còn hàng nhé!', time: '10:10', unread: 0 },
    { id: 2, name: 'Hải Sản Biển Đông', avatar: 'H', lastMsg: 'Cảm ơn bạn đã ủng hộ.', time: '09:00', unread: 2 },
    { id: 3, name: 'Trái Cây Miền Tây', avatar: 'T', lastMsg: 'Dạ, sầu riêng đang vào mùa ạ.', time: 'Hôm qua', unread: 0 }
  ]);

  const [messages, setMessages] = useState({
    1: [
      { id: 1, sender: 'vendor', text: 'Chào bạn, Nông Trại Đà Lạt có thể giúp gì cho bạn?', time: '10:00' },
      { id: 2, sender: 'user', text: 'Cho mình hỏi cà chua Đà Lạt còn hàng không shop?', time: '10:05' },
      { id: 3, sender: 'vendor', text: 'Chào bạn, sản phẩm còn hàng nhé!', time: '10:10' }
    ],
    2: [
      { id: 1, sender: 'vendor', text: 'Cảm ơn bạn đã ủng hộ.', time: '09:00' }
    ],
    3: [
      { id: 1, sender: 'vendor', text: 'Dạ, sầu riêng đang vào mùa ạ.', time: 'Hôm qua' }
    ]
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMsg]
    }));
    setInputMsg('');

    // Simulate vendor reply
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        sender: 'vendor',
        text: 'Cảm ơn bạn đã nhắn tin. Chúng tôi sẽ phản hồi sớm nhất có thể.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => ({
        ...prev,
        [activeChat]: [...prev[activeChat], reply]
      }));
    }, 1500);
  };

  const activevendor = vendor.find(v => v.id === activeChat);

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* SIDEBAR */}
        <div className="messages-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Tin nhắn</h2>
            <div className="search-chat">
              <FiSearch className="search-icon" />
              <input type="text" placeholder="Tìm kiếm cửa hàng..." />
            </div>
          </div>
          <div className="vendor-list">
            {vendor.map(vendor => (
              <div
                key={vendor.id}
                className={`vendor-item ${activeChat === vendor.id ? 'active' : ''}`}
                onClick={() => setActiveChat(vendor.id)}
              >
                <div className="vendor-avatar">{vendor.avatar}</div>
                <div className="vendor-info">
                  <div className="vendor-name-row">
                    <span className="vendor-name">{vendor.name}</span>
                    <span className="vendor-time">{vendor.time}</span>
                  </div>
                  <div className="vendor-msg-row">
                    <span className="vendor-last-msg">{vendor.lastMsg}</span>
                    {vendor.unread > 0 && <span className="unread-badge">{vendor.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT CONTENT */}
        <div className="messages-content">
          {activeChat ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="vendor-avatar">{activevendor?.avatar}</div>
                  <div>
                    <h3 className="chat-vendor-name">{activevendor?.name}</h3>
                    <span className="chat-status">Đang hoạt động</span>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button className="btn-icon"><FiSearch /></button>
                  <button className="btn-icon"><FiMoreVertical /></button>
                </div>
              </div>

              <div className="chat-history">
                <div className="chat-date-divider"><span>Hôm nay</span></div>
                {messages[activeChat]?.map(msg => (
                  <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender}`}>
                    <div className={`chat-bubble ${msg.sender}`}>
                      {msg.text}
                      <span className="chat-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                />
                <button type="submit" className="btn-send" disabled={!inputMsg.trim()}>
                  <FiSend />
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon"><FiSend /></div>
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
