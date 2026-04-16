import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VenuesManager.css";

const API = "http://localhost:8080";

const VenuesManager = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [images, setImages] = useState({}); // { venue_id: [images] }
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/venues`)
      .then((res) => res.json())
      .then((data) => setVenues(Array.isArray(data) ? data : []))
      .catch(() => setAlert({ show: true, message: "โหลดสถานที่ไม่สำเร็จ", type: "danger" }))
      .finally(() => setLoading(false));
  }, []);

  // preload images for visible venues
  useEffect(() => {
    venues.forEach((v) => {
      if (!images[v.venue_id]) {
        fetch(`${API}/venues/${v.venue_id}/images`)
          .then((res) => res.json())
          .then((imgs) => {
            setImages((prev) => ({ ...prev, [v.venue_id]: Array.isArray(imgs) ? imgs : [] }));
          })
          .catch(() => {
            setImages((prev) => ({ ...prev, [v.venue_id]: [] }));
          });
      }
    });
  }, [venues]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return venues;
    return venues.filter(
      (v) =>
        v.name?.toLowerCase().includes(s) ||
        v.description?.toLowerCase().includes(s) ||
        v.location?.toLowerCase().includes(s)
    );
  }, [q, venues]);

  const getCover = (vid) => {
    const imgs = images[vid] || [];
    const c = imgs.find((i) => i.is_cover) || imgs[0];
    if (c && c.image_url) return `http://localhost:8080${c.image_url.replace(/^\./, "")}`;
    return "https://placehold.co/420x280?text=No+Image";
  };

  const handleDelete = async (venue) => {
    if (!confirm(`ลบสถานที่ "${venue.name}" ?`)) return;
    try {
      const res = await fetch(`${API}/venues/${venue.venue_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      setVenues((p) => p.filter((x) => x.venue_id !== venue.venue_id));
      setAlert({ show: true, message: "ลบสำเร็จ", type: "success" });
    } catch (e) {
      setAlert({ show: true, message: e.message || "ลบไม่สำเร็จ", type: "danger" });
    }
  };

  const handleToggle = async (venue) => {
    const next = !venue.is_active;
    try {
      const res = await fetch(`${API}/venues/${venue.venue_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error("อัปเดตสถานะไม่สำเร็จ");
      setVenues((p) => p.map((v) => (v.venue_id === venue.venue_id ? { ...v, is_active: next } : v)));
      setAlert({ show: true, message: next ? "เปิดใช้งานแล้ว" : "ระงับแล้ว", type: "success" });
    } catch (e) {
      setAlert({ show: true, message: e.message || "อัปเดตไม่สำเร็จ", type: "danger" });
    }
  };

  return (
    <div className="venues-manager">
      <div className="vm-header">
        <h1>จัดการสถานที่</h1>
        <div className="vm-actions">
          <input className="vm-search" placeholder="ค้นหาสถานที่..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="vm-btn primary" onClick={() => navigate("/venues/create")}>เพิ่มสถานที่</button>
        </div>
      </div>

      {alert.show && <div className={`vm-alert ${alert.type}`}>{alert.message}</div>}

      {loading ? (
        <div className="vm-loading">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="vm-empty">ไม่พบสถานที่</div>
      ) : (
        <div className="vm-grid">
          {filtered.map((v) => (
            <div key={v.venue_id} className="vm-card">
              <div className="vm-cover">
                <img src={getCover(v.venue_id)} alt={v.name} onError={(e) => (e.currentTarget.src = "https://placehold.co/420x280?text=No+Image")} />
              </div>
              <div className="vm-body">
                <h3 className="vm-title">{v.name}</h3>
                <p className="vm-location">{v.location}</p>
                <p className="vm-desc">{v.description ? (v.description.length > 120 ? `${v.description.slice(0,120)}...` : v.description) : "—"}</p>
              </div>
              <div className="vm-footer">
                <div className="vm-meta">
                  <span>⭐ {typeof v.rating === "number" ? v.rating.toFixed(1) : "—"}</span>
                  <span>• {v.review_count || 0} รีวิว</span>
                </div>
                <div className="vm-controls">
                  <button className="vm-btn" onClick={() => navigate(`/venues/${v.venue_id}`)}>ดู</button>
                  <button className="vm-btn" onClick={() => navigate(`/venues/${v.venue_id}/edit`)}>แก้ไข</button>
                  <button className={`vm-btn ${v.is_active === false ? "danger" : "ghost"}`} onClick={() => handleToggle(v)}>
                    {v.is_active === false ? "เปิดใช้งาน" : "ระงับ"}
                  </button>
                  <button className="vm-btn danger" onClick={() => handleDelete(v)}>ลบ</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenuesManager;