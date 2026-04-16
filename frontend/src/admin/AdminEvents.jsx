import React, { useEffect, useMemo, useState } from "react";
import "./AdminEvents.css";
import GlassAlert from "../GlassAlert";
import useGlassConfirm from "../hooks/useGlassConfirm";
import { useNavigate } from "react-router-dom";

const AdminEvents = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("event"); // "event" หรือ "portfolio"
  const [events, setEvents] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [owners, setOwners] = useState({}); // { user_id: userObject }
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [portfolioImages, setPortfolioImages] = useState({}); // {portfolio_id: [images]}
  const [ConfirmUI, confirm] = useGlassConfirm();

  const show = (message, type = "success") =>
    setAlert({ show: true, message, type });

  const fetchOwnersByIds = async (ids = []) => {
    const uniq = [...new Set(ids.filter(Boolean))];
    const missing = uniq.filter((id) => !owners[id]);
    if (missing.length === 0) return;
    try {
      const results = await Promise.all(
        missing.map((id) =>
          fetch(`http://localhost:8080/users/${id}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        )
      );
      const map = {};
      missing.forEach((id, idx) => {
        if (results[idx]) map[id] = results[idx];
      });
      setOwners((prev) => ({ ...prev, ...map }));
    } catch {
      // ignore owner fetch errors
    }
  };

  // โหลดอีเว้นท์ทั้งหมด
  useEffect(() => {
    if (mode !== "event") return;
    setLoading(true);
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => show("โหลดรายการอีเว้นท์ไม่สำเร็จ", "danger"))
      .finally(() => setLoading(false));
  }, [mode]);

  // เมื่อโหลด events แล้ว พยายามดึงข้อมูลเจ้าของ
  useEffect(() => {
    if (!events || events.length === 0) return;
    const ownerIds = events.map((e) => e.owner_id || e.user_id || e.creator_id || e.organizer_id);
    fetchOwnersByIds(ownerIds);
  }, [events]); 

  // โหลด portfolio ทั้งหมด
  useEffect(() => {
    if (mode !== "portfolio") return;
    setLoading(true);
    fetch("http://localhost:8080/organizer_portfolios")
      .then((res) => res.json())
      .then((data) => setPortfolios(Array.isArray(data) ? data : []))
      .catch(() => show("โหลดผลงานผู้จัดทำไม่สำเร็จ", "danger"))
      .finally(() => setLoading(false));
  }, [mode]);

  // เมื่อโหลด portfolios แล้ว พยายามดึงข้อมูลเจ้าของ
  useEffect(() => {
    if (!portfolios || portfolios.length === 0) return;
    const ownerIds = portfolios.map((p) => p.owner_id || p.user_id || p.organizer_id || p.creator_id);
    fetchOwnersByIds(ownerIds);
  }, [portfolios]);

  // ดึงรูปทุก portfolio
  useEffect(() => {
    if (mode !== "portfolio") return;
    portfolios.forEach((p) => {
      if (!portfolioImages[p.portfolio_id]) {
        fetch(`http://localhost:8080/organizer_portfolios/${p.portfolio_id}/images`)
          .then((res) => res.json())
          .then((imgs) => {
            setPortfolioImages((prev) => ({ ...prev, [p.portfolio_id]: imgs }));
          });
      }
    });
  }, [mode, portfolios]);

  // กรองข้อมูลตาม q
  const filteredEvents = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return events;
    return events.filter(
      (e) =>
        e.name?.toLowerCase().includes(s) ||
        e.description?.toLowerCase().includes(s)
    );
  }, [q, events]);

  const filteredPortfolios = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return portfolios;
    return portfolios.filter(
      (p) =>
        p.title?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        p.category?.toLowerCase().includes(s)
    );
  }, [q, portfolios]);

  const img = (cover) => {
    if (!cover) return "https://placehold.co/320x180?text=No+Image";
    return cover.startsWith("http") ? cover : `http://localhost:8080${cover}`;
  };

  const formatRating = (avg) => (typeof avg === "number" ? avg.toFixed(1) : "—");

  // ลบอีเว้นท์
  const handleDeleteEvent = async (event) => {
    const ok = await confirm({
      title: "ยืนยันลบอีเว้นท์",
      message: `ลบอีเว้นท์ "${event?.name ?? event?.event_id}" แบบถาวรหรือไม่?`,
      type: "danger",
      confirmText: "ลบ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:8080/events/${event.event_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบอีเว้นท์ไม่สำเร็จ");
      setEvents(prev => prev.filter(e => e.event_id !== event.event_id));
      show("ลบอีเว้นท์สำเร็จ");
    } catch (e) { show(e.message || "ลบอีเว้นท์ไม่สำเร็จ", "danger"); }
  };

  // ระงับ/เปิดใช้งานอีเว้นท์
  const handleToggleActiveEvent = async (event) => {
    const next = !event?.is_active;
    const ok = await confirm({
      title: next ? "ยืนยันเปิดใช้งานอีเว้นท์" : "ยืนยันระงับอีเว้นท์",
      message: next
        ? `ต้องการเปิดใช้งาน "${event?.name ?? event?.event_id}" หรือไม่?`
        : `ต้องการระงับ "${event?.name ?? event?.event_id}" หรือไม่? ผู้ใช้จะมองไม่เห็นอีเว้นท์นี้`,
      type: next ? "info" : "danger",
      confirmText: next ? "เปิดใช้งาน" : "ระงับ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:8080/events/${event.event_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error("อัปเดตสถานะไม่สำเร็จ");
      setEvents((prev) =>
        prev.map((e) => (e.event_id === event.event_id ? { ...e, is_active: next } : e))
      );
      show(next ? "เปิดใช้งานอีเว้นท์แล้ว" : "ระงับอีเว้นท์แล้ว");
    } catch (e) {
      show(e.message || "อัปเดตสถานะไม่สำเร็จ", "danger");
    }
  };

  // ลบ portfolio
  const handleDeletePortfolio = async (portfolio) => {
    const ok = await confirm({
      title: "ยืนยันลบพอร์ตโฟลิโอ",
      message: `ลบพอร์ตโฟลิโอ "${portfolio?.title ?? portfolio?.portfolio_id}" แบบถาวรหรือไม่?`,
      type: "danger",
      confirmText: "ลบ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:8080/organizer_portfolios/${portfolio.portfolio_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบผลงานไม่สำเร็จ");
      setPortfolios(prev => prev.filter(p => p.portfolio_id !== portfolio.portfolio_id));
      show("ลบผลงานสำเร็จ");
    } catch (e) { show(e.message || "ลบผลงานไม่สำเร็จ", "danger"); }
  };

  // ระงับ/เปิดใช้งาน portfolio
  const handleToggleActivePortfolio = async (portfolio) => {
    const next = !portfolio?.is_active;
    const ok = await confirm({
      title: next ? "ยืนยันเปิดใช้งานพอร์ตโฟลิโอ" : "ยืนยันระงับพอร์ตโฟลิโอ",
      message: next
        ? `ต้องการเปิดใช้งานพอร์ต "${portfolio?.title ?? portfolio?.portfolio_id}" หรือไม่?`
        : `ต้องการระงับพอร์ต "${portfolio?.title ?? portfolio?.portfolio_id}" หรือไม่?`,
      type: next ? "info" : "danger",
      confirmText: next ? "เปิดใช้งาน" : "ระงับ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:8080/organizer_portfolios/${portfolio.portfolio_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error("อัปเดตสถานะไม่สำเร็จ");
      setPortfolios((prev) =>
        prev.map((p) => (p.portfolio_id === portfolio.portfolio_id ? { ...p, is_active: next } : p))
      );
      show(next ? "เปิดใช้งานผลงานแล้ว" : "ระงับผลงานแล้ว");
    } catch (e) {
      show(e.message || "อัปเดตสถานะไม่สำเร็จ", "danger");
    }
  };

  useEffect(() => {
    if (!alert.show) return;
    const t = setTimeout(() => setAlert((p) => ({ ...p, show: false })), 2200);
    return () => clearTimeout(t);
  }, [alert.show]);

  return (
    <div className="adminDB-ev">
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert((p) => ({ ...p, show: false }))}
      />

      {/* ปุ่มสลับโหมด */}
      <div className="adminDB-ev-togglebar" style={{ marginBottom: 18, display: "flex", gap: 10 }}>
        <button
          className={`adminDB-ev-togglebtn${mode === "event" ? " active" : ""}`}
          onClick={() => setMode("event")}
        >
          อีเว้นท์ของสมามาชิก
        </button>
        <button
          className={`adminDB-ev-togglebtn${mode === "portfolio" ? " active" : ""}`}
          onClick={() => setMode("portfolio")}
        >
          อีเว้นท์ของผู้จัดทำ
        </button>
      </div>

      <div className="adminDB-ev-head">
        <h1>{mode === "event" ? "จัดการ อีเว้นท์" : "จัดการ ผลงานผู้จัดทำ"}</h1>
        <div className="adminDB-ev-tools">
          <input
            className="adminDB-ev-search"
            placeholder={mode === "event" ? "ค้นหาอีเว้นท์..." : "ค้นหาผลงาน..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="adminDB-ev-count">
            ทั้งหมด {mode === "event" ? filteredEvents.length : filteredPortfolios.length} รายการ
          </div>
        </div>
      </div>

      {loading ? (
        <div className="adminDB-ev-loading">กำลังโหลด...</div>
      ) : mode === "event" ? (
        filteredEvents.length === 0 ? (
          <div className="adminDB-ev-empty">ไม่พบอีเว้นท์</div>
        ) : (
          <div className="adminDB-ev-list">
            {filteredEvents.map((e) => (
              <div
                key={e.event_id}
                className="adminDB-ev-card"
                onClick={() => navigate(`/events/${e.event_id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="adminDB-ev-cover">
                  <img
                    src={img(e.cover_image || e.event_image)}
                    alt={e.name}
                    onError={(ev) => {
                      ev.currentTarget.src = "https://placehold.co/320x180?text=No+Image";
                    }}
                  />
                </div>
                <div className="adminDB-ev-meta">
                  <div className="adminDB-ev-title">{e.name}</div>
                  <div className="adminDB-ev-owner">
                    เจ้าของ: {
                      (() => {
                        const oid = e.owner_id || e.user_id || e.creator_id || e.organizer_id;
                        const u = owners[oid];
                        return u ? (u.name || u.full_name || u.displayName || u.username || "—") : "—";
                      })()
                    }
                  </div>
                  <div className="adminDB-ev-desc">
                    {e.description?.length > 120
                      ? `${e.description.slice(0, 120)}...`
                      : e.description || "—"}
                  </div>
                  <div className="adminDB-ev-stats">
                    <span>⭐ {formatRating(e.avgRating)} </span>
                    <span>• {e.totalReviews || 0} รีวิว</span>
                  </div>
                  <div className="adminDB-ev-status">
                    <span
                      className={`adminDB-ev-badge ${e.is_active === false ? "inactive" : "active"}`}
                      title={e.is_active === false ? "อีเว้นท์ถูกระงับ" : "อีเว้นท์ใช้งานปกติ"}
                    >
                      {e.is_active === false ? "ระงับอยู่" : "ใช้งานอยู่"}
                    </span>
                  </div>
                </div>
                <div className="adminDB-ev-actions">
                  <button
                    className="adminDB-ev-btn ghost"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleToggleActiveEvent(e);
                    }}
                    title={e.is_active === false ? "เปิดใช้งาน" : "ระงับการใช้งาน"}
                  >
                    {e.is_active === false ? "เปิดใช้งาน" : "ระงับ"}
                  </button>
                  <button
                    className="adminDB-ev-btn danger"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDeleteEvent(e);
                    }}
                    title="ลบอีเว้นท์นี้"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredPortfolios.length === 0 ? (
          <div className="adminDB-ev-empty">ไม่พบผลงานผู้จัดทำ</div>
        ) : (
          <div className="adminDB-ev-list">
            {filteredPortfolios.map((p) => {
              const imgs = portfolioImages[p.portfolio_id] || [];
              const cover = imgs.find((img) => img.is_cover) || imgs[0];
              return (
                <div
                  key={p.portfolio_id}
                  className="adminDB-ev-card"
                  onClick={() => navigate(`/portfolios/${p.portfolio_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="adminDB-ev-cover">
                    <img
                      src={
                        cover
                          ? `http://localhost:8080${cover.image_url.replace(/^\./, "")}`
                          : "https://placehold.co/320x180?text=No+Image"
                      }
                      alt={p.title}
                      onError={(ev) => { ev.currentTarget.src = "https://placehold.co/320x180?text=No+Image"; }}
                    />
                  </div>
                  <div className="adminDB-ev-meta">
                    <div className="adminDB-ev-title">{p.title}</div>
                    <div className="adminDB-ev-owner">
                      เจ้าของ: {
                        (() => {
                          const oid = p.owner_id || p.user_id || p.organizer_id || p.creator_id;
                          const u = owners[oid];
                          return u ? (u.name || u.full_name || u.displayName || u.username || "—") : "—";
                        })()
                      }
                    </div>
                    <div className="adminDB-ev-desc">
                      {p.description?.length > 120
                        ? `${p.description.slice(0, 120)}...`
                        : p.description || "—"}
                    </div>
                    <div className="adminDB-ev-stats">
                      <span>{p.category ? `หมวดหมู่: ${p.category}` : ""}</span>
                      <span>{p.price ? `ราคา: ${p.price}` : ""}</span>
                    </div>
                    <div className="adminDB-ev-status">
                      <span
                        className={`adminDB-ev-badge ${p.is_active === false ? "inactive" : "active"}`}
                        title={p.is_active === false ? "ผลงานถูกระงับ" : "ผลงานใช้งานปกติ"}
                      >
                        {p.is_active === false ? "ระงับอยู่" : "ใช้งานอยู่"}
                      </span>
                    </div>
                  </div>
                  <div className="adminDB-ev-actions">
                    <button
                      className="adminDB-ev-btn ghost"
                      onClick={(ev) => { ev.stopPropagation(); handleToggleActivePortfolio(p); }}
                      title={p.is_active === false ? "เปิดใช้งาน" : "ระงับการใช้งาน"}
                    >
                      {p.is_active === false ? "เปิดใช้งาน" : "ระงับ"}
                    </button>
                    <button
                      className="adminDB-ev-btn danger"
                      onClick={(ev) => { ev.stopPropagation(); handleDeletePortfolio(p); }}
                      title="ลบผลงานนี้"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
      {/* กล่องยืนยันส่วนกลาง */}
      {ConfirmUI}
    </div>
  );
};

export default AdminEvents;