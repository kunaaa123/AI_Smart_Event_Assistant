import React, { useEffect, useState, useRef } from "react";
import "./AddPortfolio.css";
import GlassAlert from "./GlassAlert"; // เพิ่มการนำเข้า GlassAlert

/**
 * EditPortfolio
 * props:
 *  - portfolio: object (ต้องมี portfolio_id)
 *  - onSuccess: fn
 *  - onCancel: fn
 *
 * ใช้ style เดียวกับ AddPortfolio.css
 */
const EditPortfolio = ({ portfolio, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  // images
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // existing images (fetched)
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // ref + state to replace an existing image
  const replaceInputRef = useRef(null);
  const [replaceTarget, setReplaceTarget] = useState(null);

  useEffect(() => {
    if (!portfolio) return;
    setForm({
      title: portfolio.title || "",
      description: portfolio.description || "",
      category: portfolio.category || "",
      price: portfolio.price || "",
    });
    // fetch existing images
    (async () => {
      try {
        const res = await fetch(`http://localhost:8080/organizer_portfolios/${portfolio.portfolio_id}/images`);
        if (res.ok) {
          const imgs = await res.json();
          setExistingImages(Array.isArray(imgs) ? imgs : []);
          const cover = imgs.find(i => i.is_cover);
          if (cover) {
            const url = cover.image_url?.replace(/^\./, "");
            setCoverPreview(url ? `http://localhost:8080${url}` : "");
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [portfolio]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const removeExistingImage = (img) => {
    // mark for deletion locally
    setImagesToDelete(prev => [...prev, img.image_id || img.id || img.image_url]);
    setExistingImages(prev => prev.filter(i => i !== img));
  };

  // เมื่อต้องการ "เปลี่ยนรูปเดิม" เราจะ:
  // 1) ลบรูปเดิมจาก existingImages และ mark ให้ลบ (imagesToDelete)
  // 2) เพิ่มไฟล์ใหม่เข้าไปใน galleryImages เพื่อให้ถูกอัปโหลดเป็นรูปใหม่
  const handleReplaceClick = (img) => {
    setReplaceTarget(img);
    // เคลียร์ค่าเก่าเพื่อให้ onChange ถูกเรียกเมื่อเลือกไฟล์เดิมซ้ำ
    if (replaceInputRef.current) replaceInputRef.current.value = "";
    replaceInputRef.current?.click();
  };

  const handleReplaceChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !replaceTarget) {
      if (replaceInputRef.current) replaceInputRef.current.value = "";
      setReplaceTarget(null);
      return;
    }

    // mark old image to delete
    setImagesToDelete(prev => [...prev, replaceTarget.image_id || replaceTarget.id || replaceTarget.image_url]);
    // remove from existingImages
    setExistingImages(prev => prev.filter(i => i !== replaceTarget));
    // add new file to gallery upload queue
    setGalleryImages(prev => [...prev, file]);
    setGalleryPreviews(prev => [...prev, URL.createObjectURL(file)]);

    // cleanup
    setReplaceTarget(null);
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...galleryImages, ...files];
    const newPreviews = [...galleryPreviews, ...files.map(file => URL.createObjectURL(file))];
    setGalleryImages(newFiles);
    setGalleryPreviews(newPreviews);
    // clear value so choosing same files again will still trigger onChange
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const removeGalleryImage = (index) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryImages(newImages);
    setGalleryPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!portfolio?.portfolio_id) return;

    // 1) ส่ง JSON เพื่ออัปเดตข้อมูล portfolio (backend คาด JSON)
    const payload = {
      portfolio_id: portfolio.portfolio_id,
      title: form.title,
      description: form.description,
      category: form.category,
      price: form.price,
    };

    try {
      const res = await fetch(
        `http://localhost:8080/organizer_portfolios/${portfolio.portfolio_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        setAlert({ show: true, message: "เกิดข้อผิดพลาดในการอัปเดต", type: "danger" });
        return;
      }
    } catch {
      setAlert({ show: true, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", type: "danger" });
      return;
    }

    // 2) ลบรูปที่เลือกให้ลบ (backend มี DELETE /organizer_portfolio_images/:image_id)
    if (imagesToDelete && imagesToDelete.length > 0) {
      for (const imgRef of imagesToDelete) {
        const id = parseInt(String(imgRef).replace(/[^0-9]/g, ""), 10);
        if (isNaN(id)) continue;
        try {
          await fetch(`http://localhost:8080/organizer_portfolio_images/${id}`, {
            method: "DELETE",
          });
        } catch {
          // ignore individual delete errors
        }
      }
    }

    // 3) อัปโหลด cover ใหม่ (ถ้ามี)
    if (coverImage) {
      const coverData = new FormData();
      coverData.append("images", coverImage);
      coverData.append("is_cover", "true");
      try {
        await fetch(
          `http://localhost:8080/organizer_portfolios/${portfolio.portfolio_id}/images`,
          { method: "POST", body: coverData }
        );
      } catch {
        // ไม่บล็อกการดำเนินการหลัก
      }
    }

    // 4) อัปโหลด gallery ใหม่ (ถ้ามี)
    if (galleryImages.length > 0) {
      const galleryData = new FormData();
      galleryImages.forEach((img) => galleryData.append("images", img));
      galleryData.append("is_cover", "false");
      try {
        await fetch(
          `http://localhost:8080/organizer_portfolios/${portfolio.portfolio_id}/images`,
          { method: "POST", body: galleryData }
        );
      } catch {
        // ignore
      }
    }

    setAlert({ show: true, message: "✅ แก้ไขผลงานสำเร็จ", type: "success" });
    setTimeout(() => {
      onSuccess?.();
    }, 700);
  };

  // drag handlers (reuse from AddPortfolio)
  const handleCoverDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
  const handleCoverDragLeave = (e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); };
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
  const handleGalleryDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
  const handleGalleryDragLeave = (e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); };
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

  return (
    <div className="add-portfolio-container">
      <h2 className="add-portfolio-page-title">✏️ แก้ไขผลงาน</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="add-portfolio-field-group">
          <label>ชื่อผลงาน</label>
          <input className="add-portfolio-input" name="title" value={form.title} onChange={handleChange} required />
        </div>

        <div className="add-portfolio-field-group">
          <label>ประเภทงาน</label>
          <select className="add-portfolio-select" name="category" value={form.category} onChange={handleChange} required>
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
          <textarea className="add-portfolio-textarea" name="description" value={form.description} onChange={handleChange} rows="4" />
        </div>

        <div className="add-portfolio-field-group">
          <label>ราคา (บาท) <span className="add-portfolio-optional-text">(ไม่บังคับ)</span></label>
          <input className="add-portfolio-input" name="price" value={form.price} onChange={handleChange} type="number" min="0" />
        </div>

        <div className="add-portfolio-field-group">
          <label>ภาพปกผลงาน</label>
          <div className={`add-portfolio-image_upload_box cover_upload ${coverPreview ? 'has_image' : ''}`}
               onClick={(e) => { if (e.target === e.currentTarget) coverInputRef.current?.click(); }}
               onDragOver={handleCoverDragOver}
               onDragLeave={handleCoverDragLeave}
               onDrop={handleCoverDrop}>
            {coverPreview ? (
              <div className="add-portfolio-image-preview-container">
                <img src={coverPreview} alt="cover" className="add-portfolio-cover-preview" />
                <div className="add-portfolio-image-overlay">
                  <div className="add-portfolio-image-actions">
                    <button type="button" className="add-portfolio-image-action-btn view-btn" onClick={(e) => { e.stopPropagation(); window.open(coverPreview, '_blank'); }}>🔍</button>
                    <button type="button" className="add-portfolio-image-action-btn change-btn" onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}>🔄</button>
                    <button type="button" className="add-portfolio-image-action-btn remove-btn" onClick={(e) => { e.stopPropagation(); setCoverImage(null); setCoverPreview(""); if (coverInputRef.current) coverInputRef.current.value = ''; }}>🗑️</button>
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
            <input ref={coverInputRef} type="file" accept="image/*" onChange={e => { const file = e.target.files[0]; if (file) { setCoverImage(file); setCoverPreview(URL.createObjectURL(file)); } }} style={{ display: 'none' }} />
          </div>

          {/* existing images list */}
          {existingImages.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label>รูปภาพเดิม</label>
              <div className="add-portfolio-gallery-grid">
                {existingImages.map((img, idx) => {
                  const src = img.image_url ? `http://localhost:8080${img.image_url.replace(/^\./, "")}` : "";
                  return (
                    <div key={idx} className="add-portfolio-gallery-item">
                      <img src={src} alt={`existing-${idx}`} className="add-portfolio-gallery-thumbnail" />
                      <div className="add-portfolio-gallery-overlay">
                        <div className="add-portfolio-gallery-actions">
                          <button type="button" className="add-portfolio-gallery-action-btn view-btn" onClick={(e) => { e.stopPropagation(); window.open(src, '_blank'); }}>🔍</button>
                          <button type="button" className="add-portfolio-gallery-action-btn change-btn" onClick={(e) => { e.stopPropagation(); handleReplaceClick(img); }}>🔄</button>
                          <button type="button" className="add-portfolio-gallery-action-btn remove-btn" onClick={(e) => { e.stopPropagation(); removeExistingImage(img); }}>❌</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="add-portfolio-field-group">
          <label>รูปภาพเพิ่มเติม (Gallery) <span className="add-portfolio-optional-text">(เลือกได้หลายรูป)</span></label>
          <div className="add-portfolio-gallery-upload-area" onClick={(e) => { if (e.target === e.currentTarget) galleryInputRef.current?.click(); }} onDragOver={handleGalleryDragOver} onDragLeave={handleGalleryDragLeave} onDrop={handleGalleryDrop}>
            <div className="add-portfolio-gallery-upload-content">
              <div className="add-portfolio-upload-icon">🖼️</div>
              <div className="add-portfolio-upload-title">เพิ่มรูปภาพผลงาน</div>
              <div className="add-portfolio-upload-subtitle">คลิกเพื่อเลือกหลายไฟล์พร้อมกัน หรือลากรูปมาวาง</div>
              <div className="add-portfolio-upload-button">📁 เลือกรูปภาพ</div>
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} style={{ display: 'none' }} />
            {/* hidden input used when replacing an existing image */}
            <input ref={replaceInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleReplaceChange} onClick={(e) => e.stopPropagation()} />
          </div>

          {galleryPreviews.length > 0 && (
            <div className="add-portfolio-gallery-preview">
              <div className="add-portfolio-gallery-header">
                <span>รูปที่เลือกแล้ว ({galleryPreviews.length} รูป)</span>
                <button type="button" className="add-portfolio-clear-all-btn" onClick={() => { setGalleryImages([]); setGalleryPreviews([]); if (galleryInputRef.current) galleryInputRef.current.value = ''; }} title="ลบรูปทั้งหมด">🗑️ ลบทั้งหมด</button>
              </div>
              <div className="add-portfolio-gallery-grid">
                {galleryPreviews.map((src, idx) => (
                  <div key={idx} className="add-portfolio-gallery-item">
                    <img src={src} alt={`gallery-${idx}`} className="add-portfolio-gallery-thumbnail" />
                    <div className="add-portfolio-gallery-overlay">
                      <div className="add-portfolio-gallery-actions">
                        <button type="button" className="add-portfolio-gallery-action-btn view-btn" onClick={(e) => { e.stopPropagation(); window.open(src, '_blank'); }}>🔍</button>
                        <button type="button" className="add-portfolio-gallery-action-btn remove-btn" onClick={(e) => { e.stopPropagation(); removeGalleryImage(idx); }}>❌</button>
                      </div>
                    </div>
                    <div className="add-portfolio-gallery-number">{idx + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="add-portfolio-submit-btn" type="submit">💾 บันทึกการแก้ไข</button>
          <button type="button" onClick={() => onCancel?.()} className="add-portfolio-clear-all-btn" style={{ background: "#fff", color: "#222", border: "1px solid #ddd" }}>ยกเลิก</button>
        </div>

        {/* ใช้ GlassAlert */}
        <GlassAlert
          message={alert.message}
          type={alert.type}
          show={alert.show}
          onClose={() => setAlert(prev => ({ ...prev, show: false }))}
        />
      </form>
    </div>
  );
};

export default EditPortfolio;