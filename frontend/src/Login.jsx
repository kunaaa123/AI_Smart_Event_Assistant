'use client'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "./Login.css";

const Login = ({ showToast }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.user) {
        // ดึง profile เพิ่มเติม
        const profileRes = await fetch(`http://localhost:8080/users/${data.user.user_id}`)
        if (profileRes.ok) {
          const profile = await profileRes.json()
          localStorage.setItem("user", JSON.stringify(profile))
          window.dispatchEvent(new Event("user-profile-updated"))
          showToast("เข้าสู่ระบบสำเร็จ", "success")
          navigate("/")
        } else {
          localStorage.setItem("user", JSON.stringify(data.user))
          showToast("เข้าสู่ระบบสำเร็จ (ข้อมูลไม่ครบ)", "warning")
          navigate("/")
        }
      } else {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ")
        showToast(data.error || "เข้าสู่ระบบไม่สำเร็จ", "danger")
      }
    } catch {
      setError("เกิดข้อผิดพลาด")
      showToast("เกิดข้อผิดพลาด", "danger")
    }
  }

  return (
    <section className="login-page-section">
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
              <a href="#">ลืมรหัสผ่าน</a>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Login
