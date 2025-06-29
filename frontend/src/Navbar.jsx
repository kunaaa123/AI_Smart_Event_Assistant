import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Navbar.css'; // ถ้าคุณเขียนไว้ในไฟล์ Navbar.css


const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw || raw === "undefined") return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  // ฟัง event storage และอัปเดต user เมื่อ localStorage เปลี่ยน
  useEffect(() => {
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw || raw === "undefined") setUser(null);
        else setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("user-profile-updated", handleStorage); // เพิ่มบรรทัดนี้
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("user-profile-updated", handleStorage); // เพิ่มบรรทัดนี้
    };
  }, []);

  // เพิ่มฟังก์ชัน refresh user เมื่อกลับมาที่หน้า (เช่นหลัง login/register)
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined") setUser(null);
    else setUser(JSON.parse(raw));
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3">
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center gap-2" href="/">
          <img
            src="/logo.png"
            alt="Logo"
            width="36"
            height="36"
            style={{ borderRadius: 8 }}
          />
          <span className="fw-bold fs-5">Smart AI Event Assistant</span>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-3">
            <li className="nav-item">
              <button
                className="nav-link btn btn-link"
                onClick={() => navigate("/")}
              >
                หน้าหลัก
              </button>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                ติดต่อฉัน
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                รายการโปรด
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                อีเว้นท์ของฉัน
              </a>
            </li>
          </ul>
          <form className="d-flex me-3" role="search">
            <input
              className="form-control"
              type="search"
              placeholder="ค้นหา"
              aria-label="Search"
              style={{ minWidth: 180 }}
            />
          </form>
          {user ? (
            <div className="d-flex align-items-center gap-2">
              <div
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/profile")}
                title="โปรไฟล์"
              >
                <img
                  src={
                    user.profile_image
                      ? user.profile_image.startsWith("http")
                        ? user.profile_image
                        : `http://localhost:8080${user.profile_image}`
                      : "/default-avatar.png"
                  }
                  alt="avatar"
                  className="navbar-avatar" // เปลี่ยนตรงนี้
                />
              </div>
              <span className="fw-semibold">{user.username}</span>
              <button
                className="btn btn-outline-secondary btn-sm ms-2"
                onClick={() => {
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate("/login")}
              >
                เข้าสู่ระบบ
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/register")}
              >
                สมัครสมาชิก
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;