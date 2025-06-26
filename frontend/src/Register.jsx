import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

const Register = ({ showToast }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("สมัครสมาชิกสำเร็จ", "success");
        setTimeout(() => (window.location = "/login"), 1200);
      } else {
        showToast(data.error || "สมัครสมาชิกไม่สำเร็จ", "danger");
      }
    } catch {
      showToast("เกิดข้อผิดพลาด", "danger");
    }
  };

  return (
    <section className="login-page-section">
      <div className="login-page-main-box">
        <div className="login-page-form-box">
          <form className="login-page-form" onSubmit={handleRegister}>
            <h2>สมัครสมาชิก</h2>
            <div className="login-page-form-group" style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="ชื่อ"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ flex: 1 }}
              />
            </div>
            <div className="login-page-form-group">
              <label htmlFor="email">อีเมล</label>
              <input
                id="email"
                type="email"
                placeholder="singha2546@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-page-form-group">
              <label htmlFor="password">รหัสผ่าน</label>
              <input
                id="password"
                type="password"
                placeholder="**********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="login-page-main-btn" type="submit">
              สมัครสมาชิก
            </button>
            <div className="login-page-links">
              <Link to="/login">เข้าสู่ระบบ</Link>
            </div>
          </form>
        </div>
        <div className="login-page-img-box">
          <img
            src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80"
            alt="register"
          />
        </div>
      </div>
    </section>
  );
};

export default Register;