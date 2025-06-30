import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileLayout from "./ProfileLayout";
import CreateEvent from "./CreateEvent";
import GlassAlert from "./GlassAlert";
import "./MyEvents.css";

const MyEvents = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]); // เพิ่ม state นี้
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [eventImages, setEventImages] = useState({}); // {event_id: [images]}

  const isOrganizer = user.role === "organizer";
  const navigate = useNavigate();

  // ดึง event ของ user
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

  // ดึง organizer ทั้งหมด
  const fetchOrganizers = async () => {
    try {
      const res = await fetch("http://localhost:8080/organizers");
      if (res.ok) {
        const data = await res.json();
        setOrganizers(data);
      }
    } catch {
      setOrganizers([]);
    }
  };

  const fetchEventImages = async (event_id) => {
    try {
      const res = await fetch(`http://localhost:8080/events/${event_id}/images`);
      if (res.ok) {
        const imgs = await res.json();
        setEventImages(prev => ({ ...prev, [event_id]: imgs }));
      }
    } catch (err) {
      // ป้องกัน error ลูป
      console.error("Failed to fetch images for event", event_id, err);
    }
  };

  useEffect(() => {
    if (user.user_id) fetchMyEvents();
    fetchOrganizers();
    // eslint-disable-next-line
  }, [user.user_id]);

  const filteredEvents = events.filter(
    (event) =>
      event.name?.toLowerCase().includes(search.toLowerCase()) ||
      event.description?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const fetched = new Set();
    filteredEvents.forEach(event => {
      if (!eventImages[event.event_id] && !fetched.has(event.event_id)) {
        fetchEventImages(event.event_id);
        fetched.add(event.event_id);
      }
    });
    // eslint-disable-next-line
  }, [filteredEvents]);

  // ฟังก์ชันหา organizer name
  const getOrganizerName = (organizer_id) => {
    const org = organizers.find((o) => o.organizer_id === organizer_id);
    if (org) {
      return `${org.first_name} ${org.last_name}`;
    }
    return "ไม่พบชื่อผู้จัด";
  };

  return (
    <ProfileLayout user={user} sectionName="อีเว้นท์ของฉัน">
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
          <button
            className="my-events-create-btn"
            onClick={() => setShowCreateModal(true)}
          >
            สร้างอีเว้นท์
          </button>
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
      {/* Modal Popup */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
              padding: 32,
              minWidth: 380,
              maxWidth: 480,
              width: "100%",
              position: "relative"
            }}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 18,
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#22223b"
              }}
              aria-label="close"
            >
              ×
            </button>
            <CreateEvent
              onSuccess={() => {
                setShowCreateModal(false);
                setAlert({ show: true, message: "สร้างอีเว้นท์สำเร็จ!", type: "success" });
                setLoading(true);
                fetchMyEvents();
              }}
              onError={(msg) => setAlert({ show: true, message: msg, type: "danger" })}
              isPopup
            />
          </div>
        </div>
      )}
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
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
                <div
                  className="my-event-card-grid"
                  key={event.event_id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/events/${event.event_id}`)}
                >
                  <div className="my-event-img-wrap">
                    <img
                      src={
                        eventImages[event.event_id]
                          ? (
                              eventImages[event.event_id].find(img => img.is_cover) ||
                              eventImages[event.event_id][0]
                            )?.image_url
                            ? `http://localhost:8080${(
                                eventImages[event.event_id].find(img => img.is_cover) ||
                                eventImages[event.event_id][0]
                              ).image_url.replace(/^\./, "")}`
                            : "https://placehold.co/300x180?text=No+Image"
                          : "https://placehold.co/300x180?text=No+Image"
                      }
                      alt={event.name}
                      className="my-event-img"
                    />
                  </div>
                  <div className="my-event-info">
                    <div className="my-event-info-title">{event.name}</div>
                    <div className="my-event-info-organizer">
                      {getOrganizerName(event.organizer_id)}
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

