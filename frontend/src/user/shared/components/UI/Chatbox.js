import React, { useState, useRef, useEffect } from 'react';
import { FaCommentDots, FaTimes, FaPaperPlane, FaGem } from 'react-icons/fa';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuthToken } from '../../../utils/authStorage';
import './Chatbox.css';

// Khởi tạo Gemini với API Key của bạn
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY_HERE");

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Khởi tạo tin nhắn chào mừng
  const [messages, setMessages] = useState([
    { id: 1, text: 'Kính chào Quý khách đến với Lumina Jewelry. Tôi là Gemini, chuyên gia tư vấn kim hoàn. Quý khách đang quan tâm đến dòng trang sức hay loại đá quý nào ạ?', sender: 'bot' }
  ]);

  // Lưu trữ lịch sử chat để Gemini hiểu ngữ cảnh
  const [chatSession, setChatSession] = useState(null);

  // Khởi tạo phiên chat khi component mount
  useEffect(() => {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "Bạn là chuyên gia tư vấn cao cấp của thương hiệu trang sức Lumina Jewelry. Nhiệm vụ của bạn là trả lời TẤT CẢ câu hỏi của khách hàng về trang sức, kim cương, vàng, đá quý và phối đồ. Phong cách: Sang trọng, lịch thiệp, am hiểu sâu sắc. Luôn gọi người dùng là 'Quý khách'. Nếu khách hỏi mua, hãy hướng dẫn họ thêm vào giỏ hàng hoặc xem bộ sưu tập. Tuyệt đối không nói 'liên hệ vendor' hay 'đang gián đoạn', hãy tự mình giải quyết vấn đề của khách.",
    });

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Xin chào" }] },
        { role: "model", parts: [{ text: "Kính chào Quý khách. Tôi là chuyên gia tư vấn từ Lumina Jewelry, rất hân hạnh được hỗ trợ bạn tìm kiếm những tuyệt tác trang sức hoàn mỹ nhất." }] },
      ],
    });
    setChatSession(chat);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSend = async () => {
    if (inputValue.trim() === '' || !chatSession) return;

    const userText = inputValue.trim();
    const newUserMsg = { id: Date.now(), text: userText, sender: 'user' };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Gửi tin nhắn đến Gemini và đợi phản hồi
      const result = await chatSession.sendMessage(userText);
      const response = await result.response;
      const aiText = response.text();
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: aiText, 
        sender: 'bot' 
      }]);

    } catch (err) {
      console.error("Gemini Error:", err);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "Lumina chân thành cáo lỗi. Có một chút vấn đề về kết nối, Quý khách vui lòng nhắc lại câu hỏi được không ạ?", 
        sender: 'bot' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbox-container">
      {isOpen && (
        <div className="chat-window open shadow-lg">
          <div className="chat-header">
            <div className="header-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaGem className="gem-icon" />
              <span>Lumina AI Expert</span>
            </div>
            <FaTimes className="chat-close-btn" onClick={() => setIsOpen(false)} />
          </div>
          
          <div className="chat-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message bot">
                <div className="message-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-footer">
            <input 
              type="text" 
              className="chat-input"
              placeholder="Hỏi về kim cương, vàng 18k..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={isTyping}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      <button className={`chat-toggle-btn ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaTimes /> : <FaCommentDots />}
      </button>
    </div>
  );
};

export default Chatbox;