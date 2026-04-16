import React, { useEffect } from "react";
import "./GCFFEConfirm.css";

const GCFFEConfirm = ({
  open,
  title = "ยืนยันการทำรายการ",
  message = "คุณแน่ใจหรือไม่?",
  type = "warning", // success | info | warning | danger
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  onConfirm,
  onCancel,
  closeOnOverlay = true,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const onOverlayClick = () => {
    if (closeOnOverlay) onCancel?.();
  };

  return (
    <div className="GCFFE-overlay" onClick={onOverlayClick}>
      <div
        className="GCFFE-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`GCFFE-header ${type}`}>
          <div className="GCFFE-title">
            {type === "danger"
              ? "🛑"
              : type === "warning"
              ? "⚠️"
              : type === "success"
              ? "✅"
              : "ℹ️"}{" "}
            {title}
          </div>
          <button className="GCFFE-close" onClick={onCancel} aria-label="close">
            ×
          </button>
        </div>
        <div className="GCFFE-body">
          <div className="GCFFE-message">{message}</div>
        </div>
        <div className="GCFFE-actions">
          <button className="GCFFE-btn ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`GCFFE-btn ${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GCFFEConfirm;