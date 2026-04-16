import React, { useEffect, useMemo, useState } from "react";
import "./AdminAIImages.css";
import useGlassConfirm from "../hooks/useGlassConfirm.js"; // เพิ่ม

const API = "http://localhost:8080";

const AdminAIImages = () => {
  // ผู้ใช้
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userQ, setUserQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // all | member | organizer | admin

  // การเลือกผู้ใช้ + รูป
  const [userId, setUserId] = useState("");
  const [imageType, setImageType] = useState("invitation"); // 'invitation' | 'theme'
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ตัวกรองรูป
  const [q, setQ] = useState("");
  const [groupByAlbum, setGroupByAlbum] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [ConfirmUI, confirm] = useGlassConfirm(); // เพิ่ม

  const canFetch = useMemo(() => /^[0-9]+$/.test(String(userId).trim()), [userId]);

  // โหลดรายการผู้ใช้ทั้งหมด
  useEffect(() => {
    let cancelled = false;

    // helper: ดึงจำนวนรูปของ user ต่อประเภท
    const getImageCount = async (uid, type) => {
      try {
        const res = await fetch(`${API}/ai-generated-images/user/${uid}/${type}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && typeof data.count === "number") return data.count;
      } catch {
        // ignore error
      }
      return 0;
    };

    // helper: มีรูป AI อย่างน้อย 1 รูปหรือไม่ (เช็คทั้ง invitation และ theme แบบขนาน)
    const hasAnyAIImage = async (uid) => {
      const [inv, thm] = await Promise.all([
        getImageCount(uid, "invitation"),
        getImageCount(uid, "theme"),
      ]);
      return (inv + thm) > 0;
    };

    // กรองผู้ใช้ให้เหลือเฉพาะคนที่มีรูป AI
    const filterUsersWithAI = async (list) => {
      // จำกัดการอัปเดต UI ขณะกำลังคัดกรอง
      setUsersLoading(true);
      const results = await Promise.all(
        list.map(async (u) => ((await hasAnyAIImage(u.user_id)) ? u : null))
      );
      return results.filter(Boolean);
    };

    setUsersLoading(true);

    const loadUsers = async () => {
      try {
        const res = await fetch(`${API}/users`);
        const data = await res.json();
        const all = Array.isArray(data) ? data : [];
        // กรองเฉพาะผู้ที่มีรูป AI
        const onlyHasAI = await filterUsersWithAI(all);
        if (!cancelled) {
          setUsers(onlyHasAI);
        }
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  // ค้นหา/กรองผู้ใช้
  const filteredUsers = useMemo(() => {
    const s = (userQ || "").trim().toLowerCase();
    return users.filter((u) => {
      const matchRole =
        roleFilter === "all" || (u.role || "").toLowerCase() === roleFilter;
      const name = [u.first_name, u.last_name, u.username, u.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchRole && (!s || name.includes(s));
    });
  }, [users, userQ, roleFilter]);

  // ดึงรูปตามผู้ใช้ + ประเภท
  const fetchImages = async () => {
    if (!canFetch) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/ai-generated-images/user/${String(userId).trim()}/${imageType}`
      );
      const data = await res.json().catch(() => ({}));
      const list = res.ok && data && Array.isArray(data.images) ? data.images : [];
      setImages(list);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  // ลบรูปเดี่ยว
  const deleteImage = async (img) => {
    const ok = await confirm({
      title: "ยืนยันลบรูป",
      message: `ต้องการลบรูป #${img.id} นี้หรือไม่?`,
      type: "danger",
      confirmText: "ลบ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    try {
      const url = `${API}/ai-generated-images/${img.id}?user_id=${String(userId).trim()}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const t = await res.text();
        alert(t || "ลบรูปไม่สำเร็จ");
        return;
      }
      setImages((prev) => prev.filter((x) => x.id !== img.id));
    } catch {
      alert("ลบรูปไม่สำเร็จ");
    }
  };

  // ลบทั้งอัลบั้ม
  const deleteAlbum = async (aid) => {
    const ok = await confirm({
      title: "ยืนยันลบอัลบั้ม",
      message: `ต้องการลบอัลบั้ม ${aid} ทั้งชุดหรือไม่?`,
      type: "danger",
      confirmText: "ลบอัลบั้ม",
      closeOnOverlay: false,
    });
    if (!ok) return;

    try {
      const url = `${API}/ai-generated-images/album/${aid}?user_id=${String(userId).trim()}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const t = await res.text();
        alert(t || "ลบอัลบั้มไม่สำเร็จ");
        return;
      }
      setImages((prev) => prev.filter((x) => String(x.album_id || "") !== String(aid)));
    } catch {
      alert("ลบอัลบั้มไม่สำเร็จ");
    }
  };

  // auto fetch เมื่อเปลี่ยนผู้ใช้หรือประเภท
  useEffect(() => {
    if (canFetch) fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageType, userId]);

  // สร้างชุดข้อมูลอัลบั้ม/เดี่ยว
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return images;
    return images.filter(
      (img) =>
        String(img.prompt || "").toLowerCase().includes(s) ||
        String(img.enhanced_prompt || "").toLowerCase().includes(s) ||
        String(img.album_id || "").toLowerCase().includes(s) ||
        String(img.id || "").includes(s)
    );
  }, [images, q]);

  const { albums, singles } = useMemo(() => {
    const albumMap = {};
    const single = [];
    for (const it of filtered) {
      const aid = it.is_album && it.album_id ? String(it.album_id) : "";
      if (aid) {
        if (!albumMap[aid]) albumMap[aid] = [];
        albumMap[aid].push(it);
      } else {
        single.push(it);
      }
    }
    Object.keys(albumMap).forEach((k) => {
      albumMap[k].sort(
        (a, b) => (a.variation_number || 0) - (b.variation_number || 0)
      );
    });
    single.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    return { albums: albumMap, singles: single };
  }, [filtered]);

  const albumKeys = useMemo(
    () =>
      Object.keys(albums).sort((a, b) => {
        const latestA =
          [...albums[a]]
            .sort(
              (x, y) =>
                new Date(y.created_at || 0) - new Date(x.created_at || 0)
            )[0]?.created_at || 0;
        const latestB =
          [...albums[b]]
            .sort(
              (x, y) =>
                new Date(y.created_at || 0) - new Date(x.created_at || 0)
            )[0]?.created_at || 0;
        return new Date(latestB) - new Date(latestA);
      }),
    [albums]
  );

  const avatar = (u) => {
    const p = u?.profile_image || "";
    if (!p) return "https://placehold.co/36x36?text=%F0%9F%91%A4";
    return p.startsWith("http")
      ? p
      : `${API}${p.startsWith("/") ? "" : "/"}${p.replace(/^\./, "")}`;
  };

  // สร้าง JSX รายการผู้ใช้ (เลี่ยง ternary ซ้อน)
  const userList = useMemo(() => {
    if (usersLoading) {
      return <div className="AdminAI-u-loading">กำลังโหลดผู้ใช้...</div>;
    }
    if (filteredUsers.length === 0) {
      return <div className="AdminAI-u-empty">ไม่พบผู้ใช้</div>;
    }
    return filteredUsers.map((u) => (
      <button
        key={u.user_id}
        type="button"
        className={`AdminAI-user${
          String(userId) === String(u.user_id) ? " active" : ""
        }`}
        onClick={() => setUserId(String(u.user_id))}
        title={u.email}
      >
        <img
          className="AdminAI-u-avatar"
          src={avatar(u)}
          alt=""
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/36x36?text=%F0%9F%91%A4";
          }}
        />
        <div className="AdminAI-u-meta">
          <div className="AdminAI-u-name">
            {u.first_name || u.username || "ผู้ใช้"} {u.last_name || ""}
          </div>
          <div className="AdminAI-u-sub">{u.email || "—"}</div>
        </div>
        <span className={`AdminAI-u-role chip-${u.role || "member"}`}>
          {u.role || "member"}
        </span>
      </button>
    ));
  }, [usersLoading, filteredUsers, userId]);

  return (
    <div className="AdminAI">
      {ConfirmUI} {/* กล่องยืนยันส่วนกลาง */}
      <div className="AdminAI-head">
        <div>
          <div className="AdminAI-title">รูปภาพที่สร้างด้วย AI</div>
          <div className="AdminAI-subtitle">
            เลือกผู้ใช้ด้านซ้าย จากนั้นเลือกประเภทภาพเพื่อดูผลลัพธ์
          </div>
        </div>
      </div>

      <div className="AdminAI-two">
        {/* ซ้าย: รายชื่อผู้ใช้ */}
        <aside className="AdminAI-users">
          <div className="AdminAI-u-head">
            <input
              className="AdminAI-u-search"
              placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล)"
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
            />
            <div className="AdminAI-rolebar">
              {["all", "member", "organizer", "admin"].map((r) => (
                <button
                  key={r}
                  className={`AdminAI-rolebtn${
                    roleFilter === r ? " active" : ""
                  }`}
                  onClick={() => setRoleFilter(r)}
                  title={r === "all" ? "ทั้งหมด" : r}
                >
                  {r === "all" ? "ทั้งหมด" : r}
                </button>
              ))}
            </div>
          </div>

          <div className="AdminAI-ul">{userList}</div>
        </aside>

        {/* ขวา: รูปภาพของผู้ใช้ */}
        <section className="AdminAI-right">
          <div className="AdminAI-tools">
            <select
              className="AdminAI-select"
              value={imageType}
              onChange={(e) => setImageType(e.target.value)}
            >
              <option value="invitation">Invitation</option>
              <option value="theme">Theme</option>
            </select>

            <div className="AdminAI-search-wrap">
              <span className="AdminAI-search-ico" aria-hidden>
                🔎
              </span>
              <input
                className="AdminAI-search"
                placeholder="ค้นหา (prompt/album_id/ID)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <label className="AdminAI-toggle">
              <input
                type="checkbox"
                checked={groupByAlbum}
                onChange={(e) => setGroupByAlbum(e.target.checked)}
              />
              <span>จัดกลุ่มเป็นอัลบั้ม</span>
            </label>

            <div className="AdminAI-spacer" />

            {/* ปุ่ม manual เผื่อ reload */}
            <button
              className="AdminAI-btn"
              onClick={fetchImages}
              disabled={!canFetch || loading}
            >
              รีเฟรช
            </button>
          </div>

          <div className="AdminAI-count">ทั้งหมด {filtered.length} รูป</div>

          <div className="AdminAI-card">
            {!canFetch ? (
              <div className="AdminAI-empty">เลือกผู้ใช้จากด้านซ้ายเพื่อเริ่มต้น</div>
            ) : loading ? (
              <div className="AdminAI-loading">กำลังโหลด...</div>
            ) : filtered.length === 0 ? (
              <div className="AdminAI-empty">ไม่พบข้อมูล</div>
            ) : groupByAlbum && albumKeys.length > 0 ? (
              <div className="AdminAI-albums">
                {albumKeys.map((aid) => (
                  <div key={aid} className="AdminAI-album">
                    <div className="AdminAI-album-head">
                      <div className="AdminAI-album-title">อัลบั้ม: {aid}</div>
                      <div className="AdminAI-album-actions">
                        <button
                          className="AdminAI-btn danger"
                          onClick={() => deleteAlbum(aid)}
                        >
                          ลบอัลบั้ม
                        </button>
                        <button
                          className="AdminAI-btn"
                          onClick={() => setSelectedAlbum(albums[aid])}
                        >
                          ดูทั้งหมด
                        </button>
                      </div>
                    </div>
                    <div className="AdminAI-grid">
                      {albums[aid].map((img) => (
                        <div key={img.id} className="AdminAI-item">
                          <div
                            className="AdminAI-thumb-wrap"
                            title={`variation #${img.variation_number || 1}`}
                          >
                            <img
                              className="AdminAI-thumb"
                              src={`data:image/png;base64,${img.base64_data}`}
                              alt={`AI ${imageType}`}
                              loading="lazy"
                              onClick={() => setSelectedImage(img)}
                            />
                            <div className="AdminAI-variation">
                              #{img.variation_number || 1}
                            </div>
                          </div>
                          <div className="AdminAI-meta">
                            <div className="AdminAI-prompt" title={img.prompt}>
                              {(img.prompt || "—").slice(0, 60)}
                              {(img.prompt || "").length > 60 ? "..." : ""}
                            </div>
                            <div className="AdminAI-info">
                              <span>สร้างเมื่อ: {img.created_at}</span>
                              {img.has_reference ? (
                                <span className="AdminAI-badge">has ref</span>
                              ) : null}
                            </div>
                          </div>
                          <div className="AdminAI-actions">
                            <button
                              className="AdminAI-btn danger"
                              onClick={() => deleteImage(img)}
                            >
                              ลบ
                            </button>
                            <a
                              className="AdminAI-btn ghost"
                              href={`data:image/png;base64,${img.base64_data}`}
                              download={`${imageType}_${
                                img.variation_number || 1
                              }.png`}
                            >
                              ดาวน์โหลด
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="AdminAI-grid">
                {singles.map((img) => (
                  <div key={img.id} className="AdminAI-item">
                    <div className="AdminAI-thumb-wrap">
                      <img
                        className="AdminAI-thumb"
                        src={`data:image/png;base64,${img.base64_data}`}
                        alt={`AI ${imageType}`}
                        loading="lazy"
                        onClick={() => setSelectedImage(img)}
                      />
                      {img.is_album && img.album_id ? (
                        <div
                          className="AdminAI-album-badge"
                          onClick={() => setSelectedAlbum([img])}
                          title={`อัลบั้ม ${img.album_id}`}
                        >
                          ALBUM
                        </div>
                      ) : null}
                    </div>
                    <div className="AdminAI-meta">
                      <div className="AdminAI-prompt" title={img.prompt}>
                        {(img.prompt || "—").slice(0, 60)}
                        {(img.prompt || "").length > 60 ? "..." : ""}
                      </div>
                      <div className="AdminAI-info">
                        <span>ID: {img.id}</span>
                        <span> • </span>
                        <span>{img.created_at}</span>
                      </div>
                    </div>
                    <div className="AdminAI-actions">
                      <button
                        className="AdminAI-btn danger"
                        onClick={() => deleteImage(img)}
                      >
                        ลบ
                      </button>
                      <a
                        className="AdminAI-btn ghost"
                        href={`data:image/png;base64,${img.base64_data}`}
                        download={`${imageType}_${
                          img.variation_number || 1
                        }.png`}
                      >
                        ดาวน์โหลด
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Album modal */}
      {selectedAlbum && (
        <div className="AdminAI-modal" onClick={() => setSelectedAlbum(null)}>
          <div
            className="AdminAI-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="AdminAI-modal-head">
              <div className="AdminAI-modal-title">
                อัลบั้ม ({selectedAlbum.length} รูป)
              </div>
              <button
                className="AdminAI-modal-close"
                onClick={() => setSelectedAlbum(null)}
              >
                ✕
              </button>
            </div>
            <div className="AdminAI-modal-grid">
              {selectedAlbum.map((img) => (
                <div
                  key={img.id}
                  className="AdminAI-modal-item"
                  title={`variation #${img.variation_number || 1}`}
                >
                  <img
                    src={`data:image/png;base64,${img.base64_data}`}
                    alt="album"
                    onClick={() => setSelectedImage(img)}
                  />
                  <div className="AdminAI-modal-variation">
                    #{img.variation_number || 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image modal */}
      {selectedImage && (
        <div className="AdminAI-modal" onClick={() => setSelectedImage(null)}>
          <div
            className="AdminAI-modal-content AdminAI-modal-content--image"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="AdminAI-modal-close"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <img
              className="AdminAI-modal-img"
              src={`data:image/png;base64,${selectedImage.base64_data}`}
              alt="preview"
            />
            <div className="AdminAI-modal-footer">
              <div
                className="AdminAI-modal-caption"
                title={selectedImage.prompt}
              >
                {selectedImage.prompt || "—"}
              </div>
              <a
                className="AdminAI-btn"
                href={`data:image/png;base64,${selectedImage.base64_data}`}
                download={`${imageType}_${
                  selectedImage.variation_number || 1
                }.png`}
              >
                ดาวน์โหลด
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIImages;