import React, { useEffect, useState } from "react";
import "./AdminRequests.css";
import useGlassConfirm from "../hooks/useGlassConfirm.js"; // เปลี่ยนมาใช้ hook

const API = "http://localhost:8080";

const normalizeRequest = (r) => ({
  request_id: r.request_id ?? r.RequestID ?? r.requestId,
  user_id: r.user_id ?? r.UserID ?? r.userId,
  organizer_name: r.organizer_name ?? r.OrganizerName ?? r.organizerName,
  category: r.category ?? r.Category ?? r.CategoryName ?? "",
  email: r.email ?? r.Email ?? "",
  phone: r.phone ?? r.Phone ?? "",
  price: r.price ?? r.Price ?? "",
  description: r.description ?? r.Description ?? "",
  image_label: r.image_label ?? r.ImageLabel ?? r.imageLabel ?? null,
  // use || so empty string also falls back to "pending"
  status: (r.status || r.Status || "pending").toString(),
  created_at: r.created_at ?? r.CreatedAt ?? null,
});

const AdminRequests = () => {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ค่าเริ่มต้นเป็น "pending" (มี setter เพื่อสลับแสดงระหว่าง pending / approved)
  const [statusFilter, setStatusFilter] = useState("pending");

  // ใช้ GlassConfirm hook
  const [ConfirmUI, confirm] = useGlassConfirm();

  const loadList = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API}/request_organizers`);
      const data = await res.json();
      if (!Array.isArray(data)) {
        setList([]);
        window.dispatchEvent(new CustomEvent("requests-updated", { detail: { pending: 0 } }));
      } else {
        const listWithAvatars = await Promise.all(
          data.map(async (r) => {
            const nr = normalizeRequest(r);
            let avatar = "/default-avatar.png";
            const uid = nr.user_id;
            if (uid) {
              try {
                const ures = await fetch(`${API}/users/${uid}`);
                if (ures.ok) {
                  const u = await ures.json();
                  const p = u.profile_image ?? u.ProfileImage ?? u.profileImage ?? null;
                  if (p) avatar = p.startsWith("http") ? p : `${API}${p}`;
                }
              } catch (e) {
                console.error("fetch user for avatar failed", e);
              }
            }
            return { ...nr, avatar };
          })
        );
        setList(listWithAvatars);
        const pendingCount = listWithAvatars.filter((it) => ((it.status || "").toLowerCase() === "pending")).length;
        window.dispatchEvent(new CustomEvent("requests-updated", { detail: { pending: pendingCount } }));
      }
    } catch (e) {
      console.error("load requests:", e);
      setList([]);
      window.dispatchEvent(new CustomEvent("requests-updated", { detail: { pending: 0 } }));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const loadDetail = async (requestId, userId) => {
    setSelectedId(requestId);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const [rres, ires, ures] = await Promise.allSettled([
        fetch(`${API}/request_organizers/${requestId}`),
        fetch(`${API}/request_organizers/${requestId}/images`),
        userId ? fetch(`${API}/users/${userId}`) : Promise.resolve({ ok: false }),
      ]);

      let requestData = null;
      if (rres.status === "fulfilled" && rres.value.ok) requestData = await rres.value.json();

      let images = [];
      if (ires.status === "fulfilled" && ires.value.ok) {
        const imgs = await ires.value.json();
        if (Array.isArray(imgs)) images = imgs.map((it) => (it.image_url?.startsWith("http") ? it.image_url : `${API}${it.image_url}`));
      } else if (requestData && requestData.image_label) {
        const il = requestData.image_label;
        const url =
          il.startsWith("http")
            ? il
            : il.startsWith("/uploads/")
            ? `${API}${il}`
            : `${API}/uploads/request_organizers/${il}`;
        images = [url];
      }

      let user = null;
      if (ures.status === "fulfilled" && ures.value.ok) {
        user = await ures.value.json();
      }

      setDetail({
        request: normalizeRequest(requestData ?? {}),
        images,
        user,
      });
    } catch (err) {
      console.error("load detail:", err);
      setDetail({ error: "ไม่สามารถโหลดรายละเอียดได้" });
    } finally {
      setLoadingDetail(false);
    }
  };

  // กรองรายการตามสถานะ (pending | approved)
  const filteredList = list.filter((it) => {
    const s = (it.status || "").toLowerCase();
    return s === statusFilter;
  });

  // helper for keyboard accessibility on non-button list items
  const handleKeySelect = (e, id, uid) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      loadDetail(id, uid);
    }
  };

  return (
    <div className="adm-requests-root">
      {/* กล่องยืนยันส่วนกลาง */}
      {ConfirmUI}

      <aside className="adm-list-col">
        <div className="adm-list-header">คำร้องขอผู้จัดงาน</div>

        {/* ปุ่มกรอง: แสดงเฉพาะ "รอดำเนินการ" หรือ "อนุมัติแล้ว" */}
        <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(15,23,42,0.06)",
              background: statusFilter === "pending" ? "#e6f2ff" : "transparent",
              cursor: "pointer",
              fontWeight: statusFilter === "pending" ? 700 : 500,
            }}
          >
            รอดำเนินการ
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(15,23,42,0.06)",
              background: statusFilter === "approved" ? "#e6f2ff" : "transparent",
              cursor: "pointer",
              fontWeight: statusFilter === "approved" ? 700 : 500,
            }}
          >
            อนุมัติแล้ว
          </button>
        </div>

        {loadingList ? (
          <div className="adm-empty">กำลังโหลด...</div>
        ) : filteredList.length === 0 ? (
          <div className="adm-empty">ไม่มีคำร้อง</div>
        ) : (
          <div className="adm-list">
            {filteredList.map((r) => (
              // เปลี่ยนจาก <button> เป็น <div> เพื่อ "ลบปุ่ม" (แต่ยังคลิกได้และเข้าถึงคีย์บอร์ด)
              <div
                key={r.request_id}
                role="button"
                tabIndex={0}
                className={`adm-list-item ${selectedId === r.request_id ? "active" : ""}`}
                onClick={() => loadDetail(r.request_id, r.user_id)}
                onKeyDown={(e) => handleKeySelect(e, r.request_id, r.user_id)}
              >
                <img
                  className="adm-list-avatar"
                  src={r.avatar}
                  alt="avatar"
                />
                <div className="adm-list-meta">
                  <div className="adm-list-name">{r.organizer_name || "ไม่ระบุชื่อ"}</div>
                  <div className="adm-list-sub">{r.category} • {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="adm-detail-col">
        {loadingDetail ? (
          <div className="adm-placeholder">กำลังโหลดรายละเอียด...</div>
        ) : detail == null ? (
          <div className="adm-placeholder">คลิกผู้ส่งด้านซ้ายเพื่อดูรายละเอียด</div>
        ) : detail.error ? (
          <div className="adm-error">{detail.error}</div>
        ) : (
          <article className="adm-card">
            <header className="adm-card-header">
              <div className="adm-user">
                <img
                  className="adm-user-avatar"
                  src={detail.user?.profile_image ? (detail.user.profile_image.startsWith("http") ? detail.user.profile_image : `${API}${detail.user.profile_image}`) : "/default-avatar.png"}
                  alt="user"
                />
                <div>
                  <div className="adm-user-name">{(detail.user?.username ?? `${detail.user?.first_name ?? ""} ${detail.user?.last_name ?? ""}`.trim()) || "ไม่ระบุ"}</div>
                  <div className="adm-user-email">{detail.user?.email ?? ""}</div>
                </div>
              </div>

              <div className="adm-actions">
                <div className={`adm-status ${detail.request.status}`}>{detail.request.status}</div>

                {detail.request?.status?.toString().toLowerCase() === "pending" ? (
                  <>
                    <button
                      className="adm-approve-btn"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "ยืนยันอนุมัติ",
                          message: "อนุมัติคำร้องและเปลี่ยนบทบาทผู้ใช้เป็น Organizer?",
                          type: "success",
                          confirmText: "อนุมัติ",
                          closeOnOverlay: false,
                        });
                        if (!ok) return;
                        try {
                          const res = await fetch(`${API}/request_organizers/${detail.request.request_id}/approve`, { method: "POST" });
                          if (!res.ok) throw new Error("approve failed");
                          await loadList();
                          await loadDetail(detail.request.request_id, detail.request.user_id);
                          alert("อนุมัติเรียบร้อย");
                        } catch {
                          alert("อนุมัติไม่สำเร็จ");
                        }
                      }}
                    >
                      อนุมัติ
                    </button>

                    <button
                      className="adm-reject-btn"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "ยืนยันปฏิเสธ",
                          message: "ต้องการปฏิเสธคำร้องนี้หรือไม่?",
                          type: "warning",
                          confirmText: "ปฏิเสธ",
                          closeOnOverlay: false,
                        });
                        if (!ok) return;
                        try {
                          const res = await fetch(`${API}/request_organizers/${detail.request.request_id}/reject`, { method: "POST" });
                          if (!res.ok) throw new Error("reject failed");
                          await loadList();
                          setSelectedId(null);
                          setDetail(null);
                          alert("ปฏิเสธคำร้องเรียบร้อย");
                        } catch {
                          alert("ปฏิเสธไม่สำเร็จ");
                        }
                      }}
                    >
                      ปฏิเสธ
                    </button>
                  </>
                ) : null}

                {detail.request?.status?.toString().toLowerCase() === "approved" ? (
                  <button
                    className="adm-revoke-btn"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "ยืนยันยกเลิกสิทธิ",
                        message: "ผู้ใช้งานจะถูกยกเลิกสิทธิผู้จัดและถูกระงับการใช้งานทันที",
                        type: "danger",
                        confirmText: "ยกเลิกสิทธิและระงับ",
                        closeOnOverlay: false,
                      });
                      if (!ok) return;
                      try {
                        const res = await fetch(`${API}/request_organizers/${detail.request.request_id}/revoke`, { method: "POST" });
                        if (!res.ok) throw new Error("revoke failed");
                        await loadList();
                        await loadDetail(detail.request.request_id, detail.request.user_id);
                        alert("ยกเลิกสิทธิและระงับบัญชีเรียบร้อย");
                      } catch {
                        alert("ยกเลิกสิทธิไม่สำเร็จ");
                      }
                    }}
                  >
                    ยกเลิกสิทธิ
                  </button>
                ) : null}
              </div>
            </header>

            <section className="adm-card-body">
              <div className="adm-info-grid">
                <div className="adm-info">
                  <label>ชื่อผู้จัด</label>
                  <div>{detail.request.organizer_name || "-"}</div>
                </div>
                <div className="adm-info">
                  <label>ประเภท</label>
                  <div>{detail.request.category || "-"}</div>
                </div>
                <div className="adm-info">
                  <label>อีเมล</label>
                  <div>{detail.request.email || "-"}</div>
                </div>
                <div className="adm-info">
                  <label>เบอร์</label>
                  <div>{detail.request.phone || "-"}</div>
                </div>
                <div className="adm-info">
                  <label>ราคา</label>
                  <div>{detail.request.price || "-"}</div>
                </div>
                <div className="adm-info">
                  <label>วันที่ส่ง</label>
                  <div>{detail.request.created_at ? new Date(detail.request.created_at).toLocaleString() : "-"}</div>
                </div>
              </div>

              <div className="adm-gallery">
                {detail.images && detail.images.length > 0 ? (
                  <>
                    <div className="adm-gallery-main">
                      <img
                        src={detail.images[0]}
                        className="adm-gallery-cover"
                        alt="cover"
                        onError={(e) => { e.currentTarget.src = "/default-image.png"; }}
                      />
                    </div>
                    <div className="adm-gallery-thumbs">
                      {detail.images.slice(1).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`thumb-${i}`}
                          className="adm-thumb"
                          onError={(e) => { e.currentTarget.src = "/default-image.png"; }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="adm-no-images">ไม่มีรูปผลงาน</div>
                )}
              </div>

              <div className="adm-desc">
                <label>คำอธิบาย</label>
                <div>{detail.request.description || "-"}</div>
              </div>
            </section>
          </article>
        )}
      </main>
    </div>
  );
};

export default AdminRequests;