import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AiLayout from "./AiLayout";
import "./AiPage.css";

function AiPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);

  // ดึงข้อมูลผู้ใช้
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem("user");
      if (!user || user === "undefined") return null;
      return JSON.parse(user);
    } catch {
      return null;
    }
  });

  // สร้าง CHAT_KEY ที่เฉพาะเจาะจงสำหรับแต่ละ user
  const CHAT_KEY = currentUser ? `ai_chat_history_${currentUser.user_id}` : "ai_chat_history_guest";

  // เช็ค login
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user || user === "undefined") {
      navigate("/login");
      return;
    }
    
    try {
      const userData = JSON.parse(user);
      setCurrentUser(userData);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  // โหลดประวัติแชทจาก localStorage ตาม user_id
  const [messages, setMessages] = useState(() => {
    if (!currentUser) return getDefaultMessage();
    
    const userChatKey = `ai_chat_history_${currentUser.user_id}`;
    const saved = localStorage.getItem(userChatKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getDefaultMessage();
      }
    }
    return getDefaultMessage();
  });

  // ฟังก์ชันสร้างข้อความเริ่มต้น
  function getDefaultMessage() {
    return [
      {
        sender: "ai",
        text: "สวัสดีครับ! ผมคือ **EventMaster AI** 🎪 ผู้เชี่ยวชาญด้านการจัดงานอีเว้นท์มืออาชีพ\n\nผมพร้อมให้คำปรึกษาเกี่ยวกับ:\n🎯 การวางแผนอีเว้นท์ทุกประเภท\n💰 การจัดการงบประมาณและ timeline\n🏛️ การเลือกสถานที่และ vendor\n🎨 การตกแต่งและธีม\n📱 การโปรโมทงาน\n\nถามผมได้เลยครับ! 🚀",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "welcome"
      },
    ];
  }

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // บันทึกแชททุกครั้งที่ messages เปลี่ยน (ตาม user_id)
  useEffect(() => {
    if (currentUser && currentUser.user_id) {
      const userChatKey = `ai_chat_history_${currentUser.user_id}`;
      try {
        localStorage.setItem(userChatKey, JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save chat history:", error);
      }
    }
  }, [messages, currentUser]);

  // รีเฟรชข้อความเมื่อ user เปลี่ยน
  useEffect(() => {
    if (currentUser && currentUser.user_id) {
      const userChatKey = `ai_chat_history_${currentUser.user_id}`;
      const saved = localStorage.getItem(userChatKey);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch {
          setMessages(getDefaultMessage());
        }
      } else {
        setMessages(getDefaultMessage());
      }
    }
  }, [currentUser]);

  // Auto scroll เฉพาะเมื่อส่งข้อความใหม่หรือกำลังพิมพ์
  useEffect(() => {
    if (shouldAutoScroll || loading || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll, loading, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || !currentUser) return;
    
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMessage = input.trim();
    
    // เปิด auto scroll เมื่อส่งข้อความ
    setShouldAutoScroll(true);
    
    setMessages(prev => [...prev, { sender: "user", text: userMessage, time }]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:8081/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          user_id: currentUser.user_id, // ส่ง user_id ไปด้วย
          user_name: currentUser.first_name || currentUser.username || "User"
        }),
      });

      const reader = res.body.getReader();
      let aiText = "";
      let hasStartedResponse = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        aiText += chunk;

        if (!hasStartedResponse) {
          hasStartedResponse = true;
          setIsTyping(false);
        }

        setMessages(msgs => {
          const newMsgs = [...msgs];
          const lastMsg = newMsgs[newMsgs.length - 1];
          
          if (lastMsg && lastMsg.sender === "ai" && !lastMsg.final) {
            lastMsg.text = aiText;
          } else {
            newMsgs.push({ sender: "ai", text: aiText, time, final: false });
          }
          
          return newMsgs;
        });
      }

      // Mark final message
      setMessages(msgs => {
        const newMsgs = [...msgs];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg && lastMsg.sender === "ai") {
          lastMsg.final = true;
        }
        return newMsgs;
      });

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { 
        sender: "ai", 
        text: "ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง 🔄", 
        time,
        type: "error"
      }]);
    }
    
    setLoading(false);
    setIsTyping(false);
    // ปิด auto scroll หลังจากส่งเสร็จ
    setTimeout(() => setShouldAutoScroll(false), 1000);
  };

  const clearChat = () => {
    if (!currentUser) return;
    
    if (confirm("🗑️ คุณต้องการล้างประวัติการสนทนาทั้งหมดหรือไม่?")) {
      const initialMessage = getDefaultMessage();
      setMessages(initialMessage);
      
      // ล้างข้อมูลใน localStorage สำหรับ user นี้
      const userChatKey = `ai_chat_history_${currentUser.user_id}`;
      localStorage.setItem(userChatKey, JSON.stringify(initialMessage));
      setShouldAutoScroll(false);
    }
  };

  // Quick questions - ปรับให้เป็นส่วนตัวมากขึ้น
  const quickQuestions = [
    "💰 งบ 50,000 บาท จัดงานแต่งงานได้ไหม?",
    "🎂 จัดงานวันเกิดบ้านต้องเตรียมอะไรบ้าง?",
    "🏢 จัดสัมมนา 100 คน ต้องใช้งบเท่าไหร่?",
    "🎪 หาสถานที่จัดปาร์ตี้ในกรุงเทพ",
    "📱 โปรโมทงานในโซเชียลยังไง?",
    "🎨 ธีมงานแต่งงานยอดนิยม 2024"
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  // Format message text (support markdown-like formatting)
  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  // แสดงหน้า loading ถ้ายังไม่มีข้อมูล user
  if (!currentUser) {
    return (
      <AiLayout>
        <div className="ai-chat-main">
          <div className="ai-chat-centerbox">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ fontSize: '2rem' }}>🔄</div>
              <div>กำลังโหลด...</div>
            </div>
          </div>
        </div>
      </AiLayout>
    );
  }

  return (
    <AiLayout>
      <div className="ai-chat-main">
        <div className="ai-chat-centerbox">
          <div className="ai-chat-header-row">
            <div className="ai-chat-header-avatar">
              <img src="/Bannerimg/logo.png" alt="AI" className="ai-chat-header-logo" />
              <div className="ai-status-indicator online"></div>
            </div>
            <div className="ai-chat-header-info">
              <div className="ai-chat-header-title">EventMaster AI</div>
              <div className="ai-chat-header-desc">
                {isTyping ? "กำลังพิมพ์... ⌨️" : `สวัสดี ${currentUser.first_name || currentUser.username || "User"}! 🎪`}
              </div>
            </div>
            <div className="ai-chat-actions">
              <button 
                className="ai-chat-action-btn"
                onClick={clearChat}
                title="ล้างประวัติการสนทนา"
              >
                🗑️
              </button>
            </div>
          </div>

          <div className="ai-chat-messages">
            <div className="ai-chat-date-label">
              <span>วันนี้</span>
              <div className="date-line"></div>
            </div>

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`ai-chat-message-row ${msg.sender === "user" ? "user" : "ai"} ${msg.type || ''}`}
              >
                {msg.sender === "ai" && (
                  <div className="ai-chat-avatar">
                    <img
                      src="/Bannerimg/logo.png"
                      alt="AI"
                      className="ai-chat-message-logo"
                    />
                    <div className="ai-avatar-badge">🎪</div>
                  </div>
                )}
                <div className={`ai-chat-message ${msg.sender === "ai" ? "ai-message" : "user-message"} ${msg.type || ''}`}>
                  <div 
                    className="message-content"
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                  />
                  <div className="ai-chat-message-time">
                    {msg.time}
                    {msg.sender === "user" && <span className="message-status">✓</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="ai-chat-message-row ai typing-indicator">
                <div className="ai-chat-avatar">
                  <img src="/Bannerimg/logo.png" alt="AI" className="ai-chat-message-logo" />
                  <div className="ai-avatar-badge">🎪</div>
                </div>
                <div className="ai-chat-message ai-message">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="quick-questions">
              <div className="quick-questions-title">💡 คำถามยอดนิยม</div>
              <div className="quick-questions-grid">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    className="quick-question-btn"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ai-chat-input-row">
            <div className="input-container">
              <input
                className="ai-chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="ถามเกี่ยวกับการจัดงานอีเว้นท์... 🎪"
                disabled={loading}
              />
              <button
                className="ai-chat-send-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
              >
                {loading ? "⏳" : "🚀"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AiLayout>
  );
}

export default AiPage;