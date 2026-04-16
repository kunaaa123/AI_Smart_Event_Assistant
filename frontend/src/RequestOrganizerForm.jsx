import React, { useRef, useEffect, useState } from "react";
import "./RequestOrganizerForm.css";

const RequestOrganizerForm = ({
  show,
  onClose,
  form,
  onChange,
  onImageChange,
  onResult, // <-- changed from onSubmit to onResult
}) => {
  const galleryInputRef = useRef();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [galleryImages, setGalleryImages] = useState([]); // File[]
  const [galleryPreviews, setGalleryPreviews] = useState([]); // string[]
  const [dragActive, setDragActive] = useState(false);

  const PRICE_OPTIONS = [
    "500-999",
    "1,000-1,999",
    "2,000-2,999",
    "3,000-4,999",
    "5,000+",
  ];
  const [customPriceSelected, setCustomPriceSelected] = useState(false);
  const [customPrice, setCustomPrice] = useState("");

  const [customSelected, setCustomSelected] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // init first/last from combined organizer_name
  useEffect(() => {
    const name = (form.organizer_name || "").trim();
    if (!name) {
      setFirstName("");
      setLastName("");
      return;
    }
    const parts = name.split(" ");
    setFirstName(parts.shift() || "");
    setLastName(parts.join(" ") || "");
  }, [form.organizer_name]);

  // fetch categories from backend
  useEffect(() => {
    let mounted = true;
    fetch("http://localhost:8080/categories")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          setCategories(data);
          const names = data.map((c) => c.name);
          if (form.category && !names.includes(form.category)) {
            setCustomSelected(true);
            setCustomCategory(form.category);
          } else {
            setCustomSelected(false);
            setCustomCategory("");
          }
        } else {
          setCategories([]);
        }
      })
      .catch(() => {
        setCategories([]);
      })
      .finally(() => mounted && setLoadingCats(false));
    return () => {
      mounted = false;
    };
  }, [form.category]);

  // combine first+last and notify parent (same shape as original onChange)
  const updateCombinedName = (fn, ln) => {
    const combined = `${(fn || "").trim()} ${(ln || "").trim()}`.trim();
    onChange({ target: { name: "organizer_name", value: combined } });
  };

  const handleFirstChange = (e) => {
    setFirstName(e.target.value);
    updateCombinedName(e.target.value, lastName);
  };
  const handleLastChange = (e) => {
    setLastName(e.target.value);
    updateCombinedName(firstName, e.target.value);
  };

  const handleCategorySelect = (e) => {
    const v = e.target.value;
    if (v === "__other__") {
      setCustomSelected(true);
      setCustomCategory("");
      onChange({ target: { name: "category", value: "" } });
    } else {
      setCustomSelected(false);
      setCustomCategory("");
      onChange({ target: { name: "category", value: v } });
    }
  };

  const handleCustomCategoryChange = (e) => {
    const v = e.target.value;
    setCustomCategory(v);
    onChange({ target: { name: "category", value: v } });
  };

  // ราคา: เลือกหรือพิมพ์เอง
  const handlePriceSelect = (e) => {
    const v = e.target.value;
    if (v === "__other__") {
      setCustomPriceSelected(true);
      setCustomPrice("");
      onChange({ target: { name: "price", value: "" } });
    } else {
      setCustomPriceSelected(false);
      setCustomPrice("");
      onChange({ target: { name: "price", value: v } });
    }
  };

  const handleCustomPriceChange = (e) => {
    const v = e.target.value;
    setCustomPrice(v);
    onChange({ target: { name: "price", value: v } });
  };

  // ---------- gallery (multiple) ----------
  const handleGalleryChange = (filesList) => {
    const files = Array.from(filesList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const newFiles = [...galleryImages, ...files];
    const newPreviews = [
      ...galleryPreviews,
      ...files.map((f) => URL.createObjectURL(f)),
    ];
    setGalleryImages(newFiles);
    setGalleryPreviews(newPreviews);
    if (onImageChange) onImageChange({ target: { name: "images", files: newFiles } });
  };

  const onGalleryInputChange = (e) => {
    handleGalleryChange(e.target.files);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dt = e.dataTransfer;
    if (dt && dt.files) handleGalleryChange(dt.files);
  };

  const removeGalleryImage = (index) => {
    const newFiles = galleryImages.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryImages(newFiles);
    setGalleryPreviews(newPreviews);
    if (onImageChange) onImageChange({ target: { name: "images", files: newFiles } });
  };

  const clearGallery = () => {
    galleryPreviews.forEach((p) => URL.revokeObjectURL(p));
    setGalleryImages([]);
    setGalleryPreviews([]);
    if (onImageChange) onImageChange({ target: { name: "images", files: [] } });
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  // release object URLs on unmount
  useEffect(() => {
    return () => {
      galleryPreviews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [galleryPreviews]);

  // prevent background scrolling + avoid layout shift when modal opens
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyLock = () => {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    };
    const removeLock = () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };

    if (show) applyLock();
    else removeLock();

    return () => removeLock();
  }, [show]);

  // เพิ่ม: อ่าน user จาก localStorage (แก้ปัญหา 'user' is not defined)
  // ⛔ ลบส่วนนี้เพราะไม่ได้ใช้งาน ทำให้เกิด warning ts(6133) และ eslint
  // const user = React.useMemo(() => {
  //   try {
  //     return JSON.parse(localStorage.getItem("user") || "{}");
  //   } catch {
  //     return {};
  //   }
  // }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ถ้ามี onResult ให้ส่งข้อมูลกลับไปให้ parent (Register.jsx) จัดการสมัคร user + ส่งคำร้อง
    if (typeof onResult === "function") {
      onResult({
        form,
        images: galleryImages, // File[]
      });
      return;
    }

    // fallback: โหมด standalone โพสต์เอง
    try {
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const fd = new FormData();
      fd.append("user_id", String(user.user_id || ""));
      fd.append("organizer_name", form.organizer_name || "");
      fd.append("category", form.category || "");
      fd.append("email", form.email || "");
      fd.append("price", form.price || "");
      fd.append("phone", form.phone || "");
      fd.append("description", form.description || "");
      galleryImages.forEach((f) => fd.append("images", f));

      const res = await fetch("http://localhost:8080/request_organizers", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "ส่งคำร้องไม่สำเร็จ");
        return;
      }
      alert("ส่งคำร้องสำเร็จ");
      onClose && onClose();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  if (!show) return null;

  return (
    <div className="ORQ-backdrop">
      <div className="ORQ-modal">
        <div className="ORQ-modal-header">
          <span className="ORQ-title">ร้องขอรับทำอีเว้นท์</span>
          <button className="ORQ-close" onClick={onClose}>×</button>
        </div>

        <form className="ORQ-form" onSubmit={handleSubmit}>
          <div className="ORQ-row">
            <div className="ORQ-col">
              <label className="ORQ-label">ชื่อจริง</label>
              <input className="ORQ-input" name="organizer_first_name" value={firstName} onChange={handleFirstChange} placeholder="ชื่อจริง" required />
            </div>
            <div className="ORQ-col">
              <label className="ORQ-label">นามสกุล</label>
              <input className="ORQ-input" name="organizer_last_name" value={lastName} onChange={handleLastChange} placeholder="นามสกุล" required />
            </div>
          </div>

          <div className="ORQ-row">
            <div className="ORQ-col">
              <label className="ORQ-label">ประเภทงาน</label>
              <select className="ORQ-input" name="category" value={customSelected ? "__other__" : (form.category || "")} onChange={handleCategorySelect} required={!customSelected}>
                <option value="" disabled>{loadingCats ? "กำลังโหลด..." : "เลือกประเภทงาน"}</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                <option value="__other__">อื่นๆ (พิมพ์เอง)</option>
              </select>
              {customSelected && (
                <input className="ORQ-input ORQ-input-inline" style={{ marginTop: 8 }} placeholder="พิมพ์ประเภทงาน" value={customCategory} onChange={handleCustomCategoryChange} required />
              )}
            </div>

            <div className="ORQ-col">
              <label className="ORQ-label">อีเมล</label>
              <input className="ORQ-input" name="email" value={form.email} onChange={onChange} type="email" placeholder="อีเมล" required />
            </div>
          </div>

          <div className="ORQ-row">
            <div className="ORQ-col-full">
              <label className="ORQ-label">เสนอราคา</label>
              <div className="ORQ-price-row">
                <select className="ORQ-input ORQ-select" name="price" value={customPriceSelected ? "__other__" : (form.price || "")} onChange={handlePriceSelect} required={!customPriceSelected}>
                  <option value="" disabled>เลือกช่วงราคา</option>
                  {PRICE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  <option value="__other__">อื่นๆ (พิมพ์เอง)</option>
                </select>
                {customPriceSelected && (
                  <input className="ORQ-input ORQ-input-inline" placeholder="พิมพ์ราคา เช่น 2500" value={customPrice} onChange={handleCustomPriceChange} required />
                )}
              </div>
            </div>
          </div>

          <div className="ORQ-row">
            <div className="ORQ-col-full">
              <label className="ORQ-label">เบอร์ติดต่อ</label>
              <input className="ORQ-input" name="phone" value={form.phone} onChange={onChange} placeholder="เบอร์ติดต่อ" required />
            </div>
          </div>

          <div className="ORQ-row">
            <div className="ORQ-col-full">
              <label className="ORQ-label">คำอธิบายเกี่ยวกับตัวเอง</label>
              <textarea className="ORQ-textarea" name="description" value={form.description} onChange={onChange} placeholder="คำอธิบาย" required />
            </div>
          </div>

          <div className="ORQ-row">
            <div className="ORQ-col-full">
              <label className="ORQ-label">ผลงานของคุณ (แนบรูปได้หลายรูป)</label>

              <div
                className={`ORQ-upload-area ${dragActive ? "ORQ-drag" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDrop={onDrop}
              >
                <div className="ORQ-upload-top">
                  <div className="ORQ-upload-instruction">ลากรูปมาวางหรือกดปุ่มเพื่อเลือกหลายไฟล์</div>
                  <div className="ORQ-upload-actions">
                    <button type="button" className="ORQ-btn" onClick={() => galleryInputRef.current?.click()}>เลือกไฟล์</button>
                    <button type="button" className="ORQ-btn ORQ-btn-danger" onClick={clearGallery}>ลบทั้งหมด</button>
                  </div>
                </div>

                {galleryPreviews.length > 0 ? (
                  <div className="ORQ-gallery-grid">
                    {galleryPreviews.map((src, idx) => (
                      <div key={idx} className="ORQ-gallery-item">
                        <img src={src} alt={`preview-${idx}`} className="ORQ-gallery-img" />
                        <div className="ORQ-gallery-overlay">
                          <button type="button" onClick={() => window.open(src, "_blank")} title="ดูเต็ม" className="ORQ-gallery-action">🔍</button>
                          <button type="button" onClick={() => removeGalleryImage(idx)} title="ลบ" className="ORQ-gallery-action ORQ-gallery-action-remove">❌</button>
                        </div>
                        <div className="ORQ-gallery-number">{idx + 1}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ORQ-upload-placeholder">ยังไม่มีรูปตัวอย่าง — รองรับ JPG/PNG</div>
                )}

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={onGalleryInputChange}
                />
              </div>
            </div>
          </div>

          <div className="ORQ-actions">
            <button className="ORQ-submit" type="submit">ส่งคำร้องขอ</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestOrganizerForm;