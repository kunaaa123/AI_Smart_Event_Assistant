import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import "./AdminVenues.css";
import useGlassConfirm from "../hooks/useGlassConfirm"; // เพิ่ม

const API = "http://localhost:8080";

/* MapPicker component: โหลด Google Maps + Places, มี search box, คลิกบนแผนที่ หรือเลือกผลค้นหาได้ */
const MapPicker = ({ initialLat = 13.736717, initialLng = 100.523186, onChange }) => {
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const infoRef = useRef(null);

  const loadScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("no window"));
      if (window.google && window.google.maps && window.google.maps.places) return resolve();
      const existing = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existing) {
        const t = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(t);
            resolve();
          }
        }, 100);
        setTimeout(() => { clearInterval(t); reject(new Error("Google Maps load timeout")); }, 10000);
        return;
      }
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
      s.async = true;
      s.defer = true;
      s.onload = () => {
        // wait for places to be available
        const t = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(t);
            resolve();
          }
        }, 50);
        setTimeout(() => { clearInterval(t); reject(new Error("Google Maps init timeout")); }, 7000);
      };
      s.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(s);
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadScript();
        if (!mounted) return;
        const center = { lat: parseFloat(initialLat) || 13.736717, lng: parseFloat(initialLng) || 100.523186 };
        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          gestureHandling: "greedy",
          streetViewControl: false,
          mapTypeControl: false,
        });

        const marker = new window.google.maps.Marker({ position: center, map, draggable: false });
        const infowindow = new window.google.maps.InfoWindow();
        markerRef.current = marker;
        infoRef.current = infowindow;

        // click to pick
        map.addListener("click", async (ev) => {
          const lat = ev.latLng.lat();
          const lng = ev.latLng.lng();
          marker.setPosition({ lat, lng });
          infowindow.setContent(`<div style="padding:6px">พิกัด: ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>`);
          infowindow.open(map, marker);
          onChange && onChange({ lat, lng, place: null });
        });

        // search box (Places Autocomplete)
        const input = inputRef.current;
        const searchBox = new window.google.maps.places.SearchBox(input);
        map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(input);

        searchBox.addListener("places_changed", () => {
          const places = searchBox.getPlaces();
          if (!places || places.length === 0) return;
          const p = places[0];
          const lat = p.geometry?.location?.lat();
          const lng = p.geometry?.location?.lng();
          if (lat && lng) {
            const pos = { lat, lng };
            map.panTo(pos);
            marker.setPosition(pos);
            infowindow.setContent(`<div style="padding:6px"><strong>${p.name || ""}</strong><div style="font-size:12px;color:#666">${p.formatted_address || ""}</div></div>`);
            infowindow.open(map, marker);
            onChange && onChange({
              lat,
              lng,
              place: {
                name: p.name,
                address: p.formatted_address,
                place_id: p.place_id,
                types: p.types
              }
            });
          }
        });

      } catch (err) {
        console.warn("MapPicker init error", err);
      }
    })();

    return () => { mounted = false; };
  }, [initialLat, initialLng, loadScript, onChange]);

  return (
    <div className="advne-map-picker-wrap">
      <input ref={inputRef} className="advne-map-picker-search" placeholder="ค้นหาสถานที่ (พิมพ์ชื่อหรือที่อยู่)" />
      <div ref={mapRef} className="advne-map-picker-map" />
    </div>
  );
};

