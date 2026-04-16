import React, { useEffect, useState } from "react";
import "./EventUserAdminDetail.css";
import useGlassConfirm from "../hooks/useGlassConfirm"; // เพิ่ม

const EventUserAdminDetail = ({ user, onClose }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [isSuspended, setIsSuspended] = useState(user.is_suspended);
  const [ConfirmUI, confirm] = useGlassConfirm(); // เพิ่ม

  useEffect(() => {
    if (!user?.user_id) return;
    setLoading(true);
    fetch(`http://localhost:8080/events/user/${user.user_id}`)
      .then((res) => res.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
    setIsSuspended(user.is_suspended);
  }, [user]);

  const handleSuspend = async () => {
    const ok = await confirm({
      title: isSuspended ? "ยืนยันปลดระงับบัญชี" : "ยืนยันระงับบัญชี",
      message: isSuspended
        ? "ต้องการปลดระงับและเปิดการใช้งานบัญชีนี้หรือไม่?"
        : "ผู้ใช้งานจะไม่สามารถเข้าสู่ระบบได้ ต้องการระงับบัญชีนี้หรือไม่?",
      type: isSuspended ? "info" : "danger",
      confirmText: isSuspended ? "ปลดระงับ" : "ระงับ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    setSuspendLoading(true);
    await fetch(`http://localhost:8080/users/${user.user_id}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspend: !isSuspended }),
    });
    setIsSuspended(!isSuspended);
    setSuspendLoading(false);
  };

  const handleToggleActiveEvent = async (eventId, currentStatus) => {
    const next = !currentStatus;
    const ok = await confirm({
      title: next ? "ยืนยันเปิดใช้งานอีเว้นท์" : "ยืนยันระงับอีเว้นท์",
      message: next
        ? "ต้องการเปิดใช้งานอีเว้นท์นี้หรือไม่?"
        : "ต้องการระงับอีเว้นท์นี้หรือไม่? ผู้ใช้จะมองไม่เห็นอีเว้นท์นี้",
      type: next ? "info" : "danger",
      confirmText: next ? "เปิดใช้งาน" : "ระงับ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:8080/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error("อัปเดตสถานะไม่สำเร็จ");
      setEvents((prev) =>
        prev.map((ev) => (ev.event_id === eventId ? { ...ev, is_active: next } : ev))
      );
    } catch (e) {
      alert(e.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  return (
    <div className="EUAD-popup-bg" onClick={onClose}>
      {ConfirmUI} {/* กล่องยืนยันส่วนกลาง */} 
      <div className="EUAD-popup EUAD-popup-large" onClick={e => e.stopPropagation()}>
        <button className="EUAD-close-btn" onClick={onClose}>×</button>
        <div
          className="EUAD-profile"
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <img
              src={user.profile_image ? `http://localhost:8080${user.profile_image}` : "https://placehold.co/80x80?text=User"}
              alt={user.username}
              className="EUAD-avatar EUAD-avatar-large"
            />
            <div>
              <div className="EUAD-name EUAD-name-large">
                {/* จุดสถานะผู้ใช้ */}
                <span
                  className="EUAD-status-dot"
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    marginRight: 10,
                    background: isSuspended ? "#ff4d4f" : "#52c41a",
                    border: "2px solid #fff",
                    boxShadow: "0 0 2px #0002"
                  }}
                  title={isSuspended ? "ถูกระงับ" : "ใช้งานปกติ"}
                />
                {user.first_name || user.username} {user.last_name || ""}
              </div>
              <div className="EUAD-role">{user.role}</div>

              {/* ป้ายแสดงสถานะผู้ใช้ */}
              <div style={{ marginTop: 6 }}>
                <span
                  className={`EUAD-statuschip ${isSuspended ? "suspended" : "ok"}`}
                  aria-label={isSuspended ? "สถานะผู้ใช้: ถูกระงับ" : "สถานะผู้ใช้: ใช้งานปกติ"}
                >
                  {isSuspended ? "ถูกระงับ" : "ใช้งานปกติ"}
                </span>
              </div>
            </div>
          </div>

          {/* ปุ่มย้ายมาด้านขวาสุด */}
          <button
            className="EUAD-suspend-btn"
            style={{
              marginLeft: "auto",
              background: isSuspended ? "#52c41a" : "#ff4d4f",
              color: "#fff",
              borderRadius: "8px",
              padding: "7px 18px",
              border: "none",
              fontWeight: 500,
              fontSize: "1rem",
              cursor: "pointer",
              opacity: suspendLoading ? 0.7 : 1
            }}
            disabled={suspendLoading}
            onClick={handleSuspend}
          >
            {suspendLoading ? "กำลังดำเนินการ..." : isSuspended ? "ปลดระงับ" : "ระงับ"}
          </button>
        </div>
        <h2 className="EUAD-title EUAD-title-large">อีเว้นท์ของผู้ใช้งาน</h2>
        {loading ? (
          <div className="EUAD-loading">กำลังโหลด...</div>
        ) : events.length === 0 ? (
          <div className="EUAD-empty">ไม่มีอีเว้นท์</div>
        ) : (
          <div className="EUAD-event-list EUAD-event-list-large">
            {events.map(ev => {
              const imgUrl = ev.cover_image
                ? `http://localhost:8080${ev.cover_image.replace(/^\./, "")}`
                : "https://placehold.co/120x120?text=Event";
              return (
                <div
                  key={ev.event_id}
                  className="EUAD-event-card EUAD-event-card-large"
                  style={{
                    border: "2px solid #e0e0e0",
                    boxShadow: "0 4px 16px #0001",
                    borderRadius: "18px",
                    padding: "18px 16px",
                    marginBottom: "16px",
                    background: "#f7f8fa",
                    display: "flex",
                    alignItems: "center",
                    gap: "18px"
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={ev.name}
                    className="EUAD-event-img EUAD-event-img-large"
                    onError={e => e.currentTarget.src = "https://placehold.co/120x120?text=Event"}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="EUAD-event-name EUAD-event-name-large" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* จุดสถานะอีเว้นท์ */}
                      <span
                        className="EUAD-status-dot"
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          marginRight: 6,
                          background: ev.is_active === false ? "#ff4d4f" : "#52c41a",
                          border: "2px solid #fff",
                          boxShadow: "0 0 2px #0002"
                        }}
                        title={ev.is_active === false ? "อีเว้นท์ถูกระงับ" : "อีเว้นท์ใช้งานปกติ"}
                      />
                      {ev.name}
                    </div>
                    <div className="EUAD-event-desc EUAD-event-desc-large">{ev.description?.slice(0, 80) || "—"}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      className="EUAD-view-btn"
                      style={{
                        background: "#4f6ef7",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "7px 18px",
                        border: "none",
                        fontWeight: 500,
                        fontSize: "1rem",
                        cursor: "pointer"
                      }}
                      onClick={() => window.location.href = `/events/${ev.event_id}`}
                    >
                      ดูรายละเอียด
                    </button>
                    <button
                      className="EUAD-suspend-btn"
                      style={{
                        background: ev.is_active === false ? "#52c41a" : "#ff4d4f",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "7px 18px",
                        border: "none",
                        fontWeight: 500,
                        fontSize: "1rem",
                        cursor: "pointer"
                      }}
                      onClick={() => handleToggleActiveEvent(ev.event_id, ev.is_active)}
                    >
                      {ev.is_active === false ? "เปิดใช้งาน" : "ระงับ"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventUserAdminDetail;