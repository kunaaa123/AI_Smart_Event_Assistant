import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EventList.css";

const EventList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // ดึงข้อมูล organizers
    fetch("http://localhost:8080/organizers")
      .then((res) => res.json())
      .then((data) => setOrganizers(Array.isArray(data) ? data : []))
      .catch(() => setOrganizers([]));

    // ดึงข้อมูล events พร้อมรูปปกและคะแนน
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8080/events");
        const eventsData = await res.json();
        
        if (!Array.isArray(eventsData)) {
          setEvents([]);
          return;
        }

        // ดึงรูปปกและคะแนนเฉลี่ยของแต่ละอีเว้นท์
        const eventsWithDetails = await Promise.all(
          eventsData.map(async (event) => {
            try {
              // ดึงรูปปก
              let coverImg = null;
              try {
                const imgRes = await fetch(`http://localhost:8080/events/${event.event_id}/images`);
                let imgs = await imgRes.json();
                if (Array.isArray(imgs) && imgs.length > 0) {
                  coverImg = imgs.find((img) => img.is_cover) || imgs[0];
                }
              } catch {
                // Ignore image errors
              }

              // ดึงคะแนนเฉลี่ย
              let avgRating = 0;
              let totalReviews = 0;
              try {
                const reviewRes = await fetch(`http://localhost:8080/events/${event.event_id}/reviews`);
                let reviews = await reviewRes.json();
                if (Array.isArray(reviews)) {
                  const ratings = reviews.map((r) => r.rating);
                  avgRating = ratings.length > 0 
                    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
                    : 0;
                  totalReviews = ratings.length;
                }
              } catch {
                // Ignore review errors
              }

              return {
                ...event,
                cover_image: coverImg ? coverImg.image_url : null,
                avgRating,
                totalReviews
              };
            } catch (error) {
              console.error(`Error processing event ${event.event_id}:`, error);
              return {
                ...event,
                cover_image: null,
                avgRating: 0,
                totalReviews: 0
              };
            }
          })
        );

        setEvents(eventsWithDetails);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  // ฟังก์ชันหา organizer name
  const getOrganizerName = (organizer_id) => {
    const org = organizers.find((o) => o.organizer_id === organizer_id);
    if (org) {
      return `${org.first_name || ""} ${org.last_name || ""}`.trim() || org.username || "ไม่พบชื่อผู้จัด";
    }
    return "ไม่พบชื่อผู้จัด";
  };

  // กรองอีเว้นท์ตามการค้นหา
  const filteredEvents = events
    .filter((event) =>
      event.name?.toLowerCase().includes(search.toLowerCase()) ||
      event.description?.toLowerCase().includes(search.toLowerCase()) ||
      getOrganizerName(event.organizer_id).toLowerCase().includes(search.toLowerCase())
    )
    .filter((event) => event.is_active !== false); // ซ่อนอีเวนท์ที่ถูกระงับ

  return (
    <div className="event-list-container">
      <div className="event-list-header">
        <h1>อีเว้นท์ทั้งหมด</h1>
        <div className="event-list-search">
          <input
            type="text"
            placeholder="ค้นหาอีเว้นท์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="event-list-search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="event-list-loading">กำลังโหลด...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="event-list-empty">
          <h3>ไม่พบอีเว้นท์</h3>
          <p>ลองค้นหาด้วยคำอื่น หรือกลับมาดูใหม่ภายหลัง</p>
        </div>
      ) : (
        <div className="event-list-grid">
          {filteredEvents.map((event) => (
            <div
              className="event-list-card"
              key={event.event_id}
              onClick={() => navigate(`/events/${event.event_id}`)}
            >
              <div className="event-list-img-wrap">
                <img
                  src={
                    event.cover_image
                      ? `http://localhost:8080${event.cover_image.replace(/^\./, "")}`
                      : "https://placehold.co/300x180?text=No+Image"
                  }
                  alt={event.name}
                  className="event-list-img"
                />
              </div>
              <div className="event-list-info">
                <div className="event-list-title">{event.name}</div>
                <div className="event-list-organizer">
                  {getOrganizerName(event.organizer_id)}
                </div>
                <div className="event-list-rating">
                  <span className="event-list-stars">
                    {"★".repeat(Math.round(event.avgRating))}
                    {"☆".repeat(5 - Math.round(event.avgRating))}
                  </span>
                  <span className="event-list-rating-num">
                    {event.avgRating > 0 ? event.avgRating.toFixed(1) : "ยังไม่มีคะแนน"}
                  </span>
                  <span className="event-list-rating-count">
                    ({event.totalReviews} รีวิว)
                  </span>
                </div>
                <div className="event-list-desc">
                  {event.description?.length > 60 
                    ? `${event.description.slice(0, 60)}...` 
                    : event.description || "ไม่มีคำอธิบาย"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;