import React, { useState } from "react";
import GlassAlert from "./GlassAlert";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  const show = (message, type = "success") => setAlert({ show: true, message, type });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await res.json(); // ไม่ต้องสน ข้อความเหมือนกัน
      show("ถ้ามีบัญชีนี้ ระบบได้ส่งอีเมลสำหรับเปลี่ยนรหัสผ่านแล้ว", "success");
    } catch {
      show("เกิดข้อผิดพลาด", "danger");
    }
  };

  return (
    <section className="login-page-section">
      <GlassAlert show={alert.show} message={alert.message} type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })} />
      <div className="login-page-main-box">
        <div className="login-page-form-box" style={{ width: "100%" }}>
          <form className="login-page-form" onSubmit={onSubmit}>
            <h2>ลืมรหัสผ่าน</h2>
            <div className="login-page-form-group">
              <label htmlFor="email">อีเมลที่สมัคร</label>
              <input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="login-page-main-btn" type="submit">ส่งลิงก์รีเซ็ต</button>
            <div className="login-page-links">
              <a href="/">กลับหน้าแรก</a>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}