import React, { useState } from "react";
import "./Contact.css";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ loading: false, ok: null, msg: "" });

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ loading: false, ok: false, msg: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
      return;
    }
    setStatus({ loading: true, ok: null, msg: "" });
    try {
      // ปรับ endpoint ตาม backend ของโปรเจกต์ (ตัวอย่างใช้ /contact)
      const res = await fetch("http://localhost:8080/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus({ loading: false, ok: true, msg: "ส่งข้อความเรียบร้อยแล้ว ขอบคุณค่ะ" });
        setForm({ name: "", email: "", message: "" });
        setTimeout(() => navigate("/"), 1400);
      } else {
        const err = await res.text();
        setStatus({ loading: false, ok: false, msg: err || "เกิดข้อผิดพลาดในการส่ง" });
      }
    } catch {
      setStatus({ loading: false, ok: false, msg: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-left">
        <h1 className="contact-title">ติดต่อฉัน</h1>
        <p className="contact-sub">
          หากต้องการความช่วยเหลือ ส่งคำถามของคุณผ่านแบบฟอร์มด้านล่างหรืออีเมล์มาที่ 651463018@crru.ac.th
        </p>

        <form className="contact-form" onSubmit={submit} autoComplete="off">
          <label>ชื่อ</label>
          <input name="name" value={form.name} onChange={onChange} placeholder="ชื่อของคุณ" />

          <label>อีเมล์</label>
          <input name="email" value={form.email} onChange={onChange} placeholder="อีเมล์สำหรับติดต่อ" />

          <label>ข้อความ</label>
          <textarea name="message" value={form.message} onChange={onChange} placeholder="กรุณาใส่ข้อความ" rows={8} />

          <div className="contact-actions">
            <button type="submit" className="btn-submit" disabled={status.loading}>
              {status.loading ? "กำลังส่ง..." : "ส่ง"}
            </button>
          </div>

          {status.ok === true && <div className="contact-msg success">{status.msg}</div>}
          {status.ok === false && <div className="contact-msg error">{status.msg}</div>}
        </form>
      </div>

      <div className="contact-right" aria-hidden="true">
        <div className="contact-illustration">
          <img src="/Bannerimg/BF3.jpg" alt="contact illustration" />
        </div>
      </div>
    </div>
  );
};

export default Contact;