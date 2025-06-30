import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateEvent.css"; // <-- เปลี่ยนเป็นไฟล์ใหม่


const CreateEvent = ({ onSuccess, onError, isPopup }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_image: null,
    imagePreview: "",
    organizer_id: "",
  });
  const [organizers, setOrganizers] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const user = JSON.parse(localStorage.getItem("user")) || {};

  // ดึง organizer ทั้งหมด
  useEffect(() => {
    fetch("http://localhost:8080/organizers")
      .then((res) => res.json())
      .then((data) => setOrganizers(data))
      .catch(() => setOrganizers([]));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryImages(files);
    setGalleryPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.organizer_id || form.organizer_id === "0") {
      setAlert({ show: true, message: "กรุณาเลือกผู้จัดงาน", type: "danger" });
      if (onError) onError("กรุณาเลือกผู้จัดงาน");
      return;
    }
    const data = new FormData();
    data.append("name", form.name);
    data.append("description", form.description);
    data.append("organizer_id", form.organizer_id);
    data.append("user_id", user.user_id);

    let eventId = null;
    try {
      const res = await fetch("http://localhost:8080/events", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        const event = await res.json();
        eventId = event.event_id;
      } else {
        setAlert({ show: true, message: "เกิดข้อผิดพลาดในการสร้างอีเว้นท์", type: "danger" });
        if (onError) onError("เกิดข้อผิดพลาดในการสร้างอีเว้นท์");
        return;
      }
    } catch {
      setAlert({ show: true, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", type: "danger" });
      if (onError) onError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      return;
    }

    // อัปโหลดภาพปก
    if (eventId && coverImage) {
      const coverData = new FormData();
      coverData.append("images", coverImage);
      coverData.append("is_cover", "true");
      await fetch(`http://localhost:8080/events/${eventId}/images`, {
        method: "POST",
        body: coverData,
      });
    }

    // อัปโหลดภาพ gallery
    if (eventId && galleryImages.length > 0) {
      const galleryData = new FormData();
      galleryImages.forEach(img => galleryData.append("images", img));
      galleryData.append("is_cover", "false");
      await fetch(`http://localhost:8080/events/${eventId}/images`, {
        method: "POST",
        body: galleryData,
      });
    }

    setAlert({ show: true, message: "สร้างอีเว้นท์สำเร็จ!", type: "success" });
    if (onSuccess) onSuccess();
    if (!isPopup) setTimeout(() => navigate("/my-events"), 1200);
  };

  return (
    <div>
      <div className="my-events-header-outer">
        <h2 className="my-events-title">สร้างอีเว้นท์ใหม่</h2>
      </div>
      <form className="my-events-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="my-events-form-group">
          <label>ชื่ออีเว้นท์</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="my-events-form-group">
          <label>รายละเอียด</label>
          <textarea name="description" value={form.description} onChange={handleChange} required />
        </div>
        <div className="my-events-form-group">
          <label>เลือกผู้จัดงาน (Organizer)</label>
          <select
            name="organizer_id"
            value={form.organizer_id}
            onChange={handleChange}
            required
          >
            <option value="">-- เลือกผู้จัดงาน --</option>
            {organizers.map((org) => (
              <option key={org.organizer_id} value={org.organizer_id}>
                {org.first_name} {org.last_name} ({org.expertise || "ไม่ระบุ"})
              </option>
            ))}
          </select>
        </div>
        <div className="my-events-form-group">
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
            <img src={coverPreview} alt="cover" style={{ width: 100, borderRadius: 8, objectFit: "cover", marginTop: 8 }} />
          )}
        </div>
        <div className="my-events-form-group">
          <label>ภาพอื่นๆ (Gallery)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          {galleryPreviews.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {galleryPreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`gallery-${idx}`}
                  style={{ width: 100, borderRadius: 8, objectFit: "cover" }}
                />
              ))}
            </div>
          )}
        </div>
        <button className="my-events-create-btn" type="submit">
          สร้างอีเว้นท์
        </button>
        {alert.show && (
          <div className={`alert alert-${alert.type}`}>{alert.message}</div>
        )}
      </form>
    </div>
  );
};

export default CreateEvent;