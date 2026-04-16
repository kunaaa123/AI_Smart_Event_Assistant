import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GlassAlert from './GlassAlert'; // เพิ่ม import
import './Navbar.css';

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
  // เพิ่มตัวช่วยตรวจ role
  const role = (user?.role || "").toLowerCase();
  const isOrganizer = role === "organizer";

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const searchBoxRef = useRef();

  // เพิ่ม state สำหรับ GlassAlert
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

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

  // ฟังก์ชันค้นหา event, organizer และ venue
  const handleSearch = async (value) => {
    setSearch(value);
    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchPopup(false);
      return;
    }

    try {
      // ดึงข้อมูล event, organizer และ venue
      const [eventsRes, organizersRes, venuesRes] = await Promise.all([
        fetch("http://localhost:8080/events").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:8080/organizers").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:8080/venues").then((r) => r.json()).catch(() => [])
      ]);

      // filter event
      const eventResults = (Array.isArray(eventsRes) ? eventsRes : []).filter(
        (e) =>
          e.name?.toLowerCase().includes(value.toLowerCase()) ||
          e.description?.toLowerCase().includes(value.toLowerCase())
      );

      // ดึงรูปปกของแต่ละ event
      const eventResultsWithCover = await Promise.all(
        eventResults.map(async (e) => {
          let coverImg = null;
          try {
            const imgRes = await fetch(`http://localhost:8080/events/${e.event_id}/images`);
            let imgs = await imgRes.json();
            if (Array.isArray(imgs) && imgs.length > 0) {
              coverImg = imgs.find((img) => img.is_cover) || imgs[0];
            }
          } catch {
            // Ignore errors when fetching event images
          }
          return {
            ...e,
            event_image: coverImg ? coverImg.image_url : null,
          };
        })
      );

      // filter organizer
      const organizerResults = (Array.isArray(organizersRes) ? organizersRes : []).filter(
        (o) =>
          `${o.first_name || ""} ${o.last_name || ""}`.toLowerCase().includes(value.toLowerCase()) ||
          o.username?.toLowerCase().includes(value.toLowerCase()) ||
          o.expertise?.toLowerCase().includes(value.toLowerCase())
      );

      // filter venue - เพิ่มการค้นหาสถานที่
      const venueResults = (Array.isArray(venuesRes) ? venuesRes : []).filter(
        (v) =>
          v.name?.toLowerCase().includes(value.toLowerCase()) ||
          v.description?.toLowerCase().includes(value.toLowerCase()) ||
          v.location?.toLowerCase().includes(value.toLowerCase()) ||
          v.venue_type?.toLowerCase().includes(value.toLowerCase())
      );

      // รวมผลลัพธ์ทั้งหมด
      const allResults = [
        ...eventResultsWithCover.map((e) => ({ type: "event", ...e })),
        ...organizerResults.map((o) => ({ type: "organizer", ...o })),
        ...venueResults.map((v) => ({ type: "venue", ...v }))
      ];

      setSearchResults(allResults);
      setShowSearchPopup(true);

      // แสดงข้อความแจ้งเตือนถ้าไม่พบผลลัพธ์
      if (allResults.length === 0) {
        showAlert(`ไม่พบผลลัพธ์สำหรับ "${value}" 🔍`, "info");
      }

    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowSearchPopup(false);
      showAlert("เกิดข้อผิดพลาดในการค้นหา", "danger");
    }
  };

  // ฟังก์ชันจัดการเมื่อกด Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      setShowSearchPopup(false);
      showAlert(`กำลังค้นหา "${search.trim()}"...`, "info");
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    } else {
      showAlert("กรุณาใส่คำค้นหา", "warning");
    }
  };

  // ฟังก์ชันจัดการ key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    const userName = user?.username || user?.first_name || "ผู้ใช้";
    localStorage.removeItem("user");
    showAlert(`ออกจากระบบเรียบร้อยแล้ว ลาก่อน ${userName} 👋`, "success");
    
    // รอให้แสดง alert แล้วค่อย redirect
    setTimeout(() => {
      window.location.href = "/?logged_out=true";
    }, 1500);
  };

  // ฟังก์ชันไปหน้าโปรไฟล์
  const handleProfileClick = () => {
    if (!user?.user_id) {
      showAlert("กรุณาเข้าสู่ระบบก่อน", "warning");
      return;
    }
    navigate("/profile");
  };

  // ฟังก์ชันไปหน้ารายการโปรด
  const handleFavoritesClick = () => {
    if (!user?.user_id) {
      showAlert("กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด", "warning");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    navigate("/my-favorites");
  };

  // ✅ ฟังก์ชันไปหน้าอีเว้นท์ของฉัน/ผลงานของฉัน (ต้องล็อกอิน)
  const handleMyEventsClick = () => {
    if (!user?.user_id) {
      showAlert("กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานหน้านี้", "warning");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }
    navigate("/my-events");
  };

  // ปิด popup เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSearchPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    window.addEventListener("user-profile-updated", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("user-profile-updated", handleStorage);
    };
  }, []);

  // เพิ่มฟังก์ชัน refresh user เมื่อกลับมาที่หน้า (เช่นหลัง login/register)
  useEffect(() => {
    // ดึง user ล่าสุดจาก localStorage
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined") return;
    const user = JSON.parse(raw);
    // ถ้าถูกระงับ ให้บังคับ logout
    if (user.is_suspended) {
      localStorage.removeItem("user");
      showAlert("บัญชีนี้ถูกระงับการใช้งาน", "danger");
      setTimeout(() => window.location.href = "/login?banned=true", 1200);
    }
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef();

  // เพิ่ม state สำหรับป็อปอัพรายละเอียดแจ้งเตือนรีพอร์ต
  const [notifDetail, setNotifDetail] = useState({ open: false, data: null, notif: null });
  // เพิ่ม state เก็บรายละเอียดอีเวนท์สำหรับ popup แจ้งเตือน
  const [notifEvent, setNotifEvent] = useState({ loading: false, name: "", cover: null });

  const handleNotifClick = (n) => {
    markRead(n.id);
    let data = null;
    try { data = n.data ? JSON.parse(n.data) : null; } catch { data = null; }
    if (data && data.kind === "report_notice" && data.event_id) {
      setNotifOpen(false);
      setNotifDetail({ open: true, data, notif: n });
    } else {
      setNotifOpen(false);
    }
  };

  // โหลดชื่อและรูปอีเวนท์เมื่อเปิด popup การแจ้งเตือน
  useEffect(() => {
    if (!notifDetail.open || !notifDetail.data?.event_id) return;
    let cancelled = false;
    const eid = notifDetail.data.event_id;

    const run = async () => {
      setNotifEvent({ loading: true, name: "", cover: null });
      try {
        // ดึงชื่ออีเวนท์
        let name = `อีเวนท์ #${eid}`;
        const evRes = await fetch(`http://localhost:8080/events/${eid}`);
        if (evRes.ok) {
          const ev = await evRes.json();
          name = ev?.name || name;
        }
        // ดึงรูปปกอีเวนท์
        let cover = null;
        try {
          const imgRes = await fetch(`http://localhost:8080/events/${eid}/images`);
          const imgs = imgRes.ok ? await imgRes.json() : [];
          if (Array.isArray(imgs) && imgs.length) {
            const pick = imgs.find(i => i.is_cover) || imgs[0];
            if (pick?.image_url) {
              cover = `http://localhost:8080${String(pick.image_url).replace(/^\./, "")}`;
            }
          }
        } catch {
          // Ignore errors when fetching event images
        }        if (!cancelled) setNotifEvent({ loading: false, name, cover });
      } catch {
        if (!cancelled) setNotifEvent({ loading: false, name: `อีเวนท์ #${eid}`, cover: null });
      }
    };
    run();
    return () => { cancelled = true; };
  }, [notifDetail.open, notifDetail.data?.event_id]);

  // fetch notifications for current user — only run when user is present
  useEffect(() => {
    if (!user) {
      setNotifications([]); // ensure cleared when logged out
      return;
    }
    let mounted = true;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`http://localhost:8080/notifications?user_id=${user.user_id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setNotifications(data || []);
      } catch {
        // ignore
      }
    };
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, [user]);

  // listen for explicit refresh events (only used to update when other pages dispatch)
  useEffect(() => {
    const onRefresh = (e) => {
      try {
        const payload = e?.detail?.notifications;
        if (Array.isArray(payload)) setNotifications(payload);
      } catch {
        // ignore
      }
    };
    window.addEventListener("notifications-refreshed", onRefresh);
    return () => window.removeEventListener("notifications-refreshed", onRefresh);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/notifications/${id}/read`, {
        method: "PATCH", // เปลี่ยนเป็น PATCH ให้ตรง backend
      });
      if (!res.ok) return; // ถ้าไม่สำเร็จ ไม่อัปเดตสถานะใน UI
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      // ignore errors
    }
  };

  // close dropdown when clicked outside
  useEffect(() => {
    const onDoc = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <>
      {/* เพิ่ม GlassAlert */}
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3">
        <div className="container-fluid">
          <a className="navbar-brand d-flex align-items-center gap-2" href="/">
            <img
              src="Bannerimg/logo.png"
              alt="Logo"
              width="46"
              height="46"
              style={{ borderRadius: 8 }}
            />
            <span className="fw-bold fs-5">Event Assistant</span>
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
                <button
                  className="nav-link btn btn-link"
                  onClick={() => navigate("/contact")}
                  type="button"
                >
                  ติดต่อฉัน
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link btn btn-link"
                  onClick={handleFavoritesClick}
                >
                  รายการโปรด
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link btn btn-link"
                  onClick={handleMyEventsClick}
                >
                  {isOrganizer ? "ผลงานของฉัน" : "อีเว้นท์ของฉัน"}
                </button>
              </li>
            </ul>
            <form 
              className="d-flex me-3 position-relative" 
              role="search" 
              ref={searchBoxRef} 
              autoComplete="off"
              onSubmit={handleSearchSubmit}
            >
              <input
                className="form-control"
                type="search"
                placeholder="ค้นหา อีเว้นท์ ผู้จัดงาน สถานที่ (กด Enter เพื่อค้นหาทั้งหมด)"
                aria-label="Search"
                style={{ minWidth: 200 }}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => search && setShowSearchPopup(true)}
                onKeyPress={handleKeyPress}
              />
              {/* Popup Search Result */}
              {showSearchPopup && searchResults.length > 0 && (
                <div className="navbar-search-popup">
                  <div className="navbar-search-header">
                    <span>ผลลัพธ์ด่วน ({searchResults.length} รายการ)</span>
                    <button
                      type="button"
                      className="navbar-search-view-all"
                      onClick={() => handleSearchSubmit({ preventDefault: () => {} })}
                    >
                      ดูทั้งหมด →
                    </button>
                  </div>
                  {searchResults.slice(0, 5).map((item, idx) => {
                    if (item.type === "event") {
                      return (
                        <div
                          key={`event-${item.event_id}-${idx}`}
                          className="navbar-search-item navbar-search-item-flex"
                          onClick={() => {
                            setShowSearchPopup(false);
                            setSearch("");
                            showAlert(`เปิดอีเว้นท์ "${item.name}"`, "info");
                            navigate(`/events/${item.event_id}`);
                          }}
                        >
                          <img
                            src={
                              item.event_image
                                ? item.event_image.startsWith("http")
                                  ? item.event_image
                                  : `http://localhost:8080${item.event_image.replace(/^\./, "")}`
                                : "https://placehold.co/48x48?text=No+Image"
                            }
                            alt={item.name}
                            className="navbar-search-thumb"
                          />
                          <div className="navbar-search-info">
                            <div>
                              <span className="navbar-search-type">[Event]</span>
                              <span className="navbar-search-title">{item.name}</span>
                            </div>
                            <div className="navbar-search-desc">
                              {item.description?.slice(0, 48) || "-"}
                            </div>
                          </div>
                        </div>
                      );
                    } else if (item.type === "organizer") {
                      return (
                        <div
                          key={`org-${item.organizer_id}-${idx}`}
                          className="navbar-search-item navbar-search-item-flex"
                          onClick={() => {
                            setShowSearchPopup(false);
                            setSearch("");
                            showAlert(`เปิดโปรไฟล์ "${item.first_name} ${item.last_name}"`, "info");
                            navigate(`/organizers/${item.organizer_id}`);
                          }}
                        >
                          <img
                            src={
                              item.profile_image
                                ? item.profile_image.startsWith("http")
                                  ? item.profile_image
                                  : `http://localhost:8080${item.profile_image.replace(/^\./, "")}`
                                : "/default-avatar.png"
                            }
                            alt={item.first_name}
                            className="navbar-search-thumb"
                          />
                          <div className="navbar-search-info">
                            <div>
                              <span className="navbar-search-type">[Organizer]</span>
                              <span className="navbar-search-title">
                                {item.first_name} {item.last_name}
                              </span>
                            </div>
                            <div className="navbar-search-desc">
                              {item.expertise || "-"}
                            </div>
                          </div>
                        </div>
                      );
                    } else if (item.type === "venue") {
                      return (
                        <div
                          key={`venue-${item.venue_id}-${idx}`}
                          className="navbar-search-item navbar-search-item-flex"
                          onClick={() => {
                            setShowSearchPopup(false);
                            setSearch("");
                            showAlert(`เปิดสถานที่ "${item.name}"`, "info");
                            navigate(`/venues/${item.venue_id}`);
                          }}
                        >
                          <img
                            src={
                              item.cover_image
                                ? item.cover_image.startsWith("http")
                                  ? item.cover_image
                                  : `http://localhost:8080${item.cover_image.replace(/^\./, "")}`
                                : "https://placehold.co/48x48?text=🏢"
                            }
                            alt={item.name}
                            className="navbar-search-thumb"
                          />
                          <div className="navbar-search-info">
                            <div>
                              <span className="navbar-search-type">[Venue]</span>
                              <span className="navbar-search-title">{item.name}</span>
                            </div>
                            <div className="navbar-search-desc">
                              📍 {item.location} • {item.venue_type}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </form>
            {user ? (
              <div className="d-flex align-items-center gap-2">
                {/* Notification bell - show only when user logged in */}
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    title="Notifications"
                    onClick={() => setNotifOpen(v => !v)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}
                  >
                    <span style={{ fontSize: 20 }}>🔔</span>
                    {unreadCount > 0 && (
                      <span className="notif-badge">{unreadCount}</span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="notif-dropdown">
                      <div style={{ padding: 8, borderBottom: "1px solid #eee", fontWeight: 700 }}>การแจ้งเตือน</div>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 12 }}>ยังไม่มีการแจ้งเตือน</div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`notif-item ${n.is_read ? "" : "unread"}`}
                            onClick={() => handleNotifClick(n)}
                            title="คลิกเพื่อดูรายละเอียด"
                          >
                            <div style={{ fontSize: 13, color: "#111" }}>{n.message}</div>
                            <div style={{ fontSize: 11, color: "#666" }}>{new Date(n.created_at).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{ cursor: "pointer" }}
                  onClick={handleProfileClick}
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
                    className="navbar-avatar"
                  />
                </div>
                <span className="fw-semibold">{user.username || user.first_name || "ผู้ใช้"}</span>
                <button
                  className="btn btn-outline-secondary btn-sm ms-2"
                  onClick={handleLogout}
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    showAlert("กำลังเปิดหน้าเข้าสู่ระบบ...", "info");
                    setTimeout(() => navigate("/login"), 800);
                  }}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    showAlert("กำลังเปิดหน้าสมัครสมาชิก...", "info");
                    setTimeout(() => navigate("/register"), 800);
                  }}
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Popup รายละเอียดแจ้งเตือนรีพอร์ต */}
      {notifDetail.open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setNotifDetail({ open: false, data: null, notif: null })}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 12px 30px rgba(0,0,0,.15)" }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #eef2f7", fontWeight: 800 }}>
              แจ้งเตือนเกี่ยวกับอีเวนท์ของคุณ
            </div>

            {/* ส่วนหัว: รูป + ชื่ออีเวนท์ */}
            <div style={{ padding: 16, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 72, height: 48, borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb", background: "#f8fafc", flex: "0 0 auto" }}>
                  <img
                    src={notifEvent.cover || "https://placehold.co/144x96?text=Event"}
                    alt={notifEvent.name || `Event #${notifDetail.data?.event_id}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => { e.currentTarget.src = "https://placehold.co/144x96?text=Event"; }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>
                    {notifEvent.name || `อีเวนท์ #${notifDetail.data?.event_id}`}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>
                    #{notifDetail.data?.event_id}
                  </div>
                </div>
              </div>

              {/* รายละเอียดจากรีพอร์ต */}
              {notifDetail.data?.reason && <div><b>เหตุผล</b>: {notifDetail.data.reason}</div>}
              {notifDetail.data?.details && <div><b>รายละเอียด</b>: {notifDetail.data.details}</div>}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setNotifDetail({ open: false, data: null, notif: null });
                    // เปิดหน้าอีเวนท์
                    navigate(`/events/${notifDetail.data?.event_id}`);
                  }}
                >
                  เปิดหน้าอีเวนท์
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    localStorage.setItem("editEventId", String(notifDetail.data?.event_id || ""));
                    setNotifDetail({ open: false, data: null, notif: null });
                    navigate("/my-events");
                  }}
                >
                  แก้ไขอีเวนท์นี้
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;