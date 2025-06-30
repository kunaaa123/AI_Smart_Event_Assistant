import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./EventDetail.css";
import "./HomeBanner.css";

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [organizer, setOrganizer] = useState(null);
  const [popularEvents, setPopularEvents] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    const fetchEvent = async () => {
      const res = await fetch(`http://localhost:8080/events/${id}`);
      if (res.ok) setEvent(await res.json());
    };
    const fetchImages = async () => {
      const res = await fetch(`http://localhost:8080/events/${id}/images`);
      if (res.ok) setImages(await res.json());
    };
    Promise.all([fetchEvent(), fetchImages()]).then(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const fetchOrganizer = async () => {
      if (!event?.organizer_id) return;
      const res = await fetch(`http://localhost:8080/organizers/${event.organizer_id}`);
      if (res.ok) setOrganizer(await res.json());
    };
    if (event) fetchOrganizer();
  }, [event]);

  // หาภาพปก
  const cover = images.find(img => img.is_cover) || images[0];
  const gallery = images.filter(img => !img.is_cover && img.image_id !== (cover && cover.image_id));

  // แสดงทีละ 2 รูป และเปลี่ยนทุก 3 วิ
  useEffect(() => {
    if (gallery.length <= 2) return;
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 2) % gallery.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [gallery]);

  const galleryToShow = gallery.slice(galleryIndex, galleryIndex + 2);
  if (galleryToShow.length < 2 && gallery.length > 2) {
    galleryToShow.push(...gallery.slice(0, 2 - galleryToShow.length));
  }

  useEffect(() => {
    if (event) {
      console.log("event:", event); // ดูว่ามี organizer_id ไหม
    }
  }, [event]);

  useEffect(() => {
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then(async (events) => {
        if (!Array.isArray(events)) return setPopularEvents([]);
        const eventWithRating = await Promise.all(
          events.map(async (event) => {
            const res = await fetch(
              `http://localhost:8080/events/${event.event_id}/reviews`
            );
            let reviews = await res.json();
            if (!Array.isArray(reviews)) reviews = [];
            const ratings = reviews.map((r) => r.rating);
            const avgRating =
              ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;

            // ดึงรูปปก (is_cover) หรือรูปแรก
            let coverImg = null;
            try {
              const imgRes = await fetch(`http://localhost:8080/events/${event.event_id}/images`);
              let imgs = await imgRes.json();
              if (Array.isArray(imgs) && imgs.length > 0) {
                coverImg = imgs.find((img) => img.is_cover) || imgs[0];
              }
            } catch {
              // Ignore errors when fetching cover image
            }
            return {
              ...event,
              reviews,
              avgRating,
              totalReviews: ratings.length,
              cover_image: coverImg ? coverImg.image_url : null,
            };
          })
        );
        setPopularEvents(
          eventWithRating
            .filter((e) => e.avgRating >= 3 && e.totalReviews > 0)
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 4)
        );
        setLoadingPopular(false);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/organizers")
      .then((res) => res.json())
      .then((data) => setOrganizers(Array.isArray(data) ? data : []))
      .catch(() => setOrganizers([]));
  }, []);

  const getOrganizerName = (organizer_id) => {
    const org = organizers.find((o) => o.organizer_id === organizer_id);
    if (org) {
      return `${org.first_name || ""} ${org.last_name || ""}`.trim() || org.username || "ไม่พบชื่อผู้จัด";
    }
    return "ไม่พบชื่อผู้จัด";
  };

  if (loading) return <div style={{ padding: 40 }}>กำลังโหลด...</div>;
  if (!event) return <div style={{ padding: 40 }}>ไม่พบข้อมูลอีเว้นท์</div>;

  return (
    <div className="event-detail-main">
      <div className="event-detail-top">
        <div className="event-detail-cover-col">
          {cover && (
            <img
              src={`http://localhost:8080${cover.image_url.replace(/^\./, "")}`}
              alt={event.name}
              className="event-detail-cover-img"
            />
          )}
          <div className="event-detail-nav-btns">
            <button className="event-detail-nav-btn">Details</button>
            <button className="event-detail-nav-btn">Organizer</button>
            <button className="event-detail-nav-btn">Reviews</button>
          </div>
        </div>
        <div className="event-detail-gallery-col">
          <div className="event-detail-gallery-title">ภาพเพิ่มเติม</div>
          <div className="event-detail-gallery-list">
            {gallery.length === 0 && <div className="event-detail-gallery-empty">-</div>}
            {galleryToShow.map((img, idx) => (
              <img
                key={img.image_id}
                src={`http://localhost:8080${img.image_url.replace(/^\./, "")}`}
                alt={`gallery-${idx}`}
                className="event-detail-gallery-img"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="event-detail_desc-section">
        <div className="event-detail-desc-title">คำอธิบายงาน</div>
        <div className="event-detail-desc-text">{event.description}</div>
      </div>

      {/* Organizer Section */}
      {organizer && (
        <div className="event-detail-organizer-section">
          <div className="event-detail-organizer-title">ผู้รับทำอีเว้นท์</div>
          <div className="event-detail-organizer-row">
            <div className="event-detail-organizer-img-col">
              <div className="event-detail-organizer-role">{organizer.expertise || "ผู้จัดงานอีเว้นท์"}</div>
              <div className="event-detail-organizer-name">
                {organizer.first_name} {organizer.last_name}
              </div>
              <img
                src={
                  organizer.profile_image
                    ? `http://localhost:8080${organizer.profile_image.replace(/^\./, "")}`
                    : "https://placehold.co/80x80?text=No+Image"
                }
                alt={organizer.first_name}
                className="event-detail-organizer-img"
              />
              <div className="event-detail-organizer-bio">
                {organizer.bio || "ไม่มีข้อมูลคำอธิบาย"}
              </div>
            </div>
            {/* ถ้ามีข้อมูลอื่นๆ เพิ่มเติม เช่น รีวิว/ปีประสบการณ์ ใส่ฝั่งขวานี้ */}
            {/* <div className="event-detail-organizer-info-col">
              ... (ถ้ามี)
            </div> */}
          </div>
        </div>
      )}

      {/* อีเว้นท์ยอดนิยม */}
      <div className="event-detail-popular-section" style={{ marginTop: 56 }}>
        <div className="event-detail-popular-header">
          <span>อีเว้นท์ ยอดนิยม</span>
          <a href="/events" className="event-detail-popular-more">
            แสดงทั้งหมด
          </a>
        </div>
        {loadingPopular ? (
          <div style={{ textAlign: "center", margin: 40 }}>กำลังโหลด...</div>
        ) : (
          <div className="event-detail-popular-list">
            {popularEvents.map((event) => (
              <div
                className="event-detail-popular-card"
                key={event.event_id}
                style={{ cursor: "pointer" }}
                onClick={() => window.location.href = `/events/${event.event_id}`}
              >
                <div className="event-detail-popular-img-wrap">
                  <img
                    src={
                      event.cover_image
                        ? `http://localhost:8080${event.cover_image.replace(/^\./, "")}`
                        : "https://placehold.co/300x180?text=No+Image"
                    }
                    alt={event.name}
                    className="event-detail-popular-img"
                  />
                </div>
                <div className="event-detail-popular-info">
                  <div className="event-detail-popular-title">{event.name}</div>
                  <div className="event-detail-popular-organizer">
                    {getOrganizerName(event.organizer_id)}
                  </div>
                  <div className="event-detail-popular-rating">
                    <span className="event-detail-popular-stars">
                      {"★".repeat(Math.round(event.avgRating))}
                      {"☆".repeat(5 - Math.round(event.avgRating))}
                    </span>
                    <span className="event-detail-popular-rating-num">
                      {event.avgRating.toFixed(1)}
                    </span>
                    <span className="event-detail-popular-rating-count">
                      ({event.totalReviews} Ratings)
                    </span>
                  </div>
                  <div className="event-detail-popular-desc">{event.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className="event-detail-review-section">
        <div className="event-detail-review-card">
          <div className="event-detail-review-header">
            <img
              src={
                user.profile_image
                  ? user.profile_image.startsWith("http")
                    ? user.profile_image
                    : `http://localhost:8080${user.profile_image}`
                  : "https://placehold.co/40x40?text=U"
              }
              alt={user.first_name || user.username || "avatar"}
              className="event-detail-review-avatar"
            />
            <div className="event-detail-review-user">
              <div className="event-detail-review-name">
                {user.first_name || user.username || "Guest"}
              </div>
            </div>
          </div>
          {user && user.user_id ? (
            <>
              <textarea
                className="event-detail-review-textarea"
                placeholder="ร่วมแสดงความคิดเห็นเกี่ยวกับอีเว้นท์นี้..."
                rows={3}
              />
              <div className="event-detail-review-actions">
                <div className="event-detail-review-icons">
                  <span className="event-detail-review-icon">B</span>
                  <span className="event-detail-review-icon">I</span>
                  <span className="event-detail-review-icon">🖉</span>
                </div>
                <button className="event-detail-review-btn">Comment</button>
              </div>
              <div className="event-detail-review-stars">
                {[1,2,3,4,5].map((n) => (
                  <span key={n} className="event-detail-review-star">★</span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", margin: "18px 0" }}>
              <button
                className="event-detail-review-btn"
                onClick={() => window.location.href = "/login"}
              >
                เข้าสู่ระบบเพื่อแสดงความคิดเห็น
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;