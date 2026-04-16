import React, { useState, useEffect, useRef } from "react";
import ProfileLayout from "./ProfileLayout";
import GlassAlert from "./GlassAlert";
import GCFFEConfirm from "./GCFFEConfirm"; // เพิ่ม

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [form, setForm] = useState({
    username: user.username || "",
    email: user.email || "",
    bio: user.bio || "",       // เพิ่ม bio
  });

  const [pw, setPw] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePwChange = (e) => setPw({ ...pw, [e.target.name]: e.target.value });

  const show = (message, type="success") => setAlert({ show: true, message, type });

  // คอนเฟิร์มสำหรับหน้าบ้าน (GCFFEConfirm)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOpts, setConfirmOpts] = useState({
    title: "ยืนยันการทำรายการ",
    message: "คุณแน่ใจหรือไม่?",
    type: "warning",
    confirmText: "บันทึก",
    cancelText: "ยกเลิก",
    closeOnOverlay: true,
  });
  const confirmResolverRef = useRef(null);
  const ask = (opts = {}) =>
    new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmOpts((prev) => ({ ...prev, ...opts }));
      setConfirmOpen(true);
    });
  const onConfirm = () => {
    setConfirmOpen(false);
    confirmResolverRef.current?.(true);
    confirmResolverRef.current = null;
  };
  const onCancel = () => {
    setConfirmOpen(false);
    confirmResolverRef.current?.(false);
    confirmResolverRef.current = null;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // ยืนยันก่อนบันทึก (แจ้งถ้ามีการเปลี่ยนรหัสผ่าน)
    const willChangePw = pw.current_password || pw.new_password || pw.confirm_password;
    const ok = await ask({
      title: "ยืนยันบันทึกโปรไฟล์",
      message: `ต้องการบันทึกการเปลี่ยนแปลง${willChangePw ? " และเปลี่ยนรหัสผ่าน" : ""} หรือไม่?`,
      type: "warning",
      confirmText: "บันทึก",
      closeOnOverlay: false,
    });
    if (!ok) return; // ผู้ใช้กดยกเลิก ไม่ต้องแสดง error

    try {
      // 1) อัปเดต username/email
      const resBasic = await fetch(`http://localhost:8080/users/${user.user_id}/basic`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),   // form มี bio แล้ว
      });
      const basicData = await resBasic.json();

      if (!resBasic.ok) {
        show(basicData.error || "อัปเดตโปรไฟล์ไม่สำเร็จ", "danger");
        return;
      }

      // เก็บ user ล่าสุด
      localStorage.setItem("user", JSON.stringify(basicData));
      window.dispatchEvent(new Event("user-profile-updated"));

      // 2) ถ้ามีกรอกรหัสผ่านใหม่ ให้เรียกเปลี่ยนรหัสผ่าน
      const wantsChangePassword =
        pw.current_password || pw.new_password || pw.confirm_password;

      if (wantsChangePassword) {
        if (!pw.new_password) {
          show("กรุณากรอกรหัสผ่านใหม่", "warning");
          return;
        }
        if (pw.new_password !== pw.confirm_password) {
          show("รหัสผ่านใหม่ไม่ตรงกัน", "warning");
          return;
        }

        const resPw = await fetch(`http://localhost:8080/users/${user.user_id}/password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: pw.current_password,
            new_password: pw.new_password,
          }),
        });
        const pwData = await resPw.json();
        if (!resPw.ok) {
          show(pwData.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ", "danger");
          return;
        }

        setPw({ current_password: "", new_password: "", confirm_password: "" });
      }

      show("บันทึกข้อมูลสำเร็จ", "success");
    } catch {
      show("เกิดข้อผิดพลาด", "danger");
    }
  };

  useEffect(() => {
    if (alert.show) {
      const t = setTimeout(() => setAlert((p) => ({ ...p, show: false })), 2500);
      return () => clearTimeout(t);
    }
  }, [alert.show]);

  return (
    <ProfileLayout user={user}>
      {/* GCFFE Confirm */}
      <GCFFEConfirm
        open={confirmOpen}
        title={confirmOpts.title}
        message={confirmOpts.message}
        type={confirmOpts.type}
        confirmText={confirmOpts.confirmText}
        cancelText={confirmOpts.cancelText}
        closeOnOverlay={confirmOpts.closeOnOverlay}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

      <GlassAlert show={alert.show} message={alert.message} type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })} />

      <div className="profile-title">โปรไฟล์</div>

      {/* ฟอร์มเดียว: ชื่อผู้ใช้/อีเมล + เปลี่ยนรหัสผ่าน */}
      <form className="profile-main" onSubmit={handleSave}>
        <div className="profile-form-row">
          <div className="profile-form-group">
            <label className="profile-label">ชื่อผู้ใช้</label>
            <div className="profile-input-wrapper">
              <input
                className="profile-input"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="ชื่อผู้ใช้"
                autoComplete="off"
              />
              <span className="profile-edit-icon">✎</span>
            </div>
          </div>
          <div className="profile-form-group">
            <label className="profile-label">อีเมล</label>
            <div className="profile-input-wrapper">
              <input
                className="profile-input"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="อีเมล"
                autoComplete="off"
                readOnly
                disabled
                title="อีเมลไม่สามารถแก้ไขได้"
              />
              <span className="profile-edit-icon"></span>
            </div>
          </div>
        </div>

        {/* Bio - อยู่ในกรอบเดียวกัน */}
        <div className="profile-form-group">
          <label className="profile-label">คำเเนะนำตัว</label>
          <textarea
            className="profile-textarea"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="แนะนำตัวสั้นๆ"
            rows={3}
          />
        </div>

        {/* ส่วนเปลี่ยนรหัสผ่าน (อยู่ในกรอบเดียวกัน) */}
        <div className="profile-form-row" style={{ marginTop: 12 }}>
          <div className="profile-form-group">
            <label className="profile-label">รหัสผ่านปัจจุบัน</label>
            <input
              className="profile-input"
              name="current_password"
              type="password"
              value={pw.current_password}
              onChange={handlePwChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-label">รหัสผ่านใหม่</label>
            <input
              className="profile-input"
              name="new_password"
              type="password"
              value={pw.new_password}
              onChange={handlePwChange}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              autoComplete="new-password"
              minLength={6}
            />
          </div>
        </div>

        <div className="profile-form-row">
          <div className="profile-form-group">
            <label className="profile-label">ยืนยันรหัสผ่านใหม่</label>
            <input
              className="profile-input"
              name="confirm_password"
              type="password"
              value={pw.confirm_password}
              onChange={handlePwChange}
              placeholder="พิมพ์ซ้ำ"
              autoComplete="new-password"
              minLength={6}
            />
          </div>
        </div>

        <button className="profile-submit-btn" type="submit" style={{ marginTop: 12 }}>
          บันทึก
        </button>
      </form>
    </ProfileLayout>
  );
};

export default Profile;



