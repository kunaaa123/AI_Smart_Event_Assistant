import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GlassAlert from "./GlassAlert";

export default function ResetPassword() {
  const nav = useNavigate();
  const location = useLocation(); // ✅ call hook at top-level
  const token = new URLSearchParams(location.search).get("token") || ""; // ✅ no useMemo

  const [form, setForm] = useState({ new_password: "", confirm: "" });
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const show = (m, t = "success") => setAlert({ show: true, message: m, type: t });

  const submit = async (e) => {
    e.preventDefault();
    if (!token) { show("โทเค็นไม่ถูกต้อง", "danger"); return; }
    if (!form.new_password || form.new_password.length < 6) { show("รหัสอย่างน้อย 6 ตัวอักษร", "warning"); return; }
    if (form.new_password !== form.confirm) { show("รหัสผ่านใหม่ไม่ตรงกัน", "warning"); return; }
    try {
      const res = await fetch("http://localhost:8080/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: form.new_password }),
      });
      const data = await res.json();
      if (!res.ok) { show(data.error || "เปลี่ยนรหัสไม่สำเร็จ", "danger"); return; }
      show("เปลี่ยนรหัสผ่านสำเร็จ", "success");
      setTimeout(() => nav("/login"), 1000);
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
          <form className="login-page-form" onSubmit={submit}>
            <h2>ตั้งรหัสผ่านใหม่</h2>
            <div className="login-page-form-group">
              <label>รหัสผ่านใหม่</label>
              <input type="password" value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })} minLength={6} required />
            </div>
            <div className="login-page-form-group">
              <label>ยืนยันรหัสผ่านใหม่</label>
              <input type="password" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} minLength={6} required />
            </div>
            <button className="login-page-main-btn" type="submit">บันทึก</button>
          </form>
        </div>
      </div>
    </section>
  );
}