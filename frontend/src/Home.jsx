import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassAlert from "./GlassAlert"; // เพิ่ม import
import "./HomeBanner.css";
import "./Modern2Block.css";

const bannerImages = [
  "/Bannerimg/BF1.jpg",
  "/Bannerimg/BF2.jpg",
  "/Bannerimg/BF3.jpg",
  "/Bannerimg/BF4.jpg",
  "./Bannerimg/BF5.jpg",
  "/Bannerimg/BF6.jpg",
];

const bannerTexts = [
  "Event Assistant",
  "จัดการอีเว้นท์ง่ายในคลิกเดียว",
  "รีวิวผู้จัดและอีเว้นท์ได้ทันที",
  "สร้างสรรค์งานของคุณให้โดดเด่น",
  "ค้นหาอีเว้นท์ที่ใช่สำหรับคุณ",
  "เชื่อมต่อกับผู้จัดงานทั่วโลก",
];

const Home = () => {
  const [index, setIndex] = useState(0);
  // เก็บสถานะขยายคำอธิบายของแต่ละอีเว้นท์ (event_id => true)
  const [expandedEventDescriptions, setExpandedEventDescriptions] = useState({});
  const [popularEvents, setPopularEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topOrganizers, setTopOrganizers] = useState([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(true);
  const [show2Block, setShow2Block] = useState(false);
  
  // เพิ่ม state สำหรับสถานที่ยอดนิยม
  const [popularVenues, setPopularVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venueImages, setVenueImages] = useState({}); // เพิ่ม state สำหรับเก็บรูปภาพของสถานที่

  // เพิ่ม state สำหรับ GlassAlert
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  // --------------------------
  // states for Gather flow
  const [showGatherModal, setShowGatherModal] = useState(false);
  const [gatherLoading, setGatherLoading] = useState(false);
  // --------------------------
 
  // ย้าย logic เข้าโลกเสมือนจาก Profile -> ทำงานเหมือนเดิม (POST แล้วเปลี่ยน window.location.href)
  // const handleEnterVirtualWorld = async () => {
  //   setGatherLoading(true);
  //   const user = JSON.parse(localStorage.getItem("user")) || {};
  //   if (!user || !user.user_id) {
  //     showAlert("กรุณาเข้าสู่ระบบก่อนเข้าโลกเสมือน", "warning");
  //     setGatherLoading(false);
  //     setTimeout(() => navigate("/login"), 1200);
  //     return;
  //   }
  //   try {
  //     const role = (user.role || "member").toString().toLowerCase();
  //     const res = await fetch("http://localhost:8080/api/gather/session", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         user_id: user.user_id,
  //         username: user.username || user.email || `user_${user.user_id}`,
  //         avatar: user.profile_image || null,
  //         realm_id: "demo",
  //         role: role,
  //       }),
  //     });
  //     if (!res.ok) {
  //       const err = await res.json().catch(() => ({}));
  //       alert(err.error || "ไม่สามารถเข้าโลกเสมือนได้");
  //       setGatherLoading(false);
  //       return;
  //     }
  //     const data = await res.json();
  //     if (data.join_url) {
  //       // เปลี่ยนหน้าไปยัง join_url (เหมือน ProfileLayout เดิม)
  //       window.location.href = data.join_url;
  //     } else {
  //       alert("ไม่ได้รับลิงก์เข้าโลกเสมือน");
  //       setGatherLoading(false);
  //     }
  //   } catch (e) {
  //     console.error(e);
  //     alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
  //     setGatherLoading(false);
  //   }
  // };

  const navigate = useNavigate();

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

  // ฟังก์ชันตรวจสอบการออกจากระบบจาก URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loggedOut = urlParams.get('logged_out');
    const loginSuccess = urlParams.get('login_success');
    
    if (loggedOut === 'true') {
      showAlert("ออกจากระบบเรียบร้อยแล้ว 👋", "info");
      // ลบ parameter ออกจาก URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (loginSuccess === 'true') {
      showAlert("เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ 🎉", "success");
      // ลบ parameter ออกจาก URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ฟังก์ชันจัดการการคลิกปุ่มสร้างอีเว้นท์
  const handleCreateEvent = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.user_id) {
      showAlert("กรุณาเข้าสู่ระบบก่อนสร้างอีเว้นท์", "warning");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      navigate("/my-events");
    }
  };

  // ฟังก์ชันจัดการการคลิกปุ่มสร้างบัตรเชิญ
  const handleCreateInvitation = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.user_id) {
      showAlert("กรุณาเข้าสู่ระบบก่อนสร้างบัตรเชิญ", "warning");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      navigate("/create-invite-card");
    }
  };

  const handleAskAdvice = () => {
    const user = localStorage.getItem("user");
    if (!user || user === "undefined") {
      showAlert("กรุณาเข้าสู่ระบบก่อนใช้งาน AI", "warning");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      navigate("/ai");
    }
  };

  // ฟังก์ชันจัดการคลิกปุ่มทดลอง AI
  const handleTryAI = () => {
    const user = localStorage.getItem("user");
    if (!user || user === "undefined") {
      showAlert("กรุณาเข้าสู่ระบบก่อนทดลองใช้ AI", "warning");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      showAlert("กำลังเปิดหน้าทดลองใช้ AI...", "info");
      setTimeout(() => navigate("/ai"), 1000);
    }
  };
  const joinGather = async () => {
    setGatherLoading(true); // ใช้งานเพื่อป้องกัน warning และแสดงสถานะ
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const role = (user.role || "member").toString().toLowerCase();

    try {
      const res = await fetch("http://localhost:8080/api/gather/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          username: user.username || user.email || `user_${user.user_id}`,
          avatar: user.profile_image || null,
          realm_id: "demo",
          role: role // <-- ส่ง role จริง
        }),
      });
      const data = await res.json();
      if (res.ok && data.join_url) {
        window.open(data.join_url, "_blank", "noopener,noreferrer");
      } else {
        alert(data.error || "ไม่สามารถขอเข้าร่วมได้");
      }
    } catch (e) {
      console.error("joinGather error", e);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setGatherLoading(false);
    }
  }

  useEffect(() => {
    fetch("http://localhost:8080/organizers")
      .then((res) => res.json())
      .then((data) => setOrganizers(Array.isArray(data) ? data : []))
      .catch(() => {
        setOrganizers([]);
        console.error("Failed to fetch organizers");
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then(async (events) => {
        console.log("events from API:", events);
        if (!Array.isArray(events)) return setPopularEvents([]);

        // กรองเฉพาะที่ไม่ถูกระงับ
        const activeEvents = events.filter((e) => e.is_active !== false);

        // คำนวณคะแนนเฉลี่ยของเฉพาะอีเว้นท์ที่ยัง active
        const eventsWithRating = await Promise.all(
          activeEvents.map(async (event) => {
            try {
              const reviewRes = await fetch(`http://localhost:8080/events/${event.event_id}/reviews`);
              let reviews = await reviewRes.json();
              if (!Array.isArray(reviews)) reviews = [];
              
              const ratings = reviews.map((r) => r.rating);
              const avgRating = ratings.length > 0 
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
                : 0;
              
              // ดึงรูปปก
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
                avgRating,
                totalReviews: ratings.length,
                cover_image: coverImg ? coverImg.image_url : null,
              };
            } catch (error) {
              console.error(`Error processing event ${event.event_id}:`, error);
              return {
                ...event,
                avgRating: 0,
                totalReviews: 0,
                cover_image: null,
              };
            }
          })
        );
        
        setPopularEvents(
          eventsWithRating
            .filter((e) => e.avgRating >= 3 && e.totalReviews > 0)
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 4)
        );
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setPopularEvents([]);
        setLoading(false);
        showAlert("เกิดข้อผิดพลาดในการโหลดอีเว้นท์", "danger");
      });
  }, []);

  // ดึง organizer ทั้งหมด + คำนวณ avg rating
  useEffect(() => {
    const fetchOrganizers = async () => {
      setLoadingOrganizers(true);
      try {
        const res = await fetch("http://localhost:8080/organizers");
        let orgs = await res.json();
        if (!Array.isArray(orgs)) orgs = [];
        
        // ดึงรีวิวและข้อมูลผู้ใช้แต่ละ organizer
        const orgsWithRating = await Promise.all(
          orgs.map(async (org) => {
            try {
              // ดึงรีวิว
              const reviewRes = await fetch(
                `http://localhost:8080/organizers/${org.organizer_id}/reviews`
              );
              let reviews = await reviewRes.json();
              if (!Array.isArray(reviews)) reviews = [];
              const ratings = reviews.map((r) => r.rating);
              const avgRating =
                ratings.length > 0
                  ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                  : 0;

              // ดึงข้อมูลผู้ใช้จริงเพื่อเอารูปโปรไฟล์
              const userRes = await fetch(`http://localhost:8080/users/${org.user_id}`);
              let userData = {};
              if (userRes.ok) {
                userData = await userRes.json();
              }

              return {
                ...org,
                reviews,
                avgRating,
                totalReviews: ratings.length,
                // ใช้รูปโปรไฟล์จากข้อมูลผู้ใช้แทน portfolio_img
                profile_image: userData.profile_image || null,
                first_name: userData.first_name || org.first_name,
                last_name: userData.last_name || org.last_name,
                username: userData.username || org.username,
                email: userData.email || org.email,
                phone: userData.phone || org.phone,
                bio: userData.bio || org.bio
              };
            } catch (error) {
              console.error(`Error processing organizer ${org.organizer_id}:`, error);
              return {
                ...org,
                reviews: [],
                avgRating: 0,
                totalReviews: 0,
                profile_image: null
              };
            }
          })
        );
        
        // filter เฉพาะ organizer ที่ avgRating 3-5 และมีรีวิว
        setTopOrganizers(
          orgsWithRating
            .filter((o) => o.avgRating >= 3 && o.avgRating <= 5 && o.totalReviews > 0)
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 5)
        );
        setLoadingOrganizers(false);
      } catch (error) {
        console.error("Error fetching organizers:", error);
        setLoadingOrganizers(false);
        showAlert("เกิดข้อผิดพลาดในการโหลดผู้จัดงาน", "danger");
      }
    };
    fetchOrganizers();
  }, []);

  // เพิ่ม useEffect สำหรับดึงสถานที่ยอดนิยม
  useEffect(() => {
    const fetchPopularVenues = async () => {
      setLoadingVenues(true);
      try {
        const response = await fetch("http://localhost:8080/venues/popular?limit=4");
        if (response.ok) {
          const venues = await response.json();
          setPopularVenues(Array.isArray(venues) ? venues : []);
        }
      } catch (error) {
        console.error("Error fetching popular venues:", error);
        setPopularVenues([]);
        showAlert("เกิดข้อผิดพลาดในการโหลดสถานที่", "danger");
      }
      setLoadingVenues(false);
    };
    
    fetchPopularVenues();
  }, []);

  // เพิ่ม useEffect สำหรับดึงรูปภาพของสถานที่
  useEffect(() => {
    const fetchVenueImages = async () => {
      for (const venue of popularVenues) {
        if (!venueImages[venue.venue_id]) {
          try {
            const res = await fetch(`http://localhost:8080/venues/${venue.venue_id}/images`);
            if (res.ok) {
              const images = await res.json();
              const coverImage = images.find(img => img.is_cover) || images[0];
              
              setVenueImages(prev => ({
                ...prev,
                [venue.venue_id]: coverImage
              }));
            }
          } catch (error) {
            console.error(`Error fetching images for venue ${venue.venue_id}:`, error);
          }
        }
      }
    };

    if (popularVenues.length > 0) {
      fetchVenueImages();
    }
  }, [popularVenues, venueImages]);

  // ฟังก์ชันดึงรูปปกสำหรับสถานที่
  const getVenueCoverImage = (venueId) => {
    const coverImage = venueImages[venueId];
    if (coverImage) {
      return `http://localhost:8080${coverImage.image_url.replace(/^\./, "")}`;
    }
    return "https://placehold.co/300x180?text=No+Image";
  };

  // ฟังก์ชันหา organizer name
  const getOrganizerName = (organizer_id) => {
    const org = organizers.find((o) => o.organizer_id === organizer_id);
    if (org) {
      return `${org.first_name || ""} ${org.last_name || ""}`.trim() || org.username || "ไม่พบชื่อผู้จัด";
    }
    return "ไม่พบชื่อผู้จัด";
  };

  // เพิ่ม useEffect นี้
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const section = document.querySelector('.modern-2block-section');
    if (!section) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setShow2Block(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* เพิ่ม GlassAlert */}
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />

      {/* Banner และ 3 ปุ่ม */}
      <div className="home-banner-outer">
        <div className="home-banner-img-wrap">
          {bannerImages.map((img, i) => (
            <img
              key={img}
              src={img}
              alt={`banner${i + 1}`}
              className={`home-banner-img${i === index ? " active" : ""}`}
              style={{ zIndex: i === index ? 2 : 1 }}
            />
          ))}
          <div className="home-banner-text">{bannerTexts[index]}</div>
          <div className="home-banner-dots">
            {bannerImages.map((_, i) => (
              <span
                key={i}
                className={`home-banner-dot${i === index ? " active" : ""}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="home-feature-btns">
        <div 
          className="home-feature-btn"
          onClick={handleCreateEvent}
          style={{ cursor: "pointer" }}
        >
          <div className="home-feature-btn-icon">📢</div>
          <div className="home-feature-btn-label">สร้างอีเว้นท์</div>
        </div>
        <div
          className="home-feature-btn"
          onClick={handleAskAdvice}
          style={{ cursor: "pointer" }}
        >
          <div className="home-feature-btn-icon">💬</div>
          <div className="home-feature-btn-label">ขอคำแนะนำ</div>
        </div>
        <div 
          className="home-feature-btn"
          onClick={handleCreateInvitation}
          style={{ cursor: "pointer" }}
        >
          <div className="home-feature-btn-icon">🎁</div>
          <div className="home-feature-btn-label">สร้างบัตรเชิญ</div>
        </div>
        {/* <div
          className="home-feature-btn"
          onClick={handleEnterVirtualWorld}
          style={{
            cursor: gatherLoading ? "default" : "pointer",
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e6eef6",
            borderRadius: 8,
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 160,
            justifyContent: "center",
            boxShadow: "0 6px 18px rgba(7,12,20,0.03)"
          }}
        >
          <div className="home-feature-btn-icon" style={{ fontSize: 18 }}>🕹️</div>
          <div className="home-feature-btn-label">{gatherLoading ? "กำลังเข้า..." : "เข้าโลกเสมือน"}</div>
        </div> */}
      </div>

      {/* อีเว้นท์ยอดนิยม */}
      <div className="home-popular-section">
        <div className="home-popular-header">
          <span>อีเว้นท์ ยอดนิยม</span>
          <button 
            onClick={() => navigate("/events")} 
            className="home-popular-more"
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
          >
            แสดงทั้งหมด
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", margin: 40 }}>กำลังโหลด...</div>
        ) : popularEvents.length === 0 ? (
          <div style={{ textAlign: "center", margin: 40, color: "#666" }}>
            ยังไม่มีอีเว้นท์ที่มีรีวิว
          </div>
        ) : (
          <div className="home-popular-list">
            {popularEvents.map((event) => (
              <div
                className="home-popular-card"
                key={event.event_id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/events/${event.event_id}`)}
              >
                <div className="home-popular-img-wrap">
                  <img
                    src={
                      event.cover_image
                        ? `http://localhost:8080${event.cover_image.replace(/^\./, "")}`
                        : "https://placehold.co/300x180?text=No+Image"
                    }
                    alt={event.name}
                    className="home-popular-img"
                  />
                </div>
                <div className="home-popular-info">
                  <div className="home-popular-title">{event.name}</div>
                  <div className="home-popular-organizer">
                    {getOrganizerName(event.organizer_id)}
                  </div>
                  <div className="home-popular-rating">
                    <span className="home-popular-stars">
                      {"★".repeat(Math.round(event.avgRating))}
                      {"☆".repeat(5 - Math.round(event.avgRating))}
                    </span>
                    <span className="home-popular-rating-num">
                      {event.avgRating.toFixed(1)}
                    </span>
                    <span className="home-popular-rating-count">
                      ({event.totalReviews} Ratings)
                    </span>
                  </div>
                  <div className="home-popular-desc" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {event.description && (() => {
                      const isExpanded = !!expandedEventDescriptions[event.event_id];
                      const maxLen = 120; // จำนวนอักษรที่โชว์แบบย่อ
                      if (event.description.length <= maxLen) return event.description;
                      return isExpanded ? event.description : `${event.description.slice(0, maxLen)}...`;
                    })()}
                    {event.description && event.description.length > 120 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedEventDescriptions(prev => ({ ...prev, [event.event_id]: !prev[event.event_id] })); }}
                        style={{
                          alignSelf: "flex-start",
                          background: "transparent",
                          border: "none",
                          color: "#007bff",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: 13
                        }}
                      >
                        {expandedEventDescriptions[event.event_id] ? "ย่อ" : "อ่านเพิ่มเติม"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* สถานที่ยอดนิยม */}
      <div className="home-popular-section">
        <div className="home-popular-header">
          <span>สถานที่ ยอดนิยม</span>
          <button 
            onClick={() => navigate("/venues")} 
            className="home-popular-more"
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
          >
            แสดงทั้งหมด
          </button>
        </div>
        {loadingVenues ? (
          <div style={{ textAlign: "center", margin: 40 }}>กำลังโหลด...</div>
        ) : popularVenues.length === 0 ? (
          <div style={{ textAlign: "center", margin: 40, color: "#666" }}>
            ยังไม่มีข้อมูลสถานที่
          </div>
        ) : (
          <div className="home-popular-list">
            {popularVenues.map((venue) => (
              <div
                className="home-popular-card"
                key={venue.venue_id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/venues/${venue.venue_id}`)}
              >
                <div className="home-popular-img-wrap">
                  <img
                    src={getVenueCoverImage(venue.venue_id)}
                    alt={venue.name}
                    className="home-popular-img"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/300x180?text=No+Image";
                    }}
                  />
                </div>
                <div className="home-popular-info">
                  <div className="home-popular-title">{venue.name}</div>
                  <div className="home-popular-organizer">
                    📍 {venue.location} • {venue.venue_type}
                  </div>
                  <div className="home-popular-rating">
                    <span className="home-popular-stars">
                      {"★".repeat(Math.round(venue.rating))}
                      {"☆".repeat(5 - Math.round(venue.rating))}
                    </span>
                    <span className="home-popular-rating-num">
                      {venue.rating}
                    </span>
                    <span className="home-popular-rating-count">
                      ({venue.review_count} รีวิว)
                    </span>
                  </div>
                  <div className="home-popular-desc">
                    💰 {venue.price_range}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ผู้รับทำ ยอดนิยม */}
      <div className="home-popular-section">
        <div className="home-popular-header">
          <span>ผู้รับทำ ยอดนิยม</span>
          <button 
            onClick={() => navigate("/organizers")} 
            className="home-popular-more"
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
          >
            แสดงทั้งหมด
          </button>
        </div>
        {loadingOrganizers ? (
          <div style={{ textAlign: "center", margin: 40 }}>กำลังโหลด...</div>
        ) : (
          <div className="home-organizers-list">
            {topOrganizers.map((org) => (
              <div 
                className="home-organizer-profile-card" 
                key={org.organizer_id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/organizers/${org.organizer_id}`)}
              >
                {/* Profile image with border */}
                <div className="home-organizer-avatar-section">
                  <div className="home-organizer-avatar-wrapper">
                    <img
                      src={
                        org.profile_image
                          ? org.profile_image.startsWith("http")
                            ? org.profile_image
                            : `http://localhost:8080${org.profile_image.replace(/^\./, "")}`
                          : "/default-avatar.png"
                      }
                      alt={org.first_name}
                      className="home-organizer-avatar"
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                    <div className="home-organizer-avatar-ring"></div>
                  </div>
                </div>

                {/* Profile info */}
                <div className="home-organizer-info">
                  <div className="home-organizer-name">
                    {`${org.first_name || ""} ${org.last_name || ""}`.trim() || org.username}
                  </div>
                  
                  <div className="home-organizer-expertise">
                    <span className="home-organizer-expertise-icon">🎯</span>
                    {org.expertise || "ผู้จัดงานมืออาชีพ"}
                  </div>

                  {/* Rating with stars */}
                  <div className="home-organizer-rating">
                    <div className="home-organizer-stars">
                      {"★".repeat(Math.round(org.avgRating))}
                      {"☆".repeat(5 - Math.round(org.avgRating))}
                    </div>
                    <span className="home-organizer-rating-num">
                      {org.avgRating.toFixed(1)}
                    </span>
                    <span className="home-organizer-rating-count">
                      ({org.totalReviews} รีวิว)
                    </span>
                  </div>

                  {/* Bio preview */}
                  {org.bio && (
                    <div className="home-organizer-bio">
                      "{org.bio.length > 60 ? `${org.bio.slice(0, 60)}...` : org.bio}"
                    </div>
                  )}

                  {/* Contact button - เหลือแค่ปุ่มเดียว */}
                  <div className="home-organizer-actions">
                    <button 
                      className="home-organizer-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/organizers/${org.organizer_id}`);
                      }}
                    >
                      <span>👁️</span>
                      ดูโปรไฟล์
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`modern-2block-section${show2Block ? " show" : ""}`}>
        {/* Block 1 */}
        <div className="modern-2block-row">
          <div className="modern-2block-img-col">
            <img
              src="/Bannerimg/PERR.png"
              alt="ทดลองใช้งาน AI"
              className="modern-2block-img"
            />
          </div>
          <div className="modern-2block-content-col">
            <div className="modern-2block-title">ทดลองใช้งาน AI</div>
            <div className="modern-2block-desc">
              การใช้งาน AI ช่วยเพิ่มประสิทธิภาพในการจัดงานอีเว้นท์ <br />
              ลดความยุ่งยาก ประหยัดเวลา และตอบสนองความต้องการได้อย่างแม่นยำ
            </div>
            <button 
              className="modern-2block-btn"
              onClick={handleTryAI}
            >
              ทดลอง <span className="modern-2block-btn-arrow">→</span>
            </button>
          </div>
        </div>
        {/* Block 2 */}
        <div className="modern-2block-row second">
          <div className="modern-2block-content-col">
            <div className="modern-2block-title">สถานที่สุดเจ๋ง</div>
            <div className="modern-2block-desc modern-2block-desc-below-btn">
              การแนะนำสถานที่และร้านค้าสำหรับจัดงานเป็นนวัตกรรมที่ช่วยเพิ่มความสะดวกและความพิเศษในการวางแผนจัดอีเว้นท์
            </div>
            <button 
              className="modern-2block-btn"
              onClick={() => navigate("/venues")}
            >
              แนะนำ <span className="modern-2block-btn-arrow">→</span>
            </button>
          </div>
          <div className="modern-2block-img-col">
            <img
              src="/Bannerimg/PERR2.png"
              alt="สถานที่สุดเจ๋ง"
              className="modern-2block-img"
            />
          </div>
        </div>
      </div>

      {/* Gather modal */}
      {showGatherModal && (
        <div className="gather-modal-backdrop" style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999
        }}>
          <div style={{background:"#fff", padding:20, borderRadius:8, width:360}}>
            <h3>แต่งตัวละครก่อนเข้า</h3>
            <div style={{display:"flex", gap:12, alignItems:"center", margin:"12px 0"}}>
              <div style={{width:64, height:64, borderRadius:12, background:"#6c5ce7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28}}>🙂</div>
              <div style={{flex:1}}>
                <div style={{marginBottom:8}}>ตัวอย่างอวาตาร์ (ปรับได้ในโลก)</div>
                <input placeholder="ชื่อตัวละคร (ไม่บังคับ)" style={{width:"100%", marginBottom:8}} />
              </div>
            </div>
            <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
              <button onClick={()=>setShowGatherModal(false)} disabled={gatherLoading}>ยกเลิก</button>
              <button onClick={joinGather} disabled={gatherLoading}>{gatherLoading ? "กำลังเข้า..." : "เข้าร่วม"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-logo">
            <span role="img" aria-label="logo">🤖</span> Event Assistant
          </div>
          <div className="home-footer-links">
            <a href="/" className="home-footer-link">หน้าแรก</a>
            <a href="/events" className="home-footer-link">อีเว้นท์</a>
            <a href="/organizers" className="home-footer-link">ผู้รับทำ</a>
            <a href="/venues" className="home-footer-link">สถานที่</a>
            <a href="/about" className="home-footer-link">เกี่ยวกับเรา</a>
          </div>
          <div className="home-footer-copy">
            &copy; {new Date().getFullYear()} Event Assistant. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;