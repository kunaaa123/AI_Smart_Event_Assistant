import React from "react";

/*
  OrganizerProfilePopup
  props:
    - organizer: object (may be pseudo from user)
    - onClose: fn
*/
const OrganizerProfilePopup = ({ organizer = {}, onClose }) => {
  const avatar = organizer?.profile_image
    ? (organizer.profile_image.startsWith("http") ? organizer.profile_image : `http://localhost:8080${organizer.profile_image.replace(/^\./, "")}`)
    : "/default-avatar.png";

  const name = (organizer?.first_name || organizer?.username || "ผู้ใช้") + (organizer?.last_name ? ` ${organizer.last_name}` : "");
  const role = organizer?.expertise || organizer?.role || "ผู้สร้างอีเว้นท์";
  const bio = organizer?.bio || organizer?.description || "ไม่มีคำอธิบายเพิ่มเติม";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "min(540px, 96%)",
          background: "#ffffff",
          borderRadius: 14,
          padding: "28px 20px",
          boxShadow: "0 18px 40px rgba(2,6,23,0.4)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "center"
        }}
      >
        <img
          src={avatar}
          alt="avatar"
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid #f3f4f6",
            boxShadow: "0 6px 18px rgba(15,23,42,0.12)"
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{name}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{role}</div>
        </div>

        <div style={{
          maxWidth: "92%",
          fontSize: 14,
          color: "#334155",
          lineHeight: 1.45,
          background: "#f8fafc",
          padding: "12px 14px",
          borderRadius: 10,
          marginTop: 6
        }}>
          {bio}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#0f172a",
              cursor: "pointer"
            }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfilePopup;