import React from "react";

const GlassAlert = ({ message, type = "success", show, onClose }) => {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 24,
        zIndex: 9999,
        minWidth: 260,
        maxWidth: 340,
        padding: "18px 28px 18px 22px",
        borderRadius: 18,
        background: "#ffffff", // เปลี่ยนเป็นสีขาว
        boxShadow: "0 8px 24px rgba(15,23,42,0.18)", // เงานุ่มๆ
        // backdropFilter: "blur(10px)",        // เอาเอฟเฟ็กต์แก้วออก
        // WebkitBackdropFilter: "blur(10px)",
        border: "1px solid #e2e8f0", // กรอบบางสีเทา
        color:
          type === "success"
            ? "#166534"
            : type === "danger"
            ? "#991b1b"
            : "#0f172a",
        fontWeight: 500,
        fontSize: "1.08rem",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "all 0.3s",
      }}
    >
      <span
        style={{
          fontSize: 22,
          display: "inline-block",
          marginRight: 6,
        }}
      >
        {type === "success" && "✅"}
        {type === "danger" && "❌"}
        {type === "warning" && "⚠️"}
        {type === "info" && "ℹ️"}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "rgba(255,255,255,0.3)",
          border: "none",
          borderRadius: "50%",
          width: 28,
          height: 28,
          cursor: "pointer",
          fontWeight: "bold",
          color: "#22223b",
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="close"
      >
        ×
      </button>
    </div>
  );
};

export default GlassAlert;