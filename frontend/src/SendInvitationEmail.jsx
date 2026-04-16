import React, { useState, useEffect } from 'react';
import './SendInvitationEmail.css';

function SendInvitationEmail({ imageData, onClose, isOpen }) {
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: 'คำเชิญร่วมงาน - มาร่วมงานด้วยกันนะคะ',
    message: 'สวัสดีค่ะ ขอเชิญมาร่วมงานในโอกาสพิเศษนี้ จะดีใจมากถ้าได้พบกันค่ะ'
  });
  const [sending, setSending] = useState(false);
  const [emailMode, setEmailMode] = useState('TO');

  // ป้องกัน body scroll เมื่อ popup เปิด
  useEffect(() => {
    if (isOpen) {
      // บันทึก scroll position เดิม
      const scrollY = window.scrollY;
      
      // ป้องกัน body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // คืนค่า body scroll เมื่อปิด popup
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // คืนค่า scroll position เดิม
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendEmail = async () => {
    if (!emailForm.to.trim()) {
      alert('กรุณาใส่อีเมลผู้รับ');
      return;
    }

    setSending(true);

    try {
      const formData = new FormData();
      
      // แปลง base64 เป็น File object
      const byteCharacters = atob(imageData.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const file = new File([byteArray], 'invitation.png', { type: 'image/png' });

      // ดึง user_id จาก localStorage หรือตั้งค่าเริ่มต้น
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.user_id || '1';

      // เพิ่มข้อมูลทั้งหมดที่ backend ต้องการ - ส่งตาม emailMode
      formData.append('subject', emailForm.subject);
      formData.append('message', emailForm.message);
      formData.append('invitation', file);
      formData.append('prompt', imageData.prompt || 'บัตรเชิญที่สร้างด้วย AI');
      formData.append('createdAt', imageData.createdAt || new Date().toLocaleString('th-TH'));
      formData.append('user_id', userId);

      // ส่งอีเมลตาม mode ที่เลือก - ป้องกันการซ้ำ
      if (emailMode === 'TO') {
        formData.append('to', emailForm.to);
        formData.append('cc', '');
        formData.append('bcc', '');
      } else if (emailMode === 'CC') {
        formData.append('to', 'singha20032546@gmail.com'); // ใช้อีเมลระบบเป็น TO หลัก
        formData.append('cc', emailForm.to);
        formData.append('bcc', '');
      } else if (emailMode === 'BCC') {
        formData.append('to', 'singha20032546@gmail.com'); // ใช้อีเมลระบบเป็น TO หลัก
        formData.append('cc', '');
        formData.append('bcc', emailForm.to);
      }

      console.log('📧 Sending email with data:');
      console.log('- Mode:', emailMode);
      console.log('- Email:', emailForm.to);
      console.log('- Subject:', emailForm.subject);
      console.log('- User ID:', userId);

      const response = await fetch('http://localhost:8080/send-invitation-email', {
        method: 'POST',
        body: formData
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent successfully:', result);
        alert(`ส่งบัตรเชิญสำเร็จ (${emailMode})! 📧✨`);
        onClose();
      } else {
        const errorText = await response.text();
        console.error('❌ Email sending failed:', errorText);
        throw new Error(`การส่งอีเมลล้มเหลว (${response.status})`);
      }

    } catch (error) {
      console.error('🚫 Email sending error:', error);
      alert(`เกิดข้อผิดพลาดในการส่งอีเมล: ${error.message}`);
    }

    setSending(false);
  };

  // Handle overlay click to close (แต่ป้องกัน event bubbling)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key to close
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, onClose]);

  // ตรวจสอบว่า modal ถูกเปิดหรือไม่
  if (!isOpen || !imageData) {
    return null;
  }

  // ข้อมูลโหมดการส่งอีเมล
  const emailModes = [
    { 
      key: 'TO', 
      label: 'ส่งถึง (TO)', 
      icon: '📧', 
      color: '#4f8cff',
      description: 'ส่งตรงถึงผู้รับ'
    },
    { 
      key: 'CC', 
      label: 'สำเนา (CC)', 
      icon: '📋', 
      color: '#ff9500',
      description: 'ส่งเป็นสำเนาแสดงให้เห็น'
    },
    { 
      key: 'BCC', 
      label: 'สำเนาลับ (BCC)', 
      icon: '🔒', 
      color: '#34c738',
      description: 'ส่งเป็นสำเนาซ่อน'
    }
  ];

  const currentMode = emailModes.find(mode => mode.key === emailMode);

  return (
    <div className="send-email-overlay" onClick={handleOverlayClick}>
      <div className="send-email-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="send-email-popup-header">
          <span>📧 ส่งบัตรเชิญทางอีเมล</span>
          <button className="send-email-popup-close" onClick={onClose}>✕</button>
        </div>
        <div className="send-email-popup-body">
          <div className="send-email-popup-row">
            <span className="send-email-popup-label">จาก</span>
            <span className="send-email-popup-value">Smart AI Event Assistant</span>
          </div>

          {/* Email Mode Selector */}
          <div className="send-email-popup-row">
            <span className="send-email-popup-label">โหมดการส่ง</span>
            <div className="email-mode-selector">
              {emailModes.map((mode) => (
                <button
                  key={mode.key}
                  className={`email-mode-btn ${emailMode === mode.key ? 'active' : ''}`}
                  onClick={() => setEmailMode(mode.key)}
                  style={{
                    '--mode-color': mode.color
                  }}
                  title={mode.description}
                >
                  <span className="email-mode-icon">{mode.icon}</span>
                  <span className="email-mode-label">{mode.label}</span>
                </button>
              ))}
            </div>
            <div className="email-mode-description">
              <span className="email-mode-desc-icon">{currentMode.icon}</span>
              <span className="email-mode-desc-text">{currentMode.description}</span>
            </div>
          </div>

          {/* Email Input Field */}
          <div className="send-email-popup-row">
            <span className="send-email-popup-label">
              {currentMode.icon} {currentMode.label} *
            </span>
            <input
              type="email"
              name="to"
              value={emailForm.to}
              onChange={handleInputChange}
              placeholder={`${emailMode === 'TO' ? 'example@email.com' : `อีเมลสำหรับ ${currentMode.label}`}`}
              required
              className="send-email-popup-input"
              style={{
                borderColor: emailForm.to ? currentMode.color : '#e1e5e9'
              }}
            />
          </div>

          <div className="send-email-popup-row">
            <span className="send-email-popup-label">หัวข้อ *</span>
            <input
              type="text"
              name="subject"
              value={emailForm.subject}
              onChange={handleInputChange}
              placeholder="หัวข้ออีเมล"
              required
              className="send-email-popup-input"
            />
          </div>

          <div className="send-email-popup-row">
            <span className="send-email-popup-label">ไฟล์แนบ</span>
            <div className="send-email-popup-attachment">
              <img
                src={`data:image/png;base64,${imageData.base64}`}
                alt="Invitation"
                className="send-email-popup-attachment-img"
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>บัตรเชิญ.png</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {imageData.prompt ? `${imageData.prompt.slice(0, 40)}...` : 'AI Generated Invitation'}
                </div>
              </div>
            </div>
          </div>

          <div className="send-email-popup-row">
            <span className="send-email-popup-label">ข้อความ</span>
            <textarea
              name="message"
              value={emailForm.message}
              onChange={handleInputChange}
              rows={4}
              className="send-email-popup-textarea"
              placeholder="ข้อความที่ต้องการส่งพร้อมบัตรเชิญ"
            />
          </div>
          
          <div className="send-email-popup-actions">
            <button
              className="send-email-popup-send-btn"
              onClick={handleSendEmail}
              disabled={sending || !emailForm.to.trim() || !emailForm.subject.trim()}
              style={{
                background: `linear-gradient(135deg, ${currentMode.color} 0%, ${currentMode.color}cc 100%)`
              }}
            >
              {sending ? (
                <>
                  <span className="send-loading-spinner">⏳</span>
                  กำลังส่ง...
                </>
              ) : (
                <>
                  {currentMode.icon} ส่ง{currentMode.label}
                </>
              )}
            </button>
            <button
              className="send-email-popup-cancel-btn"
              onClick={onClose}
              disabled={sending}
            >
              ❌ ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SendInvitationEmail;