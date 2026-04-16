import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./VenueDetail.css";

const API = "http://localhost:8080"; // เพิ่มบรรทัดนี้ ข้างบนของไฟล์

const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]); // <-- new: venue reviews
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [popularVenues, setPopularVenues] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [hoverRating, setHoverRating] = useState(0); // <-- added for star hover effect

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await fetch(`http://localhost:8080/venues/${id}`);
        if (response.ok) {
          const data = await response.json();
          setVenue(data);
        }
      } catch (err) {
        console.error("Error fetching venue:", err);
      }
    };

    const fetchImages = async () => {
      try {
        const response = await fetch(`http://localhost:8080/venues/${id}/images`);
        if (response.ok) {
          const data = await response.json();
          setImages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching images:", err);
        setImages([]);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API}/venues/${id}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data) ? data : []);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setReviews([]);
      }
    };

    Promise.all([fetchVenue(), fetchImages()]).then(() => setLoading(false));
    // fetch reviews after initial load (non-blocking)
    fetchReviews();
  }, [id]);

  // ดึงสถานที่ยอดนิยมอื่นๆ
  useEffect(() => {
    const fetchPopularVenues = async () => {
      setLoadingPopular(true);
      try {
        const response = await fetch("http://localhost:8080/venues/popular?limit=4");
        if (response.ok) {
          const venues = await response.json();
          setPopularVenues(
            Array.isArray(venues) 
              ? venues.filter(v => v.venue_id !== parseInt(id))
              : []
          );
        }
      } catch (error) {
        console.error("Error fetching popular venues:", error);
        setPopularVenues([]);
      }
      setLoadingPopular(false);
    };
    
    if (id) {
      fetchPopularVenues();
    }
  }, [id]);

  // หาภาพปก และ gallery
  const cover = images.find(img => img.is_cover) || images[0];
  const gallery = images.filter(img => !img.is_cover && img.image_id !== (cover && cover.image_id));

  // แสดงทีละ 2 รูป และเปลี่ยนทุก 4 วิ
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

  if (loading) {
    return (
      <div className="venue-detail-container">
        <div className="venue-detail-loading">กำลังโหลดข้อมูลสถานที่...</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="venue-detail-container">
        <div className="venue-detail-error">
          <h3>ไม่พบข้อมูลสถานที่</h3>
          <button 
            onClick={() => navigate("/venues")} 
            className="venue-detail-back-btn"
          >
            กลับไปหน้าสถานที่
          </button>
        </div>
      </div>
    );
  }

  // helper ที่ปลอดภัยสำหรับ build url
  const toUrl = (raw) => {
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    // ลบจุดนำหน้า (./...) แล้วต่อกับ API root
    return `${API}${raw.replace(/^\./, "")}`;
  };

  // submit review handler
  const handleSubmitReview = async () => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    if (!user.user_id) {
      // redirect to login if not logged in
      window.location.href = "/login";
      return;
    }
    if (!newReview.rating || newReview.rating < 1 || newReview.rating > 5) {
      window.alert("กรุณาให้ดาว 1-5");
      return;
    }
    if (!newReview.comment || !newReview.comment.trim()) {
      window.alert("กรุณาเขียนความเห็น");
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await fetch(`${API}/venues/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });
      if (res.ok) {
        setNewReview({ rating: 0, comment: "" });
        // refresh reviews and venue meta
        const r2 = await fetch(`${API}/venues/${id}/reviews`);
        if (r2.ok) {
          const data = await r2.json();
          setReviews(Array.isArray(data) ? data : []);
        }
        // try refresh venue to update rating/review_count if backend updates them
        try {
          const vres = await fetch(`${API}/venues/${id}`);
          if (vres.ok) {
            const vdata = await vres.json();
            setVenue(vdata);
          }
        } catch { /* ignore */ }
        window.alert("ส่งรีวิวสถานที่สำเร็จ");
      } else {
        const text = await res.text().catch(() => "");
        window.alert("ส่งรีวิวไม่สำเร็จ: " + (text || res.statusText));
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      window.alert("เกิดข้อผิดพลาดในการส่งรีวิว");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const gallerySection = (
    <div className="venue-detail-gallery-col">
      <div className="venue-detail-gallery-title">ภาพเพิ่มเติม</div>
      <div className="venue-detail-gallery-list">
        {gallery.length === 0 && <div className="venue-detail-gallery-empty">-</div>}
        {galleryToShow.map((img, idx) => (
          <img
            key={img.image_id}
            src={toUrl(img.image_url)}
            alt={`gallery-${idx}`}
            className="venue-detail-gallery-img"
          />
        ))}
      </div>
    </div>
  );



  return (
    <div className="venue-detail-main">
      <div className="venue-detail-top">
        <div className="venue-detail-cover-col">
          <div className="venue-detail-cover-wrapper">
            {cover ? (
              <img
                src={cover ? toUrl(cover.image_url) : "https://placehold.co/600x350?text=No+Image"}
                alt={venue.name}
                className="venue-detail-cover-img"
              />
            ) : (
              <img
                src="https://placehold.co/600x350?text=No+Image"
                alt={venue.name}
                className="venue-detail-cover-img"
              />
            )}
          </div>
          <div className="venue-detail-nav-btns">
            <button 
              onClick={() => navigate("/venues")}
              className="venue-detail-nav-btn"
            >
              ← กลับ
            </button>
            <button className="venue-detail-nav-btn">Details</button>
            <button className="venue-detail-nav-btn">Location</button>
            <button className="venue-detail-nav-btn">Contact</button>
          </div>
        </div>
        
        {/* Gallery */}
        {gallerySection}
      </div>
      
      <div className="venue-detail_desc-section">
        <div className="venue-detail-desc-title">รายละเอียดสถานที่</div>
        <div className="venue-detail-desc-text">{venue.description}</div>
      </div>

      {/* ข้อมูลสถานที่ - เพิ่ม Google Maps */}
      <div className="venue-detail-info-section">
        <div className="venue-detail-info-title">ข้อมูลสถานที่</div>
        <div className="venue-detail-info-content">
          <div className="venue-detail-info-left">
            <div className="venue-detail-info-card-large">
              <div className="venue-detail-meta-item">
                📍 {venue.location}
              </div>
              <div className="venue-detail-meta-item">
                🏢 {venue.venue_type}
              </div>
              <div className="venue-detail-meta-item">
                💰 {venue.price_range}
              </div>
              {venue.latitude && venue.longitude && (
                <div className="venue-detail-meta-item">
                  🌍 พิกัด: {venue.latitude.toFixed(6)}, {venue.longitude.toFixed(6)}
                </div>
              )}
            </div>
            
            {/* เพิ่มปุ่มไปยัง Google Maps */}
            {venue.latitude && venue.longitude && (
              <div className="venue-detail-map-actions">
                <button
                  className="venue-detail-google-maps-btn"
                  onClick={() => {
                    const lat = venue.latitude;
                    const lng = venue.longitude;
                    const venueName = encodeURIComponent(venue.name);
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${venueName}`;
                    window.open(googleMapsUrl, '_blank');
                  }}
                  title="เปิดใน Google Maps"
                >
                  <span className="venue-detail-google-maps-icon">🗺️</span>
                  <span>เปิดใน Google Maps</span>
                </button>
                
                <button
                  className="venue-detail-directions-btn"
                  onClick={() => {
                    const lat = venue.latitude;
                    const lng = venue.longitude;
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                    window.open(directionsUrl, '_blank');
                  }}
                  title="หาเส้นทาง"
                >
                  <span className="venue-detail-directions-icon">🧭</span>
                  <span>หาเส้นทาง</span>
                </button>
              </div>
            )}
          </div>
          <div className="venue-detail-info-right">
            <GoogleMap 
              latitude={venue.latitude} 
              longitude={venue.longitude} 
              venueName={venue.name}
            />
          </div>
        </div>
      </div>

     

      {/* สถานที่ยอดนิยมอื่นๆ */}
      <div className="venue-detail-popular-section" style={{ marginTop: 56 }}>
        <div className="venue-detail-popular-header">
          <span>สถานที่ ยอดนิยมอื่นๆ</span>
          <a href="/venues" className="venue-detail-popular-more">
            แสดงทั้งหมด
          </a>
        </div>
        {loadingPopular ? (
          <div style={{ textAlign: "center", margin: 40 }}>กำลังโหลด...</div>
        ) : popularVenues.length === 0 ? (
          <div style={{ textAlign: "center", margin: 40, color: "#666" }}>
            ไม่มีสถานที่อื่นแสดง
          </div>
        ) : (
          <div className="venue-detail-popular-list">
            {popularVenues.map((venue) => (
              <div
                className="venue-detail-popular-card"
                key={venue.venue_id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/venues/${venue.venue_id}`)}
              >
                <div className="venue-detail-popular-img-wrap">
                  <img
                    src={
                      venue.cover_image
                        ? `http://localhost:8080${venue.cover_image.replace(/^\./, "")}`
                        : "https://placehold.co/300x180?text=No+Image"
                    }
                    alt={venue.name}
                    className="venue-detail-popular-img"
                  />
                </div>
                <div className="venue-detail-popular-info">
                  <div className="venue-detail-popular-title">{venue.name}</div>
                  <div className="venue-detail-popular-organizer">
                    📍 {venue.location} • {venue.venue_type}
                  </div>
                  <div className="venue-detail-popular-rating">
                    <span className="venue-detail-popular-stars">
                      {"★".repeat(Math.round(venue.rating))}
                      {"☆".repeat(5 - Math.round(venue.rating))}
                    </span>
                    <span className="venue-detail-popular-rating-num">
                      {venue.rating}
                    </span>
                    <span className="venue-detail-popular-rating-count">
                      ({venue.review_count} รีวิว)
                    </span>
                  </div>
                  <div className="venue-detail-popular-desc">
                    💰 {venue.price_range}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
       {/* รีวิวสถานที่ (ย้ายมาไว้ข้างล่างสุด) */}
      {/* Review input card */}
      <div style={{ marginTop: 28, maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>รีวิวสถานที่</h2>
        </div>

        <div style={{ display: "flex", gap: 20, flexDirection: "column" }}>
          {/* Average / summary when exist */}
          {reviews.length > 0 && (
            <div style={{
              margin: "0 auto",
              padding: "18px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #f7f8fa 0%, #e6f3ff 100%)",
              border: "1px solid #e0e7ff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1f2937" }}>คะแนนเฉลี่ย:</span>
                <span style={{ color: "#fbbf24", fontSize: "1.4rem" }}>
                  {"★".repeat(Math.round(reviews.reduce((s, r) => s + (r.rating || 0), 0) / Math.max(1, reviews.length)))}
                  {"☆".repeat(5 - Math.round(reviews.reduce((s, r) => s + (r.rating || 0), 0) / Math.max(1, reviews.length)))}
                </span>
                <span style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  background: "#fff",
                  padding: "4px 10px",
                  borderRadius: 8,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                }}>
                  {(reviews.reduce((s, r) => s + (r.rating || 0), 0) / Math.max(1, reviews.length)).toFixed(1)}
                </span>
                <span style={{ color: "#6b7280" }}>({reviews.length} รีวิว)</span>
              </div>
            </div>
          )}

          {/* Form */}
          <div style={{
            background: "#fff", padding: 14, borderRadius: 12, border: "1px solid #e6e6fa",
            boxShadow: "0 6px 20px rgba(15,23,42,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <img
                src={
                  (() => {
                    const user = JSON.parse(localStorage.getItem("user")) || {};
                    if (!user) return "https://placehold.co/40x40?text=U";
                    if (user.profile_image) return user.profile_image.startsWith("http") ? user.profile_image : `http://localhost:8080${user.profile_image}`;
                    return "https://placehold.co/40x40?text=U";
                  })()
                }
                alt="avatar"
                style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid #f1f5f9" }}
              />
              <div style={{ fontWeight: 700 }}>{(JSON.parse(localStorage.getItem("user")) || {}).first_name || (JSON.parse(localStorage.getItem("user")) || {}).username || "Guest"}</div>
            </div>

            { (JSON.parse(localStorage.getItem("user")) || {}).user_id ? (
              <>
                <textarea
                  rows={3}
                  placeholder="เขียนความเห็นเกี่ยวกับสถานที่..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  disabled={reviewSubmitting}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", resize: "vertical", marginBottom: 10 }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {[1,2,3,4,5].map((n) => (
                      <span key={n}
                        onClick={() => setNewReview(prev => ({ ...prev, rating: n }))}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          cursor: reviewSubmitting ? "not-allowed" : "pointer",
                          fontSize: 22,
                          color: n <= (hoverRating || newReview.rating) ? "#fbbf24" : "#ddd",
                          transition: "transform .08s"
                        }}
                      >
                        ★
                      </span>
                    ))}
                    <span style={{ marginLeft: 10, color: "#666" }}>{newReview.rating > 0 ? `${newReview.rating} ดาว` : "กรุณาให้คะแนน"}</span>
                  </div>

                  <div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={reviewSubmitting}
                      style={{ padding: "8px 14px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" }}
                    >
                      {reviewSubmitting ? "กำลังส่ง..." : "ส่งรีวิวสถานที่"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <button onClick={() => window.location.href = "/login"} style={{ padding: "8px 12px", borderRadius: 8 }}>เข้าสู่ระบบเพื่อแสดงความคิดเห็น</button>
              </div>
            )}
          </div>

          {/* Existing reviews list */}
          {reviews.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
              {reviews.map((r) => (
                <div key={r.review_id || `${r.user_id}-${r.created_at}`} style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <img
                      src={ r.profile_image ? `http://localhost:8080${r.profile_image.replace(/^\./, "")}` : "https://placehold.co/40x40?text=👤" }
                      alt={r.username || `ผู้ใช้ ${r.user_id}`}
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #e0e7ff" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "1.02rem", color: "#1f2937" }}>{r.username || r.user_name || `ผู้ใช้ #${r.user_id}`}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>
                        {r.created_at ? new Date(r.created_at).toLocaleString("th-TH") : ""}
                      </div>
                    </div>
                    <div style={{
                      background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                      padding: "6px 12px",
                      borderRadius: 20,
                      color: "#fff",
                      fontWeight: 700
                    }}>
                      {"★".repeat(Math.round(r.rating || 0))}
                    </div>
                  </div>
                  <div style={{ color: "#374151", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    {r.comment}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Google Maps component แก้ไขอย่างละเอียด
const GoogleMap = React.memo(({ latitude, longitude, venueName }) => {
  const mapRef = React.useRef(null);
  const [mapState, setMapState] = useState({
    isLoaded: false,
    isLoading: true,
    error: null
  });

  // ฟังก์ชันตรวจสอบว่า Google Maps API พร้อมใช้งานหรือไม่
  const isGoogleMapsReady = () => {
    return (
      typeof window !== 'undefined' &&
      window.google &&
      window.google.maps &&
      window.google.maps.Map &&
      typeof window.google.maps.Map === 'function'
    );
  };

  // ฟังก์ชันโหลด Google Maps API
  const loadGoogleMapsAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      // ตรวจสอบว่า API พร้อมใช้งานแล้วหรือไม่
      if (isGoogleMapsReady()) {
        console.log('Google Maps API already loaded');
        resolve();
        return;
      }

      // ตรวจสอบว่ามี script tag อยู่แล้วหรือไม่
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      
      if (existingScript) {
        console.log('Google Maps script exists, waiting for load...');
        
        // ถ้ามี script แล้ว ให้รอจนกว่า API จะพร้อม
        const checkInterval = setInterval(() => {
          if (isGoogleMapsReady()) {
            clearInterval(checkInterval);
            console.log('Google Maps API ready');
            resolve();
          }
        }, 100);

        // Timeout หลัง 10 วินาที
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Google Maps API load timeout'));
        }, 10000);

        return;
      }

      // โหลด Google Maps API ใหม่
      console.log('Loading new Google Maps script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('Google Maps script loaded');
        
        // รอให้ API พร้อมใช้งาน
        const checkReady = setInterval(() => {
          if (isGoogleMapsReady()) {
            clearInterval(checkReady);
            console.log('Google Maps API fully ready');
            resolve();
          }
        }, 50);

        // Timeout หลัง 5 วินาที
        setTimeout(() => {
          clearInterval(checkReady);
          reject(new Error('Google Maps API initialization timeout'));
        }, 5000);
      };

      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // โหลด Google Maps API
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        setMapState(prev => ({ ...prev, isLoading: true, error: null }));
        
        await loadGoogleMapsAPI();
        
        if (isMounted) {
          setMapState({
            isLoaded: true,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        if (isMounted) {
          setMapState({
            isLoaded: false,
            isLoading: false,
            error: error.message
          });
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [loadGoogleMapsAPI]);

  // สร้างแผนที่เมื่อ API พร้อมและมีพิกัด
  useEffect(() => {
    if (!mapState.isLoaded || !mapRef.current || !latitude || !longitude || mapState.error) {
      return;
    }

    try {
      console.log('Creating map with coordinates:', { latitude, longitude });
      
      // แปลงพิกัดเป็นตัวเลข
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // ตรวจสอบความถูกต้องของพิกัด
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates');
      }

      // ตรวจสอบว่า Google Maps API พร้อมใช้งาน
      if (!isGoogleMapsReady()) {
        throw new Error('Google Maps API not ready');
      }

      // สร้างแผนที่
      const mapOptions = {
        center: { lat, lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative'
      };

      console.log('Creating map with options:', mapOptions);
      const mapInstance = new window.google.maps.Map(mapRef.current, mapOptions);

      // สร้าง marker
      const markerOptions = {
        position: { lat, lng },
        map: mapInstance,
        title: venueName || 'สถานที่'
      };

      console.log('Creating marker with options:', markerOptions);
      
      // ใช้ Marker ปกติ (เสถียรกว่า AdvancedMarkerElement)
      new window.google.maps.Marker(markerOptions);

      console.log('Map and marker created successfully');

    } catch (error) {
      console.error('Error creating map:', error);
      setMapState(prev => ({
        ...prev,
        error: `ไม่สามารถสร้างแผนที่ได้: ${error.message}`
      }));
    }
  }, [mapState.isLoaded, latitude, longitude, venueName, mapState.error]);

  // แสดงข้อความเมื่อไม่มีพิกัด
  if (!latitude || !longitude) {
    return (
      <div className="venue-detail-map-placeholder">
        <div className="venue-detail-map-no-location">
          📍 ไม่มีข้อมูลตำแหน่งแสดง
        </div>
      </div>
    );
  }

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (mapState.error) {
    return (
      <div className="venue-detail-map-placeholder">
        <div className="venue-detail-map-no-location">
          ❌ {mapState.error}
        </div>
      </div>
    );
  }

  return (
    <div className="venue-detail-map-container">
      <div 
        ref={mapRef} 
        className="venue-detail-map"
        style={{ 
          width: '100%', 
          height: '300px', 
          borderRadius: '8px',
          backgroundColor: '#f5f5f5'
        }}
      />
      {mapState.isLoading && (
        <div className="venue-detail-map-loading">
          กำลังโหลดแผนที่...
        </div>
      )}
    </div>
  );
});

GoogleMap.displayName = 'GoogleMap';

export default VenueDetail;