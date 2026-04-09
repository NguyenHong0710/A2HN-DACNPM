import React, { useState, useRef, useEffect } from 'react';
import { FaCommentDots, FaTimes, FaPaperPlane, FaGem } from 'react-icons/fa';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './Chatbox.css';

// Vẫn dùng Key của bạn để test
const genAI = new GoogleGenerativeAI("AIzaSyBfECCyyuljulWDSMluNUKoAiNv3oUKeEU");

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBotReady, setIsBotReady] = useState(false); // Trạng thái kiểm tra bot sẵn sàng
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    { id: 1, text: 'Kính chào Quý khách đến với Lumina Jewelry. Tôi là chuyên gia tư vấn kim hoàn. Quý khách đang quan tâm đến dòng trang sức hay loại đá quý nào ạ?', sender: 'bot' }
  ]);

  const [chatSession, setChatSession] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    const initializeChat = async () => {
      let contextData = "";

      // Đặt thời gian chờ tối đa cho API là 3 giây để không làm chậm bot
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); 

      // 1. TÍCH HỢP DỮ LIỆU SẢN PHẨM TỪ LARAVEL (CÓ TIMEOUT)
      try {
        const productRes = await fetch('http://127.0.0.1:8000/api/products', { 
          signal: controller.signal 
        }); 
        clearTimeout(timeoutId); // Nếu load nhanh hơn 3s thì hủy bộ đếm giờ
        
        if (productRes.ok) {
          const productsResponse = await productRes.json();
          const productList = productsResponse.data || productsResponse; 
          // Chỉ lấy tối đa 10 sản phẩm để AI đọc cực nhanh
          const productString = productList.slice(0, 10).map(p => `- Tên: ${p.name || p.title} | Giá: ${p.price} VNĐ`).join('\n');
          
          contextData += `\nDANH SÁCH SẢN PHẨM HIỆN CÓ CỦA LUMINA:\n${productString}\n`;
        }
      } catch (error) {
        console.warn("API load quá 3s hoặc lỗi, chuyển sang dữ liệu dự phòng lập tức!");
        contextData += `\nDANH SÁCH SẢN PHẨM HIỆN CÓ CỦA LUMINA:\n- Nhẫn Kim Cương Solitaire 18K | Giá: 25,000,000 VNĐ\n- Dây chuyền Vàng Trắng đính Sapphire | Giá: 18,500,000 VNĐ\n- Bông tai Ngọc Trai Akoya | Giá: 12,000,000 VNĐ\n`;
      }

      // Khai báo tạm thông tin đơn hàng (Sau này bạn có thể gọi API từ Laravel để lấy đơn hàng thật)
      const userOrderInfo = "Khách hàng hiện chưa đăng nhập hoặc chưa có đơn hàng.";

      // 2. NHỒI DỮ LIỆU VÀO AI PROMPT
      const model = genAI.getGenerativeModel({ 
          model: "gemini-flash-latest",
          systemInstruction: `Bạn là chuyên gia tư vấn của Lumina Jewelry. Luôn gọi người dùng là 'Quý khách'.
          
          THÔNG TIN KHÁCH HÀNG HIỆN TẠI: ${userOrderInfo}
          
          ${contextData}
          
          Nhiệm vụ: Dựa vào thông tin trên để tư vấn ngắn gọn, nhanh chóng. Nếu khách hỏi 'đơn hàng của tôi đâu', hãy dùng thông tin đơn hàng ở trên để trả lời. Nếu khách hỏi sản phẩm, hãy ưu tiên giới thiệu các sản phẩm trong danh sách hiện có.`,
        });

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: "Xin chào" }] },
          { role: "model", parts: [{ text: "Kính chào Quý khách. Tôi là chuyên gia tư vấn từ Lumina Jewelry." }] },
        ],
      });
      
      setChatSession(chat);
      setIsBotReady(true); // Báo hiệu bot đã khởi động xong
    };

    initializeChat();
  }, []);

  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    // Chặn người dùng chat nếu bot chưa khởi động xong do mạng
    if (!isBotReady || !chatSession) {
      setMessages(prev => [...prev, { id: Date.now(), text: "Hệ thống đang tải dữ liệu sản phẩm, Quý khách vui lòng đợi 1-2 giây rồi gửi lại nhé!", sender: 'bot' }]);
      return;
    }

    const userText = inputValue.trim();
    const newUserMsg = { id: Date.now(), text: userText, sender: 'user' };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true); 

    try {
      const botMsgId = Date.now() + 1;
      setMessages(prev => [...prev, { id: botMsgId, text: '', sender: 'bot' }]);

      // Đổ luồng dữ liệu cực nhanh
      const result = await chatSession.sendMessageStream(userText);
      setIsTyping(false); 
      
      let fullText = '';
      for await (const chunk of result.stream) {
        fullText += chunk.text();
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId ? { ...msg, text: fullText } : msg
        ));
      }

    } catch (err) {
      console.error("Gemini Error:", err);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "Xin lỗi Quý khách, mạng đang gặp sự cố nhỏ. Vui lòng thử lại.", 
        sender: 'bot' 
      }]);
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
            <FaTimes className="chat-close-btn" style={{cursor: 'pointer'}} onClick={() => setIsOpen(false)} />
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
              placeholder={isBotReady ? "Hỏi về sản phẩm, đơn hàng..." : "Đang kết nối hệ thống..."} 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={!isBotReady} // Khóa ô nhập khi chưa sẵn sàng
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={isTyping || !isBotReady}>
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