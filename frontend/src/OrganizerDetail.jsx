import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./OrganizerDetail.css";

const OrganizerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [portfolioImages, setPortfolioImages] = useState({});
  
  // เพิ่ม state สำหรับการเขียนรีวิว
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  
  // --- report state ---
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  // ---------------------

  const user = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    const fetchOrganizer = async () => {
      try {
        const response = await fetch(`http://localhost:8080/organizers/${id}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Organizer data:", data);
          setOrganizer(data);
        }
      } catch (err) {
        console.error("Error fetching organizer:", err);
      }
      setLoading(false);
    };

    const fetchPortfolios = async () => {
      try {
        const response = await fetch(`http://localhost:8080/organizer_portfolios/organizer/${id}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Portfolios data:", data);
          setPortfolios(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching portfolios:", err);
        setPortfolios([]);
      }
      setLoadingPortfolios(false);
    };

    const fetchReviews = async () => {
      try {
        const response = await fetch(`http://localhost:8080/organizers/${id}/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setReviews([]);
      }
      setLoadingReviews(false);
    };

    fetchOrganizer();
    fetchPortfolios();
    fetchReviews();
  }, [id]);

  // ดึงรูปภาพสำหรับแต่ละผลงาน
  useEffect(() => {
    const fetchPortfolioImages = async () => {
      for (const portfolio of portfolios) {
        if (!portfolioImages[portfolio.portfolio_id]) {
          try {
            const res = await fetch(`http://localhost:8080/organizer_portfolios/${portfolio.portfolio_id}/images`);
            if (res.ok) {
              const images = await res.json();
              const coverImage = images.find(img => img.is_cover) || images[0];
              
              setPortfolioImages(prev => ({
                ...prev,
                [portfolio.portfolio_id]: coverImage
              }));
            }
          } catch (error) {
            console.error(`Error fetching images for portfolio ${portfolio.portfolio_id}:`, error);
          }
        }
      }
    };

    if (portfolios.length > 0) {
      fetchPortfolioImages();
    }
  }, [portfolios, portfolioImages]);

  // ฟังก์ชันส่งรีวิว
  const handleSubmitReview = async () => {
    if (!user.user_id) {
      alert("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
      return;
    }
    
    if (newReview.rating === 0) {
      alert("กรุณาให้คะแนน");
      return;
    }
    
    if (!newReview.comment.trim()) {
      alert("กรุณาเขียนความคิดเห็น");
      return;
    }

    setReviewLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/organizers/${id}/reviews`, {
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

      if (response.ok) {
        // รีเฟรชรีวิว
        const reviewsResponse = await fetch(`http://localhost:8080/organizers/${id}/reviews`);
        if (reviewsResponse.ok) {
          const updatedReviews = await reviewsResponse.json();
          setReviews(Array.isArray(updatedReviews) ? updatedReviews : []);
        }
        
        // รีเซ็ตฟอร์ม
        setNewReview({ rating: 0, comment: "" });
        alert("ส่งความคิดเห็นสำเร็จ!");
      } else {
        alert("เกิดข้อผิดพลาดในการส่งความคิดเห็น");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
    setReviewLoading(false);
  };

  // ฟังก์ชันรายงานผู้จัดงาน
  const handleSubmitReport = async () => {
    if (!user.user_id) {
      alert("กรุณาเข้าสู่ระบบก่อนรายงาน");
      return;
    }
    if (!reportReason.trim()) {
      alert("กรุณาระบุเหตุผล");
      return;
    }
    setReportSubmitting(true);
    try {
      const body = {
        organizer_id: organizer.organizer_id,
        user_id: user.user_id,
        reason: reportReason,
        details: reportDetails,
      };
      const res = await fetch("http://localhost:8080/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => res.statusText);
        alert("ส่งรายงานไม่สำเร็จ: " + t);
      } else {
        alert("ส่งรายงานเรียบร้อยแล้ว ทีมงานจะตรวจสอบ");
        setReportOpen(false);
        setReportReason("");
        setReportDetails("");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
    setReportSubmitting(false);
  };

  // ฟังก์ชันดึงรูปปกสำหรับผลงาน
  const getPortfolioCoverImage = (portfolioId) => {
    const coverImage = portfolioImages[portfolioId];
    if (coverImage) {
      return `http://localhost:8080${coverImage.image_url.replace(/^\./, "")}`;
    }
    return "https://placehold.co/300x200?text=No+Image";
  };

  // คำนวณคะแนนเฉลี่ย
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="organizer-detail-container">
        <div className="organizer-detail-loading">กำลังโหลดข้อมูลผู้จัดงาน...</div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="organizer-detail-container">
        <div className="organizer-detail-error">
          <h3>ไม่พบข้อมูลผู้จัดงาน</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="organizer-detail-wrapper">
      {/* Main Content - 2 Column Layout */}
      <div className="organizer-detail-main">
        {/* Left Column - Organizer Info */}
        <div className="organizer-detail-left">
          {/* Profile Card */}
          <div className="organizer-profile-card">
            <div className="organizer-profile-image" style={{ position: "relative", display: "inline-block" }}>
              <img
                src={
                  organizer.profile_image
                    ? `http://localhost:8080${organizer.profile_image.replace(/^\./, "")}`
                    : "https://placehold.co/200x200?text=No+Image"
                }
                alt={organizer.first_name}
              />
              {/* ไอคอนรายงานแบบลอยบนรูปโปรไฟล์ (เฉพาะไอคอน ไม่มีข้อความ) */}
              <button
                onClick={() => setReportOpen(true)}
                aria-label="รายงานผู้จัดงาน"
                title="รายงานผู้จัดงาน"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "none",
                  background: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  zIndex: 10,
                  color: "#ef4444",
                  fontSize: 18,
                  transition: "transform 0.12s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <span aria-hidden>🚩</span>
              </button>
            </div>
            <div className="organizer-profile-info">
              <h2 className="organizer-name">
                {organizer.first_name} {organizer.last_name}
              </h2>
              <p className="organizer-expertise">
                {organizer.expertise || "ผู้จัดงานมืออาชีพ"}
              </p>
              <div className="organizer-rating">
                <div className="stars">
                  {"★".repeat(Math.round(avgRating))}
                  {"☆".repeat(5 - Math.round(avgRating))}
                </div>
                <span className="rating-text">
                  {avgRating > 0 ? avgRating.toFixed(1) : "ยังไม่มีคะแนน"} ({reviews.length} รีวิว)
                </span>
              </div>
            </div>
          </div>

          {/* รวม Contact Info + Bio ในการ์ดเดียว */}
          <div className="organizer-info-card">
            <h3>ข้อมูลติดต่อและเกี่ยวกับ</h3>
            
            {/* Contact Section */}
            <div className="contact-section">
              <h4 className="subsection-title">📞 ติดต่อ</h4>
              <div className="contact-items">
                <div className="contact-item">
                  <span className="contact-label">📱 เบอร์โทร:</span>
                  <span className="contact-value">{organizer.phone || "ไม่ระบุ"}</span>
                </div>
                <div className="contact-item">
                  <span className="contact-label">📧 อีเมล:</span>
                  <span className="contact-value">{organizer.email || "ไม่ระบุ"}</span>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="bio-section">
              <h4 className="subsection-title">👤 เกี่ยวกับ</h4>
              <div className="bio-content">
                {organizer.bio ? (
                  <p>{organizer.bio}</p>
                ) : (
                  <p className="no-bio">ยังไม่มีข้อมูลเกี่ยวกับผู้จัดงาน</p>
                )}
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="organizer-reviews-card">
            <h3>รีวิวล่าสุด</h3>
            {loadingReviews ? (
              <div className="loading-text">กำลังโหลดรีวิว...</div>
            ) : reviews.length === 0 ? (
              <div className="empty-text">ยังไม่มีรีวิว</div>
            ) : (
              <div className="reviews-list">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.review_id} className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">
                        {review.username || "ผู้ใช้งาน"}
                      </span>
                      <div className="review-stars">
                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                      </div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    <div className="review-date">
                      {new Date(review.created_at).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                ))}
                {reviews.length > 3 && (
                  <button className="view-all-reviews">ดูรีวิวทั้งหมด ({reviews.length})</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Portfolios */}
        <div className="organizer-detail-right">
          <div className="organizer-portfolios-section">
            {loadingPortfolios ? (
              <div className="organizer-portfolios-loading">กำลังโหลดผลงาน...</div>
            ) : portfolios.length === 0 ? (
              <div className="organizer-portfolios-empty">
                <div className="organizer-portfolios-empty-icon">📁</div>
                <div className="organizer-portfolios-empty-text">ยังไม่มีผลงานแสดง</div>
              </div>
            ) : (
              <div className="organizer-portfolios-main-border">
                <div className="organizer-portfolios-grid">
                  {portfolios.map((portfolio) => (
                    <div 
                      key={portfolio.portfolio_id} 
                      className="organizer-portfolio-card"
                      onClick={() => navigate(`/portfolios/${portfolio.portfolio_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="organizer-portfolio-img-wrap">
                        <img
                          src={getPortfolioCoverImage(portfolio.portfolio_id)}
                          alt={portfolio.title}
                          className="organizer-portfolio-img"
                          onError={(e) => {
                            e.target.src = "https://placehold.co/300x200?text=No+Image";
                          }}
                        />
                      </div>
                      <div className="organizer-portfolio-info">
                        <div className="organizer-portfolio-info-title">{portfolio.title}</div>
                        <div className="organizer-portfolio-info-category">{portfolio.category}</div>
                        <div className="organizer-portfolio-info-price">
                          {portfolio.price || "ติดต่อสอบถาม"}
                        </div>
                        <div className="organizer-portfolio-info-desc">
                          {portfolio.description?.length > 50 
                            ? `${portfolio.description.slice(0, 50)}...` 
                            : portfolio.description || "ไม่มีคำอธิบาย"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Review Section - ย้ายมาไว้ใต้ผลงานโดยตรง */}
            <div className="organizer-review-section" style={{ marginTop: "30px" }}>
              <div className="organizer-review-card" style={{ 
                width: "100%", 
                maxWidth: "800px", 
                padding: "25px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ marginBottom: "20px", color: "#374151" }}>💬 แสดงความคิดเห็นเกี่ยวกับผู้จัดงาน</h3>
                
                {user && user.user_id ? (
                  <div className="organizer-review-form" style={{ width: "100%" }}>
                    <div className="organizer-review-header" style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      marginBottom: "15px",
                      minHeight: "50px"
                    }}>
                      <img
                        src={
                          user.profile_image
                            ? user.profile_image.startsWith("http")
                              ? user.profile_image
                              : `http://localhost:8080${user.profile_image}`
                            : "https://placehold.co/40x40?text=U"
                        }
                        alt={user.first_name || user.username || "avatar"}
                        className="organizer-review-avatar"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          marginRight: "12px",
                          objectFit: "cover"
                        }}
                      />
                      <div className="organizer-review-user">
                        <div className="organizer-review-name" style={{
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "16px"
                        }}>
                          {user.first_name || user.username || "Guest"}
                        </div>
                      </div>
                    </div>
                    
                    <textarea
                      className="organizer-review-textarea"
                      placeholder="แบ่งปันประสบการณ์การทำงานกับผู้จัดงานท่านนี้..."
                      rows={4}
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      disabled={reviewLoading}
                      style={{
                        width: "100%",
                        minHeight: "100px",
                        padding: "12px 16px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        resize: "vertical",
                        fontFamily: "inherit",
                        fontSize: "14px",
                        marginBottom: "20px",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                        backgroundColor: reviewLoading ? "#f9fafb" : "#fff"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                      onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                    />
                    
                    <div className="organizer-review-actions" style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "15px"
                    }}>
                      <div className="organizer-review-stars" style={{
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0
                      }}>
                        <span style={{ 
                          marginRight: "12px", 
                          fontWeight: "600", 
                          color: "#666",
                          fontSize: "15px",
                          whiteSpace: "nowrap"
                        }}>
                          ให้คะแนน:
                        </span>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "4px",
                          marginRight: "12px"
                        }}>
                          {[1,2,3,4,5].map((n) => (
                            <span 
                              key={n} 
                              className="organizer-review-star"
                              style={{ 
                                color: n <= (hoverRating || newReview.rating) ? "#fbbf24" : "#ddd",
                                cursor: reviewLoading ? "not-allowed" : "pointer",
                                fontSize: "24px",
                                transition: "all 0.2s ease",
                                userSelect: "none",
                                lineHeight: "1"
                              }}
                              onClick={() => !reviewLoading && setNewReview({...newReview, rating: n})}
                              onMouseEnter={() => !reviewLoading && setHoverRating(n)}
                              onMouseLeave={() => !reviewLoading && setHoverRating(0)}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span style={{ 
                          fontSize: "14px", 
                          color: "#666", 
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                          minWidth: "100px"
                        }}>
                          {newReview.rating > 0 ? `${newReview.rating} ดาว` : "กรุณาให้คะแนน"}
                        </span>
                      </div>
                      
                      <button 
                        className="organizer-review-btn"
                        onClick={handleSubmitReview}
                        disabled={reviewLoading}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: reviewLoading ? "#9ca3af" : "#3b82f6",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontWeight: "600",
                          cursor: reviewLoading ? "not-allowed" : "pointer",
                          transition: "background-color 0.2s ease",
                          fontSize: "14px",
                          minWidth: "120px"
                        }}
                        onMouseEnter={(e) => {
                          if (!reviewLoading) e.target.style.backgroundColor = "#2563eb";
                        }}
                        onMouseLeave={(e) => {
                          if (!reviewLoading) e.target.style.backgroundColor = "#3b82f6";
                        }}
                      >
                        {reviewLoading ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", margin: "20px 0" }}>
                    <button
                      className="organizer-review-btn"
                      onClick={() => window.location.href = "/login"}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#3b82f6",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      เข้าสู่ระบบเพื่อแสดงความคิดเห็น
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report modal (like EventDetail: icon + select options) */}
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
              maxWidth: 520,
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 12 }}>
              รายงานผู้จัดงาน
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
              <option value="พฤติกรรมไม่เหมาะสม">พฤติกรรมไม่เหมาะสม</option>
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
                background: "#fff",
                marginBottom: 12,
              }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
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
    </div>
  );
};

export default OrganizerDetail;