import React, { useState, useEffect } from "react";
import ProfileLayout from "./ProfileLayout";
import RequestOrganizerForm from "./RequestOrganizerForm";
import GlassAlert from "./GlassAlert";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  // สมมุติ user มี first_name, last_name, email, phone, bio
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
    bio: user.bio || "",
    username: user.username || "",
    password: user.password || "",
    role: user.role || "member",
    profile_image: user.profile_image || null,
  });

  // สำหรับ popup ส่งคำร้องขอ
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    organizer_name: user.first_name || "", // ชื่อจริง
    category: "",                         // ประเภทงาน
    email: user.email || "",
    price: "", // ✅ แก้ไขตรงนี้
    phone: user.phone || "",
    description: "",
    image: null,
    imagePreview: "",
    imageLabel: "",
  });

  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  const handleRequestChange = (e) => {
    setRequestForm({ ...requestForm, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRequestForm((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const payload = {
        user_id: user.user_id,
        organizer_name: requestForm.organizer_name,
        category: requestForm.category,
        email: requestForm.email,
        price: requestForm.price,
        phone: requestForm.phone,
        description: requestForm.description,
        imageLabel: requestForm.imageLabel,
      };
      const res = await fetch("http://localhost:8080/request_organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setAlert({ show: true, message: "ส่งคำร้องขอสำเร็จ", type: "success" });
        setShowRequestModal(false);
      } else {
        setAlert({ show: true, message: "เกิดข้อผิดพลาดในการส่งคำร้องขอ", type: "danger" });
      }
    } catch {
      setAlert({ show: true, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ", type: "danger" });
    }
  };

  // สำหรับปุ่มแก้ไข (icon)
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = user.user_id;
      const res = await fetch(`http://localhost:8080/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setAlert({ show: true, message: "บันทึกข้อมูลสำเร็จ", type: "success" });
        fetchUserProfile(userId);
      } else {
        setAlert({ show: true, message: "เกิดข้อผิดพลาด", type: "danger" });
      }
    } catch {
      setAlert({ show: true, message: "เกิดข้อผิดพลาด", type: "danger" });
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const res = await fetch(`http://localhost:8080/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        // อัปเดตทั้ง form และ localStorage
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          username: data.username || "",
          password: "", // ไม่ควรดึง password
          role: data.role || "member",
          profile_image: data.profile_image || null,
        });
        // อัปเดต localStorage ด้วย (ถ้าต้องการให้ navbar เปลี่ยนด้วย)
        localStorage.setItem("user", JSON.stringify(data));
      }
    } catch {
      // handle error
    }
  };

  useEffect(() => {
    if (user.user_id) {
      fetchUserProfile(user.user_id);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert((prev) => ({ ...prev, show: false }));
      }, 2500); // 2.5 วินาที
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  return (
    <ProfileLayout user={user}>
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <form className="profile-main" onSubmit={handleSubmit}>
        <div className="profile-form-row">
          <div className="profile-form-group">
            <label className="profile-label">ชื่อจริง</label>
            <div className="profile-input-wrapper">
              <input
                className="profile-input"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="ชื่อจริง"
                autoComplete="off"
              />
              <span className="profile-edit-icon">✎</span>
            </div>
          </div>
          <div className="profile-form-group">
            <label className="profile-label">นามสกุล</label>
            <div className="profile-input-wrapper">
              <input
                className="profile-input"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="นามสกุล"
                autoComplete="off"
              />
              <span className="profile-edit-icon">✎</span>
            </div>
          </div>
        </div>
        <div className="profile-form-row">
          <div className="profile-form-group">
            <label className="profile-label">อีเมล</label>
            <div className="profile-input-wrapper">
              <input
                className="profile-input"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="อีเมล"
                autoComplete="off"
                type="email"
              />
              <span className="profile-edit-icon">✎</span>
            </div>
          </div>
          <div className="profile-form-group">
            <label className="profile-label">เบอร์มือถือ</label>
            <div className="profile-input-wrapper">
              <input
                className="profile-input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="เบอร์มือถือ"
                autoComplete="off"
              />
              <span className="profile-edit-icon">✎</span>
            </div>
          </div>
        </div>
        <div className="profile-form-group" style={{ marginBottom: 18 }}>
          <label className="profile-label">คำอธิบาย</label>
          <textarea
            className="profile-textarea"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="คำอธิบาย"
          />
        </div>
        <button
          className="profile-submit-btn"
          type="submit"
          style={{ marginBottom: 18 }} // เพิ่มระยะห่าง
        >
          บันทึก
        </button>
        <button
          className="profile-submit-btn"
          type="button"
          onClick={() => setShowRequestModal(true)}
        >
          ส่งคำร้องขอ
        </button>
      </form>
      <RequestOrganizerForm
        show={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        form={requestForm}
        onChange={handleRequestChange}
        onImageChange={handleImageChange}
        onSubmit={handleRequestSubmit}
      />
    </ProfileLayout>
  );
};

export default Profile;
