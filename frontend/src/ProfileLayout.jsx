import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Profile.css";

const ProfileLayout = ({ user, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // กำหนด active menu
  const menuList = [
    { label: "โปรไฟล์", path: "/profile" },
    { label: "อีเว้นท์ของฉัน", path: "/my-events" },
    { label: "คอมเมนต์ของฉัน", path: "/my-comments" },
    { label: "รายการโปรด", path: "/my-favorites" },
    { label: "สร้างธีมบัตรเชิญด้วย AI", path: "/ai-invite-theme" },
  ];

  return (
    <div className="profile-outer-container">
      <div className="profile-container">
        {/* Sidebar */}
        <div className="profile-sidebar">
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt="avatar"
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar">
              {user.username ? user.username[0].toUpperCase() : "U"}
            </div>
          )}
          <div className="profile-name">{user.username || "ชื่อผู้ใช้"}</div>
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
            }}
          >
            อัปโหลดรูป
          </button>
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