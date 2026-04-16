import React, { useState, useEffect } from 'react';
import './ThemeWizard.css';

// Small styled hint component for inputs
const InputHint = ({ compact = false }) => (
  <div
    style={{
      display: 'flex',
      gap: 8,
      alignItems: compact ? 'center' : 'flex-start',
      marginTop: compact ? 8 : 10,
      background: '#f6ffef',
      border: '1px solid #e6f6dc',
      padding: compact ? '6px 10px' : '10px 12px',
      borderRadius: 8,
      color: '#1a5a2a',
      fontSize: compact ? 12 : 13,
      lineHeight: 1.2
    }}
  >
    <div style={{ fontSize: 16 }}>🛈</div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontWeight: 600 }}>Please enter display text in English</div>
      <div style={{ color: '#2b7a3a', opacity: 0.95, marginTop: 4 }}>
        For best results use English only — the system supports English for displayed/generated text.
      </div>
      <div style={{ color: '#225f2f', marginTop: 6, fontSize: 12, opacity: 0.9 }}>
        โปรดกรอกข้อความที่ต้องการให้แสดงเป็นภาษาอังกฤษเท่านั้น
      </div>
    </div>
  </div>
);

const ThemeWizard = ({ isOpen, onClose, onGenerate }) => {
  const [step, setStep] = useState(1);
  const [animationDirection, setAnimationDirection] = useState('forward');
  const [isGenerating, setIsGenerating] = useState(false);

  const [wizardData, setWizardData] = useState({
    eventType: '',
    venue: '',
    atmosphere: '',
    eventName: '',
    eventDate: '',
    guestCount: '',
    colors: [],
    style: '',
    decorElements: [],
    customPrompt: ''
  });

  // info modal state for help buttons
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoBody, setInfoBody] = useState('');
  const openInfo = (title, body) => { setInfoTitle(title); setInfoBody(body); setInfoOpen(true); };
  const closeInfo = () => setInfoOpen(false);

  // Reset เมื่อเปิด wizard ใหม่
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsGenerating(false);
      setAnimationDirection('forward');
    }
  }, [isOpen]);

  // ข้อมูลตัวเลือกสำหรับธีมอีเว้นต์ (เพิ่มฟิลด์ details สำหรับคำอธิบายเชิงลึก)
  const eventTypes = [
    { id: 'wedding', name: 'งานแต่งงาน', icon: '💒', desc: 'งานมงคลสมรส',
      details: 'งานแต่งงาน: เน้นธีมโรแมนติก หรือหรูหราตามงบประมาณ — ตัวอย่างการตกแต่ง: ดอกไม้ช่อใหญ่, ฉากถ่ายรูป, แสงไฟวอร์มไวท์. แนะนำโทนสี: ทอง-ขาว, บลัช-ทอง.' },
    { id: 'birthday', name: 'งานวันเกิด', icon: '🎂', desc: 'ฉลองวันเกิด',
      details: 'งานวันเกิด: ปรับสไตล์ตามอายุและความชอบผู้รับ เช่น การ์ตูนสำหรับเด็ก, หรูหราสำหรับผู้ใหญ่. ของตกแต่ง: ลูกโป่ง, แบ็กดรอป, เค้กตกแต่งธีม.' },
    { id: 'corporate', name: 'งานองค์กร', icon: '🏢', desc: 'ประชุม สัมมนา',
      details: 'งานองค์กร: เน้นความเป็นมืออาชีพและฟังก์ชัน เช่น เวิร์คชอป, งานเปิดตัวสินค้า. แนะนำการจัดพื้นที่: เวที/สไลด์, มุมเครือข่าย, ป้ายแบรนด์.' },
    { id: 'party', name: 'งานปาร์ตี้', icon: '🎉', desc: 'งานสังสรรค์',
      details: 'งานปาร์ตี้: เลือกธีมสนุก เช่น นีออน, ดิสโก้ หรือปาร์ตี้ริมสระ. เพิ่มไฟตกแต่ง, มุมถ่ายรูป, ดนตรี/ดีเจ.' },
    { id: 'graduation', name: 'งานรับปริญญา', icon: '🎓', desc: 'พิธีสำเร็จการศึกษา',
      details: 'งานรับปริญญา: มักเน้นมุมถ่ายรูปและโต๊ะลงนาม. โทนสีควรเป็นทางการหรือธีมคณะ พร้อมพร็อพถ่ายรูป.' },
    { id: 'anniversary', name: 'งานครบรอบ', icon: '💕', desc: 'ฉลองครบรอบ',
      details: 'งานครบรอบ: มักใช้บรรยากาศอบอุ่น/โรแมนติก และมุมเล่าเรื่องความทรงจำ เช่น ภาพถ่ายย้อนหลัง, ดอกไม้.' },
    { id: 'baby-shower', name: 'งานฉลองลูก', icon: '👶', desc: 'Baby Shower',
      details: 'Baby Shower: โทนอ่อนหวานหรือธีมสนุกสำหรับเด็ก เน้นมุมกิจกรรมและของชำร่วยให้แขก.' },
    { id: 'festival', name: 'งานเทศกาล', icon: '🎊', desc: 'งานเทศกาลต่างๆ',
      details: 'งานเทศกาล: ขึ้นอยู่กับประเภทเทศกาล เช่น งานกินเจ, งานปีใหม่ — ควรวางผังให้รองรับการเดินและการจัดบูท.' }
  ];

  const venues = [
    { id: 'hotel', name: 'โรงแรม', icon: '🏨', desc: 'ห้องบอลรูม งานหรู',
      details: 'โรงแรม/บอลรูม: เหมาะกับงานใหญ่และหรู คำนึงถึงเวที, เสียง, แสง และการวางโต๊ะที่สะดวก.' },
    { id: 'garden', name: 'สวน/สนาม', icon: '🌸', desc: 'กลางแจ้ง ธรรมชาติ',
      details: 'สวน/กลางแจ้ง: เหมาะกับการจัดงานกลางแจ้ง แต่ต้องเตรียมแผนสำรองสำหรับฝนและแสงอาทิตย์.' },
    { id: 'restaurant', name: 'ร้านอาหาร', icon: '🍽️', desc: 'สไตล์อบอุ่น',
      details: 'ร้านอาหาร: ดีสำหรับงานเล็ก-กลาง มีความเป็นส่วนตัว แต่พื้นที่อาจจำกัดในการตกแต่งขนาดใหญ่.' },
    { id: 'home', name: 'บ้าน', icon: '🏠', desc: 'แบบครอบครัว',
      details: 'บ้าน: บรรยากาศอบอุ่นเป็นกันเอง เหมาะกับงานครอบครัว ต้องคำนึงถึงที่จอดรถและการเข้าถึง.' },
    { id: 'beach', name: 'ชายหาด', icon: '🏖️', desc: 'วิวทะเล โรแมนติก',
      details: 'ชายหาด: บรรยากาศโรแมนติก ธีมทะเล แต่ต้องระวังลมและทรายเข้ามาในการจัดตกแต่ง.' },
    { id: 'office', name: 'สำนักงาน', icon: '🏢', desc: 'งานองค์กร',
      details: 'สำนักงาน: เหมาะสำหรับกิจกรรมองค์กรหรือสัมมนา ต้องเตรียมอุปกรณ์นำเสนอและที่นั่ง.' },
    { id: 'hall', name: 'หอประชุม', icon: '🎭', desc: 'งานใหญ่ เป็นทางการ',
      details: 'หอประชุม: รองรับผู้เข้าร่วมจำนวนมาก เหมาะกับคอนเฟอเรนซ์หรือพิธีการ.' },
    { id: 'rooftop', name: 'ดาดฟ้า', icon: '🌆', desc: 'วิวเมือง ทันสมัย',
      details: 'ดาดฟ้า: เท่และทันสมัย เหมาะกับปาร์ตี้ช่วงเย็น แต่ต้องคำนึงถึงสภาพอากาศและความปลอดภัย.' }
  ];

  const atmospheres = [
    { id: 'romantic', name: 'โรแมนติก', icon: '💕', desc: 'อบอุ่น หวานๆ',
      details: 'บรรยากาศโรแมนติก: ใช้ไฟวอร์มไวท์, ดอกไม้, ผ้าม่าน และสีพาสเทล/ทอง เพิ่มมุมถ่ายรูป.' },
    { id: 'elegant', name: 'หรูหรา', icon: '👑', desc: 'สง่างาม ระดับพรีเมียม',
      details: 'หรูหรา: เน้นผ้า, งานแสง, โทนสีทอง/ดำ/กรมที่ให้ความรู้สึกพรีเมียม.' },
    { id: 'fun', name: 'สนุกสนาน', icon: '🎉', desc: 'ครึกครื้น มีชีวิตชีวา',
      details: 'สนุกสนาน: ใช้สีสดใส, แสงสเปเชียล, พื้นที่กิจกรรม และเพลงที่จังหวะเร็ว.' },
    { id: 'modern', name: 'ทันสมัย', icon: '✨', desc: 'โมเดิร์น มินิมอล',
      details: 'ทันสมัย: โทนสีสะอาด เรียบง่าย ใช้องค์ประกอบกราฟิกและแสง LED.' },
    { id: 'vintage', name: 'วินเทจ', icon: '📷', desc: 'คลาสสิค ย้อนยุค',
      details: 'วินเทจ: ใช้ของโบราณ, เฟอร์นิเจอร์ไม้ และโทนสีกลาง-อบอุ่น.' },
    { id: 'natural', name: 'ธรรมชาติ', icon: '🌿', desc: 'เน้นความสดชื่น',
      details: 'ธรรมชาติ: เน้นต้นไม้/ดอกไม้จริง, ไม้ และวัสดุรีไซเคิล ให้ความรู้สึกเป็นมิตรกับสิ่งแวดล้อม.' },
    { id: 'luxury', name: 'หรูหรามาก', icon: '💎', desc: 'อลังการ ระดับไฮเอนด์',
      details: 'หรูหรามาก: จัดเต็มโคมไฟแชนเดอเลียร์, งานดอกไม้ใหญ่ และวัสดุคุณภาพสูง.' },
    { id: 'cozy', name: 'อบอุ่น', icon: '🕯️', desc: 'สบายๆ เป็นกันเอง',
      details: 'อบอุ่น: ใช้แสงไฟอ่อน, เบาะนั่งสบาย และมุมเล็ก ๆ สำหรับพูดคุย.' }
  ];

  const colorPalettes = [
    { id: 'gold-white', colors: ['#FFD700', '#FFFFFF'], name: 'ทอง-ขาว', desc: 'หรูหรา คลาสสิค',
      details: 'ทอง-ขาว: ให้ความรู้สึกหรูหรา เหมาะกับงานแต่งงานหรืองานที่เป็นทางการ.' },
    { id: 'navy-gold', colors: ['#1B2951', '#FFD700'], name: 'กรม-ทอง', desc: 'สง่างาม เป็นทางการ',
      details: 'กรม-ทอง: ทางการและโดดเด่น เหมาะกับงานองค์กรหรือพิธีการ.' },
    { id: 'blush-gold', colors: ['#FFB6C1', '#FFD700'], name: 'บลัช-ทอง', desc: 'หวาน โรแมนติก',
      details: 'บลัช-ทอง: เหมาะกับงานแต่งงานและงานที่ต้องการโทนหวานอบอุ่น.' },
    { id: 'green-cream', colors: ['#8FBC8F', '#F5F5DC'], name: 'เขียว-ครีม', desc: 'ธรรมชาติ สดชื่น',
      details: 'เขียว-ครีม: ให้ความรู้สึกสดชื่น เหมาะกับงานสวนหรือธีมธรรมชาติ.' },
    { id: 'black-gold', colors: ['#000000', '#FFD700'], name: 'ดำ-ทอง', desc: 'หรูหรา โดดเด่น',
      details: 'ดำ-ทอง: โทนคอนทราสต์ สูง เหมาะสำหรับปาร์ตี้หรูหรือธีมลักชัวรี่.' },
    { id: 'blue-silver', colors: ['#4169E1', '#C0C0C0'], name: 'น้ำเงิน-เงิน', desc: 'สะอาด เย็นสบาย',
      details: 'น้ำเงิน-เงิน: ให้ความรู้สึกเป็นทางการสะอาด เหมาะกับงานองค์กรหรือธีมทะเล.' },
    { id: 'purple-white', colors: ['#9370DB', '#FFFFFF'], name: 'ม่วง-ขาว', desc: 'ลึกลับ หรูหรา',
      details: 'ม่วง-ขาว: ให้ลุคลึกลับและหรู เหมาะกับธีมกลางคืนหรือคอนเสิร์ตเล็ก ๆ.' },
    { id: 'coral-cream', colors: ['#FF7F50', '#F5F5DC'], name: 'ปะการัง-ครีม', desc: 'อบอุ่น มีชีวิตชีวา',
      details: 'ปะการัง-ครีม: สดใสและอบอุ่น เหมาะกับปาร์ตี้กลางวันหรืองานชายหาด.' }
  ];

  const styles = [
    { id: 'minimalist', name: 'มินิมอล', icon: '⚪', desc: 'เรียบง่าย สะอาด',
      details: 'มินิมอล: เน้นพื้นที่โล่ง โทนสีเรียบ และการจัดวางที่สะอาดตา.' },
    { id: 'bohemian', name: 'โบฮีเมียน', icon: '🌺', desc: 'ศิลปะ อิสระ',
      details: 'โบฮีเมียน: ผสมผสานลวดลายและวัสดุจากธรรมชาติ เหมาะกับงานชิลล์.' },
    { id: 'industrial', name: 'อินดัสเทรียล', icon: '🏭', desc: 'คอนกรีต เหล็ก',
      details: 'อินดัสเทรียล: เหมาะกับสถานที่ Loft หรือโรงงานเก่า ใช้วัสดุเหล็กและไฟเปลือย.' },
    { id: 'rustic', name: 'รัสติก', icon: '🪵', desc: 'ไม้ ธรรมชาติ',
      details: 'รัสติก: เน้นเนื้อไม้, ผ้าลินิน และของตกแต่งที่ให้ความรู้สึกอบอุ่น.' },
    { id: 'glam', name: 'แกลม', icon: '✨', desc: 'ระยิบระยับ หรูหรา',
      details: 'แกลม: ใช้ประกาย, ผ้าไหม, และของประดับที่ดูหรูหรา.' },
    { id: 'tropical', name: 'ทรอปิคอล', icon: '🌴', desc: 'ใบไผ่ สีสดใส',
      details: 'ทรอปิคอล: ใช้ใบไม้ใหญ่ ดอกไม้ทรอปิคอล และสีสันสดใส.' },
    { id: 'classic', name: 'คลาสสิค', icon: '🏛️', desc: 'เก่าแก่ สง่างาม',
      details: 'คลาสสิค: เหมาะกับพิธีการ ใช้องค์ประกอบแบบดั้งเดิมและโทนสีเรียบ.' },
    { id: 'contemporary', name: 'คอนเทมโพรารี่', icon: '🎨', desc: 'ทันสมัย สร้างสรรค์',
      details: 'คอนเทมโพรารี่: ผสมผสานสมัยใหม่กับรูปแบบศิลป์ เหมาะกับงานที่ต้องการความสร้างสรรค์.' }
  ];

  const decorElements = [
    { id: 'flowers', name: 'ดอกไม้', icon: '🌸', desc: 'ช่อดอกไม้ กระเช้า',
      details: 'ดอกไม้: เลือกชนิดและสีให้เข้ากับธีม เช่น กุหลาบสำหรับโรแมนติก หรือดอกท้องถิ่นสำหรับธีมธรรมชาติ.' },
    { id: 'balloons', name: 'ลูกโป่ง', icon: '🎈', desc: 'ลูกโป่งหลากสี',
      details: 'ลูกโป่ง: เหมาะกับงานสนุกสนานและเด็ก สามารถใช้ลูกโป่งโกลด์หรือเมทัลลิคเพื่อความหรู.' },
    { id: 'lighting', name: 'แสงไฟ', icon: '💡', desc: 'ไฟประดับ สปอตไลท์',
      details: 'แสงไฟ: ปรับอารมณ์ของงานได้มาก เช่น ไฟวอร์มไวท์สำหรับอบอุ่น หรือไฟสีนีออนสำหรับปาร์ตี้.' },
    { id: 'fabric', name: 'ผ้าประดับ', icon: '🎭', desc: 'ผ้าไหม ผ้าซาติน',
      details: 'ผ้าประดับ: ใช้ผ้าคลุมโต๊ะ ผ้าห้อย หรือผ้าม่านเพื่อเพิ่มมิติและความนุ่มนวล.' },
    { id: 'candles', name: 'เทียน', icon: '🕯️', desc: 'เทียนหอม บรรยากาศ',
      details: 'เทียน: สร้างบรรยากาศอบอุ่นและโรแมนติก ต้องระวังเรื่องความปลอดภัยและลม.' },
    { id: 'centerpiece', name: 'ของตกแต่งโต๊ะ', icon: '🏺', desc: 'แจกัน ของประดับ',
      details: 'ของตกแต่งโต๊ะ: เลือกขนาดให้เหมาะกับโต๊ะ ไม่บดบังการสนทนา.' },
    { id: 'backdrop', name: 'ฉากหลัง', icon: '🖼️', desc: 'ผนังถ่ายรูป',
      details: 'ฉากหลัง: สำคัญสำหรับมุมถ่ายรูป ออกแบบให้เข้ากับธีมและพื้นที่ถ่ายภาพ.' },
    { id: 'props', name: 'อุปกรณ์ถ่ายรูป', icon: '📸', desc: 'โฟโต้บูธ พร็อพ',
      details: 'พร็อพถ่ายรูป: เพิ่มความสนุกและเป็นที่ระลึกของแขก สามารถปรับให้เข้ากับคอนเซปต์งาน.' }
  ];

  const handleNext = () => {
    if (step < 4) {
      setAnimationDirection('forward');
      setTimeout(() => setStep(step + 1), 50);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setAnimationDirection('backward');
      setTimeout(() => setStep(step - 1), 50);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // สร้าง prompt จากข้อมูลที่เลือก
    const selectedEventType = eventTypes.find(t => t.id === wizardData.eventType);
    const selectedVenue = venues.find(v => v.id === wizardData.venue);
    const selectedAtmosphere = atmospheres.find(a => a.id === wizardData.atmosphere);
    const selectedStyle = styles.find(s => s.id === wizardData.style);
    
    let autoPrompt = `${selectedEventType?.name || 'งาน'} theme decoration`;
    
    if (wizardData.eventName) {
      autoPrompt += `, event: ${wizardData.eventName}`;
    }
    
    if (selectedVenue) {
      autoPrompt += `, venue: ${selectedVenue.name}`;
    }
    
    if (selectedAtmosphere) {
      autoPrompt += `, atmosphere: ${selectedAtmosphere.name}`;
    }
    
    if (selectedStyle) {
      autoPrompt += `, style: ${selectedStyle.name}`;
    }
    
    if (wizardData.colors.length > 0) {
      const colorNames = colorPalettes
        .filter(p => wizardData.colors.includes(p.id))
        .map(p => p.name)
        .join(', ');
      autoPrompt += `, colors: ${colorNames}`;
    }

    if (wizardData.decorElements.length > 0) {
      const elementNames = decorElements
        .filter(e => wizardData.decorElements.includes(e.id))
        .map(e => e.name)
        .join(', ');
      autoPrompt += `, decorations: ${elementNames}`;
    }

    if (wizardData.guestCount) {
      autoPrompt += `, guests: ${wizardData.guestCount} people`;
    }
    
    // รวมกับ custom prompt
    const finalPrompt = wizardData.customPrompt 
      ? `${autoPrompt}, ${wizardData.customPrompt}`
      : autoPrompt;
    
    // รีเซ็ตข้อมูลใน wizard ก่อนปิด
    setWizardData({
      eventType: '',
      venue: '',
      atmosphere: '',
      eventName: '',
      eventDate: '',
      guestCount: '',
      colors: [],
      style: '',
      decorElements: [],
      customPrompt: ''
    });

    // ปิด wizard ทันที
    onClose();

    // เรียก generate แบบไม่รอผล — หน้าแม่จะแสดง loading
    onGenerate(finalPrompt, true).catch(() => { /* ignore, parent handles errors */ });
  };

  if (!isOpen) return null;

  return (
    <div className="theme-wizard-overlay">
      <div className="theme-wizard-container">
        <div className="theme-wizard-header">
          <h2>
            <span className="wizard-icon">🎨</span>
            <span className="wizard-title-text">ตัวช่วยสร้างธีมอีเว้นต์</span>
          </h2>
          <button 
            className="theme-wizard-close" 
            onClick={onClose}
            disabled={isGenerating}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="theme-wizard-progress">
          {[1, 2, 3, 4].map(num => (
            <div 
              key={num} 
              className={`progress-step ${step >= num ? 'active' : ''} ${step === num ? 'current' : ''}`}
            >
              <span className="progress-number">{num}</span>
              <div className="progress-ripple"></div>
            </div>
          ))}
          <div 
            className="progress-line"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
        </div>

        <div className="theme-wizard-content">
          {/* Step 1: ประเภทงานและสถานที่ */}
          {step === 1 && (
            <div className={`theme-wizard-step ${animationDirection}`}>
              <h3>
                <span className="step-emoji">🎯</span>
                งานประเภทใดและจัดที่ไหน?
              </h3>
              
              <div className="step-section">
                <h4>ประเภทงาน</h4>
                <div className="theme-event-types-grid">
                  {eventTypes.map((type, index) => (
                    <div
                      key={type.id}
                      className={`theme-event-type-card ${wizardData.eventType === type.id ? 'selected' : ''}`}
                      onClick={() => setWizardData({...wizardData, eventType: type.id})}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div style={{position:'absolute', top:8, right:8, zIndex:5}}>
                        <button
                          onClick={(e)=>{ e.stopPropagation(); openInfo(type.name, type.details || type.desc); }}
                          style={{background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}
                          aria-label={`Info ${type.name}`}
                        >ℹ️</button>
                      </div>
                      <div className="theme-event-icon">{type.icon}</div>
                      <div className="theme-event-name">{type.name}</div>
                      <div className="theme-event-desc">{type.desc}</div>
                      <div className="card-glow"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="step-section">
                <h4>สถานที่จัดงาน</h4>
                <div className="theme-venues-grid">
                  {venues.map((venue, index) => (
                    <div
                      key={venue.id}
                      className={`theme-venue-card ${wizardData.venue === venue.id ? 'selected' : ''}`}
                      onClick={() => setWizardData({...wizardData, venue: venue.id})}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div style={{position:'absolute', top:8, right:8, zIndex:5}}>
                        <button onClick={(e)=>{ e.stopPropagation(); openInfo(venue.name, venue.details || venue.desc); }} style={{background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}>ℹ️</button>
                      </div>
                      <div className="theme-venue-icon">{venue.icon}</div>
                      <div className="theme-venue-name">{venue.name}</div>
                      <div className="theme-venue-desc">{venue.desc}</div>
                      <div className="card-glow"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: บรรยากาศและสไตล์ */}
          {step === 2 && (
            <div className={`theme-wizard-step ${animationDirection}`}>
              <h3>
                <span className="step-emoji">✨</span>
                ต้องการบรรยากาศและสไตล์แบบไหน?
              </h3>
              
              <div className="step-section">
                <h4>บรรยากาศที่ต้องการ</h4>
                <div className="theme-atmospheres-grid">
                  {atmospheres.map((atmosphere, index) => (
                    <div
                      key={atmosphere.id}
                      className={`theme-atmosphere-card ${wizardData.atmosphere === atmosphere.id ? 'selected' : ''}`}
                      onClick={() => setWizardData({...wizardData, atmosphere: atmosphere.id})}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div style={{position:'absolute', top:8, right:8, zIndex:5}}>
                        <button onClick={(e)=>{ e.stopPropagation(); openInfo(atmosphere.name, atmosphere.details || atmosphere.desc); }} style={{background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}>ℹ️</button>
                      </div>
                      <div className="theme-atmosphere-icon">{atmosphere.icon}</div>
                      <div className="theme-atmosphere-name">{atmosphere.name}</div>
                      <div className="theme-atmosphere-desc">{atmosphere.desc}</div>
                      <div className="card-glow"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="step-section">
                <h4>สไตล์การตกแต่ง</h4>
                <div className="theme-styles-grid">
                  {styles.map((style, index) => (
                    <div
                      key={style.id}
                      className={`theme-style-card ${wizardData.style === style.id ? 'selected' : ''}`}
                      onClick={() => setWizardData({...wizardData, style: style.id})}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div style={{position:'absolute', top:8, right:8, zIndex:5}}>
                        <button onClick={(e)=>{ e.stopPropagation(); openInfo(style.name, style.details || style.desc); }} style={{background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}>ℹ️</button>
                      </div>
                      <div className="theme-style-icon">{style.icon}</div>
                      <div className="theme-style-name">{style.name}</div>
                      <div className="theme-style-desc">{style.desc}</div>
                      <div className="card-glow"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: สีและการตกแต่ง */}
          {step === 3 && (
            <div className={`theme-wizard-step ${animationDirection}`}>
              <h3>
                <span className="step-emoji">🎨</span>
                เลือกโทนสีและการตกแต่ง
              </h3>
              
              <div className="step-section">
                <h4>โทนสี (เลือกได้หลายสี)</h4>
                <div className="theme-colors-grid">
                  {colorPalettes.map((palette, index) => (
                    <div
                      key={palette.id}
                      className={`theme-color-card ${wizardData.colors.includes(palette.id) ? 'selected' : ''}`}
                      onClick={() => {
                        const newColors = wizardData.colors.includes(palette.id)
                          ? wizardData.colors.filter(c => c !== palette.id)
                          : [...wizardData.colors, palette.id];
                        setWizardData({...wizardData, colors: newColors});
                      }}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div style={{position:'absolute', top:8, right:8, zIndex:5}}>
                        <button onClick={(e)=>{ e.stopPropagation(); openInfo(palette.name, palette.details || `สี: ${palette.colors.join(', ')}`); }} style={{background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}>ℹ️</button>
                      </div>
                      <div className="theme-color-preview">
                        {palette.colors.map((color, colorIndex) => (
                          <div 
                            key={color} 
                            className="theme-color-dot" 
                            style={{
                              backgroundColor: color,
                              animationDelay: `${colorIndex * 0.2}s`
                            }}
                          />
                        ))}
                      </div>
                      <div className="theme-color-name">{palette.name}</div>
                      <div className="theme-color-desc">{palette.desc}</div>
                      <div className="card-glow"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="step-section">
                <h4>องค์ประกอบการตกแต่ง (เลือกได้หลายอย่าง)</h4>
                <div className="theme-elements-grid">
                  {decorElements.map((element, index) => (
                    <div
                      key={element.id}
                      className={`theme-element-card ${wizardData.decorElements.includes(element.id) ? 'selected' : ''}`}
                      onClick={() => {
                        const newElements = wizardData.decorElements.includes(element.id)
                          ? wizardData.decorElements.filter(e => e !== element.id)
                          : [...wizardData.decorElements, element.id];
                        setWizardData({...wizardData, decorElements: newElements});
                      }}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div style={{position:'absolute', top:8, right:8, zIndex:5}}>
                        <button onClick={(e)=>{ e.stopPropagation(); openInfo(element.name, element.details || element.desc); }} style={{background:'rgba(255,255,255,0.95)', border:'none', borderRadius:16, padding:6, cursor:'pointer'}}>ℹ️</button>
                      </div>
                      <div className="theme-element-icon">{element.icon}</div>
                      <div className="theme-element-name">{element.name}</div>
                      <div className="theme-element-desc">{element.desc}</div>
                      <div className="card-glow"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: รายละเอียดเพิ่มเติม */}
          {step === 4 && (
            <div className={`theme-wizard-step ${animationDirection}`}>
              <h3>
                <span className="step-emoji">📝</span>
                รายละเอียดเพิ่มเติม
              </h3>
              
              <div className="theme-form-row">
                <div className="theme-form-group">
                  <label>ชื่องาน</label>
                  <input
                    type="text"
                    placeholder="เช่น งานแต่งงาน คุณสมชาย & คุณสมหญิง"
                    value={wizardData.eventName}
                    onChange={(e) => setWizardData({...wizardData, eventName: e.target.value})}
                  />
                 <InputHint compact />
                </div>

                <div className="theme-form-group">
                  <label>วันที่จัดงาน</label>
                  <input
                    type="date"
                    value={wizardData.eventDate}
                    onChange={(e) => setWizardData({...wizardData, eventDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="theme-form-group">
                <label>จำนวนแขก (โดยประมาณ)</label>
                <select
                  value={wizardData.guestCount}
                  onChange={(e) => setWizardData({...wizardData, guestCount: e.target.value})}
                >
                  <option value="">เลือกจำนวนแขก</option>
                  <option value="10-30">10-30 คน (เล็ก)</option>
                  <option value="30-80">30-80 คน (กลาง)</option>
                  <option value="80-150">80-150 คน (ใหญ่)</option>
                  <option value="150+">150+ คน (ใหญ่มาก)</option>
                </select>
              </div>

              <div className="theme-form-group">
                <label>คำอธิบายเพิ่มเติม (ไม่บังคับ)</label>
                <textarea
                  rows={4}
                  placeholder="เช่น ต้องการมุมถ่ายรูป ต้องการบรรยากาศโรแมนติก ต้องการใช้วัสดุธรรมชาติ..."
                  value={wizardData.customPrompt}
                  onChange={(e) => setWizardData({...wizardData, customPrompt: e.target.value})}
                />
               <InputHint />
              </div>

              {/* Preview */}
              <div className="theme-wizard-preview">
                <h4>
                  <span className="preview-emoji">👀</span>
                  ตัวอย่างธีมที่จะสร้าง:
                </h4>
                <div className="theme-preview-card">
                  <div className="preview-row">
                    <strong>ประเภท:</strong> 
                    <span>{eventTypes.find(t => t.id === wizardData.eventType)?.name || '-'}</span>
                  </div>
                  <div className="preview-row">
                    <strong>สถานที่:</strong> 
                    <span>{venues.find(v => v.id === wizardData.venue)?.name || '-'}</span>
                  </div>
                  {wizardData.atmosphere && (
                    <div className="preview-row">
                      <strong>บรรยากาศ:</strong> 
                      <span>{atmospheres.find(a => a.id === wizardData.atmosphere)?.name || '-'}</span>
                    </div>
                  )}
                  {wizardData.style && (
                    <div className="preview-row">
                      <strong>สไตล์:</strong> 
                      <span>{styles.find(s => s.id === wizardData.style)?.name || '-'}</span>
                    </div>
                  )}
                  {wizardData.eventName && (
                    <div className="preview-row">
                      <strong>ชื่องาน:</strong> 
                      <span>{wizardData.eventName}</span>
                    </div>
                  )}
                  {wizardData.guestCount && (
                    <div className="preview-row">
                      <strong>จำนวนแขก:</strong> 
                      <span>{wizardData.guestCount}</span>
                    </div>
                  )}
                  {wizardData.colors.length > 0 && (
                    <div className="preview-row">
                      <strong>โทนสี:</strong> 
                      <span>
                        {colorPalettes.filter(p => wizardData.colors.includes(p.id)).map(p => p.name).join(', ')}
                      </span>
                    </div>
                  )}
                  {wizardData.decorElements.length > 0 && (
                    <div className="preview-row">
                      <strong>การตกแต่ง:</strong> 
                      <span>
                        {decorElements.filter(e => wizardData.decorElements.includes(e.id)).map(e => e.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="theme-wizard-footer">
          <button 
            className="theme-wizard-btn secondary" 
            onClick={handlePrev}
            disabled={step === 1 || isGenerating}
          >
            <span className="btn-icon">←</span>
            ย้อนกลับ
          </button>
          
          {step < 4 ? (
            <button 
              className="theme-wizard-btn primary" 
              onClick={handleNext}
              disabled={step === 1 && (!wizardData.eventType || !wizardData.venue)}
            >
              ถัดไป
              <span className="btn-icon">→</span>
            </button>
          ) : (
            <button 
              className={`theme-wizard-btn generate ${isGenerating ? 'generating' : ''}`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="generate-spinner">🔄</span>
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <span className="btn-icon">🎨</span>
                  สร้างธีมอีเว้นต์
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

export default ThemeWizard;