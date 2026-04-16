import React, { useState, useEffect } from 'react';
import './InvitationWizard.css';

// Small styled hint component for inputs
const InputHint = ({ compact = false }) => (
  <div
    style={{
      display: 'flex',
      gap: 8,
      alignItems: compact ? 'center' : 'flex-start',
      marginTop: compact ? 8 : 10,
      background: '#f0f7ff',
      border: '1px solid #dbeeff',
      padding: compact ? '6px 10px' : '10px 12px',
      borderRadius: 8,
      color: '#084b8a',
      fontSize: compact ? 12 : 13,
      lineHeight: 1.2
    }}
  >
    <div style={{ fontSize: 16 }}>🛈</div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontWeight: 600 }}>Please enter display text in English</div>
      <div style={{ color: '#145fa8', opacity: 0.9, marginTop: 4 }}>
        For best results use English only — the system supports English for displayed/generated text.
      </div>
      <div style={{ color: '#0b3b66', marginTop: 6, fontSize: 12, opacity: 0.9 }}>
        โปรดกรอกข้อความที่ต้องการให้แสดงเป็นภาษาอังกฤษเท่านั้น
      </div>
    </div>
  </div>
);

const InvitationWizard = ({ isOpen, onClose, onGenerate }) => {
  const [step, setStep] = useState(1);
  const [animationDirection, setAnimationDirection] = useState('forward');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [wizardData, setWizardData] = useState({
    eventType: '',
    theme: '',
    eventName: '',
    eventDate: '',
    venue: '',
    colors: [],
    style: '',
    customPrompt: ''
  });

  // info modal state for help buttons
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoBody, setInfoBody] = useState('');

  const openInfo = (title, body) => {
    setInfoTitle(title);
    setInfoBody(body);
    setInfoOpen(true);
  };
  const closeInfo = () => setInfoOpen(false);

  // Reset เมื่อเปิด wizard ใหม่
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAnimationDirection('forward');
      setIsGenerating(false);
      setWizardData({
        eventType: '',
        theme: '',
        eventName: '',
        eventDate: '',
        venue: '',
        colors: [],
        style: '',
        customPrompt: ''
      });
    }
  }, [isOpen]);

  // ข้อมูลตัวเลือกสำหรับบัตรเชิญ (เพิ่ม details สำหรับคำอธิบายเชิงลึก)
  const eventTypes = [
    { id: 'wedding', name: 'งานแต่งงาน', icon: '💒', desc: 'งานมงคลสมรส', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      details: 'งานแต่งงาน: เหมาะกับการออกแบบการ์ดที่ให้ความรู้สึกโรแมนติกหรือหรูหรา — ระบุโทนสีหลัก, แบบตัวอักษร (script สำหรับโรแมนติก, serif สำหรับคลาสสิค), และองค์ประกอบเช่น ลายดอกไม้หรือกรอบทอง' },
    { id: 'birthday', name: 'งานวันเกิด', icon: '🎂', desc: 'ฉลองวันเกิด', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      details: 'งานวันเกิด: ปรับการออกแบบตามกลุ่มอายุ — เด็กอาจต้องการสีสดใสและตัวการ์ตูน ผู้ใหญ่อาจชอบสไตล์มินิมอลหรือหรูหรา; ระบุขนาดการ์ดและสไตล์เค้ก/ไอคอนที่ต้องการ' },
    { id: 'corporate', name: 'งานองค์กร', icon: '🏢', desc: 'ประชุม สัมมนา', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      details: 'งานองค์กร: ควรใส่โลโก้บริษัท ข้อมูลติดต่อ และโทนสีบริษัท ใช้ฟอนต์อ่านง่าย และเว้นพื้นที่สำหรับ agenda/QR code' },
    { id: 'party', name: 'งานปาร์ตี้', icon: '🎉', desc: 'งานสังสรรค์', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      details: 'งานปาร์ตี้: เน้นความสนุกและคอนทราสต์ เช่น นีออนหรือธีมสีสัน ใช้ไอคอนที่บ่งบอกกิจกรรม (ดีเจ, ค็อกเทล) และระบุ dress code ถ้ามี' },
    { id: 'graduation', name: 'งานรับปริญญา', icon: '🎓', desc: 'พิธีสำเร็จการศึกษา', gradient: 'linear-gradient(135deg, #a8caba 0%, #5d4e75 100%)',
      details: 'งานรับปริญญา: เน้นความเป็นทางการ มีมุมสำหรับรูปและข้อมูลพิธีการ—ใช้สีคณะหรือธีมพิธีการ พร้อมใส่เวลาพิธีและสถานที่' },
    { id: 'baby-shower', name: 'งานฉลองลูก', icon: '👶', desc: 'Baby Shower', gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      details: 'Baby Shower: โทนอ่อนหวานหรือธีมสนุกสำหรับเด็ก เช่น สัตว์น่ารัก, ประเภทของของขวัญที่แขกควรนำมา รวมถึงรายละเอียดกิจกรรม' },
    { id: 'anniversary', name: 'งานครบรอบ', icon: '💕', desc: 'ฉลองครบรอบ', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      details: 'งานครบรอบ: โทนอบอุ่นหรือโรแมนติก ใช้รูปย้อนความทรงจำหรือข้อความพิเศษ, ระบุการแต่งกายและคำเชิญแบบเป็นส่วนตัว' },
    { id: 'other', name: 'อื่นๆ', icon: '✨', desc: 'งานประเภทอื่น', gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      details: 'อื่นๆ: ระบุลักษณะงานและสิ่งที่ต้องการพิเศษในช่องคำอธิบายเพิ่มเติม เช่น ธีมวัฒนธรรม พิธีการเฉพาะทาง หรือข้อจำกัดด้านงบประมาณ' }
  ];

  const themes = {
    wedding: [
      { id: 'classic', name: 'คลาสสิค', preview: '🤍 ขาว ทอง หรูหรา', gradient: 'linear-gradient(135deg, #fff 0%, #ffd700 100%)',
        details: 'คลาสสิค: ใช้กรอบทอง, ฟอนต์ serif, พื้นหลังขาวหรือครีม เหมาะกับงานที่ต้องการความสง่างาม' },
      { id: 'modern', name: 'โมเดิร์น', preview: '🖤 ขาว ดำ เรียบง่าย', gradient: 'linear-gradient(135deg, #000 0%, #fff 100%)',
        details: 'โมเดิร์น: โทนขาว-ดำหรือโทนอ่อน ใช้พื้นที่ว่างและฟอนต์ sans-serif ดูสะอาดตา' },
      { id: 'vintage', name: 'วินเทจ', preview: '🌸 ชมพู ครีม โรแมนติก', gradient: 'linear-gradient(135deg, #ffb6c1 0%, #f5f5dc 100%)',
        details: 'วินเทจ: ใส่ลายเส้นโบราณ, สีพาสเทล, และองค์ประกอบย้อนยุค เช่น แสตมป์หรือลายดอกไม้' },
      { id: 'garden', name: 'การ์เด้น', preview: '🌿 เขียว ขาว ธรรมชาติ', gradient: 'linear-gradient(135deg, #8fbc8f 0%, #f5f5dc 100%)',
        details: 'การ์เด้น: ธีมธรรมชาติ ใช้ใบไม้และดอกไม้จริง/ลายพิมพ์ และโทนสีเขียว-ครีม' }
    ],
    birthday: [
      { id: 'cartoon', name: 'การ์ตูน', preview: '🎨 สีสดใส น่ารัก', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
        details: 'การ์ตูน: รูปแบบน่ารัก สีสดใส เหมาะกับเด็ก ใช้ไอคอนตัวการ์ตูนและฟอนต์สนุก' },
      { id: 'luxury', name: 'หรูหรา', preview: '✨ ทอง ดำ เงิน', gradient: 'linear-gradient(135deg, #ffd700 0%, #000 100%)',
        details: 'หรูหรา: ฟอนต์หรู และการใช้องค์ประกอบประกาย เช่น โลหะหรือฟอยล์ทอง' },
      { id: 'minimal', name: 'มินิมอล', preview: '⚪ ขาว เทา เรียบ', gradient: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
        details: 'มินิมอล: เรียบง่าย ใช้สีจำกัดและพื้นที่ว่าง เพื่อความทันสมัย' },
      { id: 'colorful', name: 'สีสันสดใส', preview: '🌈 หลากสี สนุกสนาน', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)',
        details: 'สีสันสดใส: ผสมสีหลายเฉด เหมาะกับปาร์ตี้ที่ต้องการพลังงานและความสนุก' }
    ],
    corporate: [
      { id: 'professional', name: 'มืออาชีพ', preview: '💼 น้ำเงิน ขาว', gradient: 'linear-gradient(135deg, #4169e1 0%, #fff 100%)',
        details: 'มืออาชีพ: ใส่โลโก้, ข้อมูลการลงทะเบียน, และฟอนต์อ่านง่าย' },
      { id: 'modern-corp', name: 'โมเดิร์น', preview: '🏢 เทา ดำ ขาว', gradient: 'linear-gradient(135deg, #808080 0%, #000 50%, #fff 100%)',
        details: 'โมเดิร์น: เส้นสายเรียบและไอคอนทันสมัย เหมาะสำหรับการเปิดตัวหรือสัมมนา' },
      { id: 'creative', name: 'สร้างสรรค์', preview: '🎯 สีสัน ทันสมัย', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        details: 'สร้างสรรค์: เล่นกับรูปทรงและสี เน้นการสื่อสารแบรนด์ที่แตกต่าง' }
    ],
    party: [
      { id: 'neon', name: 'นีออน', preview: '💫 สีนีออน มันวาว', gradient: 'linear-gradient(135deg, #ff0080 0%, #00ff80 100%)',
        details: 'นีออน: ใช้สีเปล่งประกายและเอฟเฟกต์ปาร์ตี้ เหมาะกับปาร์ตี้กลางคืน' },
      { id: 'elegant', name: 'หรูหรา', preview: '🥂 ทอง ดำ เงิน', gradient: 'linear-gradient(135deg, #ffd700 0%, #000 50%, #c0c0c0 100%)',
        details: 'หรูหรา: องค์ประกอบประกายและฟอนต์เรียบหรู เหมาะกับงานกาล่า' },
      { id: 'fun', name: 'สนุกสนาน', preview: '🎊 สีสดใส เฟส', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)',
        details: 'สนุกสนาน: ไอคอนกิจกรรมและสีจัดเต็ม เพิ่มข้อมูลเกี่ยวกับ playlist หรือธีมการแต่งกาย' }
    ]
  };

  const colorPalettes = [
    { id: 'gold-white', colors: ['#FFD700', '#FFFFFF'], name: 'ทอง-ขาว', desc: 'หรูหรา คลาสสิค',
      details: 'ทอง-ขาว: ให้ความรู้สึกหรูหรา เหมาะกับงานแต่งหรืองานทางการ — ใช้กับฟอยล์ทองหรืองานพิมพ์พรีเมียม' },
    { id: 'navy-gold', colors: ['#1B2951', '#FFD700'], name: 'กรม-ทอง', desc: 'สง่างาม โดดเด่น',
      details: 'กรม-ทอง: เป็นทางการและโดดเด่น เหมาะกับการ์ดที่ต้องการคอนทราสต์สูง' },
    { id: 'pink-white', colors: ['#FFB6C1', '#FFFFFF'], name: 'ชมพู-ขาว', desc: 'หวาน โรแมนติก',
      details: 'ชมพู-ขาว: เหมาะกับงานโรแมนติกหรือ baby shower ใช้พื้นเรียบและลายดอกเล็ก ๆ' },
    { id: 'green-cream', colors: ['#8FBC8F', '#F5F5DC'], name: 'เขียว-ครีม', desc: 'ธรรมชาติ สดชื่น',
      details: 'เขียว-ครีม: ธีมธรรมชาติ เหมาะกับการ์ดกระดาษรีไซเคิลและงานกลางแจ้ง' },
    { id: 'black-gold', colors: ['#000000', '#FFD700'], name: 'ดำ-ทอง', desc: 'หรูหรา ทันสมัย',
      details: 'ดำ-ทอง: คอนทราสต์สูง เหมาะกับปาร์ตี้หรูหรา หรือการ์ดสไตล์มืดที่ดูพรีเมียม' },
    { id: 'blue-silver', colors: ['#4169E1', '#C0C0C0'], name: 'น้ำเงิน-เงิน', desc: 'สะอาด เย็นสบาย',
      details: 'น้ำเงิน-เงิน: ให้ความรู้สึกเป็นทางการและสะอาด เหมาะกับงานองค์กรหรือธีมทะเล' },
    { id: 'purple-white', colors: ['#9370DB', '#FFFFFF'], name: 'ม่วง-ขาว', desc: 'ลึกลับ หรูหรา',
      details: 'ม่วง-ขาว: ให้ลุคลึกลับ เหมาะกับอีเวนต์กลางคืนหรือคอนเสิร์ตขนาดเล็ก' },
    { id: 'coral-cream', colors: ['#FF7F50', '#F5F5DC'], name: 'ปะการัง-ครีม', desc: 'อบอุ่น สดชื่น',
      details: 'ปะการัง-ครีม: โทนอุ่น เหมาะกับงานกลางวันหรือชายหาด' }
  ];

  const styles = [
    { id: 'formal', name: 'ทางการ', icon: '🎩', desc: 'เป็นทางการ สุภาพ', color: '#1e3d59',
      details: 'ทางการ: ฟอนต์ serif, จัดวางเท่ากันทั้งหน้า และเว้นที่สำหรับข้อมูลสำคัญ' },
    { id: 'casual', name: 'สบายๆ', icon: '😊', desc: 'ผ่อนคลาย สบายๆ', color: '#f38ba8',
      details: 'สบายๆ: ฟอนต์กลมและองค์ประกอบที่ไม่เป็นทางการ เหมาะกับงานเพื่อนฝูง' },
    { id: 'luxury', name: 'หรูหรา', icon: '👑', desc: 'หรูหรา ระดับพรีเมียม', color: '#ffd700',
      details: 'หรูหรา: ใช้องค์ประกอบพรีเมียมเช่น ฟอยล์, กระดาษหนา, และตัวอักษรที่ประณีต' },
    { id: 'cute', name: 'น่ารัก', icon: '🥰', desc: 'น่ารัก อบอุ่น', color: '#ffb3ba',
      details: 'น่ารัก: สีพาสเทล ไอคอนการ์ตูน และฟอนต์เล่นๆ เหมาะกับงานเด็กหรืองานกุ๊กกิ๊ก' },
    { id: 'artistic', name: 'ศิลปะ', icon: '🎨', desc: 'สร้างสรรค์ ศิลปะ', color: '#a8e6cf',
      details: 'ศิลปะ: เล่นกับรูปทรง ไอเท็มแปลกตา และการจัดวางที่เป็นศิลป์' },
    { id: 'minimalist', name: 'มินิมอล', icon: '⚪', desc: 'เรียบง่าย สะอาด', color: '#e0e0e0',
      details: 'มินิมอล: ลดองค์ประกอบ ใช้พื้นที่ว่างและฟอนต์เรียบ เหมาะกับงานร่วมสมัย' }
  ];

  const handleNext = () => {
    if (step < 4) {
      setAnimationDirection('forward');
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setAnimationDirection('backward');
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    // สร้าง prompt จากข้อมูลที่เลือก (เหมือนเดิม)
    const selectedEventType = eventTypes.find(t => t.id === wizardData.eventType);
    const selectedTheme = themes[wizardData.eventType]?.find(t => t.id === wizardData.theme);
    const selectedStyle = styles.find(s => s.id === wizardData.style);

    let autoPrompt = `${selectedEventType?.name || ''} invitation card`;

    if (wizardData.eventName) autoPrompt += `, event: ${wizardData.eventName}`;
    if (selectedTheme) autoPrompt += `, ${selectedTheme.name} theme`;
    if (selectedStyle) autoPrompt += `, ${selectedStyle.name} style`;
    if (wizardData.venue) autoPrompt += `, venue: ${wizardData.venue}`;
    if (wizardData.eventDate) {
      const date = new Date(wizardData.eventDate);
      autoPrompt += `, date: ${date.toLocaleDateString('th-TH')}`;
    }
    if (wizardData.colors.length > 0) {
      const colorNames = colorPalettes
        .filter(p => wizardData.colors.includes(p.id))
        .map(p => p.name)
        .join(', ');
      autoPrompt += `, colors: ${colorNames}`;
    }
    const finalPrompt = wizardData.customPrompt ? `${autoPrompt}, ${wizardData.customPrompt}` : autoPrompt;

    // รีเซ็ต wizard (optional) และปิด (ไม่รอการสร้างใน wizard)
    setWizardData({
      eventType: '',
      theme: '',
      eventName: '',
      eventDate: '',
      venue: '',
      colors: [],
      style: '',
      customPrompt: ''
    });

    onClose();

    // แจ้ง parent ให้เป็นคนสร้าง และให้สร้างทันที (autoGenerate = true)
    if (typeof onGenerate === 'function') {
      try {
        // ไม่ await เพื่อให้ UI ปิดทันที — parent จะจัดการการสร้าง/loading
        onGenerate(finalPrompt, true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invitation-wizard-overlay">
      <div className="invitation-wizard-container">
        {/* Header */}
        <div className="invitation-wizard-header">
          <div className="wizard-icon">🎨</div>
          <div className="wizard-title-text">
            <h2>ตัวช่วยสร้างบัตรเชิญ</h2>
            <p>สร้างบัตรเชิญสวยๆ ในไม่กี่ขั้นตอน</p>
          </div>
          <button 
            className="invitation-wizard-close" 
            onClick={onClose}
            disabled={isGenerating}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="invitation-wizard-progress">
          <div className="progress-line"></div>
          {[1, 2, 3, 4].map(num => (
            <div 
              key={num} 
              className={`progress-step ${step >= num ? 'active' : ''} ${step === num ? 'current' : ''}`}
            >
              <div className="progress-number">{num}</div>
              {step === num && <div className="progress-ripple"></div>}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="invitation-wizard-content">
          {/* Step 1: ประเภทงาน */}
          {step === 1 && (
            <div className={`invitation-wizard-step ${animationDirection}`}>
              <h3><span className="step-emoji">🎪</span> งานประเภทใด?</h3>
              <div className="invitation-event-types-grid">
                {eventTypes.map((type, index) => (
                  <div
                    key={type.id}
                    className={`invitation-event-type-card ${wizardData.eventType === type.id ? 'selected' : ''}`}
                    onClick={() => setWizardData({...wizardData, eventType: type.id})}
                    style={{ 
                      animationDelay: `${index * 0.05}s`,
                      background: wizardData.eventType === type.id ? type.gradient : undefined
                    }}
                  >
                    <div className="card-glow"></div>
                    <div style={{position:'absolute', top:8, right:8, zIndex:5}}>
                      <button
                        onClick={(e)=>{ e.stopPropagation(); openInfo(type.name, type.details || `${type.desc}`); }}
                        style={{background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}
                        aria-label={`Info ${type.name}`}
                      >ℹ️</button>
                    </div>
                    <div className="invitation-event-icon">{type.icon}</div>
                    <div className="invitation-event-name">{type.name}</div>
                    <div className="invitation-event-desc">{type.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: ธีมและสี */}
          {step === 2 && (
            <div className={`invitation-wizard-step ${animationDirection}`}>
              <h3><span className="step-emoji">🎨</span> เลือกธีมและสี</h3>
              
              {/* Theme Selection */}
              {wizardData.eventType && themes[wizardData.eventType] && (
                <div className="step-section">
                  <h4>ธีม</h4>
                  <div className="invitation-themes-grid">
                    {themes[wizardData.eventType].map((theme, index) => (
                      <div
                        key={theme.id}
                        className={`invitation-theme-card ${wizardData.theme === theme.id ? 'selected' : ''}`}
                        onClick={() => setWizardData({...wizardData, theme: theme.id})}
                        style={{ 
                          animationDelay: `${index * 0.05}s`,
                          background: wizardData.theme === theme.id ? theme.gradient : undefined
                        }}
                      >
                        <div className="card-glow"></div>
                        <button
                          onClick={(e)=>{ e.stopPropagation(); openInfo(theme.name, theme.details || `${theme.preview}`); }}
                          style={{position:'absolute', top:8, right:8, background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}
                          aria-label={`Info ${theme.name}`}
                        >ℹ️</button>
                        <div className="invitation-theme-name">{theme.name}</div>
                        <div className="invitation-theme-preview">{theme.preview}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              <div className="step-section">
                <h4>โทนสี (เลือกได้หลายสี)</h4>
                <div className="invitation-colors-grid">
                  {colorPalettes.map((palette, index) => (
                    <div
                      key={palette.id}
                      className={`invitation-color-card ${wizardData.colors.includes(palette.id) ? 'selected' : ''}`}
                      onClick={() => {
                        const newColors = wizardData.colors.includes(palette.id)
                          ? wizardData.colors.filter(c => c !== palette.id)
                          : [...wizardData.colors, palette.id];
                        setWizardData({...wizardData, colors: newColors});
                      }}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <div className="card-glow"></div>
                      <button
                        onClick={(e)=>{ e.stopPropagation(); openInfo(palette.name, palette.details || `สี: ${palette.colors.join(', ')}`); }}
                        style={{position:'absolute', top:8, right:8, background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}
                        aria-label={`Info ${palette.name}`}
                      >ℹ️</button>
                      <div className="invitation-color-preview">
                        {palette.colors.map(color => (
                          <div 
                            key={color} 
                            className="invitation-color-dot" 
                            style={{backgroundColor: color}}
                          />
                        ))}
                      </div>
                      <div className="invitation-color-name">{palette.name}</div>
                      <div className="invitation-color-desc">{palette.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: รายละเอียดงาน */}
          {step === 3 && (
            <div className={`invitation-wizard-step ${animationDirection}`}>
              <h3><span className="step-emoji">📝</span> รายละเอียดงาน</h3>
              
              <div className="invitation-form-group">
                <label>ชื่องาน</label>
                <input
                  type="text"
                  placeholder="เช่น งานแต่งงาน คุณสมชาย & คุณสมหญิง"
                  value={wizardData.eventName}
                  onChange={(e) => setWizardData({...wizardData, eventName: e.target.value})}
                />
                {/* input hint */}
                <InputHint compact />
              </div>

              <div className="invitation-form-group">
                <label>วันที่จัดงาน</label>
                <input
                  type="date"
                  value={wizardData.eventDate}
                  onChange={(e) => setWizardData({...wizardData, eventDate: e.target.value})}
                />
              </div>

              {/* <div className="invitation-form-group">
                <label>สถานที่</label>
                <input
                  type="text"
                  placeholder="เช่น โรงแรม ABC หรือ บ้านเจ้าสาว"
                  value={wizardData.venue}
                  onChange={(e) => setWizardData({...wizardData, venue: e.target.value})}
                />
              </div> */}

              <div className="invitation-form-group">
                <label>สไตล์</label>
                <div className="invitation-styles-grid">
                  {styles.map((style, index) => (
                    <div
                      key={style.id}
                      className={`invitation-style-card ${wizardData.style === style.id ? 'selected' : ''}`}
                      onClick={() => setWizardData({...wizardData, style: style.id})}
                      style={{ 
                        animationDelay: `${index * 0.05}s`,
                        borderColor: wizardData.style === style.id ? style.color : undefined
                      }}
                    >
                      <div className="card-glow"></div>
                      <button
                        onClick={(e)=>{ e.stopPropagation(); openInfo(style.name, style.details || `${style.desc}`); }}
                        style={{position:'absolute', top:8, right:8, background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}
                        aria-label={`Info ${style.name}`}
                      >ℹ️</button>
                      <div className="invitation-style-icon">{style.icon}</div>
                      <div className="invitation-style-name">{style.name}</div>
                      <div className="invitation-style-desc">{style.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: รายละเอียดเพิ่มเติม */}
          {step === 4 && (
            <div className={`invitation-wizard-step ${animationDirection}`}>
              <h3><span className="step-emoji">✨</span> รายละเอียดเพิ่มเติม</h3>
              
              <div className="invitation-form-group">
                <label>คำอธิบายเพิ่มเติม (ไม่บังคับ)</label>
                <textarea
                  rows={4}
                  placeholder="เช่น ต้องการให้มีดอกไม้ ต้องการสีอบอุ่น ต้องการรูปแบบการ์ตูน..."
                  value={wizardData.customPrompt}
                  onChange={(e) => setWizardData({...wizardData, customPrompt: e.target.value})}
                />
                {/* input hint */}
                <InputHint />
              </div>

              {/* Preview */}
              <div className="invitation-wizard-preview">
                <h4>ตัวอย่างบัตรเชิญที่จะสร้าง:</h4>
                <div className="invitation-preview-card">
                  <div><strong>ประเภท:</strong> {eventTypes.find(t => t.id === wizardData.eventType)?.name || '-'}</div>
                  {wizardData.theme && <div><strong>ธีม:</strong> {themes[wizardData.eventType]?.find(t => t.id === wizardData.theme)?.name || '-'}</div>}
                  {wizardData.eventName && <div><strong>ชื่องาน:</strong> {wizardData.eventName}</div>}
                  {wizardData.eventDate && <div><strong>วันที่:</strong> {new Date(wizardData.eventDate).toLocaleDateString('th-TH')}</div>}
                  {wizardData.venue && <div><strong>สถานที่:</strong> {wizardData.venue}</div>}
                  {wizardData.style && <div><strong>สไตล์:</strong> {styles.find(s => s.id === wizardData.style)?.name || '-'}</div>}
                  {wizardData.colors.length > 0 && (
                    <div>
                      <strong>โทนสี:</strong> {colorPalettes.filter(p => wizardData.colors.includes(p.id)).map(p => p.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="invitation-wizard-footer">
          <button 
            className="invitation-wizard-btn secondary" 
            onClick={handlePrev}
            disabled={step === 1 || isGenerating}
          >
            ← ย้อนกลับ
          </button>
          
          {step < 4 ? (
            <button 
              className="invitation-wizard-btn primary" 
              onClick={handleNext}
              disabled={(step === 1 && !wizardData.eventType) || isGenerating}
            >
              ถัดไป →
            </button>
          ) : (
            <button 
              className="invitation-wizard-btn generate" 
              onClick={handleGenerate}
              disabled={!wizardData.eventType || isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="generating-spinner">⏳</span>
                  กำลังสร้าง 3 แบบ...
                </>
              ) : (
                <>
                  🎨 สร้างบัตรเชิญ 3 แบบ
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info modal (simple) */}
      {infoOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999}} onClick={closeInfo}>
          <div style={{background:'#fff', padding:20, borderRadius:8, minWidth:300, maxWidth:'90%'}} onClick={(e)=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <strong>{infoTitle}</strong>
              <button onClick={closeInfo} style={{border:'none', background:'transparent', cursor:'pointer'}}>✕</button>
            </div>
            <div style={{whiteSpace:'pre-wrap', color:'#333'}}>{infoBody}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationWizard;