import React, { useEffect, useState } from "react";
import ProfileLayout from "./ProfileLayout";
import { useNavigate } from "react-router-dom";
import AddPortfolio from "./AddPortfolio";
import "./MyEvents.css";

const OrganizerPortfolios = () => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState({}); // {portfolio_id: [images]}

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

  // ถ้าไม่มี organizer_id ให้แจ้งเตือน
  if (!user.organizer_id) {
    return (
      <ProfileLayout user={user}>
        <div className="my-events-header-outer">
          <h2 className="my-events-title">ผลงานของผู้จัดทำ</h2>
          <button
            className="my-events-create-btn"
            onClick={() => navigate("/my-events")}
            style={{
              background: "#fff",
              color: "#22223b",
              border: "1.5px solid #adb5bd",
            }}
          >
            ← กลับไปหน้าอีเว้นท์ของฉัน
          </button>
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

  return (
    <ProfileLayout user={user}>
      <div className="my-events-header-outer">
        <h2 className="my-events-title">ผลงานของผู้จัดทำ</h2>
        <button
          className="my-events-create-btn"
          onClick={() => navigate("/my-events")}
          style={{
            background: "#fff",
            color: "#22223b",
            border: "1.5px solid #adb5bd",
          }}
        >
          ← กลับไปหน้าอีเว้นท์ของฉัน
        </button>
        {/* ปุ่มเพิ่มผลงาน */}
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
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
              padding: 32,
              minWidth: 340,
              maxWidth: 420,
              width: "100%",
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
      <div className="my-events-main-border">
        <div className="my-events-container">
          {loading ? (
            <div>กำลังโหลด...</div>
          ) : portfolios.length === 0 ? (
            <div>คุณยังไม่มีผลงาน</div>
          ) : (
            <div className="my-events-list-grid">
              {portfolios.map((item) => {
                const images = portfolioImages[item.portfolio_id] || [];
                const firstImage = images[0];

                return (
                  <div className="my-event-card-grid" key={item.portfolio_id}>
                    <div className="my-event-img-wrap">
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
                      <div className="my-event-info-title">{item.title}</div>
                      <div className="my-event-info-organizer">
                        {item.category}
                      </div>
                      <div className="my-event-info-desc">{item.description}</div>
                      <div className="my-event-info-price">
                        {item.price && `ราคา: ${item.price}`}
                      </div>
                    </div>
                    <div className="my-event-actions">
                      <button className="my-event-action-btn" title="Edit">
                        ✏️
                      </button>
                      <button className="my-event-action-btn" title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default OrganizerPortfolios;