const AdminVenues = () => {
  const [venues, setVenues] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // modal / form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    venue_type: "",
    price_range: "",
    latitude: "",
    longitude: ""
  });
  // แยกเป็น cover file (เดี่ยว) และ gallery files (หลายไฟล์)
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [alert, setAlert] = useState({ show: false, msg: "", type: "success" });

  // new: edit id (null = creating)
  const [editingId, setEditingId] = useState(null);

  const [ConfirmUI, ask] = useGlassConfirm(); // เพิ่ม

  // ป้องกัน background scroll และป้องกัน layout shift (scrollbar หาย -> หน้ากระโดด)
  useEffect(() => {
    if (!showCreateModal) return;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    return () => {
      document.body.style.overflow = prevOverflow || "";
      document.body.style.paddingRight = prevPaddingRight || "";
    };
  }, [showCreateModal]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/venues`);
      const data = await res.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return venues;
    return venues.filter(v => (v.name || "").toLowerCase().includes(s) || (v.location || "").toLowerCase().includes(s));
  }, [q, venues]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onGalleryFiles = (e) => {
    const list = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    setGalleryFiles(list);
  };

  const onCoverFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f && f.type.startsWith("image/")) {
      setCoverFile(f);
      setCoverPreview(URL.createObjectURL(f));
    } else {
      setCoverFile(null);
      setCoverPreview("");
    }
  };

  const showAlert = (msg, type = "success") => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
  };

  // รับค่าจาก MapPicker
  const handleMapChange = ({ lat, lng, place }) => {
    setForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: place?.address || prev.location || ""
    }));
  };

  // Open modal for creating (reset) or editing (prefill)
  const openCreateModal = () => {
    setEditingId(null);
    setForm({ name: "", description: "", location: "", venue_type: "", price_range: "", latitude: "", longitude: "" });
    setCoverFile(null);
    setCoverPreview("");
    setGalleryFiles([]);
    setShowCreateModal(true);
  };

  const openEditModal = async (v) => {
    setEditingId(v.venue_id);
    setForm({
      name: v.name || "",
      description: v.description || "",
      location: v.location || "",
      venue_type: v.venue_type || "",
      price_range: v.price_range || "",
      latitude: v.latitude ? String(v.latitude) : "",
      longitude: v.longitude ? String(v.longitude) : ""
    });
    setCoverFile(null);
    setCoverPreview(coverUrl(v));
    setGalleryFiles([]);
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e && e.preventDefault();
    if (!form.name.trim()) return showAlert("กรุณาใส่ชื่อสถานที่", "danger");
    setCreating(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        location: form.location,
        venue_type: form.venue_type,
        price_range: form.price_range || "ไม่ระบุ",
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        rating: 0,
        review_count: 0
      };

      let created = null;
      let vid = editingId;

      if (editingId) {
        // update existing
        const r = await fetch(`${API}/venues/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!r.ok) {
          const t = await r.text();
          throw new Error(t || "อัปเดตสถานที่ไม่สำเร็จ");
        }
        created = await r.json();
        vid = created.venue_id || created.VenueID || created.id || created.venueId;
      } else {
        // create new
        const r = await fetch(`${API}/venues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!r.ok) {
          const t = await r.text();
          throw new Error(t || "สร้างสถานที่ไม่สำเร็จ");
        }
        created = await r.json();
        vid = created.venue_id || created.VenueID || created.id || created.venueId;
      }

      // 1) upload cover (single file) -> mark cover_index=0 so backend updates venue.cover_image
      if (coverFile && vid) {
        try {
          const fdCover = new FormData();
          fdCover.append("images", coverFile);
          fdCover.append("cover_index", "0"); // ensure backend treats this file as cover
          const upc = await fetch(`${API}/venues/${vid}/images`, { method: "POST", body: fdCover });
          if (!upc.ok) {
            console.warn("upload cover failed", await upc.text());
          } else {
            try { console.log("cover uploaded", await upc.json()); } catch { /* intentionally ignored */ }
          }
        } catch (err) {
          console.warn("cover upload error", err);
        }
      }

      // 2) upload gallery files (if any) — do not send cover_index so none are marked cover
      if (galleryFiles.length > 0 && vid) {
        try {
          const fdG = new FormData();
          galleryFiles.forEach((f) => fdG.append("images", f));
          const upg = await fetch(`${API}/venues/${vid}/images`, { method: "POST", body: fdG });
          if (!upg.ok) {
            console.warn("upload gallery failed", await upg.text());
          } else {
            try { console.log("gallery uploaded", await upg.json()); } catch { /* intentionally ignored */ }
          }
        } catch (err) {
          console.warn("gallery upload error", err);
        }
      }

      showAlert(editingId ? "บันทึกการแก้ไขสำเร็จ" : "สร้างสถานที่สำเร็จ", "success");
      setForm({ name: "", description: "", location: "", venue_type: "", price_range: "", latitude: "", longitude: "" });
      setCoverFile(null);
      setCoverPreview("");
      setGalleryFiles([]);
      setShowCreateModal(false);
      setEditingId(null);
      await fetchAll();
    } catch (err) {
      console.error(err);
      showAlert(err.message || "เกิดข้อผิดพลาด", "danger");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (v) => {
    const ok = await ask({
      title: "ยืนยันลบสถานที่",
      message: `ลบสถานที่ "${v.name}" และรูปภาพที่เกี่ยวข้องหรือไม่?`,
      type: "danger",
      confirmText: "ลบ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    try {
      const res = await fetch(`${API}/venues/${v.venue_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      showAlert("ลบสถานที่สำเร็จ");
      setVenues(prev => prev.filter(it => it.venue_id !== v.venue_id));
    } catch (err) {
      showAlert(err.message || "ลบไม่สำเร็จ", "danger");
    }
  };

  const coverUrl = (v) => {
    if (!v) return "https://placehold.co/320x180?text=No+Image";
    const url = v.cover_image || v.coverImage || v.CoverImage || "";
    if (!url) return "https://placehold.co/320x180?text=No+Image";
    return url.startsWith("http") ? url : `${API}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="advne-venues">
      {ConfirmUI} {/* กล่องยืนยันส่วนกลาง */}
      {alert.show && <div className={`advne-venues-alert ${alert.type}`}>{alert.msg}</div>}

      <div className="advne-venues-head">
        <h1>จัดการ สถานที่</h1>
        <div className="advne-venues-tools">
          <input className="advne-venues-search" placeholder="ค้นหาชื่อหรือที่ตั้ง..." value={q} onChange={(e) => setQ(e.target.value)} />
           <div className="advne-venues-count">ทั้งหมด {filtered.length} รายการ</div>
           <button className="advne-btn advne-primary" onClick={openCreateModal}>➕ เพิ่มสถานที่</button>
         </div>
       </div>

      {/* Create / Edit modal */}
      {showCreateModal && (
        <div className="advne-venues-modal" onClick={() => { setShowCreateModal(false); setEditingId(null); }}>
          <div className="advne-venues-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="advne-venues-modal-header">
              <h3>{editingId ? "แก้ไขสถานที่" : "เพิ่มสถานที่ใหม่"}</h3>
              <button className="advne-venues-modal-close" onClick={() => { setShowCreateModal(false); setEditingId(null); }}>✕</button>
            </div>
            <form className="advne-venues-form" onSubmit={handleCreate}>
              <div className="row">
                <input name="name" value={form.name} onChange={onChange} placeholder="ชื่อสถานที่ *" />
                <input name="venue_type" value={form.venue_type} onChange={onChange} placeholder="ประเภทสถานที่" />
              </div>
              <div className="row">
                <input name="location" value={form.location} onChange={onChange} placeholder="ที่อยู่ / เมือง (จะถูกเติมอัตโนมัติจากแผนที่)" />
                <input name="price_range" value={form.price_range} onChange={onChange} placeholder="ช่วงราคา" />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>เลือกตำแหน่งบนแผนที่</label>
                <MapPicker
                  initialLat={form.latitude || 13.736717}
                  initialLng={form.longitude || 100.523186}
                  onChange={handleMapChange}
                />
                <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
                  พิกัด: {form.latitude ? parseFloat(form.latitude).toFixed(6) : "ยังไม่ได้เลือก"}, {form.longitude ? parseFloat(form.longitude).toFixed(6) : "ยังไม่ได้เลือก"}
                </div>
              </div>

              <textarea name="description" value={form.description} onChange={onChange} placeholder="คำอธิบาย (ไม่บังคับ)" />

              <div className="advne-files-row">
                <label className="advne-file-label">
                  รูปปก (ไฟล์เดียว)
                  <input type="file" accept="image/*" onChange={onCoverFile} />
                </label>
                <div className="advne-files-preview">
                  {coverPreview ? (
                    <div className="advne-file-p cover">
                      <img src={coverPreview} alt="cover-preview" style={{ maxWidth: 120, borderRadius: 6 }} />
                    </div>
                  ) : null}
                </div>

                <label className="advne-file-label" style={{ marginTop: 8 }}>
                  รูปเพิ่มเติม (Gallery) - เลือกหลายไฟล์ได้
                  <input type="file" multiple accept="image/*" onChange={onGalleryFiles} />
                </label>
                <div className="advne-files-preview">
                  {galleryFiles.map((f, i) => (
                    <div key={i} className={`advne-file-p`}>
                      <span>{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="advne-actions" style={{ marginTop: 8 }}>
                <button type="submit" className="advne-btn advne-primary" disabled={creating}>{creating ? (editingId ? "กำลังบันทึก..." : "กำลังสร้าง...") : (editingId ? "บันทึกการแก้ไข" : "สร้างสถานที่")}</button>
                <button type="button" className="advne-btn" onClick={() => {
                  setForm({ name: "", description: "", location: "", venue_type: "", price_range: "", latitude: "", longitude: "" });
                  setCoverFile(null);
                  setCoverPreview("");
                  setGalleryFiles([]);
                  setEditingId(null);
                }}>รีเซ็ต</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="advne-venues-list">
        {loading ? <div>กำลังโหลด...</div> : (
          <div className="advne-grid">
            {filtered.map(v => (
              <div key={v.venue_id} className="advne-card">
                <div className="advne-card-cover">
                  <img src={coverUrl(v)} alt={v.name} onError={(e)=>{e.currentTarget.src="https://placehold.co/320x180?text=No+Image"}} />
                </div>
                <div className="advne-card-body">
                  <div className="advne-card-title">{v.name}</div>
                  <div className="advne-card-sub">{v.location} • {v.venue_type}</div>
                </div>
                <div className="advne-card-actions">
                  <button onClick={() => window.open(`/venues/${v.venue_id}`, "_self")} className="advne-btn">ดู</button>
                  <button onClick={() => openEditModal(v)} className="advne-btn">แก้ไข</button>
                  <button onClick={() => handleDelete(v)} className="advne-btn advne-danger">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminVenues;