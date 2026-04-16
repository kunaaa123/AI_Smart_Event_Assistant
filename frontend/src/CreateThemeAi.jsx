import React, { useState, useRef, useEffect } from "react";
import AiLayout from "./AiLayout";
import GlassAlert from "./GlassAlert";
import ThemeWizard from "./components/ThemeWizard";
import "./CreateThemeAi.css";

function CreateThemeAi() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [matchedOrganizers, setMatchedOrganizers] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  
  // เพิ่ม state ที่ขาดหายไป
  const [generatedImages, setGeneratedImages] = useState([]);
  const [referenceImage, setReferenceImage] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  
  // เพิ่ม state สำหรับ album popup
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  
  // แก้ไขส่วนการจัดการ currentUser ให้เหมือนกับ CreateInviteCard
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem("user");
      if (!user || user === "undefined") return null;
      return JSON.parse(user);
    } catch {
      return null;
    }
  });

  const fileInputRef = useRef(null);

  // ฟังก์ชันแสดง alert เหมือน CreateInviteCard
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
  };

  // Auto hide alert after 3 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  // ตรวจสอบและอัปเดต currentUser
  useEffect(() => {
    const checkAndUpdateUser = () => {
      try {
        const user = localStorage.getItem("user");
        const parsedUser = user && user !== "undefined" ? JSON.parse(user) : null;
        
        // เปรียบเทียบ user_id แทนทั้ง object เพื่อลดการเปลี่ยนแปลงที่ไม่จำเป็น
        if (parsedUser?.user_id !== currentUser?.user_id) {
          console.log(`🔄 [Theme] User changed from ${currentUser?.user_id} to ${parsedUser?.user_id}`);
          setCurrentUser(parsedUser);
        }
      } catch (error) {
        console.error("Error checking user:", error);
        if (currentUser !== null) {
          setCurrentUser(null);
        }
      }
    };

    // เช็คทันทีที่โหลด
    checkAndUpdateUser();

    // เช็คทุกๆ 2 วินาที (ลดความถี่ลง)
    const interval = setInterval(checkAndUpdateUser, 2000);

    return () => clearInterval(interval);
  }, [currentUser?.user_id]);

  // 1. โหลดข้อมูลเริ่มต้น (รันครั้งเดียวตอน mount)
  useEffect(() => {
    const loadUserImages = async () => {
      if (!currentUser?.user_id) {
        setGeneratedImages([]);
        return;
      }

      try {
        console.log(`📂 [Theme] Loading images for user ${currentUser.user_id}`);
        const response = await fetch(`http://localhost:8080/ai-generated-images/user/${currentUser.user_id}/theme`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.images) {
            // แปลงข้อมูลจาก API เป็นรูปแบบที่ frontend ต้องการ
            const formattedImages = data.images.map(img => ({
              id: img.id.toString(),
              albumId: img.album_id || img.id.toString(),
              base64: img.base64_data,
              prompt: img.prompt,
              model: img.model_used || 'unknown',
              enhanced_prompt: img.enhanced_prompt || '',
              has_reference: img.has_reference,
              createdAt: new Date(img.created_at).toLocaleString('th-TH'),
              variation: img.variation_number,
              isAlbum: img.is_album,
              user_id: currentUser.user_id
            }));
            
            setGeneratedImages(formattedImages);
            console.log(`📂 [Theme] Loaded ${formattedImages.length} images from database for user ${currentUser.user_id}`);
          }
        } else {
          console.error('Failed to load theme images:', response.status);
          setGeneratedImages([]);
        }
      } catch (error) {
        console.error('Error loading theme images:', error);
        setGeneratedImages([]);
      }
    };

    loadUserImages();
  }, [currentUser?.user_id]);

  // ฟังก์ชันบันทึกรูปลงฐานข้อมูล (เปลี่ยน image_type เป็น 'theme')
  const saveImagesToDatabase = async (images) => {
    if (!currentUser?.user_id || !images.length) return false;

    try {
      const saveData = images.map(img => ({
        user_id: currentUser.user_id,
        image_type: 'theme', // เปลี่ยนเป็น theme
        album_id: img.albumId,
        base64_data: img.base64,
        prompt: img.prompt,
        enhanced_prompt: img.enhanced_prompt || '',
        model_used: img.model || '',
        variation_number: img.variation || 1,
        is_album: img.isAlbum || false,
        has_reference: img.has_reference || false
      }));

      console.log(`💾 [Theme] Saving ${saveData.length} images to database...`);
      const response = await fetch('http://localhost:8080/ai-generated-images/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`💾 [Theme] Saved ${result.count} images to database successfully`);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to save theme images to database:', errorData.error);
        return false;
      }
    } catch (error) {
      console.error('Error saving theme images to database:', error);
      return false;
    }
  };

  // Predefined suggestions
  const suggestedTags = [
    "งานแต่งงาน ธีมโมเดิร์น สีขาว-ทอง", 
    "งานวันเกิด ธีมการ์ตูน สีสันสดใส", 
    "งานออกบูธ ธีมเทคโนโลยี สีน้ำเงิน-เงิน"
  ];

  const handleTagClick = (tag) => {
    setPrompt(prev => prev ? `${prev}, ${tag}` : tag);
    showAlert(`เพิ่มแท็ก "${tag}" ลงในคำอธิบาย`, "info");
  };

  // ปรับ handleFileUpload ให้เหมือน CreateInviteCard
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ (จำกัดที่ 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert("ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)", "warning");
        return;
      }

      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        showAlert("กรุณาเลือกไฟล์รูปภาพเท่านั้น", "warning");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setUploadPreview(base64);
        
        // เก็บ base64 สำหรับส่งไป API
        const base64Data = base64.split(',')[1];
        setReferenceImage(base64Data);
        
        showAlert("อัปโหลดรูปอ้างอิงสำเร็จ 📸", "success");
      };
      reader.onerror = () => {
        showAlert("เกิดข้อผิดพลาดในการอ่านไฟล์", "danger");
      };
      reader.readAsDataURL(file);
    }
  };

  const findMatchingOrganizers = async (prompt) => {
    if (!prompt.trim() || !currentUser?.user_id) return;
    
    console.log("🔍 Theme: Starting organizer matching for prompt:", prompt);
    setLoadingMatches(true);
    
    try {
      const res = await fetch("http://localhost:8081/ai-match-organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          user_id: currentUser.user_id // ส่ง user_id ไปด้วย
        }),
      });
      
      console.log("🌐 Theme: Response status:", res.status);
      
      const data = await res.json();
      console.log("📦 Theme: Response data:", data);
      
      if (res.ok && data.success) {
        console.log("✅ Theme: Matches found:", data.matches?.length || 0);
        setMatchedOrganizers(data.matches || []);
        
        if (data.matches && data.matches.length > 0) {
          showAlert(`พบผู้จัดอีเว้นต์ที่เหมาะสม ${data.matches.length} ราย! 🎯`, "success");
        } else {
          showAlert("ไม่พบผู้จัดอีเว้นต์ที่เหมาะสม กรุณาลองใช้คำอธิบายที่ละเอียดมากขึ้น", "info");
        }
      } else {
        console.error("❌ Theme: API Error:", data.error || "Unknown error");
        setMatchedOrganizers([]);
        showAlert("เกิดข้อผิดพลาดในการค้นหาผู้จัดอีเว้นต์", "warning");
      }
    } catch (error) {
      console.error("🚫 Theme: Network error:", error);
      setMatchedOrganizers([]);
      showAlert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ AI ได้", "danger");
    }
    setLoadingMatches(false);
  };

  // แก้ไข handleGenerate เพื่อบันทึกลงฐานข้อมูลและโหลดใหม่
  const handleGenerateWithPrompt = async (customPrompt = null) => {
    const promptToUse = customPrompt || prompt;
    
    if (!currentUser?.user_id) {
      showAlert("กรุณาเข้าสู่ระบบก่อนใช้งาน", "warning");
      return;
    }
    
    if (!promptToUse.trim()) {
      showAlert("กรุณาใส่คำอธิบายก่อนสร้างภาพ", "warning");
      return;
    }
    if (promptToUse.length > 500) {
      showAlert("คำอธิบายยาวเกินไป (สูงสุด 500 ตัวอักษร)", "warning");
      return;
    }
    
    setLoading(true);
    setError("");
    showAlert("กำลังสร้างภาพธีม 3 แบบด้วย AI... ⏳", "info");
    
    try {
      const albumId = Date.now().toString();
      const albumImages = [];
      
      for (let i = 0; i < 3; i++) {
        const requestData = {
          prompt: `${promptToUse.trim()}, variation ${i + 1}, different theme composition and layout`,
          user_id: currentUser.user_id,
          user_name: currentUser.first_name || currentUser.username || "User"
        };
        
        if (referenceImage) {
          requestData.reference_image = referenceImage;
        }
        
        const endpoint = referenceImage 
          ? "http://localhost:8081/ai-generate-image-with-reference"
          : "http://localhost:8081/ai-generate-image";
        
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(requestData),
        });
        
        const data = await res.json();
        if (res.ok && data.success && data.image_base64) {
          const newImage = {
            id: `temp_${albumId}_${i}`,
            albumId: albumId,
            base64: data.image_base64,
            prompt: promptToUse.trim(),
            model: data.model_used,
            enhanced_prompt: data.enhanced_prompt,
            has_reference: !!referenceImage,
            createdAt: new Date().toLocaleString('th-TH'),
            variation: i + 1,
            isAlbum: true,
            user_id: currentUser.user_id
          };
          albumImages.push(newImage);
          
          showAlert(`กำลังสร้างภาพธีม... (${i + 1}/3) 🎨`, "info");
        } else {
          console.error(`Failed to generate theme image ${i + 1}:`, data.error);
        }
      }
      
      if (albumImages.length > 0) {
        // บันทึกลงฐานข้อมูลก่อน
        const saved = await saveImagesToDatabase(albumImages);
        
        if (saved) {
          showAlert(`สร้างและบันทึกภาพธีมสำเร็จ ${albumImages.length} แบบ! 🎨✨`, "success");
          
          // โหลดข้อมูลใหม่จากฐานข้อมูล
          const response = await fetch(`http://localhost:8080/ai-generated-images/user/${currentUser.user_id}/theme`);
          if (response.ok) {
            const refreshData = await response.json();
            if (refreshData.success && refreshData.images) {
              const refreshedImages = refreshData.images.map(img => ({
                id: img.id.toString(),
                albumId: img.album_id || img.id.toString(),
                base64: img.base64_data,
                prompt: img.prompt,
                model: img.model_used || 'unknown',
                enhanced_prompt: img.enhanced_prompt || '',
                has_reference: img.has_reference,
                createdAt: new Date(img.created_at).toLocaleString('th-TH'),
                variation: img.variation_number,
                isAlbum: img.is_album,
                user_id: currentUser.user_id
              }));
              setGeneratedImages(refreshedImages);
            }
          }
          
          // หา matching organizers
          await findMatchingOrganizers(promptToUse);
        } else {
          setGeneratedImages(prev => [...albumImages, ...prev]);
          showAlert(`สร้างภาพธีมสำเร็จ ${albumImages.length} แบบ! แต่การบันทึกมีปัญหา`, "warning");
        }
      } else {
        throw new Error("ไม่สามารถสร้างภาพใดๆ ได้");
      }
    } catch (error) {
      console.error("Theme generation error:", error);
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      showAlert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ AI ได้", "danger");
    }
    setLoading(false);
  };

  // เก็บแค่ handleGenerate function เดียว
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    await handleGenerateWithPrompt();
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowModal(true);
    showAlert("เปิดภาพขนาดใหญ่ 🖼️", "info");
  };

  // แก้ไข handleDeleteImage เพื่อลบจากฐานข้อมูล
  const handleDeleteImage = async (imageId) => {
    if (window.confirm("คุณต้องการลบภาพนี้ใช่หรือไม่?")) {
      try {
        const response = await fetch(`http://localhost:8080/ai-generated-images/${imageId}?user_id=${currentUser.user_id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // ลบจาก state ทันที
          setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
          showAlert("ลบภาพเรียบร้อยแล้ว 🗑️", "success");
        } else {
          const errorData = await response.json();
          console.error('Delete error:', errorData.error);
          showAlert("เกิดข้อผิดพลาดในการลบ", "danger");
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        showAlert("เกิดข้อผิดพลาดในการลบ", "danger");
      }
    }
  };

  // แก้ไข handleClearAll เพื่อลบจากฐานข้อมูล
  const handleClearAll = async () => {
    if (window.confirm("คุณต้องการลบรูปทั้งหมดใช่หรือไม่?")) {
      try {
        // ลบทีละอัลบั้ม
        const albums = {};
        generatedImages.forEach(img => {
          if (img.albumId && !albums[img.albumId]) {
            albums[img.albumId] = true;
          }
        });

        const deletePromises = Object.keys(albums).map(albumId =>
          fetch(`http://localhost:8080/ai-generated-images/album/${albumId}?user_id=${currentUser.user_id}`, {
            method: 'DELETE',
          })
        );

        await Promise.all(deletePromises);
        
        // ล้าง state ทันที
        setGeneratedImages([]);
        setMatchedOrganizers([]);
        showAlert("ลบภาพทั้งหมดเรียบร้อยแล้ว 🧹", "success");
      } catch (error) {
        console.error('Error clearing all images:', error);
        showAlert("เกิดข้อผิดพลาดในการลบ", "danger");
      }
    }
  };

  // ฟังก์ชันสำหรับ download
  const handleDownload = (image) => {
    try {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${image.base64}`;
      link.download = `theme-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert("ดาวน์โหลดสำเร็จ! 📥", "success");
    } catch {
      showAlert("เกิดข้อผิดพลาดในการดาวน์โหลด", "danger");
    }
  };

  // ฟังก์ชันเปิด album popup
  const handleAlbumClick = (albumImages) => {
    setSelectedAlbum(albumImages);
    setShowAlbumModal(true);
    showAlert("เปิดอัลบั้มภาพ 📸", "info");
  };

  // เพิ่ม: ฟังก์ชันลบทั้งอัลบั้ม (ใช้ซ้ำได้กับปุ่ม overlay และปุ่มเดิมด้านล่าง)
  const handleDeleteAlbum = async (albumId) => {
    if (!currentUser?.user_id) return showAlert("กรุณาเข้าสู่ระบบก่อน", "warning");
    const ok = window.confirm("คุณต้องการลบอัลบั้มทั้งหมดใช่หรือไม่?");
    if (!ok) return;

    try {
      const res = await fetch(
        `http://localhost:8080/ai-generated-images/album/${albumId}?user_id=${currentUser.user_id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await res.text());

      // ลบรูปทั้งหมดของอัลบั้มนี้ออกจาก state
      setGeneratedImages((prev) => prev.filter((img) => img.albumId !== albumId));
      showAlert("ลบอัลบั้มเรียบร้อยแล้ว 🗑️", "success");
    } catch (err) {
      console.error("Delete album error:", err);
      showAlert("ลบอัลบั้มไม่สำเร็จ", "danger");
    }
  };

  // แสดงหน้า loading ถ้ายังไม่มีข้อมูล user
  if (!currentUser) {
    return (
      <AiLayout>
        <div className="ai-theme-container ai-theme-container--narrow">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            flexDirection: 'column',
            gap: '16px',
            gridColumn: 'span 2'
          }}>
            <div style={{ fontSize: '2rem' }}>🔄</div>
            <div>กำลังโหลดข้อมูลผู้ใช้...</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              หากยังไม่ได้เข้าสู่ระบบ กรุณา <a href="/login">เข้าสู่ระบบ</a>
            </div>
          </div>
        </div>
      </AiLayout>
    );
  }

  return (
    <AiLayout>
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />

      <ThemeWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onGenerate={async (wizardPrompt, autoGenerate = false) => {
          setPrompt(wizardPrompt);
          showAlert("ใช้ข้อมูลจากตัวช่วยสร้างธีม! 🎨", "success");
          
          // ถ้า autoGenerate = true ให้เจนทันที
          if (autoGenerate) {
            // ใช้ prompt ที่ส่งมาตรงๆ แทนรอ state update
            await handleGenerateWithPrompt(wizardPrompt);
          }
        }}
      />
      
      <div className="ai-theme-container ai-theme-container--narrow">
        {/* Input Card (ซ้าย) */}
        <div className="ai-theme-input-card ai-theme-input-card--narrow">
          {/* Upload Box */}
          <div 
            className={`ai-theme-upload-box ${uploadPreview ? 'ai-theme-upload-success' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('drag-over');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
              const files = e.dataTransfer.files;
              if (files && files[0]) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                  handleFileUpload({ target: { files: [file] } });
                }
              }
            }}
          >
            {uploadPreview ? (
              <div className="ai-theme-upload-container">
                <img
                  src={uploadPreview}
                  alt="Upload Preview"
                  className="ai-theme-upload-preview"
                />
                <button
                  className="ai-theme-upload-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadPreview(null);
                    setReferenceImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    showAlert("ลบรูปอ้างอิงแล้ว", "info");
                  }}
                  title="ลบรูป"
                >
                  ✕
                </button>
                <div className="ai-theme-upload-overlay">
                  <div className="ai-theme-upload-info">
                    รูปอ้างอิง
                  </div>
                  <div className="ai-theme-upload-actions">
                    <button 
                      className="ai-theme-upload-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(uploadPreview, '_blank');
                      }}
                      title="ดูรูปเต็มขนาด"
                    >
                      🔍
                    </button>
                    <button 
                      className="ai-theme-upload-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      title="เปลี่ยนรูป"
                    >
                      🔄
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ai-theme-upload-placeholder">
                <div style={{ fontSize: '2.5rem', marginBottom: '8px', opacity: 0.7 }}>🖼️</div>
                <div className="ai-theme-upload-label">อัปโหลดรูปอ้างอิง</div>
                <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px' }}>
                  คลิกหรือลากรูปมาวาง
                </div>
                <div style={{ fontSize: '0.65rem', color: '#999', marginTop: '2px' }}>
                  (JPG, PNG, WebP - ไม่จำเป็น)
                </div>
              </div>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            style={{ display: "none" }}
          />

          {/* Wizard Button */}
          <button
            className="ai-theme-wizard-btn"
            onClick={() => setShowWizard(true)}
          >
            🎨 ใช้ตัวช่วยสร้างธีม
          </button>

          {/* แสดงชื่อผู้ใช้ */}
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#666', 
            marginBottom: '8px',
            textAlign: 'center',
            padding: '4px 8px',
            background: currentUser.user_id ? '#e8f5e8' : '#fff3cd',
            borderRadius: '8px'
          }}>
            👤 {currentUser.first_name || currentUser.username || "User"} 
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
              (ID: {currentUser.user_id || 'guest'})
            </span>
          </div>

          <label className="ai-theme-prompt-label" htmlFor="prompt-input">prompt</label>
          <textarea
            id="prompt-input"
            className="ai-theme-textarea"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={uploadPreview 
              ? "อยากได้งานวันเกิดธีมตามรูปที่ให้" 
              : "งานแต่ง ร้านอาหารสุดหรู, งานวันเกิดธีมการ์ตูน"
            }
            maxLength={500}
          />
          <div className="ai-theme-tags">
            {suggestedTags.map(tag => (
              <div
                key={tag}
                className="ai-theme-tag"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </div>
            ))}
          </div>
          <button
            className="ai-theme-generate-btn"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || !currentUser?.user_id}
          >
            {loading ? "กำลังสร้าง..." : "Generate 3 แบบ"}
          </button>
          {error && (
            <div className="ai-theme-error">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Gallery Card (ขวา) - อัลบั้มเหมือน CreateInviteCard */}
        <div className="ai-theme-preview-card ai-theme-preview-card--narrow">
          <div className="ai-theme-gallery-header">
            <h3 className="ai-theme-title">
              ผลลัพธ์ ({generatedImages.length})
              {currentUser?.user_id && (
                <span style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '8px' }}>
                  - User: {currentUser.user_id}
                </span>
              )}
            </h3>
            {generatedImages.length > 0 && (
              <button 
                className="ai-theme-clear-btn"
                onClick={handleClearAll}
                title="ลบรูปทั้งหมด"
              >
                🗑️ ล้างทั้งหมด
              </button>
            )}
          </div>
          
          <div className="ai-theme-preview-content">
            {loading ? (
              <div className="ai-theme-loading">
                <div className="ai-theme-loading-spinner">🔄</div>
                <div className="ai-theme-loading-text">กำลังสร้างภาพธีม...</div>
              </div>
            ) : generatedImages.length > 0 ? (
              <>
                {/* Gallery Container */}
                <div className="ai-theme-gallery-container">
                  <div className="ai-theme-gallery">
                    {(() => {
                      const { albums, singleImages } = groupImagesByAlbum(generatedImages);
                      const albumKeys = Object.keys(albums).sort((a, b) => b - a);
                      
                      return (
                        <>
                          {/* อัลบั้ม: ครอบรูปด้วย wrapper + overlay ปุ่มลอย */}
                          {albumKeys.map((albumId) => {
                            const albumImages = albums[albumId].sort((a, b) => a.variation - b.variation);
                            const coverImage = albumImages[0];

                            return (
                              <div key={`album-${albumId}`} className="ai-theme-gallery-item ai-theme-album-cover">
                                <div className="ai-theme-album-badge">📸 {albumImages.length} รูป</div>

                                {/* WRAP + OVERLAY */}
                                <div
                                  className="ai-theme-image-wrap"
                                  onClick={() => handleAlbumClick(albumImages)}
                                  title={`คลิกเพื่อดูอัลบั้ม ${albumImages.length} รูป`}
                                >
                                  <img
                                    src={`data:image/png;base64,${coverImage.base64}`}
                                    alt="Album Cover"
                                    className="ai-theme-gallery-thumbnail"
                                  />
                                  <div className="ai-theme-thumb-overlay">
                                    <button
                                      className="ai-theme-thumb-btn"
                                      title="ดูอัลบั้ม"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAlbumClick(albumImages);
                                      }}
                                    >
                                      👁️
                                    </button>
                                    <button
                                      className="ai-theme-thumb-btn danger"
                                      title="ลบอัลบั้ม"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAlbum(albumId);
                                      }}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>

                                <div className="ai-theme-gallery-info">
                                  <div className="ai-theme-gallery-prompt" title={coverImage.prompt}>
                                    🎨 อัลบั้ม: {coverImage.prompt.length > 25 ? `${coverImage.prompt.slice(0, 25)}...` : coverImage.prompt}
                                  </div>
                                  <div className="ai-theme-gallery-actions">
                                    <div className="ai-theme-gallery-time">{coverImage.createdAt}</div>
                                    <div className="ai-theme-action-buttons">
                                      {/* ปุ่มเดิมด้านล่างยังอยู่ (ไม่ลบโค้ดเดิม) */}
                                     
                                    
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* รูปเดี่ยว: ครอบรูปด้วย wrapper + overlay ปุ่มลอย */}
                          {singleImages.map((image) => (
                            <div key={image.id} className="ai-theme-gallery-item">
                              <div
                                className="ai-theme-image-wrap"
                                onClick={() => handleImageClick(image)}
                                title="คลิกเพื่อดูรูปใหญ่"
                              >
                                <img
                                  src={`data:image/png;base64,${image.base64}`}
                                  alt="Generated Theme"
                                  className="ai-theme-gallery-thumbnail"
                                />
                                <div className="ai-theme-thumb-overlay">
                                  <button
                                    className="ai-theme-thumb-btn"
                                    title="ดาวน์โหลด"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(image);
                                    }}
                                  >
                                    📥
                                  </button>
                                  <button
                                    className="ai-theme-thumb-btn danger"
                                    title="ลบรูป"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteImage(image.id);
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>

                              <div className="ai-theme-gallery-info">
                                <div className="ai-theme-gallery-prompt" title={image.prompt}>
                                  {image.prompt.length > 30 ? `${image.prompt.slice(0, 30)}...` : image.prompt}
                                </div>
                                <div className="ai-theme-gallery-actions">
                                  <div className="ai-theme-gallery-time">{image.createdAt}</div>
                                  <div className="ai-theme-action-buttons">
                                    {/* ปุ่มเดิมด้านล่างยังอยู่ (ไม่ลบโค้ดเดิม) */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(image);
                                      }}
                                      className="ai-theme-download-btn"
                                      title="ดาวน์โหลด"
                                    >
                                      📥
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* ปุ่มลบมุมขวาบนเดิมยังอยู่ */}
                              <button
                                className="ai-theme-gallery-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(image.id);
                                }}
                                title="ลบรูป"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Matching Organizers */}
                {(matchedOrganizers.length > 0 || loadingMatches) && (
                  <div className="ai-theme-matching-container">
                    <div className="ai-theme-matching-section">
                      <h4 className="ai-theme-matching-title">
                        🎯 ผู้จัดอีเว้นต์ที่แนะนำ
                      </h4>
                      
                      {loadingMatches ? (
                        <div className="ai-theme-matching-loading">
                          <div className="ai-theme-loading-spinner">🔄</div>
                          <span>กำลังหาผู้จัดอีเว้นต์ที่เหมาะสม...</span>
                        </div>
                      ) : matchedOrganizers.length === 0 ? (
                        <div className="ai-theme-no-matches">
                          <p>❌ ไม่พบผู้จัดอีเว้นต์ที่เหมาะสม</p>
                          <p style={{fontSize: '0.75rem', color: '#666'}}>
                            ลองใช้คำอธิบายที่ละเอียดมากขึ้น
                          </p>
                        </div>
                      ) : (
                        <div className="ai-theme-matching-horizontal">
                          {matchedOrganizers.map((organizer) => (
                            <div 
                              key={organizer.organizer_id} 
                              className="ai-theme-organizer-card-horizontal"
                              onClick={() => {
                                showAlert(`เปิดโปรไฟล์ ${organizer.first_name || organizer.name}`, "info");
                                window.open(`/organizers/${organizer.organizer_id}`, '_blank');
                              }}
                            >
                              <div className="ai-theme-organizer-image-horizontal">
                                <img
                                  src={
                                    organizer.profile_image
                                      ? organizer.profile_image.startsWith("http")
                                        ? organizer.profile_image
                                        : `http://localhost:8080${organizer.profile_image.replace(/^\./, "")}`
                                      : organizer.portfolio_img
                                      ? organizer.portfolio_img.startsWith("http")
                                        ? organizer.portfolio_img
                                        : `http://localhost:8080${organizer.portfolio_img.replace(/^\./, "")}`
                                      : "https://placehold.co/80x80?text=👤"
                                  }
                                  alt={organizer.name || `${organizer.first_name} ${organizer.last_name}`}
                                  className="ai-theme-organizer-avatar-horizontal"
                                  onError={(e) => {
                                    // ลองใช้ portfolio_img หากไม่มี profile_image
                                    if (organizer.portfolio_img && !e.target.src.includes(organizer.portfolio_img)) {
                                      e.target.src = organizer.portfolio_img.startsWith("http")
                                        ? organizer.portfolio_img
                                        : `http://localhost:8080${organizer.portfolio_img.replace(/^\./, "")}`;
                                    } else {
                                      e.target.src = "https://placehold.co/80x80?text=👤";
                                    }
                                  }}
                                />
                                <div className="ai-theme-match-badge-horizontal">
                                  {organizer.match_percentage || Math.round(organizer.similarity_score * 100)}%
                                </div>
                              </div>
                              <div className="ai-theme-organizer-name-horizontal">
                                {organizer.name || `${organizer.first_name} ${organizer.last_name}`}
                              </div>
                              <div className="ai-theme-organizer-expertise-horizontal">
                                {organizer.expertise}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="ai-theme-suggestions">
                <div className="ai-theme-suggestions-title">
                  ยังไม่มีภาพ
                </div>
                <div className="ai-theme-suggestions-subtitle">
                  กรุณาใส่คำอธิบายและกด Generate<br/>
                  เพื่อสร้างภาพธีมที่สวยงาม ✨
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Album Modal - Popup สวยๆ สำหรับดูอัลบั้ม */}
        {showAlbumModal && selectedAlbum && (
          <div className="ai-theme-album-modal" onClick={() => setShowAlbumModal(false)}>
            <div className="ai-theme-album-modal-content" onClick={e => e.stopPropagation()}>
              <div className="ai-theme-album-modal-header">
                <h3>🎨 อัลบั้มภาพธีม ({selectedAlbum.length} แบบ)</h3>
                <button 
                  className="ai-theme-album-modal-close" 
                  onClick={() => setShowAlbumModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="ai-theme-album-modal-grid">
                {selectedAlbum.map((image) => (
                  <div key={image.id} className="ai-theme-album-modal-image-item">
                    <div className="ai-theme-album-modal-image-container">
                      <img
                        src={`data:image/png;base64,${image.base64}`}
                        alt={`Variation ${image.variation}`}
                        className="ai-theme-album-modal-image"
                        onClick={() => {
                          setSelectedImage(image);
                          setShowModal(true);
                          setShowAlbumModal(false);
                        }}
                      />
                      <div className="ai-theme-album-modal-overlay">
                        <div className="ai-theme-album-modal-variation">
                          แบบที่ {image.variation}
                        </div>
                        <div className="ai-theme-album-modal-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(image);
                            }}
                            className="ai-theme-album-modal-action-btn"
                            title="ดาวน์โหลด"
                          >
                            📥
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(image);
                              setShowModal(true);
                              setShowAlbumModal(false);
                            }}
                            className="ai-theme-album-modal-action-btn"
                            title="ดูรูปใหญ่"
                          >
                            🔍
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ai-theme-album-modal-image-info">
                      <div className="ai-theme-album-modal-prompt">
                        {image.prompt.length > 40 
                          ? `${image.prompt.slice(0, 40)}...` 
                          : image.prompt
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="ai-theme-album-modal-footer">
                <div className="ai-theme-album-modal-info">
                  <strong>Created:</strong> {selectedAlbum[0]?.createdAt} | 
                  <strong> Model:</strong> {selectedAlbum[0]?.model}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal รูปใหญ่ เดิม */}
        {showModal && selectedImage && (
          <div className="ai-theme-modal" onClick={() => setShowModal(false)}>
            <div className="ai-theme-modal-content" onClick={e => e.stopPropagation()}>
              <button 
                className="ai-theme-modal-close"
                onClick={() => setShowModal(false)}
                title="ปิด"
              >
                ✕
              </button>
              <img
                src={`data:image/png;base64,${selectedImage.base64}`}
                alt="Generated Theme"
                className="ai-theme-modal-img"
              />
            </div>
          </div>
        )}
      </div>
    </AiLayout>
  );
}

// ฟังก์ชันจัดกลุ่มภาพเป็นอัลบั้ม
const groupImagesByAlbum = (images) => {
  const albums = {};
  const singleImages = [];
  
  images.forEach(image => {
    if (image.isAlbum && image.albumId) {
      if (!albums[image.albumId]) {
        albums[image.albumId] = [];
      }
      albums[image.albumId].push(image);
    } else {
      singleImages.push(image);
    }
  });
  
  return { albums, singleImages };
};

export default CreateThemeAi;
