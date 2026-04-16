import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VenueList.css";

const VenueList = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/venues");
      if (!response.ok) {
        throw new Error("Failed to fetch venues");
      }
      const data = await response.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching venues:", err);
      setError(err.message);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVenueClick = (venueId) => {
    navigate(`/venues/${venueId}`);
  };

  if (loading) {
    return (
      <div className="venue-list-container">
        <div className="venue-list-loading">กำลังโหลดข้อมูลสถานที่...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="venue-list-container">
        <div className="venue-list-error">
          <h3>เกิดข้อผิดพลาด</h3>
          <p>{error}</p>
          <button onClick={fetchVenues} className="venue-list-retry-btn">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="venue-list-container">
      <div className="venue-list-header">
        <h1>สถานที่จัดงาน</h1>
        <p>ค้นหาสถานที่ที่เหมาะสำหรับจัดงานของคุณ</p>
      </div>

      {venues.length === 0 ? (
        <div className="venue-list-empty">
          <div className="venue-list-empty-icon">🏢</div>
          <h3>ยังไม่มีข้อมูลสถานที่</h3>
          <p>กรุณากลับมาใหม่ในภายหลัง</p>
        </div>
      ) : (
        <div className="venue-list-grid">
          {venues.map((venue) => (
            <div
              key={venue.venue_id}
              className="venue-card"
              onClick={() => handleVenueClick(venue.venue_id)}
            >
              <div className="venue-card-image-wrap">
                <img
                  src={
                    venue.cover_image
                      ? `http://localhost:8080${venue.cover_image.replace(/^\./, "")}`
                      : "https://placehold.co/400x250?text=No+Image"
                  }
                  alt={venue.name}
                  className="venue-card-image"
                />
                <div className="venue-card-rating">
                  <span className="venue-card-rating-stars">
                    {"★".repeat(Math.round(venue.rating))}
                    {"☆".repeat(5 - Math.round(venue.rating))}
                  </span>
                  <span className="venue-card-rating-number">
                    {venue.rating}
                  </span>
                </div>
              </div>
              
              <div className="venue-card-content">
                <h3 className="venue-card-title">{venue.name}</h3>
                <div className="venue-card-location">
                  📍 {venue.location} • {venue.venue_type}
                </div>
                <div className="venue-card-price">
                  💰 {venue.price_range}
                </div>
                <p className="venue-card-description">
                  {venue.description.length > 100
                    ? `${venue.description.substring(0, 100)}...`
                    : venue.description}
                </p>
                <div className="venue-card-reviews">
                  ({venue.review_count} รีวิว)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueList;