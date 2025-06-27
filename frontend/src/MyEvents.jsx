import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileLayout from "./ProfileLayout";
import "./MyEvents.css";

const MyEvents = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // เช็คว่า user เป็น organizer หรือไม่
  const isOrganizer = user.role === "organizer";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const res = await fetch(`http://localhost:8080/events/user/${user.user_id}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
      setLoading(false);
    };
    if (user.user_id) fetchMyEvents();
  }, [user.user_id]);

  const filteredEvents = events.filter(
    (event) =>
      event.name?.toLowerCase().includes(search.toLowerCase()) ||
      event.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProfileLayout user={user}>
      {/* Header */}
      <div className="my-events-header-outer">
        <h2 className="my-events-title">อีเว้นท์ของฉัน</h2>
        <div className="my-events-actions">
          <input
            className="my-events-search"
            type="text"
            placeholder="Search Event"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="my-events-create-btn">สร้างอีเว้นท์</button>
          {isOrganizer && (
            <button
              className="my-events-organizer-btn"
              onClick={() => navigate("/organizer-portfolios")}
            >
              อีเว้นท์สำหรับผู้จัดทำ
            </button>
          )}
        </div>
      </div>
      {/* กรอบล้อมเฉพาะรายการอีเว้นท์ */}
      <div className="my-events-main-border">
        <div className="my-events-container">
          {loading ? (
            <div>กำลังโหลด...</div>
          ) : filteredEvents.length === 0 ? (
            <div>คุณยังไม่มีอีเว้นท์</div>
          ) : (
            <div className="my-events-list-grid">
              {filteredEvents.map((event) => (
                <div className="my-event-card-grid" key={event.event_id}>
                  <div className="my-event-img-wrap">
                    <img
                      src={event.event_image || "https://placehold.co/300x180?text=No+Image"}
                      alt={event.name}
                      className="my-event-img"
                    />
                  </div>
                  <div className="my-event-info">
                    <div className="my-event-info-title">{event.name}</div>
                    <div className="my-event-info-organizer">
                      {user.first_name} {user.last_name}
                    </div>
                  </div>
                  <div className="my-event-actions">
                    <button className="my-event-action-btn" title="Favorite">
                      <span role="img" aria-label="favorite">💙</span>
                    </button>
                    <button className="my-event-action-btn" title="Delete">
                      <span role="img" aria-label="delete">🗑️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default MyEvents;