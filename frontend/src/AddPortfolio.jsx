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
    image: null,
    imagePreview: "",
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    data.append("category", form.category);
    data.append("price", form.price);
    data.append("organizer_id", user.organizer_id);
    if (form.image) data.append("image", form.image);

    try {
      const res = await fetch("http://localhost:8080/organizer_portfolios", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setAlert({ show: true, message: "เพิ่มผลงานสำเร็จ!", type: "success" });
        setTimeout(() => navigate("/organizer-portfolios"), 1000);
      } else {
        setAlert({ show: true, message: "เกิดข้อผิดพลาด", type: "danger" });
      }
    } catch {
      setAlert({ show: true, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", type: "danger" });
    }
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
          <label>รูปภาพ</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {form.imagePreview && (
            <img src={form.imagePreview} alt="preview" className="create-event-image-preview" />
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