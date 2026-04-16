'use client'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassAlert from './GlassAlert' // เพิ่ม import
import "./Login.css";

const Login = () => { // ลบ showToast prop
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  
  // เพิ่ม state สำหรับ GlassAlert
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" })
  
  const navigate = useNavigate()

  // ฟังก์ชันแสดง alert
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
  };

  // Auto hide alert after 3 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        // พยายามดึง profile เต็มจาก backend เสมอ
        let profile = null;
        try {
          const profileRes = await fetch(`http://localhost:8080/users/${data.user.user_id}`);
          if (profileRes.ok) {
            profile = await profileRes.json();
          }
        } catch (err) {
          console.warn("fetch profile failed", err);
        }

        // ถ้าไม่สามารถดึง profile ได้ ให้ใช้ data.user เป็น fallback
        // และมั่นใจว่ามี field role (fallback เป็น "member")
        const stored = profile || {
          ...data.user,
          role: data.user?.role || "member",
        };

        localStorage.setItem("user", JSON.stringify(stored));
        window.dispatchEvent(new Event("user-profile-updated"));
        showAlert("เข้าสู่ระบบสำเร็จ! 🎉", "success");
        const to = (stored.role === "admin") ? "/admin" : "/";
        setTimeout(() => navigate(to), 800);
        return;
      } 
      if (!res.ok && data.error) {
        setError(data.error);
        showAlert(data.error, "danger");
      }
    } catch {
      setError("เกิดข้อผิดพลาด")
      showAlert("เกิดข้อผิดพลาด", "danger") // ใช้ showAlert แทน
    }
  }

  return (
    <section className="login-page-section">
      {/* เพิ่ม GlassAlert */}
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      
      <div className="login-page-main-box">
        <div className="login-page-img-box">
          <img
            src="https://images.unsplash.com/photo-1527689368864-3a821dbccc34?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"
            alt="login"
          />
        </div>
        <div className="login-page-form-box">
          <form className="login-page-form" onSubmit={handleSignIn}>
            <h2>เข้าสู่ระบบ</h2>
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
              เข้าสู่ระบบ
            </button>
            {error && <div style={{color:'red'}}>{error}</div>}
            <div className="login-page-links">
              <a href="/forgot-password">ลืมรหัสผ่าน</a>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Login
