import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeBanner.css";
import "./Modern2Block.css";

const bannerImages = [
  "/Bannerimg/b1.jpg",
  "/Bannerimg/b2.jpg",
  "/Bannerimg/b3.jpg",
  "/Bannerimg/b4.jpg",
  "./Bannerimg/b5.jpg",
  "/Bannerimg/b6.jpg",
];

const bannerTexts = [
  "Smart AI Event Assistant",
  "จัดการอีเว้นท์ง่ายในคลิกเดียว",
  "รีวิวผู้จัดและอีเว้นท์ได้ทันที",
  "สร้างสรรค์งานของคุณให้โดดเด่น",
  "ค้นหาอีเว้นท์ที่ใช่สำหรับคุณ",
  "เชื่อมต่อกับผู้จัดงานทั่วโลก",
];

const Home = () => {
  const [index, setIndex] = useState(0);
  const [popularEvents, setPopularEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topOrganizers, setTopOrganizers] = useState([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/organizers")
      .then((res) => res.json())
      .then((data) => setOrganizers(Array.isArray(data) ? data : []))
      .catch(() => setOrganizers([]));
  }, []);

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
              // Ignore errors when fetching event images
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
        setLoading(false);
      });
  }, []);

  // ดึง organizer ทั้งหมด + คำนวณ avg rating
  useEffect(() => {
    const fetchOrganizers = async () => {
      setLoadingOrganizers(true);
      const res = await fetch("http://localhost:8080/organizers");
      let orgs = await res.json();
      if (!Array.isArray(orgs)) orgs = [];
      // ดึงรีวิวแต่ละ organizer
      const orgsWithRating = await Promise.all(
        orgs.map(async (org) => {
          const res = await fetch(
            `http://localhost:8080/organizers/${org.organizer_id}/reviews`
          );
          let reviews = await res.json();
          if (!Array.isArray(reviews)) reviews = [];
          const ratings = reviews.map((r) => r.rating);
          const avgRating =
            ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;
          return {
            ...org,
            reviews,
            avgRating,
            totalReviews: ratings.length,
          };
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
    };
    fetchOrganizers();
  }, []);

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

  return (
    <div>
      {/* ... Banner และ 3 ปุ่ม ... */}
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
        <div className="home-feature-btn">
          <div className="home-feature-btn-icon">📢</div>
          <div className="home-feature-btn-label">สร้างอีเว้นท์</div>
        </div>
        <div className="home-feature-btn">
          <div className="home-feature-btn-icon">💬</div>
          <div className="home-feature-btn-label">ขอคำแนะนำ</div>
        </div>
        <div className="home-feature-btn">
          <div className="home-feature-btn-icon">🎁</div>
          <div className="home-feature-btn-label">สร้างบัตรเชิญ</div>
        </div>
      </div>

      {/* อีเว้นท์ยอดนิยม */}
      <div className="home-popular-section">
        <div className="home-popular-header">
          <span>อีเว้นท์ ยอดนิยม</span>
          <a href="/events" className="home-popular-more">
            แสดงทั้งหมด
          </a>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", margin: 40 }}>กำลังโหลด...</div>
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
                  <div className="home-popular-desc">{event.description}</div>
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
          <a href="/organizers" className="home-popular-more">
            แสดงทั้งหมด
          </a>
        </div>
        {loadingOrganizers ? (
          <div style={{ textAlign: "center", margin: 40 }}>กำลังโหลด...</div>
        ) : (
          <div className="home-popular-list">
            {topOrganizers.map((org) => (
              <div className="home-popular-card" key={org.organizer_id}>
                <div className="home-popular-img-wrap">
                  <img
                    src={
                      org.portfolio_img
                        ? org.portfolio_img.startsWith("http")
                          ? org.portfolio_img
                          : `http://localhost:8080${org.portfolio_img.replace(/^\./, "")}`
                        : "https://placehold.co/300x180?text=No+Image"
                    }
                    alt={org.first_name}
                    className="home-popular-img"
                  />
                </div>
                <div className="home-popular-info">
                  <div className="home-popular-title">
                    {`${org.first_name || ""} ${org.last_name || ""}`.trim() || org.username}
                  </div>
                  <div className="home-popular-organizer">
                    {org.expertise || "ทีมงานมืออาชีพ"}
                  </div>
                  <div className="home-popular-rating">
                    <span className="home-popular-stars">
                      {"★".repeat(Math.round(org.avgRating))}
                      {"☆".repeat(5 - Math.round(org.avgRating))}
                    </span>
                    <span className="home-popular-rating-num">
                      {org.avgRating.toFixed(1)}
                    </span>
                    <span className="home-popular-rating-count">
                      ({org.totalReviews} Ratings)
                    </span>
                  </div>
                  {/* เพิ่ม bio หรือคำอธิบายอื่นได้ */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="modern-2block-section">
        {/* Block 1 */}
        <div className="modern-2block-row">
          <div className="modern-2block-img-col">
            <img
              src="/Bannerimg/pr1.png"
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
            <button className="modern-2block-btn">
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
            <button className="modern-2block-btn">
              แนะนำ <span className="modern-2block-btn-arrow">→</span>
            </button>
          </div>
          <div className="modern-2block-img-col">
            <img
              src="/Bannerimg/pr2.png"
              alt="สถานที่สุดเจ๋ง"
              className="modern-2block-img"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-logo">
            <span role="img" aria-label="logo">🤖</span> Smart AI Event Assistant
          </div>
          <div className="home-footer-links">
            <a href="/" className="home-footer-link">หน้าแรก</a>
            <a href="/events" className="home-footer-link">อีเว้นท์</a>
            <a href="/organizers" className="home-footer-link">ผู้รับทำ</a>
            <a href="/about" className="home-footer-link">เกี่ยวกับเรา</a>
          </div>
          <div className="home-footer-copy">
            &copy; {new Date().getFullYear()} Smart AI Event Assistant. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;