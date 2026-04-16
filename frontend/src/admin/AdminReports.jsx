import React, { useEffect, useMemo, useState } from "react";
import "./AdminREEV.css";

const API = "http://localhost:8080";

const toAbsURL = (u) => {
  if (!u) return "";
  let p = String(u).trim();
  // already an absolute URL
  if (/^https?:\/\//i.test(p)) return p;
  // normalize backslashes and leading "./"
  p = p.replace(/\\/g, "/");
  p = p.replace(/^\.\//, "");   // "./uploads/..." -> "uploads/..."
  if (!p.startsWith("/")) p = "/" + p;
  return `${API}${p}`;
};
const EVENT_PLACEHOLDER = "https://placehold.co/112x72?text=Event";

const statusLabelTH = {
  pending: "รอดำเนินการ",
  resolved: "แก้ไขแล้ว",
  rejected: "ปฏิเสธ",
};

const StatusBadge = ({ status }) => {
  const s = String(status || "pending").toLowerCase();
  return <span className={`AdminREEV-status-badge ${s}`}>{statusLabelTH[s] || s}</span>;
};

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="AdminREEV-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="AdminREEV-modal" onClick={(e) => e.stopPropagation()}>
        <div className="AdminREEV-modal-header">
          <div className="AdminREEV-modal-title">{title}</div>
          <button className="AdminREEV-btn close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>
        <div className="AdminREEV-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all"); // <-- new: filter by report kind (all|event|organizer)
  const [page, setPage] = useState(1);
  const [viewItem, setViewItem] = useState(null);
  const pageSize = 10;

  // NEW: เปิด/ปิดเมนูการจัดการต่อแถว
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    const onDocClick = (e) => {
      const withinActions = e.target.closest?.(".AdminREEV-actions");
      if (!withinActions) setOpenMenu(null);
    };
    const onEsc = (e) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // เพิ่ม: hydrate รายชื่อผู้ใช้และรูปปกอีเวนท์
  async function hydrateReports(list) {
    const userIDs = [...new Set(list.map(r => r.user_id).filter(Boolean))];
    const eventIDs = [...new Set(list.map(r => r.event_id).filter(Boolean))];
    const organizerIDs = [...new Set(list.map(r => r.organizer_id).filter(Boolean))];

    const userNameMap = new Map();
    const coverMap = new Map();
    const eventStatusMap = new Map();
    const organizerMap = new Map();

    // users (reporter) names
    await Promise.all(userIDs.map(async (uid) => {
      try {
        const res = await fetch(`${API}/users/${uid}`);
        if (res.ok) {
          const u = await res.json();
          userNameMap.set(uid, `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || `ผู้ใช้ #${uid}`);
        }
      } catch { /* ignore */ }
    }));

    // events: try GET /events/:id (may include cover field), if not found try /events/:id/images
    await Promise.all(eventIDs.map(async (eid) => {
      try {
        const res = await fetch(`${API}/events/${eid}`);
        if (res.ok) {
          const ev = await res.json();
          // prefer common keys: cover_image or event_image
          const raw = ev.cover_image || ev.event_image || ev.event_image_url || ev.EventImage || null;
          if (raw) {
            coverMap.set(eid, toAbsURL(raw));
          } else {
            // fallback to images endpoint
            const r2 = await fetch(`${API}/events/${eid}/images`);
            if (r2.ok) {
              const imgs = await r2.json();
              if (Array.isArray(imgs) && imgs.length > 0) {
                const cover = imgs.find(im => im.is_cover) || imgs[0];
                if (cover && cover.image_url) coverMap.set(eid, toAbsURL(cover.image_url));
              }
            }
          }
          eventStatusMap.set(eid, ev.is_active === false ? false : true);
        }
      } catch { /* ignore */ }
    }));

    // organizers: load profile/portfolio images and name
    await Promise.all(organizerIDs.map(async (oid) => {
      try {
        const res = await fetch(`${API}/organizers/${oid}`);
        if (res.ok) {
          const o = await res.json();
          organizerMap.set(oid, {
            name: `${o.first_name || ""} ${o.last_name || ""}`.trim() || `ผู้จัด #${oid}`,
            profile: o.profile_image || o.portfolio_img || null
          });
        }
      } catch { /* ignore */ }
    }));

    return list.map(r => ({
      ...r,
      reporter_name: userNameMap.get(r.user_id) || `ผู้ใช้ #${r.user_id}`,
      // event_cover is absolute URL or empty string
      event_cover: (r.event_id ? (coverMap.get(r.event_id) || "") : ""),
      event_is_active: eventStatusMap.get(r.event_id),
      organizer_name: r.organizer_id ? (organizerMap.get(r.organizer_id)?.name || `ผู้จัด #${r.organizer_id}`) : null,
      organizer_profile: r.organizer_id ? (organizerMap.get(r.organizer_id)?.profile ? toAbsURL(organizerMap.get(r.organizer_id).profile) : "") : ""
    }));
  }

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reports`);
      const data = await res.json();
      const base = Array.isArray(data) ? data : [];
      const hydrated = await hydrateReports(base);
      setReports(hydrated);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReports(); }, []);

  const counts = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => (r.status || "pending").toLowerCase() === "pending").length;
    const resolved = reports.filter(r => (r.status || "").toLowerCase() === "resolved").length;
    const rejected = reports.filter(r => (r.status || "").toLowerCase() === "rejected").length;
    return { total, pending, resolved, rejected };
  }, [reports]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return reports.filter(r => {
      const okStatus = status === "all" ? true : String(r.status || "").toLowerCase() === status;
      // แยกประเภทให้ถูกต้อง: "event" = มี event_id / "organizer" = มี organizer_id
      const isOrganizerReport = r.organizer_id != null && Number(r.organizer_id) > 0;
      const isEventReport = r.event_id != null && Number(r.event_id) > 0;
      const okKind = kind === "all" ? true : (kind === "event" ? isEventReport : isOrganizerReport);

      const text = [
        r.reason || "",
        r.details || "",
        r.reporter_name || "",
        String(r.event_id || ""),
        String(r.user_id || ""),
        String(r.report_id || "")
      ].join(" ").toLowerCase();
      const okQ = !term || text.includes(term);
      return okStatus && okKind && okQ;
    });
  }, [reports, q, status, kind]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [q, status, kind]);

  async function updateStatus(id, newStatus) {
    const label = statusLabelTH[newStatus] || newStatus;
    const ok = window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น “${label}” สำหรับรายงาน #${id} หรือไม่?`);
    if (!ok) return;

    const old = reports.find(r => r.report_id === id)?.status || "";
    try {
      const res = await fetch(`${API}/reports/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReports(prev => prev.map(r => r.report_id === id ? { ...r, status: newStatus } : r));
        const pendingBefore = reports.filter(r => (r.status || "pending").toLowerCase() === "pending").length;
        const pendingAfter = pendingBefore + (newStatus === "pending" ? 1 : 0) - (String(old).toLowerCase() === "pending" ? 1 : 0);
        window.dispatchEvent(new CustomEvent("reports-updated", { detail: { pending: Math.max(0, pendingAfter) } }));
      } else {
        const t = await res.text();
        alert(`อัปเดตสถานะไม่สำเร็จ: ${t || res.status}`);
      }
    } catch {
      alert("อัปเดตสถานะไม่สำเร็จ");
    }
  }

  async function notifyOwner(report) {
    try {
      const res = await fetch(`${API}/reports/${report.report_id}/notify-owner`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      alert("ส่งการแจ้งเตือนไปยังเจ้าของอีเวนท์แล้ว");
    } catch (e) {
      alert(`ส่งการแจ้งเตือนไม่สำเร็จ: ${e.message}`);
    }
  }

  async function suspendEvent(eventId, reason) {
    if (!window.confirm(`ยืนยันระงับอีเวนท์ #${eventId} หรือไม่?`)) return;
    try {
      const res = await fetch(`${API}/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false, reason: reason || "ถูกระงับโดยผู้ดูแลระบบ" }),
      });
      if (!res.ok) throw new Error(await res.text());
      // อัปเดตสถานะในตารางทันที
      setReports(prev => prev.map(r => r.event_id === eventId ? { ...r, event_is_active: false } : r));
      alert("ระงับอีเวนท์แล้ว");
    } catch (e) {
      alert(`ระงับอีเวนท์ไม่สำเร็จ: ${e.message}`);
    }
  }

  async function activateEvent(eventId) {
    if (!window.confirm(`ยืนยันเปิดใช้งานอีเวนท์ #${eventId} หรือไม่?`)) return;
    try {
      const res = await fetch(`${API}/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      // อัปเดตสถานะในตารางทันที
      setReports(prev => prev.map(r => r.event_id === eventId ? { ...r, event_is_active: true } : r));
      alert("เปิดใช้งานอีเวนท์แล้ว");
    } catch (e) {
      alert(`เปิดใช้งานอีเวนท์ไม่สำเร็จ: ${e.message}`);
    }
  }

  // ลบรายงาน (frontend)
  async function deleteReport(id) {
    if (!window.confirm(`ยืนยันลบรายงาน #${id} หรือไม่?`)) return;
    try {
      const res = await fetch(`${API}/reports/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        alert(`ลบไม่สำเร็จ: ${txt}`);
        return;
      }
      setReports(prev => prev.filter(r => r.report_id !== id));
      alert("ลบรายงานเรียบร้อยแล้ว");
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  }

  const Chip = ({ value, label, count }) => (
    <button
      className={`AdminREEV-chip ${status === value ? "active" : ""}`}
      onClick={() => setStatus(value)}
      type="button"
    >
      {label}
      <span className="AdminREEV-chip-count">{count}</span>
    </button>
  );

  return (
    <div className="AdminREEV">
      <div className="AdminREEV-header">
        <div>
          <div className="AdminREEV-title">รายงานอีเวนท์</div>
          <div className="AdminREEV-subtitle">จัดการรีพอร์ตจากผู้ใช้: ค้นหา กรองข้อมูล ดูรายละเอียด และเปลี่ยนสถานะ</div>
        </div>
        <div className="AdminREEV-filters">
          <div className="AdminREEV-input-wrap">
            <span className="AdminREEV-input-icon" aria-hidden>🔎</span>
            <input
              className="AdminREEV-filter-input"
              placeholder="ค้นหา (เหตุผล/รายละเอียด/ID/อีเวนท์/ผู้ใช้)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="AdminREEV-filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="resolved">แก้ไขแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
          {/* new: filter by report kind */}
          <select
            className="AdminREEV-filter-select"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="all">ทุกประเภท</option>
            <option value="event">รายงาน (อีเวนท์)</option>
            <option value="organizer">รายงาน (ผู้จัดงาน)</option>
          </select>
          <button className="AdminREEV-btn" onClick={fetchReports} title="รีเฟรช" type="button">
            ↻ รีเฟรช
          </button>
        </div>
      </div>

      <div className="AdminREEV-chip-group">
        <Chip value="all" label="ทั้งหมด" count={counts.total} />
        <Chip value="pending" label="รอดำเนินการ" count={counts.pending} />
        <Chip value="resolved" label="แก้ไขแล้ว" count={counts.resolved} />
        <Chip value="rejected" label="ปฏิเสธ" count={counts.rejected} />
      </div>

      <div className="AdminREEV-card" style={{ marginTop: 14 }}>
        {loading ? (
          <div className="AdminREEV-loading">กำลังโหลดข้อมูล...</div>
        ) : filtered.length === 0 ? (
          <div className="AdminREEV-empty">
            <div className="AdminREEV-empty-emoji">🗒️</div>
            <div>ไม่พบรายการ</div>
          </div>
        ) : (
          <>
            <div className="AdminREEV-table-scroll">
              <table className="AdminREEV-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>อีเวนท์</th>
                    <th>ผู้รายงาน</th>
                    <th>เหตุผล</th>
                    <th>รายละเอียด</th>
                    <th>วันที่สร้าง</th>
                    <th>สถานะ</th>
                    <th style={{ minWidth: 260 }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((r) => (
                    <tr key={r.report_id}>
                      <td className="AdminREEV-mono">#{r.report_id}</td>

                      <td>
                        {/* ถ้าเป็นรายงานผู้จัด ให้ลิงก์ไปยังหน้า organizer แทน */}
                        {r.organizer_id ? (
                          <div className="AdminREEV-event-cell">
                            <a
                              href={`/organizers/${r.organizer_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="AdminREEV-event-thumb-wrap"
                              aria-label={`เปิดผู้จัด #${r.organizer_id}`}
                              title={`เปิดผู้จัด #${r.organizer_id}`}
                            >
                              <img
                                className="AdminREEV-event-thumb"
                                src={ r.event_cover ? r.event_cover : (r.organizer_profile ? r.organizer_profile : EVENT_PLACEHOLDER) }
                                alt={`รูปอีเวนท์ #${r.event_id}`}
                                loading="lazy"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = EVENT_PLACEHOLDER; }}
                              />
                            </a>
                          </div>
                        ) : (
                          <div className="AdminREEV-event-cell">
                            <a
                              href={`/events/${r.event_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="AdminREEV-event-thumb-wrap"
                              aria-label={`เปิดอีเวนท์ #${r.event_id}`}
                              title={`เปิดอีเวนท์ #${r.event_id}`}
                            >
                              <img
                                className="AdminREEV-event-thumb"
                                src={ r.event_cover ? r.event_cover : (r.organizer_profile ? r.organizer_profile : EVENT_PLACEHOLDER) }
                                alt={`รูปอีเวนท์ #${r.event_id}`}
                                loading="lazy"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = EVENT_PLACEHOLDER; }}
                              />
                            </a>
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="AdminREEV-user-cell">
                          <span className="AdminREEV-user-name">{r.reporter_name || `ผู้ใช้ #${r.user_id}`}</span>
                          <span className="AdminREEV-user-id">#{r.user_id}</span>
                        </div>
                      </td>

                      <td className="AdminREEV-semi">{r.reason}</td>
                      <td className="AdminREEV-truncate">{r.details || "—"}</td>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleString("th-TH") : "—"}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        {/* NEW: เมนูไอคอน ⋮ */}
                        <div className="AdminREEV-actions">
                          <button
                            type="button"
                            className="AdminREEV-actions-trigger"
                            aria-haspopup="menu"
                            aria-expanded={openMenu === r.report_id}
                            onClick={() =>
                              setOpenMenu(prev => (prev === r.report_id ? null : r.report_id))
                            }
                            title="การจัดการ"
                          >
                            ⋮
                          </button>

                          {openMenu === r.report_id && (
                            <div className="AdminREEV-actions-menu" role="menu">
                              <button
                                className="AdminREEV-actions-item"
                                role="menuitem"
                                onClick={() => { setOpenMenu(null); setViewItem(r); }}
                              >
                                ดูรายละเอียด
                              </button>
                              <button
                                className="AdminREEV-actions-item"
                                role="menuitem"
                                onClick={() => { setOpenMenu(null); updateStatus(r.report_id, "pending"); }}
                              >
                                รอดำเนินการ
                              </button>
                              <button
                                className="AdminREEV-actions-item success"
                                role="menuitem"
                                onClick={() => { setOpenMenu(null); updateStatus(r.report_id, "resolved"); }}
                              >
                                แก้ไขแล้ว
                              </button>
                              <button
                                className="AdminREEV-actions-item danger"
                                role="menuitem"
                                onClick={() => { setOpenMenu(null); updateStatus(r.report_id, "rejected"); }}
                              >
                                ปฏิเสธ
                              </button>
                              <div className="AdminREEV-actions-sep" />
                              <button
                                className="AdminREEV-actions-item"
                                role="menuitem"
                                onClick={() => { setOpenMenu(null); notifyOwner(r); }}
                              >
                                เตือนเจ้าของอีเวนท์
                              </button>

                              {/* แสดงปุ่มตามสถานะอีเวนท์จริง */}
                              {r.event_is_active === false ? (
                                <button
                                  className="AdminREEV-actions-item"
                                  role="menuitem"
                                  onClick={() => { setOpenMenu(null); activateEvent(r.event_id); }}
                                >
                                  เปิดใช้งานอีเวนท์
                                </button>
                              ) : (
                                <button
                                  className="AdminREEV-actions-item danger"
                                  role="menuitem"
                                  onClick={() => { setOpenMenu(null); suspendEvent(r.event_id, r.reason); }}
                                >
                                  ระงับอีเวนท์
                                </button>
                              )}
                              <div className="AdminREEV-actions-sep" />
                              <button
                                className="AdminREEV-actions-item danger"
                                role="menuitem"
                                onClick={() => { setOpenMenu(null); deleteReport(r.report_id); }}
                              >
                                ลบรายงาน
                              </button>
                              <div className="AdminREEV-actions-sep" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="AdminREEV-pagination">
              <button
                className="AdminREEV-btn subtle"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                type="button"
              >
                ← ก่อนหน้า
              </button>
              <span className="AdminREEV-pagination-info">
                หน้า {page} / {totalPages} • แสดง {pageData.length} จาก {filtered.length} รายการ
              </span>
              <button
                className="AdminREEV-btn subtle"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                type="button"
              >
                ถัดไป →
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!viewItem}
        title={viewItem ? `รายละเอียดรีพอร์ต #${viewItem.report_id}` : ""}
        onClose={() => setViewItem(null)}
      >
        {viewItem && (
          <div className="AdminREEV-detail">
            {/* แสดงเป็น Event หรือ Organizer ตามชนิดของ report */}
            {viewItem.organizer_id ? (
              <div className="AdminREEV-detail-row">
                <div className="AdminREEV-detail-label">ผู้ถูกรายงาน (ผู้จัด)</div>
                <div className="AdminREEV-detail-value">
                  <a className="AdminREEV-link" href={`/organizers/${viewItem.organizer_id}`} target="_blank" rel="noreferrer">
                    {viewItem.organizer_name || `ผู้จัด #${viewItem.organizer_id}`} ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="AdminREEV-detail-row">
                <div className="AdminREEV-detail-label">อีเวนท์</div>
                <div className="AdminREEV-detail-value">
                  <a className="AdminREEV-link" href={`/events/${viewItem.event_id}`} target="_blank" rel="noreferrer">
                    #{viewItem.event_id} ↗
                  </a>
                </div>
              </div>
            )}
            <div className="AdminREEV-detail-row">
              <div className="AdminREEV-detail-label">ผู้รายงาน</div>
              <div className="AdminREEV-detail-value">
                {viewItem.reporter_name || `ผู้ใช้ #${viewItem.user_id}`} <span className="AdminREEV-user-id">#{viewItem.user_id}</span>
              </div>
            </div>
            <div className="AdminREEV-detail-row">
              <div className="AdminREEV-detail-label">เหตุผล</div>
              <div className="AdminREEV-detail-value AdminREEV-semi">{viewItem.reason || "—"}</div>
            </div>
            <div className="AdminREEV-detail-row">
              <div className="AdminREEV-detail-label">รายละเอียด</div>
              <div className="AdminREEV-detail-value">{viewItem.details || "—"}</div>
            </div>
            <div className="AdminREEV-detail-row">
              <div className="AdminREEV-detail-label">วันที่สร้าง</div>
              <div className="AdminREEV-detail-value">
                {viewItem.created_at ? new Date(viewItem.created_at).toLocaleString("th-TH") : "—"}
              </div>
            </div>
            <div className="AdminREEV-detail-row">
              <div className="AdminREEV-detail-label">สถานะปัจจุบัน</div>
              <div className="AdminREEV-detail-value"><StatusBadge status={viewItem.status} /></div>
            </div>

            <div className="AdminREEV-detail-actions">
              <button className="AdminREEV-btn subtle" onClick={() => updateStatus(viewItem.report_id, "pending")}>รอดำเนินการ</button>
              <button className="AdminREEV-btn success" onClick={() => updateStatus(viewItem.report_id, "resolved")}>แก้ไขแล้ว</button>
              <button className="AdminREEV-btn danger" onClick={() => updateStatus(viewItem.report_id, "rejected")}>ปฏิเสธ</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}