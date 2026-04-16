import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FavoriteButton from "./components/FavoriteButton";
import { useFavorites } from "./hooks/useFavorites";
import GlassAlert from "./GlassAlert";
import OrganizerProfilePopup from "./OrganizerProfilePopup";
import "./EventDetail.css";
import "./HomeBanner.css";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [organizer, setOrganizer] = useState(null);
  const [popularEvents, setPopularEvents] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const [venue, setVenue] = useState(null);
  // refs สำหรับการสกอลไปยังแต่ละส่วน
  const detailsRef = useRef(null);
  const organizerRef = useRef(null);
  const reviewsRef = useRef(null);
  
  // state สำหรับรีวิว
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  
  // เพิ่ม state สำหรับ GlassAlert
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  
  // เพิ่ม state สำหรับ Report
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const { addToFavorites, removeFromFavorites, checkIsFavorite } = useFavorites(user.user_id);

  // ฟังก์ชันแสดง alert
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
  };

  // Auto hide alert after 3 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  // ฟังก์ชันสำหรับ toggle favorite พร้อมแจ้งเตือน
  const handleFavoriteToggle = async (eventID) => {
    if (!user.user_id) {
      showAlert("กรุณาเข้าสู่ระบบก่อน", "warning");
      return false;
    }

    const isFav = checkIsFavorite(eventID);
    
    try {
      let result;
      if (isFav) {
        result = await removeFromFavorites(eventID);
        if (result) {
          showAlert("ลบจากรายการโปรดแล้ว ❤️", "info");
        }
      } else {
        result = await addToFavorites(eventID);
        if (result) {
          showAlert("เพิ่มในรายการโปรดแล้ว 💖", "success");
        }
      }
      return result;
    } catch {
      showAlert("เกิดข้อผิดพลาด กรุณาลองใหม่", "danger");
      return false;
    }
  };

  // ฟังก์ชันส่งรีวิว - แก้ไขให้ใช้ GlassAlert
  const handleSubmitReview = async () => {
    if (!user.user_id) {
      showAlert("กรุณาเข้าสู่ระบบก่อน", "warning");
      return;
    }
    
    if (!newReview.rating || newReview.rating < 1 || newReview.rating > 5) {
      showAlert("กรุณาให้คะแนน 1-5 ดาว", "warning");
      return;
    }

    if (!newReview.comment.trim()) {
      showAlert("กรุณาเขียนความคิดเห็น", "warning");
      return;
    }

    setReviewLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/events/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id,
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      if (res.ok) {
        setNewReview({ rating: 0, comment: "" });
        fetchReviews(); // รีเฟรชรายการรีวิว
        showAlert("ส่งความคิดเห็นสำเร็จ! 🎉", "success");
      } else {
        showAlert("เกิดข้อผิดพลาดในการส่งความคิดเห็น", "danger");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      showAlert("เกิดข้อผิดพลาดในการส่งความคิดเห็น", "danger");
    }
    setReviewLoading(false);
  };

  // เปิดโมดัลรายงาน
  const openReport = () => {
    if (!user.user_id) {
      showAlert("กรุณาเข้าสู่ระบบก่อน", "warning");
      return;
    }
    setReportOpen(true);
  };

  // ส่งรายงาน
  const handleSubmitReport = async () => {
    if (!reportReason) {
      showAlert("กรุณาเลือกเหตุผลในการรายงาน", "warning");
      return;
    }
    setReportSubmitting(true);
    try {
      const res = await fetch("http://localhost:8080/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: parseInt(id),
          user_id: user.user_id,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (res.ok) {
        showAlert("ส่งรายงานแล้ว ขอบคุณค่ะ 🙏", "success");
        setReportOpen(false);
        setReportReason("");
        setReportDetails("");
      } else {
        const t = await res.text();
        showAlert(`ส่งรายงานไม่สำเร็จ: ${t || res.status}`, "danger");
      }
    } catch {
      showAlert("ส่งรายงานไม่สำเร็จ กรุณาลองใหม่", "danger");
    } finally {
      setReportSubmitting(false);
    }
  };

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
    
    // ดึงรีวิวด้วย
    fetchReviews();
  }, [id]);

  // เมื่อ event เปลี่ยน ให้พยายามดึง organizer (ถ้ามี) — หากไม่มี organizer ให้ fallback ไปดึง user (ผู้สร้าง)
  useEffect(() => {
    if (!event) {
      setOrganizer(null);
      setVenue(null);
      return;
    }

    let cancelled = false;

    const fetchOrganizerOrCreator = async () => {
      try {
        // หากมี organizer_id ให้ดึงข้อมูล organizer ปกติ
        if (event.organizer_id) {
          const res = await fetch(`http://localhost:8080/organizers/${event.organizer_id}`);
          if (res.ok) {
            const org = await res.json();
            if (!cancelled) setOrganizer(org);
            return;
          }
        }

        // fallback: ดึงข้อมูลผู้ใช้งานที่เป็นผู้สร้าง (user_id) แล้วใช้แสดงแทน organizer
        if (event.user_id) {
          const uRes = await fetch(`http://localhost:8080/users/${event.user_id}`);
          if (uRes.ok) {
            const u = await uRes.json();
            // แปลงเป็นรูปแบบที่ EventDetail คาดหวังจาก organizer
            const pseudoOrg = {
              organizer_id: null,
              first_name: u.first_name || u.username || "ผู้ใช้",
              last_name: u.last_name || "",
              profile_image: u.profile_image || null,
              expertise: u.role === "organizer" ? "ผู้จัดงาน" : "ผู้สร้างอีเว้นท์",
              bio: u.bio || "",
              _is_creator_user: true, // เครื่องหมายว่ามาจาก user ไม่ใช่ organizer table
              phone: u.phone || null,
            };
            if (!cancelled) setOrganizer(pseudoOrg);
            return;
          }
        }

        // ถ้าไม่พบทั้งคู่ ให้ตั้งเป็น null
        if (!cancelled) setOrganizer(null);
      } catch (err) {
        console.error("fetch organizer/creator failed", err);
        if (!cancelled) setOrganizer(null);
      }
    };

    const fetchVenue = async () => {
      try {
        if (event.venue_id) {
          const vRes = await fetch(`http://localhost:8080/venues/${event.venue_id}`);
          if (vRes.ok) {
            const v = await vRes.json();
            if (!cancelled) setVenue(v);
            return;
          }
        }
        // ไม่มี venue_id หรือ fetch ไม่สำเร็จ ให้ตั้ง null (จะใช้ UI แสดงว่าไม่มีสถานที่)
        if (!cancelled) setVenue(null);
      } catch (err) {
        console.error("fetch venue failed", err);
        if (!cancelled) setVenue(null);
      }
    };

    fetchOrganizerOrCreator();
    fetchVenue();

    return () => {
      cancelled = true;
    };
  }, [event]);

  // หาภาพปก
  const cover = images.find(img => img.is_cover) || images[0];
  const gallery = images.filter(img => !img.is_cover && img.image_id !== (cover && cover.image_id));

  // แสดงทีละ 2 รูป และเปลี่ยนทุก 3 วิ
  useEffect(() => {
    if (!gallery || gallery.length <= 2) {
      // ถ้า <=2 ให้ไม่ต้องหมุน
      setGalleryIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 2) % gallery.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [gallery.length]);
  
  // เตรียมรายการรูปที่จะโชว์ (ใช้ galleryIndex เพื่อหลีกเลี่ยง warning ว่า galleryIndex ไม่ได้ใช้)
  const galleryToShow = React.useMemo(() => {
    if (!gallery || gallery.length === 0) return [];
    if (gallery.length <= 2) return gallery;
    // คืนค่า 2 รูป โดย wrap-around ถ้าใกล้จุดสิ้นสุด
    const result = [];
    for (let i = 0; i < 2; i++) {
      result.push(gallery[(galleryIndex + i) % gallery.length]);
    }
    return result;
  }, [gallery, galleryIndex]);
  
  // คำนวณราคาที่จะแสดง (รองรับหลายรูปแบบที่ backend อาจส่งมา)
  const getPriceDisplay = (evt) => {
    if (!evt) return null;
    // ถ้ามีฟิลด์ price เป็นตัวเลข
    if (typeof evt.price === "number") {
      return `฿${evt.price.toLocaleString("th-TH")}`;
    }
    // ถ้ามี price_range หรือ price_text
    if (evt.price_range) return evt.price_range;
    if (evt.price_text) return evt.price_text;
    // ถ้ามี min/max
    if (evt.price_min || evt.price_max) {
      const min = evt.price_min ? `฿${Number(evt.price_min).toLocaleString("th-TH")}` : "";
      const max = evt.price_max ? `฿${Number(evt.price_max).toLocaleString("th-TH")}` : "";
      if (min && max) return `${min} - ${max}`;
      return min || max || null;
    }
    return null;
  };
  const priceDisplay = getPriceDisplay(event);

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

  // ฟังก์ชันดึงรีวิว
  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://localhost:8080/events/${id}/reviews`);
      if (res.ok) {
        const reviewsData = await res.json();
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
  };

  const [showOrganizerPopup, setShowOrganizerPopup] = useState(false);
  const [popupOrganizer, setPopupOrganizer] = useState(null);

  const openOrganizerPopup = (org) => {
    setPopupOrganizer(org);
    setShowOrganizerPopup(true);
  };
  const closeOrganizerPopup = () => {
    setShowOrganizerPopup(false);
    setPopupOrganizer(null);
  };

  // คลิกที่บล็อก/ลิงก์ผู้จัด: ถ้ามี organizer_id ให้ไปหน้า organizer ถ้าไม่มีก็เปิด popup (ผู้สร้าง)
  const handleOrganizerClick = (org, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (org && (org.organizer_id || org.id)) {
      // use organizer.organizer_id (หรือ fallback เป็น id ถาใช้งานกับ API ต่างกัน)
      const oid = org.organizer_id || org.id;
      navigate(`/organizers/${oid}`);
      return;
    }
    openOrganizerPopup(org);
  };

  if (loading) return <div style={{ padding: 40 }}>กำลังโหลด...</div>;
  if (!event) return <div style={{ padding: 40 }}>ไม่พบข้อมูลอีเว้นท์</div>;

  // คำนวณคะแนนเฉลี่ยของอีเว้นท์นี้
  const eventRatings = reviews.map(r => r.rating);
  const avgRating = eventRatings.length > 0 
    ? eventRatings.reduce((a, b) => a + b, 0) / eventRatings.length 
    : 0;

  return (
    <div className="event-detail-main">
      {/* ราคาจะแสดงเป็นปุ่มลอยบนรูป (ถูกแทรกใน cover wrapper) */}
      {/* เพิ่ม GlassAlert */}
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      
      <div className="event-detail-top">
        <div className="event-detail-cover-col">
          <div className="event-detail-cover-wrapper">
            {cover && (
              <img
                src={`http://localhost:8080${cover.image_url.replace(/^\./, "")}`}
                alt={event.name}
                className="event-detail-cover-img"
              />
            )}
            {priceDisplay && (
              <button
                type="button"
                className="event-price-fab"
                aria-label={`ราคา ${priceDisplay}`}
                onClick={() => {
                  // ถ้าต้องการให้คลิกแล้วทำอะไร ให้แก้ที่นี่ (เช่น คัดลอกราคาไปคลิปบอร์ด)
                }}
              >
                {priceDisplay}
              </button>
            )}
          </div>
          <div className="event-detail-nav-btns">
            <button
              className="event-detail-nav-btn"
              onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              รายละเอียด
            </button>
            <button
              className="event-detail-nav-btn"
              onClick={() => organizerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            >
              ผู้จัดงาน
            </button>
            <button
              className="event-detail-nav-btn"
              onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              รีวิว ({reviews.length})
            </button>
            {/* ปุ่มหัวใจเล็กๆ สวยๆ */}
            <div 
              className="event-detail-nav-favorite-btn"
              title={checkIsFavorite(parseInt(id)) ? "ลบจากรายการโปรด" : "เพิ่มในรายการโปรด"}
            >
              <FavoriteButton
                eventID={parseInt(id)}
                userID={user.user_id}
                isFavorite={checkIsFavorite(parseInt(id))}
                onToggle={handleFavoriteToggle}
                size="30"
              />
            </div>

            {/* ปุ่มรายงานอีเว้นท์ */}
            <div
              className="event-detail-nav-report-btn"
              title="รายงานอีเว้นท์นี้"
              style={{ marginLeft: 8 }}
            >
              <button
                type="button"
                onClick={openReport}
                aria-label="รายงานอีเว้นท์นี้"
                style={{
                  border: "1px solid #fee2e2",
                  background: "#fff",
                  color: "#ef4444",
                  padding: "6px 10px",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                <span aria-hidden>🚩</span>
              </button>
            </div>
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
      
      <div className="event-detail_desc-section" ref={detailsRef}>
        <div className="event-detail-desc-title">คำอธิบายงาน</div>
        <div className="event-detail-desc-text">{event.description}</div>
      </div>

      {/* Organizer Section */}
      {organizer && (
        <div className="event-detail-organizer-section" ref={organizerRef}>
          <div className="event-detail-organizer-title">ผู้รับทำอีเว้นท์ & สถานที่จัดงาน</div>
          <div className="event-detail-organizer-venue-row">
            
            {/* Organizer Column - ซ้าย */}
            <div 
              className="event-detail-organizer-col"
              style={{ cursor: "pointer" }}
              onClick={(e) => handleOrganizerClick(organizer, e)}
            >
              <div className="event-detail-organizer-header">
                <h3>👨‍💼 ผู้รับทำอีเว้นท์</h3>
              </div>
              <div className="event-detail-organizer-content">
                <div className="event-detail-organizer-role">{organizer.expertise || "ผู้จัดงานอีเว้นท์"}</div>
                <div className="event-detail-organizer-name">
                  <a
                    onClick={(e) => {
                      handleOrganizerClick(organizer, e);
                    }}
                    style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
                  >
                    {organizer.first_name} {organizer.last_name}
                  </a>
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

                {/* optional explicit button */}
                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-sm"
                    onClick={(e) => handleOrganizerClick(organizer, e)}
                    aria-label="ดูโปรไฟล์ผู้จัด"
                  >
                    ดูโปรไฟล์
                  </button>
                </div>
              </div>
            </div>

            {/* Venue Column - ขวา */}
            {venue ? (
              <div className="event-detail-venue-col">
                <div className="event-detail-venue-header">
                  <h3>📍 สถานที่จัดงาน</h3>
                </div>
                <div className="event-detail-venue-content">
                  <div className="event-detail-venue-name">{venue.name}</div>
                  <div className="event-detail-venue-location">📍 {venue.location}</div>
                  
                  {/* แผนที่จริง */}
                  <div className="event-detail-venue-map">
                    <GoogleMap 
                      latitude={venue.latitude} 
                      longitude={venue.longitude} 
                      venueName={venue.name}
                    />
                    <div className="event-detail-venue-coordinates">
                      พิกัด: {venue.latitude?.toFixed(4) || 'N/A'}, {venue.longitude?.toFixed(4) || 'N/A'}
                    </div>
                  </div>
                  
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-detail-venue-map-link"
                  >
                    🗺️ เปิดใน Google Maps
                  </a>
                </div>
              </div>
            ) : (
              <div className="event-detail-venue-col">
                <div className="event-detail-venue-header">
                  <h3>📍 สถานที่จัดงาน</h3>
                </div>
                <div className="event-detail-venue-empty">
                  ไม่ได้ระบุสถานที่จัดงาน
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* อีเว้นท์ยอดนิยม - ย้ายมาอยู่ตรงนี้ */}
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

      {/* Review Section - ฟอร์มเขียนรีวิว */}
      <div className="event-detail-review-section" ref={reviewsRef}>
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
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                disabled={reviewLoading}
              />
              <div className="event-detail-review-actions">
                <div className="event-detail-review-icons">
                  <span className="event-detail-review-icon">📝</span>
                  <span className="event-detail-review-icon">😊</span>
                  <span className="event-detail-review-icon">📷</span>
                </div>
                <button 
                  className="event-detail-review-btn"
                  onClick={handleSubmitReview}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
                </button>
              </div>
              <div className="event-detail-review-stars">
                {[1,2,3,4,5].map((n) => (
                  <span 
                    key={n} 
                    className="event-detail-review-star"
                    style={{ 
                      color: n <= (hoverRating || newReview.rating) ? "#fbbf24" : "#ddd",
                      cursor: reviewLoading ? "not-allowed" : "pointer",
                      fontSize: "1.4rem",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => !reviewLoading && setNewReview({...newReview, rating: n})}
                    onMouseEnter={() => !reviewLoading && setHoverRating(n)}
                    onMouseLeave={() => !reviewLoading && setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
                <span style={{ marginLeft: "12px", fontSize: "0.95rem", color: "#666", fontWeight: "500" }}>
                  {newReview.rating > 0 ? `${newReview.rating} ดาว` : "กรุณาให้คะแนน"}
                </span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", margin: "20px 0" }}>
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

      {/* แสดงคะแนนเฉลี่ย */}
      {reviews.length > 0 && (
        <div style={{ 
          marginTop: "24px", 
          padding: "20px", 
          background: "linear-gradient(135deg, #f7f8fa 0%, #e6f3ff 100%)", 
          borderRadius: "12px",
          border: "1px solid #e0e7ff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          maxWidth: "700px",
          margin: "24px auto 0 auto"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1f2937" }}>คะแนนเฉลี่ย:</span>
            <span style={{ color: "#fbbf24", fontSize: "1.4rem", letterSpacing: "2px" }}>
              {"★".repeat(Math.round(avgRating))}
              {"☆".repeat(5 - Math.round(avgRating))}
            </span>
            <span style={{ 
              fontSize: "1.3rem", 
              fontWeight: "700", 
              color: "#1f2937",
              background: "#fff",
              padding: "4px 12px",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {avgRating.toFixed(1)}
            </span>
            <span style={{ 
              color: "#6b7280", 
              fontSize: "1rem",
              background: "#fff",
              padding: "4px 8px",
              borderRadius: "6px"
            }}>
              ({reviews.length} รีวิว)
            </span>
          </div>
        </div>
      )}

      {/* แสดงรีวิวที่มีอยู่ */}
      {reviews.length > 0 && (
        <div className="event-detail-existing-reviews" style={{ 
          marginTop: "32px", 
          maxWidth: "700px", 
          margin: "32px auto 0 auto" 
        }}>
          <h3 style={{ 
            marginBottom: "20px", 
            fontSize: "1.25rem", 
            fontWeight: "700", 
            color: "#1f2937",
            textAlign: "center",
            padding: "0 0 10px 0",
            borderBottom: "2px solid #e0e7ff"
          }}>
            💬 ความคิดเห็นจากผู้เข้าร่วม
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {reviews.map((review) => (
              <div key={review.review_id} style={{ 
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", 
                padding: "20px", 
                borderRadius: "12px", 
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.2s ease",
                position: "relative"
              }}>
                {/* Header ของรีวิว */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px", 
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #f1f5f9"
                }}>
                  <img
                    src={
                      review.profile_image
                        ? `http://localhost:8080${review.profile_image}`
                        : "https://placehold.co/40x40?text=👤"
                    }
                    alt={review.username}
                    style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "50%", 
                      objectFit: "cover",
                      border: "2px solid #e0e7ff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ 
                      fontWeight: "600", 
                      fontSize: "1.05rem",
                      color: "#1f2937"
                    }}>
                      {review.username}
                    </span>
                    <div style={{ 
                      color: "#6b7280", 
                      fontSize: "0.85rem",
                      marginTop: "2px"
                    }}>
                      {new Date(review.created_at).toLocaleDateString("th-TH", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div style={{
                    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 2px 4px rgba(251, 191, 36, 0.3)"
                  }}>
                    <span style={{ color: "#ffffff", fontSize: "1rem", fontWeight: "600" }}>
                      {"★".repeat(review.rating)}
                    </span>
                    <span style={{ color: "#ffffff", fontSize: "0.9rem", fontWeight: "600" }}>
                      {review.rating}.0
                    </span>
                  </div>
                </div>
                
                {/* เนื้อหาความคิดเห็น */}
                <div style={{ 
                  fontSize: "1.05rem", 
                  lineHeight: "1.7", 
                  color: "#374151",
                  background: "#f8fafc",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontStyle: review.comment.length > 100 ? "normal" : "italic"
                }}>
                  "{review.comment}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* โมดัลรายงานอีเว้นท์ */}
      {reportOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !reportSubmitting && setReportOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 12 }}>
              รายงานอีเว้นท์นี้
            </div>

            <label style={{ display: "block", fontSize: 14, color: "#374151", marginBottom: 6 }}>
              เหตุผลในการรายงาน
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              disabled={reportSubmitting}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                marginBottom: 12,
                background: "#fff",
              }}
            >
              <option value="">-- เลือกเหตุผล --</option>
              <option value="ข้อมูลไม่เหมาะสม">ข้อมูลไม่เหมาะสม</option>
              <option value="สแปมหรือหลอกลวง">สแปมหรือหลอกลวง</option>
              <option value="รูปภาพ/ข้อความไม่เหมาะสม">รูปภาพ/ข้อความไม่เหมาะสม</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>

            <label style={{ display: "block", fontSize: 14, color: "#374151", marginBottom: 6 }}>
              รายละเอียดเพิ่มเติม (ถ้ามี)
            </label>
            <textarea
              rows={4}
              placeholder="อธิบายปัญหาที่พบ..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              disabled={reportSubmitting}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                disabled={reportSubmitting}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={reportSubmitting}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #dc2626",
                  background: "#ef4444",
                  color: "#fff",
                  cursor: "pointer",
                  minWidth: 120,
                }}
              >
                {reportSubmitting ? "กำลังส่ง..." : "ส่งรายงาน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* แสดงโปรไฟล์ผู้จัดในป๊อปอัพ */}
      {showOrganizerPopup && popupOrganizer && (
        <OrganizerProfilePopup
          organizer={popupOrganizer}
          onClose={closeOrganizerPopup}
        />
      )}
    </div>
  );
};

const GoogleMap = React.memo(({ latitude, longitude, venueName }) => {
  const mapRef = React.useRef(null);
  const [mapState, setMapState] = React.useState({
    isLoaded: false,
    isLoading: true,
    error: null
  });

  React.useEffect(() => {
    const loadGoogleMaps = () => {
      // ตรวจสอบว่า Google Maps API โหลดแล้วหรือยัง
      if (window.google && window.google.maps) {
        setMapState({ isLoaded: true, isLoading: false, error: null });
        return;
      }

      // ตรวจสอบว่ามี script แล้วหรือยัง
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // รอให้ script โหลดเสร็จ
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            setMapState({ isLoaded: true, isLoading: false, error: null });
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.google || !window.google.maps) {
            setMapState({ 
              isLoaded: false, 
              isLoading: false, 
              error: "โหลด Google Maps ไม่สำเร็จ" 
            });
          }
        }, 10000);
        return;
      }

      // สร้าง script ใหม่ - แก้ไข URL ให้มี loading=async
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // รอให้ Google Maps API พร้อมใช้งาน
        const checkReady = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkReady);
            setMapState({ isLoaded: true, isLoading: false, error: null });
          }
        }, 50);

        setTimeout(() => {
          clearInterval(checkReady);
          if (!window.google || !window.google.maps) {
            setMapState({ 
              isLoaded: false, 
              isLoading: false, 
              error: "Google Maps API ไม่พร้อมใช้งาน" 
            });
          }
        }, 5000);
      };
      
      script.onerror = () => {
        setMapState({ 
          isLoaded: false, 
          isLoading: false, 
          error: "ไม่สามารถโหลด Google Maps API ได้" 
        });
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  React.useEffect(() => {
    if (mapState.isLoaded && mapRef.current && latitude && longitude && !mapState.error) {
      try {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
          setMapState(prev => ({ ...prev, error: "พิกัดไม่ถูกต้อง" }));
          return;
        }

        // สร้างแผนที่ - ใช้ Marker แบบเก่าเพื่อหลีกเลี่ยง mapId
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "transit", 
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "road",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
          disableDefaultUI: false
        });

        // ใช้ Marker แบบเก่า (จะไม่มี warning เรื่อง mapId)
        new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: venueName || 'สถานที่จัดงาน',
          animation: window.google.maps.Animation.DROP, // เพิ่ม animation
          icon: {
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDQiIHZpZXdCb3g9IjAgMCAzMiA0NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzA2YjZkNDtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMGVhNWU5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxwYXRoIGQ9Ik0xNiA0NEMxNiA0NCAzMiAyMC42NjY3IDMyIDE2QzMyIDcuMTYzNDQgMjQuODM2NiAwIDE2IDBDNy4xNjM0NCAwIDAgNy4xNjM0NCAwIDE2QzAgMjAuNjY2NyAxNiA0NCAxNiA0NFoiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjEwIiBmaWxsPSJ3aGl0ZSIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI2IiBmaWxsPSIjMDZiNmQ0Ii8+Cjwvc3ZnPgo=',
            scaledSize: new window.google.maps.Size(32, 44),
            anchor: new window.google.maps.Point(16, 44)
          }
        });

        // เพิ่ม InfoWindow
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px 12px; max-width: 200px;">
              <div style="font-weight: 600; font-size: 1rem; color: #1f2937; margin-bottom: 4px;">
                📍 ${venueName || 'สถานที่จัดงาน'}
              </div>
              <div style="font-size: 0.85rem; color: #64748b;">
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
              </div>
            </div>
          `
        });

        // เพิ่ม event listener สำหรับ marker
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: venueName || 'สถานที่จัดงาน',
          animation: window.google.maps.Animation.DROP,
          icon: {
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDQiIHZpZXdCb3g9IjAgMCAzMiA0NCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzA2YjZkNDtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMGVhNWU5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxwYXRoIGQ9Ik0xNiA0NEMxNiA0NCAzMiAyMC42NjY3IDMyIDE2QzMyIDcuMTYzNDQgMjQuODM2NiAwIDE2IDBDNy4xNjM0NCAwIDAgNy4xNjM0NCAwIDE2QzAgMjAuNjY2NyAxNiA0NCAxNiA0NFoiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjEwIiBmaWxsPSJ3aGl0ZSIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI2IiBmaWxsPSIjMDZiNmQ0Ii8+Cjwvc3ZnPgo=',
            scaledSize: new window.google.maps.Size(32, 44),
            anchor: new window.google.maps.Point(16, 44)
          }
        });

        // คลิกที่ marker เพื่อแสดง info
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

      } catch (error) {
        console.error('Error creating map:', error);
        setMapState(prev => ({ 
          ...prev, 
          error: `เกิดข้อผิดพลาดในการสร้างแผนที่: ${error.message}` 
        }));
      }
    }
  }, [mapState.isLoaded, latitude, longitude, venueName, mapState.error]);

  // ไม่มีพิกัด
  if (!latitude || !longitude) {
    return (
      <div style={{
        width: '100%',
        height: '200px',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #cbd5e1',
        gap: '12px'
      }}>
        <div style={{ fontSize: '3rem', opacity: 0.5 }}>📍</div>
        <div style={{ 
          color: '#64748b', 
          fontSize: '1rem', 
          textAlign: 'center',
          fontWeight: '500'
        }}>
          ไม่มีข้อมูลตำแหน่งสำหรับแสดงแผนที่
        </div>
      </div>
    );
  }

  // เกิดข้อผิดพลาด
  if (mapState.error) {
    return (
      <div style={{
        width: '100%',
        height: '200px',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #fca5a5',
        gap: '12px'
      }}>
        <div style={{ fontSize: '2.5rem', opacity: 0.7 }}>⚠️</div>
        <div style={{ 
          color: '#dc2626', 
          fontSize: '0.95rem', 
          textAlign: 'center',
          fontWeight: '500',
          maxWidth: '250px'
        }}>
          {mapState.error}
        </div>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 16px',
            background: '#dc2626',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.background = '#b91c1c'}
          onMouseOut={(e) => e.target.style.background = '#dc2626'}
        >
          🗺️ เปิดใน Google Maps
        </a>
      </div>
    );
  }

  // กำลังโหลด
  if (mapState.isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '200px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e2e8f0',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #06b6d4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ 
          color: '#64748b', 
          fontSize: '1rem',
          fontWeight: '500' 
        }}>
          กำลังโหลดแผนที่...
        </div>
      </div>
    );
  }

  // แสดงแผนที่
  return (
    <div style={{ 
      width: '100%', 
      height: '200px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%'
        }}
      />
    </div>
  );
});

GoogleMap.displayName = 'GoogleMap';

export default EventDetail;