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
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        event_image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
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
    data.append("user_id", user.user_id); // ต้องมีบรรทัดนี้
    if (form.event_image) data.append("event_image", form.event_image);

    try {
      const res = await fetch("http://localhost:8080/events", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setAlert({ show: true, message: "สร้างอีเว้นท์สำเร็จ!", type: "success" });
        if (onSuccess) onSuccess();
        if (!isPopup) setTimeout(() => navigate("/my-events"), 1200);
      } else {
        setAlert({ show: true, message: "เกิดข้อผิดพลาดในการสร้างอีเว้นท์", type: "danger" });
        if (onError) onError("เกิดข้อผิดพลาดในการสร้างอีเว้นท์");
      }
    } catch {
      setAlert({ show: true, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", type: "danger" });
      if (onError) onError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
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
          <label>รูปภาพ</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {form.imagePreview && (
            <img src={form.imagePreview} alt="preview" style={{ width: 200, marginTop: 8, borderRadius: 8 }} />
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