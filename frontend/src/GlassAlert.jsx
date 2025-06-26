import React from "react";

const GlassAlert = ({ message, type = "success", show, onClose }) => {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        minWidth: 260,
        maxWidth: 340,
        padding: "18px 28px 18px 22px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.18)",
        boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1.5px solid rgba(255,255,255,0.28)",
        color:
          type === "success"
            ? "#1b5e20"
            : type === "danger"
            ? "#b71c1c"
            : "#22223b",
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