import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./SearchResults.css";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState({
    events: [],
    organizers: [],
    venues: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!query.trim()) {
      navigate("/");
      return;
    }
    performSearch(query);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      // ดึงข้อมูลทั้งหมดพร้อมกัน
      const [eventsRes, organizersRes, venuesRes] = await Promise.all([
        fetch("http://localhost:8080/events").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:8080/organizers").then((r) => r.json()).catch(() => []),
        fetch("http://localhost:8080/venues").then((r) => r.json()).catch(() => [])
      ]);

      // กรองและเตรียมข้อมูล Events
      const eventResults = (Array.isArray(eventsRes) ? eventsRes : []).filter(
        (e) =>
          e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const eventsWithDetails = await Promise.all(
        eventResults.map(async (event) => {
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

            // ดึงรีวิว
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
          } catch {
            return {
              ...event,
              cover_image: null,
              avgRating: 0,
              totalReviews: 0
            };
          }
        })
      );

      // กรองและเตรียมข้อมูล Organizers
      const organizerResults = (Array.isArray(organizersRes) ? organizersRes : []).filter(
        (o) =>
          `${o.first_name || ""} ${o.last_name || ""}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.expertise?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const organizersWithRating = await Promise.all(
        organizerResults.map(async (org) => {
          try {
            const reviewRes = await fetch(`http://localhost:8080/organizers/${org.organizer_id}/reviews`);
            let reviews = await reviewRes.json();
            if (!Array.isArray(reviews)) reviews = [];
            
            const ratings = reviews.map((r) => r.rating);
            const avgRating = ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;

            return {
              ...org,
              avgRating,
              totalReviews: ratings.length,
            };
          } catch {
            return {
              ...org,
              avgRating: 0,
              totalReviews: 0,
            };
          }
        })
      );

      // กรองข้อมูล Venues
      const venueResults = (Array.isArray(venuesRes) ? venuesRes : []).filter(
        (v) =>
          v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.venue_type?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults({
        events: eventsWithDetails,
        organizers: organizersWithRating,
        venues: venueResults
      });

    } catch (error) {
      console.error("Search error:", error);
      setResults({ events: [], organizers: [], venues: [] });
    }
    setLoading(false);
  };

  const totalResults = results.events.length + results.organizers.length + results.venues.length;

  const getFilteredResults = () => {
    switch (activeTab) {
      case "events":
        return results.events;
      case "organizers":
        return results.organizers;
      case "venues":
        return results.venues;
      default:
        return [
          ...results.events.map(item => ({ ...item, type: "event" })),
          ...results.organizers.map(item => ({ ...item, type: "organizer" })),
          ...results.venues.map(item => ({ ...item, type: "venue" }))
        ];
    }
  };

  if (loading) {
    return (
      <div className="search-results-container">
        <div className="search-results-loading">กำลังค้นหา...</div>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      {/* Header */}
      <div className="search-results-header">
        <h1>ผลการค้นหา</h1>
        <div className="search-results-query">
          ค้นหา: "<span>{query}</span>" พบ {totalResults} รายการ
        </div>
      </div>

      {/* Tabs */}
      <div className="search-results-tabs">
        <button 
          className={`search-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          ทั้งหมด ({totalResults})
        </button>
        <button 
          className={`search-tab ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          อีเว้นท์ ({results.events.length})
        </button>
        <button 
          className={`search-tab ${activeTab === "organizers" ? "active" : ""}`}
          onClick={() => setActiveTab("organizers")}
        >
          ผู้จัดงาน ({results.organizers.length})
        </button>
        <button 
          className={`search-tab ${activeTab === "venues" ? "active" : ""}`}
          onClick={() => setActiveTab("venues")}
        >
          สถานที่ ({results.venues.length})
        </button>
      </div>

      {/* Results */}
      <div className="search-results-content">
        {totalResults === 0 ? (
          <div className="search-results-empty">
            <div className="search-results-empty-icon">🔍</div>
            <h3>ไม่พบผลลัพธ์</h3>
            <p>ลองใช้คำค้นหาอื่น หรือตรวจสอบการสะกดคำ</p>
          </div>
        ) : (
          <div className="search-results-grid">
            {getFilteredResults().map((item, index) => {
              if (item.type === "event" || item.event_id) {
                return (
                  <div
                    key={`event-${item.event_id}-${index}`}
                    className="search-result-card"
                    onClick={() => navigate(`/events/${item.event_id}`)}
                  >
                    <div className="search-result-img-wrap">
                      <img
                        src={
                          item.cover_image
                            ? `http://localhost:8080${item.cover_image.replace(/^\./, "")}`
                            : "https://placehold.co/300x180?text=No+Image"
                        }
                        alt={item.name}
                        className="search-result-img"
                      />
                      <div className="search-result-type-badge">Event</div>
                    </div>
                    <div className="search-result-info">
                      <div className="search-result-title">{item.name}</div>
                      <div className="search-result-rating">
                        <span className="search-result-stars">
                          {"★".repeat(Math.round(item.avgRating || 0))}
                          {"☆".repeat(5 - Math.round(item.avgRating || 0))}
                        </span>
                        <span className="search-result-rating-num">
                          {item.avgRating > 0 ? item.avgRating.toFixed(1) : "ยังไม่มีคะแนน"}
                        </span>
                        <span className="search-result-rating-count">
                          ({item.totalReviews || 0} รีวิว)
                        </span>
                      </div>
                      <div className="search-result-desc">
                        {item.description?.length > 80 
                          ? `${item.description.slice(0, 80)}...` 
                          : item.description || "ไม่มีคำอธิบาย"}
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type === "organizer" || item.organizer_id) {
                return (
                  <div
                    key={`organizer-${item.organizer_id}-${index}`}
                    className="search-result-card"
                    onClick={() => navigate(`/organizers/${item.organizer_id}`)}
                  >
                    <div className="search-result-img-wrap">
                      <img
                        src={
                          item.profile_image
                            ? `http://localhost:8080${item.profile_image.replace(/^\./, "")}`
                            : "https://placehold.co/300x180?text=No+Image"
                        }
                        alt={item.first_name}
                        className="search-result-img"
                      />
                      <div className="search-result-type-badge organizer">Organizer</div>
                    </div>
                    <div className="search-result-info">
                      <div className="search-result-title">
                        {`${item.first_name || ""} ${item.last_name || ""}`.trim() || item.username}
                      </div>
                      <div className="search-result-expertise">
                        {item.expertise || "ผู้จัดงานมืออาชีพ"}
                      </div>
                      <div className="search-result-rating">
                        <span className="search-result-stars">
                          {"★".repeat(Math.round(item.avgRating || 0))}
                          {"☆".repeat(5 - Math.round(item.avgRating || 0))}
                        </span>
                        <span className="search-result-rating-num">
                          {item.avgRating > 0 ? item.avgRating.toFixed(1) : "ยังไม่มีคะแนน"}
                        </span>
                        <span className="search-result-rating-count">
                          ({item.totalReviews || 0} รีวิว)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type === "venue" || item.venue_id) {
                return (
                  <div
                    key={`venue-${item.venue_id}-${index}`}
                    className="search-result-card"
                    onClick={() => navigate(`/venues/${item.venue_id}`)}
                  >
                    <div className="search-result-img-wrap">
                      <img
                        src={
                          item.cover_image
                            ? `http://localhost:8080${item.cover_image.replace(/^\./, "")}`
                            : "https://placehold.co/300x180?text=🏢"
                        }
                        alt={item.name}
                        className="search-result-img"
                      />
                      <div className="search-result-type-badge venue">Venue</div>
                    </div>
                    <div className="search-result-info">
                      <div className="search-result-title">{item.name}</div>
                      <div className="search-result-location">
                        📍 {item.location} • {item.venue_type}
                      </div>
                      <div className="search-result-rating">
                        <span className="search-result-stars">
                          {"★".repeat(Math.round(item.rating || 0))}
                          {"☆".repeat(5 - Math.round(item.rating || 0))}
                        </span>
                        <span className="search-result-rating-num">
                          {item.rating || "ยังไม่มีคะแนน"}
                        </span>
                        <span className="search-result-rating-count">
                          ({item.review_count || 0} รีวิว)
                        </span>
                      </div>
                      <div className="search-result-desc">
                        💰 {item.price_range}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;