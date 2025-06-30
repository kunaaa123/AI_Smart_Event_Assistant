import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateEvent.css";

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

  // เพิ่ม state สำหรับรูป
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
        setAlert({ show: true, message: "เกิดข้อผิดพลาด", type: "danger" });
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
      await fetch(`http://localhost:8080/organizer_portfolios/${portfolioId}/images`, {
        method: "POST",
        body: coverData,
      });
    }

    // อัปโหลดภาพ gallery
    if (portfolioId && galleryImages.length > 0) {
      const galleryData = new FormData();
      galleryImages.forEach(img => galleryData.append("images", img));
      galleryData.append("is_cover", "false");
      await fetch(`http://localhost:8080/organizer_portfolios/${portfolioId}/images`, {
        method: "POST",
        body: galleryData,
      });
    }

    setAlert({ show: true, message: "เพิ่มผลงานสำเร็จ!", type: "success" });
    setTimeout(() => navigate("/organizer-portfolios"), 1000);
  };

  return (
    <div className="create-event-modal-box">
      <h2 className="create-event-title">เพิ่มผลงานใหม่</h2>
      <form className="create-event-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="create-event-form-group">
          <label>ชื่อผลงาน</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div className="create-event-form-group">
          <label>ประเภท</label>
          <input name="category" value={form.category} onChange={handleChange} required />
        </div>
        <div className="create-event-form-group">
          <label>รายละเอียด</label>
          <textarea name="description" value={form.description} onChange={handleChange} />
        </div>
        <div className="create-event-form-group">
          <label>ราคา</label>
          <input name="price" value={form.price} onChange={handleChange} type="number" min="0" />
        </div>
        <div className="create-event-form-group">
          <label>ภาพปก (Cover)</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files[0];
              setCoverImage(file);
              setCoverPreview(file ? URL.createObjectURL(file) : "");
            }}
          />
          {coverPreview && (
            <img src={coverPreview} alt="cover" className="create-event-image-preview" />
          )}
        </div>
        <div className="create-event-form-group">
          <label>ภาพอื่นๆ (Gallery)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => {
              const files = Array.from(e.target.files);
              setGalleryImages(files);
              setGalleryPreviews(files.map(f => URL.createObjectURL(f)));
            }}
          />
          {galleryPreviews.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {galleryPreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`gallery-${idx}`}
                  className="create-event-image-preview"
                />
              ))}
            </div>
          )}
        </div>
        <button className="create-event-btn" type="submit">
          เพิ่มผลงาน
        </button>
        {alert.show && (
          <div className={`alert alert-${alert.type}`}>{alert.message}</div>
        )}
      </form>
    </div>
  );
};

export default AddPortfolio;