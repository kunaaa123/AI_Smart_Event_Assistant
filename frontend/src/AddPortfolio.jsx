import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AddPortfolio.css";
import GlassAlert from "./GlassAlert";

const AddPortfolio = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  // state สำหรับรูป
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // refs
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ฟังก์ชัน drag & drop สำหรับรูปปก
  const handleCoverDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleCoverDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleCoverDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const file = files[0];
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // ฟังก์ชัน drag & drop สำหรับ gallery
  const handleGalleryDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleGalleryDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleGalleryDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      const newFiles = [...galleryImages, ...files];
      const newPreviews = [...galleryPreviews, ...files.map(file => URL.createObjectURL(file))];
      setGalleryImages(newFiles);
      setGalleryPreviews(newPreviews);
    }
  };

  // ลบรูปจาก gallery
  const removeGalleryImage = (index) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryImages(newImages);
    setGalleryPreviews(newPreviews);
  };

  // จัดการการเลือกไฟล์หลายไฟล์
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...galleryImages, ...files];
    const newPreviews = [...galleryPreviews, ...files.map(file => URL.createObjectURL(file))];
    setGalleryImages(newFiles);
    setGalleryPreviews(newPreviews);
  };

  // auto-hide alert
  useEffect(() => {
    if (!alert.show) return;
    const t = setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
    return () => clearTimeout(t);
  }, [alert.show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("category", form.category);
    data.append("price", form.price);
    data.append("organizer_id", user.organizer_id);

    let portfolioId = null;
    try {
      const res = await fetch("http://localhost:8080/organizer_portfolios", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        const portfolio = await res.json();
        portfolioId = portfolio.portfolio_id;
      } else {
        setAlert({ show: true, message: "เกิดข้อผิดพลาดในการสร้างผลงาน", type: "danger" });
        return;
      }
    } catch {
      setAlert({ show: true, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", type: "danger" });
      return;
    }

    // อัปโหลดภาพปก
    if (portfolioId && coverImage) {
      const coverData = new FormData();
      coverData.append("images", coverImage);
      coverData.append("is_cover", "true");
      try {
        await fetch(`http://localhost:8080/organizer_portfolios/${portfolioId}/images`, {
          method: "POST",
          body: coverData,
        });
      } catch {
        // ไม่บล็อกการดำเนินการหลัก
      }
    }

    // อัปโหลดภาพ gallery
    if (portfolioId && galleryImages.length > 0) {
      const galleryData = new FormData();
      galleryImages.forEach(img => galleryData.append("images", img));
      galleryData.append("is_cover", "false");
      try {
        await fetch(`http://localhost:8080/organizer_portfolios/${portfolioId}/images`, {
          method: "POST",
          body: galleryData,
        });
      } catch {
        // ignore
      }
    }

    setAlert({ show: true, message: "🎉 เพิ่มผลงานสำเร็จ!", type: "success" });
    setTimeout(() => navigate("/organizer-portfolios"), 900);
  };

  return (
    <div className="add-portfolio-container">
      {/* GlassAlert */}
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
      />

      <h2 className="add-portfolio-page-title">✨ เพิ่มผลงานใหม่ ✨</h2>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* ข้อมูลพื้นฐาน */}
        <div className="add-portfolio-field-group">
          <label>ชื่อผลงาน</label>
          <input 
            className="add-portfolio-input"
            name="title" 
            value={form.title} 
            onChange={handleChange} 
            placeholder="ระบุชื่อผลงานที่น่าประทับใจ..."
            required 
          />
        </div>

        <div className="add-portfolio-field-group">
          <label>ประเภทงาน</label>
          <select 
            className="add-portfolio-select"
            name="category" 
            value={form.category} 
            onChange={handleChange} 
            required
          >
            <option value="">-- เลือกประเภทผลงาน --</option>
            <option value="งานแต่งงาน">💒 งานแต่งงาน</option>
            <option value="งานเลี้ยง">🍽️ งานเลี้ยง</option>
            <option value="งานสัมมนา">🎓 งานสัมมนา</option>
            <option value="งานเปิดตัวสินค้า">🚀 งานเปิดตัวสินค้า</option>
            <option value="งานแสดงคอนเสิร์ต">🎵 งานแสดงคอนเสิร์ต</option>
            <option value="งานบริษัท">🏢 งานบริษัท</option>
            <option value="อื่นๆ">✨ อื่นๆ</option>
          </select>
        </div>

        <div className="add-portfolio-field-group">
          <label>รายละเอียดผลงาน</label>
          <textarea 
            className="add-portfolio-textarea"
            name="description" 
            value={form.description} 
            onChange={handleChange}
            placeholder="บอกเล่าเรื่องราวและรายละเอียดของผลงานนี้..."
            rows="4"
          />
        </div>

        <div className="add-portfolio-field-group">
          <label>
            ราคา (บาท) 
            <span className="add-portfolio-optional-text">(ไม่บังคับ)</span>
          </label>
          <input 
            className="add-portfolio-input"
            name="price" 
            value={form.price} 
            onChange={handleChange} 
            type="number" 
            min="0"
            placeholder="ระบุราคา หรือเว้นว่างหากต้องการให้ติดต่อสอบถาม"
          />
        </div>

        {/* ส่วนภาพปก */}
        <div className="add-portfolio-field-group">
          <label>ภาพปกผลงาน</label>
          <div 
            className={`add-portfolio-image_upload_box cover_upload ${coverPreview ? 'has_image' : ''}`}
            onClick={() => coverInputRef.current?.click()}
            onDragOver={handleCoverDragOver}
            onDragLeave={handleCoverDragLeave}
            onDrop={handleCoverDrop}
          >
            {coverPreview ? (
              <div className="add-portfolio-image-preview-container">
                <img src={coverPreview} alt="cover" className="add-portfolio-cover-preview" />
                <div className="add-portfolio-image-overlay">
                  <div className="add-portfolio-image-actions">
                    <button 
                      type="button"
                      className="add-portfolio-image-action-btn view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(coverPreview, '_blank');
                      }}
                      title="ดูรูปเต็มขนาด"
                    >
                      🔍
                    </button>
                    <button 
                      type="button"
                      className="add-portfolio-image-action-btn change-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        coverInputRef.current?.click();
                      }}
                      title="เปลี่ยนรูป"
                    >
                      🔄
                    </button>
                    <button 
                      type="button"
                      className="add-portfolio-image-action-btn remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverImage(null);
                        setCoverPreview("");
                        if (coverInputRef.current) {
                          coverInputRef.current.value = '';
                        }
                      }}
                      title="ลบรูป"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="add-portfolio-image-label">รูปปกผลงาน</div>
              </div>
            ) : (
              <div className="add-portfolio-image-placeholder">
                <div className="add-portfolio-upload-icon">📸</div>
                <div className="add-portfolio-upload-title">เลือกภาพปกสำหรับผลงาน</div>
                <div className="add-portfolio-upload-subtitle">คลิกเพื่อเลือกไฟล์ หรือลากรูปมาวาง</div>
                <div className="add-portfolio-upload-info">รองรับไฟล์: JPG, PNG, GIF (สูงสุด 10MB)</div>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  setCoverImage(file);
                  setCoverPreview(URL.createObjectURL(file));
                }
              }}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* ส่วนแกลเลอรี */}
        <div className="add-portfolio-field-group">
          <label>
            รูปภาพเพิ่มเติม (Gallery) 
            <span className="add-portfolio-optional-text">(เลือกได้หลายรูป)</span>
          </label>
          
          <div 
            className="add-portfolio-gallery-upload-area"
            onClick={() => galleryInputRef.current?.click()}
            onDragOver={handleGalleryDragOver}
            onDragLeave={handleGalleryDragLeave}
            onDrop={handleGalleryDrop}
          >
            <div className="add-portfolio-gallery-upload-content">
              <div className="add-portfolio-upload-icon">🖼️</div>
              <div className="add-portfolio-upload-title">เพิ่มรูปภาพผลงาน</div>
              <div className="add-portfolio-upload-subtitle">
                คลิกเพื่อเลือกหลายไฟล์พร้อมกัน หรือลากรูปมาวาง
              </div>
              <div className="add-portfolio-upload-button">
                📁 เลือกรูปภาพ
              </div>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* แสดง gallery previews */}
          {galleryPreviews.length > 0 && (
            <div className="add-portfolio-gallery-preview">
              <div className="add-portfolio-gallery-header">
                <span>รูปที่เลือกแล้ว ({galleryPreviews.length} รูป)</span>
                <button 
                  type="button"
                  className="add-portfolio-clear-all-btn"
                  onClick={() => {
                    setGalleryImages([]);
                    setGalleryPreviews([]);
                    if (galleryInputRef.current) {
                      galleryInputRef.current.value = '';
                    }
                  }}
                  title="ลบรูปทั้งหมด"
                >
                  🗑️ ลบทั้งหมด
                </button>
              </div>
              <div className="add-portfolio-gallery-grid">
                {galleryPreviews.map((src, idx) => (
                  <div key={idx} className="add-portfolio-gallery-item">
                    <img
                      src={src}
                      alt={`gallery-${idx}`}
                      className="add-portfolio-gallery-thumbnail"
                    />
                    <div className="add-portfolio-gallery-overlay">
                      <div className="add-portfolio-gallery-actions">
                        <button 
                          type="button"
                          className="add-portfolio-gallery-action-btn view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(src, '_blank');
                          }}
                          title="ดูรูปเต็มขนาด"
                        >
                          🔍
                        </button>
                        <button 
                          type="button"
                          className="add-portfolio-gallery-action-btn remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGalleryImage(idx);
                          }}
                          title="ลบรูปนี้"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                    <div className="add-portfolio-gallery-number">
                      {idx + 1}
                    </div>
                  </div>
                ))}
                
                {/* ปุ่มเพิ่มรูปเพิ่มเติม */}
                <div 
                  className="add-portfolio-gallery-add-more"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <div className="add-portfolio-add-more-content">
                    <div className="add-portfolio-add-more-icon">➕</div>
                    <div className="add-portfolio-add-more-text">เพิ่มรูป</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* ปุ่มส่ง */}
        <button 
          className="add-portfolio-submit-btn" 
          type="submit"
        >
          🎉 เพิ่มผลงาน
        </button>
      </form>
    </div>
  );
};

export default AddPortfolio;