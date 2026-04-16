import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Profile.css";

const ProfileLayout = ({ user, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);

  // เพิ่มตัวช่วยตรวจ role
  const role = (user?.role || "").toLowerCase();
  const isOrganizer = role === "organizer";

  // กำหนดเมนูแบบไดนามิก: ถ้าเป็นผู้จัด เปลี่ยนชื่อเมนูเป็น "ผลงานของฉัน"
  const menuList = [
    { label: "โปรไฟล์", path: "/profile" },
    { label: isOrganizer ? "ผลงานของฉัน" : "อีเว้นท์ของฉัน", path: "/my-events" },
    { label: "รายการโปรด", path: "/my-favorites" },
    { label: "คอมเมนต์ของฉัน", path: "/my-comments" },
    { label: "สร้างธีมบัตรเชิญด้วย AI", path: "/create-invite-card" },
    // ลบปุ่มสมัครเป็นผู้จัดอีเวนท์ออก (ย้ายไปทำในหน้า Login/สมัครสมาชิกแล้ว)
  ];

  // ฟังก์ชันอัปโหลดรูป
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("profile_image", file);
    try {
      const res = await fetch(
        `http://localhost:8080/users/${user.user_id}/profile-image`,
        {
          method: "POST",
          body: data,
        }
      );
      const result = await res.json();
      if (res.ok && result.profile_image) {
        const updatedUser = { ...user, profile_image: result.profile_image };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("user-profile-updated")); // เพิ่มบรรทัดนี้
      } else {
        alert(result.error || "อัปโหลดรูปไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูป");
    }
    setUploading(false);
  };

  // (ปุ่มเข้าโลกเสมือน ย้ายไปอยู่ในหน้า Home แล้ว)

  return (
    <div className="profile-outer-container">
      <div className="profile-container">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <img
            src={
              user.profile_image
                ? user.profile_image.startsWith("http")
                  ? user.profile_image
                  : `http://localhost:8080${user.profile_image}`
                : "/default-avatar.png"
            }
            alt="avatar"
            className="profile-avatar"
            style={{ cursor: "pointer" }}
            onClick={() => fileInputRef.current.click()}
            title="เปลี่ยนรูปโปรไฟล์"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleProfileImageChange}
            disabled={uploading}
          />
          <div className="profile-name">{user.username || "ชื่อผู้ใช้"}</div>

          {/* แสดงสถานะใต้รูปสำหรับผู้จัด */}
          {isOrganizer && (
            <div
              className="profile-role-badge"
              style={{
                marginTop: 6,
                padding: "4px 10px",
                fontSize: "0.9rem",
                color: "#155724",
                background: "#d4edda",
                border: "1px solid #c3e6cb",
                borderRadius: 999,
                display: "inline-block",
              }}
            >
              สถานะ: ผู้จัดทำอีเว้นท์
            </div>
          )}

          <button
            style={{
              margin: "8px 0 0 0",
              border: "none",
              background: "#e9ecef",
              borderRadius: 8,
              padding: "6px 18px",
              fontSize: "0.98rem",
              color: "#22223b",
              cursor: "pointer",
              opacity: uploading ? 0.6 : 1,
            }}
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
          </button>
          {/* ปุ่มเข้าโลกเสมือน ย้ายไปหน้า Home */}
          <div className="profile-menu">
            {menuList.map((item) => (
              <div
                key={item.path}
                className={
                  "profile-menu-item" +
                  (location.pathname === item.path ? " active" : "")
                }
                onClick={() => navigate(item.path)}
                style={{ cursor: "pointer" }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
        {/* Main Content */}
        <div className="profile-main-content">{children}</div>
      </div>
    </div>
  );
};

export default ProfileLayout;