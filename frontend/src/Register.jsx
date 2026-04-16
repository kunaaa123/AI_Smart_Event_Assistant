import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GlassAlert from "./GlassAlert";
import RequestOrganizerForm from "./RequestOrganizerForm";
import "./Login.css";

const Register = () => {
  const [username, setUsername]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [role, setRole]           = useState("member"); // member | organizer

  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgFormDraft, setOrgFormDraft] = useState({
    organizer_name: "",
    category: "",
    email: "",
    price: "",
    phone: "",
    description: "",
  });

  const navigate = useNavigate();
  const showAlert = (message, type = "success") => setAlert({ show: true, message, type });

  useEffect(() => {
    if (alert.show) {
      const t = setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [alert.show]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (role === "member") {
      // เดิม: สมัครและล็อกอินทันที
      try {
        const res = await fetch("http://localhost:8080/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, role: "member" }),
        });
        const data = await res.json();
        if (!res.ok) {
          showAlert(data?.error || "สมัครสมาชิกไม่สำเร็จ", "danger");
          return;
        }
        // login auto
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("user-profile-updated"));
        showAlert("สมัครสมาชิกสำเร็จ 🎉", "success");
        setTimeout(() => navigate("/"), 800);
      } catch {
        showAlert("เกิดข้อผิดพลาด", "danger");
      }
      return;
    }

    // ถ้าเลือก organizer: เปิดฟอร์มคำร้อง (ยังไม่ยิงสมัคร)
    setOrgFormDraft({
      organizer_name: "",
      category: "",
      email,
      price: "",
      phone: "",
      description: "",
    });
    setShowOrgForm(true);
  };

  // ได้ผลลัพธ์จากฟอร์มผู้จัด -> สมัคร user + ส่งคำร้อง + พาไปหน้าเข้าสู่ระบบ
  const handleOrganizerResult = async ({ form, images }) => {
    try {
      // สมัคร user แบบ organizer (backend จะบันทึกเป็น member + is_suspended=true)
      const regRes = await fetch("http://localhost:8080/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role: "organizer" }),
      });

      let userId = null;

      if (regRes.ok) {
        const regData = await regRes.json();
        userId = regData?.user?.user_id;
      } else {
        // fallback ถ้า 400 Email already exists ให้ find user_id ด้วยอีเมล
        let errBody = {};
        try { errBody = await regRes.json(); } catch {
          // intentionally ignore JSON parse errors
        }
        if (regRes.status === 400 && /Email already exists/i.test(errBody?.error || "")) {
          const findRes = await fetch(`http://localhost:8080/users/find?email=${encodeURIComponent(email)}`);
          if (!findRes.ok) {
            showAlert("ไม่สามารถค้นหาผู้ใช้ที่มีอีเมลนี้ได้", "danger");
            return;
          }
          const found = await findRes.json();
          userId = found?.user_id;
        } else {
          showAlert(errBody?.error || "สมัครสมาชิกไม่สำเร็จ", "danger");
          return;
        }
      }

      if (!userId) {
        showAlert("ไม่พบ user_id สำหรับส่งคำร้อง", "danger");
        return;
      }

      // ส่งคำร้องให้แอดมิน
      const fd = new FormData();
      fd.append("user_id", String(userId));
      fd.append("organizer_name", form.organizer_name || "");
      fd.append("category", form.category || "");
      fd.append("email", form.email || email || "");
      fd.append("price", form.price || "");
      fd.append("phone", form.phone || "");
      fd.append("description", form.description || "");
      (images || []).forEach((file) => fd.append("images", file));

      const reqRes = await fetch("http://localhost:8080/request_organizers", { method: "POST", body: fd });
      const reqData = await reqRes.json();
      if (!reqRes.ok) {
        showAlert(reqData?.error || "ส่งคำร้องไม่สำเร็จ", "danger");
        return;
      }

      setShowOrgForm(false);
      showAlert("ส่งคำร้องสำเร็จ รอแอดมินอนุมัติจึงจะเข้าสู่ระบบได้", "success");
      setTimeout(() => navigate("/login"), 1200);
    } catch {
      showAlert("เกิดข้อผิดพลาด", "danger");
    }
  };

  return (
    <section className="login-page-section">
      <GlassAlert show={alert.show} message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, show: false })} />

      {/* Modal คำร้องผู้จัด */}
      {showOrgForm && (
        <RequestOrganizerForm
          show={true}
          onClose={() => setShowOrgForm(false)}
          form={orgFormDraft}
          onChange={(e) => setOrgFormDraft({ ...orgFormDraft, [e.target.name]: e.target.value })}
          onImageChange={() => {}}
          onResult={handleOrganizerResult}
        />
      )}

      <div className="login-page-main-box">
        <div className="login-page-img-box">
          <img src="https://images.unsplash.com/photo-1527689368864-3a821dbccc34?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80" alt="register" />
        </div>
        <div className="login-page-form-box">
          <form className="login-page-form" onSubmit={onSubmit}>
            <h2>สมัครสมาชิก</h2>

            <div className="login-page-form-group">
              <label>ชื่อผู้ใช้</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div className="login-page-form-group">
              <label>อีเมล</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="login-page-form-group">
              <label>รหัสผ่าน</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="login-page-form-group">
              <label>สมัครเป็น</label>
              <div style={{ display: "flex", gap: 16 }}>
                <label><input type="radio" name="role" value="member" checked={role === "member"} onChange={() => setRole("member")} /> สมาชิกทั่วไป</label>
                <label><input type="radio" name="role" value="organizer" checked={role === "organizer"} onChange={() => setRole("organizer")} /> ผู้จัดอีเวนท์</label>
              </div>
            </div>

            <button className="login-page-main-btn" type="submit">
              {role === "organizer" ? "ถัดไป: กรอกแบบฟอร์มผู้จัด" : "สมัครสมาชิก"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Register;