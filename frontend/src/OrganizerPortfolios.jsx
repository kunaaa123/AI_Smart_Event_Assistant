import React, { useEffect, useState, useRef } from "react";
import ProfileLayout from "./ProfileLayout";
import { useNavigate } from "react-router-dom";
import AddPortfolio from "./AddPortfolio";
import GCFFEConfirm from "./GCFFEConfirm";
import EditPortfolio from "./EditPortfolio"; // <-- เพิ่ม import
import "./MyEvents.css";

const OrganizerPortfolios = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw && raw !== "undefined" ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState({}); // {portfolio_id: [images]}
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);

  // ลบ state และฟังก์ชันที่เกี่ยวกับการแก้ไขออก (แต่คงปุ่มไว้)
  const [deleting, setDeleting] = useState(null);
  const confirmResolverRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOpts, setConfirmOpts] = useState({
    title: "ยืนยันการทำรายการ",
    message: "คุณแน่ใจหรือไม่?",
    type: "warning",
    confirmText: "ยืนยัน",
    cancelText: "ยกเลิก",
    closeOnOverlay: true,
  });
  const ask = (opts = {}) =>
    new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmOpts((prev) => ({ ...prev, ...opts }));
      setConfirmOpen(true);
    });
  const onConfirm = () => {
    setConfirmOpen(false);
    confirmResolverRef.current?.(true);
    confirmResolverRef.current = null;
  };
  const onCancel = () => {
    setConfirmOpen(false);
    confirmResolverRef.current?.(false);
    confirmResolverRef.current = null;
  };

  // ดึงผลงานของ organizer นี้
  const fetchPortfolios = async () => {
    if (!user.organizer_id) {
      setPortfolios([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/organizer_portfolios/organizer/${user.organizer_id}`
      );
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data);
      } else {
        setPortfolios([]);
      }
    } catch {
      setPortfolios([]);
    }
    setLoading(false);
  };

  const fetchPortfolioImages = async (portfolio_id) => {
    try {
      const res = await fetch(
        `http://localhost:8080/organizer_portfolios/${portfolio_id}/images`
      );
      if (res.ok) {
        const imgs = await res.json();
        setPortfolioImages((prev) => ({ ...prev, [portfolio_id]: imgs }));
      }
    } catch {
      // handle error
    }
  };

  useEffect(() => {
    fetchPortfolios();
    // eslint-disable-next-line
  }, [user.organizer_id]);

  useEffect(() => {
    portfolios.forEach((item) => {
      if (!portfolioImages[item.portfolio_id]) {
        fetchPortfolioImages(item.portfolio_id);
      }
    });
    // eslint-disable-next-line
  }, [portfolios]);

  // helper: รีเฟรชโปรไฟล์จาก backend แล้วอัปเดต localStorage
  const refreshUserProfile = async () => {
    try {
      if (!user?.user_id) return false;
      const res = await fetch(`http://localhost:8080/users/${user.user_id}`);
      if (!res.ok) return false;
      const latest = await res.json();
      if (latest?.organizer_id) {
        const merged = { ...user, ...latest };
        setUser(merged);
        localStorage.setItem("user", JSON.stringify(merged));
        window.dispatchEvent(new Event("user-profile-updated"));
        return true;
      }
    } catch {
      // intentionally left blank
    }
    return false;
  };

  // รีเฟรช user เพื่อดึง organizer_id หลังถูกอนุมัติแล้ว (มี retry)
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const tryRefresh = async () => {
      if (cancelled) return;
      if (!user?.user_id) return;
      if ((user?.role || "").toLowerCase() !== "organizer") return;
      if (user.organizer_id) return;
      const ok = await refreshUserProfile();
      if (!ok && attempts < maxAttempts) {
        attempts += 1;
        setTimeout(tryRefresh, 2000);
      }
    };

    tryRefresh();
    return () => { cancelled = true; };
  }, [user?.user_id, user?.organizer_id, user?.role]);

  // ถ้าเป็น organizer แต่ยังไม่มี organizer_id ให้รอ/กดรีเฟรชเองได้
  if ((user?.role || "").toLowerCase() === "organizer" && !user.organizer_id) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        กำลังเชื่อมโยงบัญชีผู้จัดทำ... โปรดรอสักครู่ หรือออกแล้วเข้าสู่ระบบใหม่
        <div style={{ marginTop: 12 }}>
          <button
            className="my-events-create-btn"
            onClick={refreshUserProfile}
            style={{ background: "#fff", color: "#22223b", border: "1.5px solid #adb5bd" }}
          >
            ลองเชื่อมโยงอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // เดิม: ถ้าไม่มี organizer_id เลย
  if (!user.organizer_id) {
    return (
      <ProfileLayout user={user}>
        <div className="my-events-header-outer">
          <h2 className="my-events-title">ผลงานของผู้จัดทำ</h2>
        </div>
        <div className="my-events-main-border">
          <div className="my-events-container">
            <div style={{ color: "red", textAlign: "center", margin: 40 }}>
              คุณยังไม่ได้เป็นผู้จัดทำ หรือระบบยังไม่ได้เชื่อมโยง organizer_id
              <br />
              กรุณาติดต่อแอดมินหรือสมัครเป็น organizer ก่อน
            </div>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  // ฟีเจอร์แก้ไข: เปิด modal ของ EditPortfolio
  const handleEditClicked = (portfolio) => {
    setEditingPortfolio(portfolio);
    setShowEditModal(true);
  };

  // ฟังก์ชันลบผลงาน (คงไว้ตามเดิม)
  const handleDeletePortfolio = async (portfolio) => {
    const confirmed = await ask({
      title: "ลบผลงาน",
      message: `คุณต้องการลบผลงาน "${portfolio.title}" หรือไม่?`,
      type: "danger",
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
    });
    if (!confirmed) return;

    setDeleting(portfolio.portfolio_id);
    try {
      const res = await fetch(`http://localhost:8080/organizer_portfolios/${portfolio.portfolio_id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPortfolios(prev => prev.filter(p => p.portfolio_id !== portfolio.portfolio_id));
        alert("ลบผลงานสำเร็จ!");
      } else {
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      alert("เกิดข้อผิดพลาดในการลบ");
    }
    setDeleting(null);
  };

  return (
    <ProfileLayout user={user}>
      <div className="my-events-header-outer">
        <h2 className="my-events-title">ผลงานของผู้จัดทำ</h2>
        <button
          className="my-events-create-btn"
          onClick={() => setShowAddModal(true)}
        >
          เพิ่มผลงาน
        </button>
      </div>
      {/* Popup Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
              padding: 18,
              width: "min(92vw, 760px)",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowAddModal(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 18,
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#22223b",
              }}
              aria-label="close"
            >
              ×
            </button>
            <AddPortfolio
              onSuccess={() => {
                setShowAddModal(false);
                fetchPortfolios();
              }}
              onError={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}
      {/* Popup EditPortfolio */}
      {showEditModal && editingPortfolio && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
              padding: 18,
              width: "min(92vw, 760px)",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => { setShowEditModal(false); setEditingPortfolio(null); }}
              style={{
                position: "absolute",
                top: 12,
                right: 18,
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#22223b",
              }}
              aria-label="close"
            >
              ×
            </button>
            <EditPortfolio
              portfolio={editingPortfolio}
              onSuccess={() => {
                setShowEditModal(false);
                setEditingPortfolio(null);
                fetchPortfolios();
              }}
              onCancel={() => {
                setShowEditModal(false);
                setEditingPortfolio(null);
              }}
            />
          </div>
        </div>
      )}
      <div className="my-events-main-border">
        <div className="my-events-container">
          {loading ? (
            <div>กำลังโหลด...</div>
          ) : portfolios.length === 0 ? (
            <div className="empty-card-wrap">
              <div className="empty-card">
                <div className="empty-icon" aria-hidden>📁</div>
                <h3 className="empty-title">คุณยังไม่มีผลงาน</h3>
                <p className="empty-subtitle">เริ่มเพิ่มผลงานเพื่อโชว์ให้ลูกค้าเห็น</p>
                <button
                  className="empty-btn"
                  onClick={() => setShowAddModal(true)}
                >
                  เพิ่มผลงาน
                </button>
              </div>
            </div>
          ) : (
            <div className="my-events-list-grid">
              {portfolios.map((item) => {
                const images = portfolioImages[item.portfolio_id] || [];
                const firstImage = images[0];

                return (
                  <div className="my-event-card-grid" key={item.portfolio_id}>
                    <div 
                      className="my-event-img-wrap"
                      onClick={() => navigate(`/portfolios/${item.portfolio_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={
                          firstImage
                            ? `http://localhost:8080${firstImage.image_url.replace(
                                /^\./,
                                ""
                              )}`
                            : "https://placehold.co/300x180?text=No+Image"
                        }
                        alt={item.title}
                        className="my-event-img"
                      />
                    </div>
                    <div className="my-event-info">
                      <div 
                        className="my-event-info-title"
                        onClick={() => navigate(`/portfolios/${item.portfolio_id}`)}
                        style={{ 
                          cursor: "pointer", 
                          color: "#0ea5e9",
                          transition: "color 0.2s ease"
                        }}
                        onMouseOver={(e) => e.target.style.color = "#0284c7"}
                        onMouseOut={(e) => e.target.style.color = "#0ea5e9"}
                      >
                        {item.title}
                      </div>
                      <div className="my-event-info-organizer">
                        {item.category}
                      </div>
                      <div 
                        className="my-event-info-desc"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%"
                        }}
                        title={item.description}
                      >
                        {item.description || "ไม่มีคำอธิบาย"}
                      </div>
                      <div className="my-event-info-price">
                        {item.price && `ราคา: ${item.price}`}
                      </div>
                    </div>
                    <div className="my-event-actions">
                      <button
                        className="my-event-action-btn my-event-edit-btn"
                        onClick={() => handleEditClicked(item)}
                        title="แก้ไขผลงาน"
                      >
                        <span>✏️</span>
                        แก้ไข
                      </button>
                      <button 
                        className="my-event-action-btn my-event-delete-btn"
                        onClick={() => handleDeletePortfolio(item)}
                        title="ลบผลงาน"
                        disabled={deleting === item.portfolio_id}
                      >
                        <span>{deleting === item.portfolio_id ? "⏳" : "🗑️"}</span>
                        {deleting === item.portfolio_id ? "ลบ..." : "ลบ"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* เอา modal แก้ไขออกแล้ว */}
      <GCFFEConfirm
        open={confirmOpen}
        {...confirmOpts}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </ProfileLayout>
  );
};

export default OrganizerPortfolios;