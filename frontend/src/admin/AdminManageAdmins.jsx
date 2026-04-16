import React, { useEffect, useMemo, useState } from "react";
import useGlassConfirm from "../hooks/useGlassConfirm"; // เพิ่ม
import "./AdminManageAdmins.css";

const API = "http://localhost:8080";

const AdminManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState({});
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({ show: false, msg: "", type: "success" });

  const [ConfirmUI, confirm] = useGlassConfirm(); // เพิ่ม

  const show = (msg, type = "success") => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert((p) => ({ ...p, show: false })), 2200);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [allUsersRes, adminsRes] = await Promise.all([
        fetch(`${API}/users`),
        fetch(`${API}/admins`),
      ]);
      const [allUsers, adminList] = await Promise.all([allUsersRes.json(), adminsRes.json()]);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setAdmins(Array.isArray(adminList) ? adminList : []);
    } catch {
      setUsers([]);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const adminIds = useMemo(() => new Set(admins.map(a => String(a.user_id))), [admins]);

  const candidates = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users
      .filter(u => !adminIds.has(String(u.user_id)))
      .filter(u => {
        if (!s) return true;
        return (
          (u.username || "").toLowerCase().includes(s) ||
          (u.email || "").toLowerCase().includes(s) ||
          (u.first_name || "").toLowerCase().includes(s) ||
          (u.last_name || "").toLowerCase().includes(s)
        );
      });
  }, [users, adminIds, q]);

  const toggleSelect = (uid) => {
    setSelecting(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const promoteSelected = async () => {
    const ids = Object.entries(selecting).filter(([, v]) => v).map(([k]) => parseInt(k, 10));
    if (ids.length === 0) return show("ยังไม่ได้เลือกผู้ใช้", "warning");

    const ok = await confirm({
      title: "ยืนยันเลื่อนขั้น",
      message: `เลื่อนขั้นผู้ใช้ ${ids.length} คนเป็นแอดมินหรือไม่?`,
      type: "info",
      confirmText: "ยืนยัน",
      closeOnOverlay: false,
    });
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`${API}/admins/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: ids }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      setSelecting({});
      show(`เลื่อนขั้นผู้ใช้ ${ids.length} คนเป็นแอดมินแล้ว`);
    } catch {
      show("เลื่อนขั้นไม่สำเร็จ", "danger");
    } finally {
      setBusy(false);
    }
  };

  const demote = async (uid) => {
    const ok = await confirm({
      title: "ยืนยันลดสิทธิ์",
      message: "ยืนยันลดสิทธิ์ผู้ใช้นี้กลับเป็นสมาชิกหรือไม่?",
      type: "danger",
      confirmText: "ลดสิทธิ์",
      closeOnOverlay: false,
    });
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`${API}/users/${uid}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "member" }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      show("ลดสิทธิ์แอดมินแล้ว");
    } catch {
      show("ลดสิทธิ์ไม่สำเร็จ", "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ama-container">
      {ConfirmUI}
      {alert.show && (
        <div className={`ama-alert ${alert.type === "danger" ? "danger" : alert.type === "warning" ? "warning" : "success"}`}>
          {alert.msg}
        </div>
      )}

      <header className="ama-header">
        <div>
          <h1 className="ama-title">จัดการแอดมิน</h1>
          <p className="ama-sub">เลื่อนขั้น/ลดสิทธิ์ผู้ใช้งานเป็นผู้ดูแลระบบ</p>
        </div>
        <div className="ama-meta">
          <div className="ama-admin-count">แอดมินทั้งหมด <span className="ama-badge">{admins.length}</span></div>
        </div>
      </header>

      {loading ? (
        <div className="ama-loading">กำลังโหลด...</div>
      ) : (
        <>
          <section className="ama-section">
            <h2 className="ama-section-title">รายชื่อแอดมิน</h2>
            {admins.length === 0 ? (
              <div className="ama-empty">ยังไม่มีผู้ดูแลระบบ</div>
            ) : (
              <div className="ama-admin-list">
                {admins.map(a => (
                  <div key={a.user_id} className="ama-admin-card">
                    <img
                      className="ama-avatar"
                      src={a.profile_image ? `${API}${a.profile_image}` : "https://placehold.co/48x48?text=👤"}
                      alt=""
                      onError={(e) => { e.currentTarget.src = "https://placehold.co/48x48?text=👤"; }}
                    />
                    <div className="ama-admin-info">
                      <div className="ama-admin-name">{a.first_name || a.username || "ผู้ใช้"} {a.last_name || ""}</div>
                      <div className="ama-admin-email">{a.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => demote(a.user_id)}
                      disabled={busy}
                      className="ama-btn ama-btn-outline danger"
                      title="ลดสิทธิ์กลับเป็นสมาชิก"
                    >
                      ลดสิทธิ์
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ama-section">
            <h2 className="ama-section-title">เลื่อนขั้นผู้ใช้เป็นแอดมิน</h2>
            <div className="ama-controls">
              <input
                className="ama-search"
                placeholder="ค้นหาผู้ใช้ (ชื่อ/อีเมล)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="ama-btn ama-btn-primary" onClick={promoteSelected} disabled={busy}>
                เลื่อนขั้นผู้ใช้ที่เลือก
              </button>
            </div>

            {candidates.length === 0 ? (
              <div className="ama-empty">ไม่พบผู้ใช้ที่สามารถเลื่อนขั้น</div>
            ) : (
              <div className="ama-candidates">
                {candidates.slice(0, 50).map(u => (
                  <label key={u.user_id} className="ama-candidate">
                    <input
                      type="checkbox"
                      checked={!!selecting[u.user_id]}
                      onChange={() => toggleSelect(u.user_id)}
                    />
                    <img
                      className="ama-avatar"
                      src={u.profile_image ? `${API}${u.profile_image}` : "https://placehold.co/36x36?text=👤"}
                      alt=""
                      onError={(e) => { e.currentTarget.src = "https://placehold.co/36x36?text=👤"; }}
                    />
                    <div className="ama-candidate-info">
                      <div className="ama-candidate-name">
                        {u.first_name || u.username || "ผู้ใช้"} {u.last_name || ""}
                        <span className="ama-role">({u.role || "member"})</span>
                      </div>
                      <div className="ama-candidate-email">{u.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminManageAdmins;