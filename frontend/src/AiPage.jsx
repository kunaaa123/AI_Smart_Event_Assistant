import React, { useState, useEffect } from "react";
import AiLayout from "./AiLayout";
import "./AiPage.css";

const CHAT_KEY = "ai_chat_history";

function AiPage() {
  // โหลดประวัติแชทจาก localStorage ถ้ามี
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(CHAT_KEY);
    if (saved) return JSON.parse(saved);
    return [
      {
        sender: "ai",
        text: "สวัสดีครับ! ผมเป็น Ai ให้คำปรึกษาเกี่ยวกับการจัดอีเว้นท์ ผู้ใช้งานสามารถปรึกษาอะไรก็ได้เกี่ยวกับอีเว้นท์วันนี้กับผมครับ",
        time: "10:25 am",
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // บันทึกแชททุกครั้งที่ messages เปลี่ยน
  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages([...messages, { sender: "user", text: input, time }]);
    setLoading(true);

    const res = await fetch("http://localhost:8081/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const reader = res.body.getReader();
    let aiText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      aiText += new TextDecoder().decode(value);
      setMessages(msgs => [
        ...msgs.filter((m, i) => i !== msgs.length - 1 || m.sender !== "ai"),
        { sender: "ai", text: aiText, time }
      ]);
    }
    setInput("");
    setLoading(false);
  };

  return (
    <AiLayout>
      <div className="ai-chat-main">
        <div className="ai-chat-centerbox">
          <div className="ai-chat-header-row">
            <img src="/Bannerimg/logo.png" alt="AI" className="ai-chat-header-logo" />
            <div>
              <div className="ai-chat-header-title">Smart Ai</div>
              <div className="ai-chat-header-desc">AI แนะนำงานอีเว้นท์</div>
            </div>
          </div>
          <div className="ai-chat-messages">
            <div className="ai-chat-date-label">Today</div>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`ai-chat-message-row ${msg.sender === "user" ? "user" : "ai"}`}
              >
                {msg.sender === "ai" && (
                  <img
                    src="/Bannerimg/logo.png"
                    alt="AI"
                    className="ai-chat-message-logo"
                  />
                )}
                <div className={msg.sender === "ai" ? "ai-chat-message-ai" : "ai-chat-message-user"}>
                  {msg.text}
                  <div className="ai-chat-message-time">{msg.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="ai-chat-input-row">
            <input
              className="ai-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="กรุณาพิมพ์ข้อความ"
            />
            <button
              className="ai-chat-send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              ส่ง
            </button>
          </div>
        </div>
      </div>
    </AiLayout>
  );
}

export default AiPage;