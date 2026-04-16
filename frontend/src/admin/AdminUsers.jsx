import React, { useEffect, useState } from "react";
import "./AdminUsers.css"; // สร้างไฟล์ใหม่สำหรับ CSS
import EventUserAdminDetail from "./EventUserAdminDetail"; // นำเข้า component สำหรับแสดงรายละเอียดผู้ใช้
import useGlassConfirm from "../hooks/useGlassConfirm";    // เพิ่ม

const ROLE_LABELS = {
  member: "สมาชิก",
  organizer: "ผู้จัดทำ",
  admin: "ผู้ดูแลระบบ",
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  // ให้เริ่มต้นแสดงเฉพาะสมาชิก (member) ทันที
  const [roleFilter, setRoleFilter] = useState("member");
  const [popupUser, setPopupUser] = useState(null); // สถานะสำหรับจัดการผู้ใช้ที่ถูกคลิกเพื่อดูรายละเอียด
  const [ConfirmUI, confirm] = useGlassConfirm(); // เพิ่ม

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8080/users")
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchSearch =
      u.username?.toLowerCase().includes(q.trim().toLowerCase()) ||
      u.email?.toLowerCase().includes(q.trim().toLowerCase()) ||
      u.first_name?.toLowerCase().includes(q.trim().toLowerCase()) ||
      u.last_name?.toLowerCase().includes(q.trim().toLowerCase());
    return matchRole && matchSearch;
  });

  const handleSuspend = async (userId, suspend) => {
    const ok = await confirm({
      title: suspend ? "ยืนยันระงับบัญชี" : "ยืนยันปลดระงับ",
      message: suspend
        ? "ผู้ใช้งานจะไม่สามารถเข้าสู่ระบบได้ คุณต้องการระงับบัญชีนี้หรือไม่?"
        : "ต้องการปลดระงับและเปิดการใช้งานบัญชีนี้หรือไม่?",
      type: suspend ? "danger" : "info",
      confirmText: suspend ? "ระงับ" : "ปลดระงับ",
    });
    if (!ok) return;

    await fetch(`http://localhost:8080/users/${userId}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspend }),
    });
    const res = await fetch("http://localhost:8080/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  return (
    <div className="ADUs-container">
      {ConfirmUI} {/* แสดงกล่องยืนยันส่วนกลาง */}
      <div className="ADUs-head">
        <h1>รายชื่อผู้ใช้งาน</h1>
        <div className="ADUs-tools">
          <input
            className="ADUs-search"
            placeholder="ค้นหาผู้ใช้งาน..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="ADUs-rolebar">
            {/* ลบปุ่ม "ทั้งหมด" ออก */}
            <button
              className={`ADUs-rolebtn${roleFilter === "member" ? " active" : ""}`}
              onClick={() => setRoleFilter("member")}
            >
              สมาชิก
            </button>
            <button
              className={`ADUs-rolebtn${roleFilter === "organizer" ? " active" : ""}`}
              onClick={() => setRoleFilter("organizer")}
            >
              ผู้จัดทำ
            </button>
            <button
              className={`ADUs-rolebtn${roleFilter === "admin" ? " active" : ""}`}
              onClick={() => setRoleFilter("admin")}
            >
              ผู้ดูแลระบบ
            </button>
          </div>
          {/* ลบการแสดง "ทั้งหมด {filtered.length} คน" ออก */}
        </div>
      </div>
      {loading ? (
        <div className="ADUs-loading">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="ADUs-empty">ไม่พบผู้ใช้งาน</div>
      ) : (
        <div className="ADUs-list">
          {filtered.map((u) => (
            <div key={u.user_id} className={`ADUs-card ADUs-${u.role}`}>
              <div className="ADUs-avatar" onClick={() => setPopupUser(u)} style={{cursor:"pointer"}}>
                <img
                  src={u.profile_image ? `http://localhost:8080${u.profile_image}` : "https://placehold.co/60x60?text=User"}
                  alt={u.username}
                  onError={(e) => (e.currentTarget.src = "https://placehold.co/60x60?text=User")}
                />
              </div>
              <div className="ADUs-meta">
                <div className="ADUs-name">
                  {/* จุดสถานะ */}
                  <span
                    className="ADUs-status-dot"
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      marginRight: 8,
                      background: u.is_suspended ? "#ff4d4f" : "#52c41a",
                      border: "1.5px solid #fff",
                      boxShadow: "0 0 2px #0002"
                    }}
                    title={u.is_suspended ? "ถูกระงับ" : "ใช้งานปกติ"}
                  />
                  {u.first_name || u.username} {u.last_name || ""}
                </div>
                <div className="ADUs-role">
                  <span className={`ADUs-rolebadge ADUs-rolebadge-${u.role}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  {/* ป้ายสถานะถูกระงับ/ปกติ */}
                  <span className={`ADUs-statuschip ${u.is_suspended ? "suspended" : "ok"}`}>
                    {u.is_suspended ? "ถูกระงับ" : "ใช้งานปกติ"}
                  </span>
                </div>
              </div>
              <div className="ADUs-actions">
                <button
                  className={`ADUs-btn danger${u.is_suspended ? " suspended" : " active"}`}
                  // ลบ inline style เพื่อให้ใช้สีจาก CSS ตามสถานะ
                  onClick={() => handleSuspend(u.user_id, !u.is_suspended)}
                >
                  {u.is_suspended ? "ปลดระงับ" : "ระงับ"}
                </button>
              </div>
            </div>
          ))}
          {popupUser && (
            <EventUserAdminDetail user={popupUser} onClose={() => setPopupUser(null)} />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;