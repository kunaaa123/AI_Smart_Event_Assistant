import React, { useRef } from "react";
import "./Profile.css";

const RequestOrganizerForm = ({
  show,
  onClose,
  form,
  onChange,
  onImageChange,
  onSubmit,
}) => {
  const fileInputRef = useRef();

  if (!show) return null;
  return (
    <div className="profile-modal-backdrop">
      <div className="profile-modal-content" style={{ maxWidth: 700, width: "95%" }}>
        <div className="profile-modal-header" style={{ marginBottom: 24 }}>
          <span>ร้องขอรับทำอีเว้นท์</span>
          <button className="profile-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="profile-form-row">
            <div className="profile-form-group">
              <label className="profile-label">ชื่อผู้รับทำ</label>
              <input
                className="profile-input"
                name="organizer_name"
                value={form.organizer_name}
                onChange={onChange}
                placeholder="ชื่อผู้รับทำ"
                autoComplete="off"
                required
              />
            </div>
            <div className="profile-form-group">
              <label className="profile-label">ประเภทงาน</label>
              <div className="profile-input-wrapper">
                <input
                  className="profile-input"
                  name="category"
                  value={form.category}
                  onChange={onChange}
                  placeholder="งานเลี้ยง"
                  autoComplete="off"
                  required
                />
                <span className="profile-edit-icon">✎</span>
              </div>
            </div>
          </div>
          <div className="profile-form-row">
            <div className="profile-form-group">
              <label className="profile-label">อีเมล</label>
              <input
                className="profile-input"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="อีเมล"
                autoComplete="off"
                type="email"
                required
              />
            </div>
            <div className="profile-form-group">
              <label className="profile-label">เสนอราคา</label>
              <input
                className="profile-input"
                name="price"
                value={form.price}
                onChange={onChange}
                placeholder="2000-3000"
                autoComplete="off"
                required
              />
            </div>
          </div>
          <div className="profile-form-row">
            <div className="profile-form-group">
              <label className="profile-label">เบอร์ติดต่อ</label>
              <input
                className="profile-input"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="เบอร์ติดต่อ"
                autoComplete="off"
                required
              />
            </div>
          </div>
          <div className="profile-form-group">
            <label className="profile-label">คำอธิบายเกี่ยวกับตัวเอง</label>
            <textarea
              className="profile-textarea"
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="เป็นงานเลี้ยงที่จัดแบบเรียบแต่มีสีสันพร็อพแสงไฟสวยๆ"
              required
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">ผลงานของคุณ</label>
            <div style={{
              background: "#f7f8fa",
              borderRadius: 12,
              border: "2px solid #e9ecef",
              padding: 18,
              marginBottom: 10,
              minHeight: 160,
              width: "100%",
              maxWidth: 420,
              margin: "0 auto 10px auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {form.imagePreview ? (
                <img
                  src={form.imagePreview}
                  alt="preview"
                  style={{ width: "100%", maxWidth: 380, height: 160, objectFit: "cover", borderRadius: 8 }}
                />
              ) : (
                <span style={{ color: "#adb5bd", fontSize: 32 }}>
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#e9ecef"/><path d="M8 13l2.5 3.5 3.5-4.5 4 6H6l2-3z" fill="#adb5bd"/><circle cx="9" cy="10" r="1" fill="#adb5bd"/></svg>
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="profile-input"
                style={{ flex: 1 }}
                placeholder="Label"
                name="imageLabel"
                value={form.imageLabel}
                onChange={onChange}
              />
              <button
                type="button"
                className="profile-submit-btn"
                style={{
                  background: "#fff",
                  color: "#22223b",
                  border: "1.5px solid #adb5bd",
                  padding: "10px 18px",
                  margin: 0,
                  fontWeight: 400
                }}
                onClick={() => fileInputRef.current.click()}
              >
                Upload Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onImageChange}
              />
            </div>
          </div>
          <button
            className="profile-submit-btn"
            style={{ marginTop: 18, float: "right", background: "#22223b" }}
            type="submit"
          >
            ส่งคำร้องขอ
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestOrganizerForm;