import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./AdminLayout.css";

const API = "http://localhost:8080";

const MenuItem = ({ label, path, icon, active, onClick, badge }) => (
  <button
    className={`admin-menu-item ${active ? "active" : ""}`}
    onClick={() => onClick(path)}
    type="button"
  >
    <span className="admin-menu-icon" aria-hidden>{icon}</span>
    <span className="admin-menu-text">
      {label}
      {typeof badge === "number" && badge > 0 ? (
        <span className="admin-menu-badge" aria-hidden>{badge}</span>
      ) : null}
    </span>
  </button>
);

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- เพิ่ม: ดึง user จาก localStorage และอัปเดตเมื่อมีการแก้ไขโปรไฟล์ ---
  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  };

  const [user, setUser] = useState(getStoredUser);
  const [pendingCount, setPendingCount] = useState(0);
  // เพิ่ม: ตัวนับรีพอร์ตที่ค้าง (pending)
  const [pendingReportCount, setPendingReportCount] = useState(0);

  useEffect(() => {
    const handleProfileUpdate = () => setUser(getStoredUser());
    window.addEventListener("user-profile-updated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate); // เผื่ออัปเดตข้ามแท็บ
    // update pendingRequests when other component dispatches event
    const handleReqUpdate = (e) => {
      const n = (e && e.detail && typeof e.detail.pending === "number") ? e.detail.pending : null;
      if (n !== null) setPendingCount(n);
      else fetchPendingCount();
    };
    window.addEventListener("requests-updated", handleReqUpdate);

    // เพิ่ม: อัปเดตจำนวนรีพอร์ต pending เมื่อมีการเปลี่ยนแปลง
    const handleReportsUpdate = (e) => {
      const n = (e && e.detail && typeof e.detail.pending === "number") ? e.detail.pending : null;
      if (n !== null) setPendingReportCount(n);
      else fetchPendingReportCount();
    };
    window.addEventListener("reports-updated", handleReportsUpdate);

    // initial fetch
    fetchPendingCount();
    // initial fetch รายงาน
    fetchPendingReportCount();

    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
      window.removeEventListener("requests-updated", handleReqUpdate);
      window.removeEventListener("reports-updated", handleReportsUpdate);
    };
  }, []);

  // fetch pending count from backend
  async function fetchPendingCount() {
    try {
      const res = await fetch(`${API}/request_organizers`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const n = data.filter((it) => ((it.status || it.Status || "pending") + "").toLowerCase() === "pending").length;
        setPendingCount(n);
      } else {
        setPendingCount(0);
      }
    } catch (err) {
      console.warn("fetchPendingCount failed", err);
      setPendingCount(0);
    }
  }

  // เพิ่ม: ดึงจำนวนรีพอร์ตสถานะ pending
  async function fetchPendingReportCount() {
    try {
      const res = await fetch(`${API}/reports`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const n = data.filter((r) => (String(r.status || "pending").toLowerCase()) === "pending").length;
        setPendingReportCount(n);
      } else {
        setPendingReportCount(0);
      }
    } catch (err) {
      console.warn("fetchPendingReportCount failed", err);
      setPendingReportCount(0);
    }
  }

  const avatarUrl =
    user?.avatar_url || user?.photo || user?.avatar || user?.image_url || "";

  const getInitials = () => {
    const source = (user?.username || user?.email || "U").trim();
    if (!source) return "U";
    const parts = source.replace(/@.*/, "").split(/\s+/);
    const a = parts[0]?.[0] || "U";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  };

  const menus = [
    {
      label: "รายงาน",
      path: "/admin",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h16v4H4v-4z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label: "อีเว้นท์",
      path: "/admin/events",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label: "ผู้ใช้งาน",
      path: "/admin/users",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-7 8a7 7 0 0 1 14 0v2H5z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label: "คอมเมนต์",
      path: "/admin/comments",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16v10H7l-3 3V4z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label: "สถานที่",
      path: "/admin/venues",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label: "สมัครเป็นผู้จัดอีเว้นท์",
      path: "/admin/requests",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 3H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label: "คำรายงาน",
      path: "/admin/reports",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1v5h5" fill="currentColor"/>
        </svg>
      ),
    },
    { // <-- เพิ่มเมนูใหม่
      label: "จัดการแอดมิน",
      path: "/admin/admins",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-7 8a7 7 0 0 1 14 0v2H5z"/>
        </svg>
      ),
    },
    { // <-- คงเมนูเดิม
      label: "รูป AI",
      path: "/admin/ai-images",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M12 3l1.9 3.86L18 8l-3 3 .7 4L12 13l-3.7 2 .7-4-3-3 4.1-1.14L12 3z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-logo" />
          <div className="admin-brand-text">Event Assistant</div>
        </div>

        <nav className="admin-menu">
          {menus.map((m) => (
            <MenuItem
              key={m.path}
              label={m.label}
              path={m.path}
              icon={m.icon}
              active={
                m.path === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(m.path)
              }
              onClick={navigate}
              // pass badge for specific menus
              badge={
                m.path === "/admin/requests"
                  ? pendingCount
                  : m.path === "/admin/reports"
                  ? pendingReportCount
                  : undefined
              }
            />
          ))}
        </nav>

        {/* โปรไฟล์ผู้ใช้มุมล่างซ้าย */}
        <button
          type="button"
          className="admin-profile"
          onClick={() => navigate("/profile")} // ปรับเป็น path โปรไฟล์ของโปรเจกต์คุณ
          title="โปรไฟล์"
        >
          <span className="admin-avatar" aria-hidden>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <span className="admin-avatar-fallback">{getInitials()}</span>
            )}
          </span>
          <span className="admin-profile-info">
            <span className="admin-profile-name">{user?.username || "ผู้ใช้งาน"}</span>
            {user?.email ? <span className="admin-profile-email">{user.email}</span> : null}
          </span>
        </button>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;