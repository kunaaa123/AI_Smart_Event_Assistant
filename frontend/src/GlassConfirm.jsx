import React, { useEffect } from "react";
import "./GlassConfirm.css";

const GlassConfirm = ({
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
    <div className="gc-overlay" onClick={onOverlayClick}>
      <div className="gc-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={`gc-header ${type}`}>
          <div className="gc-title">
            {type === "danger" ? "🛑" : type === "warning" ? "⚠️" : type === "success" ? "✅" : "ℹ️"} {title}
          </div>
          <button className="gc-close" onClick={onCancel} aria-label="close">×</button>
        </div>
        <div className="gc-body">
          <div className="gc-message">{message}</div>
        </div>
        <div className="gc-actions">
          <button className="gc-btn ghost" onClick={onCancel}>{cancelText}</button>
          <button className={`gc-btn ${type}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default GlassConfirm;