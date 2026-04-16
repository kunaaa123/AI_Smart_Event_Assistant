import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PortfolioDetail.css";

const PortfolioDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [organizer, setOrganizer] = useState(null);
  const [relatedPortfolios, setRelatedPortfolios] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [relatedImages, setRelatedImages] = useState({}); // เพิ่ม state สำหรับเก็บรูปภาพของผลงานอื่นๆ

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`http://localhost:8080/organizer_portfolios/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPortfolio(data);
        }
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      }
    };

    const fetchImages = async () => {
      try {
        const res = await fetch(`http://localhost:8080/organizer_portfolios/${id}/images`);
        if (res.ok) {
          const data = await res.json();
          setImages(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching images:", error);
        setImages([]);
      }
    };

    Promise.all([fetchPortfolio(), fetchImages()]).then(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const fetchOrganizer = async () => {
      if (!portfolio?.organizer_id) return;
      try {
        const res = await fetch(`http://localhost:8080/organizers/${portfolio.organizer_id}`);
        if (res.ok) {
          const data = await res.json();
          setOrganizer(data);
        }
      } catch (error) {
        console.error("Error fetching organizer:", error);
      }
    };
    
    if (portfolio) fetchOrganizer();
  }, [portfolio]);

  // ดึงผลงานอื่นๆ ของผู้จัดทำคนเดียวกัน
  useEffect(() => {
    const fetchRelatedPortfolios = async () => {
      if (!portfolio?.organizer_id) return;
      
      try {
        const res = await fetch(`http://localhost:8080/organizer_portfolios/organizer/${portfolio.organizer_id}`);
        if (res.ok) {
          const data = await res.json();
          // กรองเอาผลงานอื่นที่ไม่ใช่ผลงานปัจจุบัน
          const filtered = data.filter(p => p.portfolio_id !== parseInt(id));
          setRelatedPortfolios(filtered.slice(0, 6)); // แสดงแค่ 6 ผลงาน
        }
      } catch (error) {
        console.error("Error fetching related portfolios:", error);
      }
      setLoadingRelated(false);
    };

    if (portfolio) fetchRelatedPortfolios();
  }, [portfolio, id]);

  // ดึงรูปภาพสำหรับผลงานอื่นๆ
  useEffect(() => {
    const fetchRelatedImages = async () => {
      for (const relatedPortfolio of relatedPortfolios) {
        if (!relatedImages[relatedPortfolio.portfolio_id]) {
          try {
            const res = await fetch(`http://localhost:8080/organizer_portfolios/${relatedPortfolio.portfolio_id}/images`);
            if (res.ok) {
              const images = await res.json();
              const coverImage = images.find(img => img.is_cover) || images[0];
              
              setRelatedImages(prev => ({
                ...prev,
                [relatedPortfolio.portfolio_id]: coverImage
              }));
            }
          } catch (error) {
            console.error(`Error fetching images for portfolio ${relatedPortfolio.portfolio_id}:`, error);
          }
        }
      }
    };

    if (relatedPortfolios.length > 0) {
      fetchRelatedImages();
    }
  }, [relatedPortfolios, relatedImages]);

  // ฟังก์ชันดึงรูปปกสำหรับผลงานอื่นๆ
  const getRelatedCoverImage = (portfolioId) => {
    const coverImage = relatedImages[portfolioId];
    if (coverImage) {
      return `http://localhost:8080${coverImage.image_url.replace(/^\./, "")}`;
    }
    return "https://placehold.co/300x180?text=No+Image";
  };

  // หาภาพปก
  const cover = images.find(img => img.is_cover) || images[0];
  const gallery = images.filter(img => !img.is_cover && img.image_id !== (cover && cover.image_id));

  // แสดงทีละ 3 รูป และเปลี่ยนทุก 4 วิ
  useEffect(() => {
    if (gallery.length <= 3) return;
    const interval = setInterval(() => {
      setGalleryIndex((prev) => (prev + 3) % gallery.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [gallery]);

  const galleryToShow = gallery.slice(galleryIndex, galleryIndex + 3);
  if (galleryToShow.length < 3 && gallery.length > 3) {
    galleryToShow.push(...gallery.slice(0, 3 - galleryToShow.length));
  }

  if (loading) {
    return (
      <div className="portfolio-detail-container">
        <div className="portfolio-detail-loading">
          <div className="portfolio-detail-spinner"></div>
          <div>กำลังโหลดผลงาน...</div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="portfolio-detail-container">
        <div className="portfolio-detail-error">
          <div className="portfolio-detail-error-icon">❌</div>
          <div>ไม่พบข้อมูลผลงาน</div>
          <button 
            className="portfolio-detail-back-btn"
            onClick={() => navigate(-1)}
          >
            ← กลับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-detail-container">
      {/* Header */}
      <div className="portfolio-detail-header">
        <button 
          className="portfolio-detail-back-btn"
          onClick={() => navigate(-1)}
        >
          ← กลับ
        </button>
        <div className="portfolio-detail-breadcrumb">
          <span>ผลงาน</span>
          <span className="portfolio-detail-breadcrumb-sep">/</span>
          <span>{portfolio.title}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="portfolio-detail-main">
        {/* Left Side - Cover Image */}
        <div className="portfolio-detail-left">
          <div className="portfolio-detail-cover-section">
            <div className="portfolio-detail-cover-wrapper">
              {cover ? (
                <img
                  src={`http://localhost:8080${cover.image_url.replace(/^\./, "")}`}
                  alt={portfolio.title}
                  className="portfolio-detail-cover-img"
                />
              ) : (
                <div className="portfolio-detail-cover-placeholder">
                  <div className="portfolio-detail-cover-placeholder-icon">🖼️</div>
                  <div>ไม่มีรูปภาพ</div>
                </div>
              )}
            </div>
            
            {/* Gallery */}
            <div className="portfolio-detail-gallery">
              <div className="portfolio-detail-gallery-title">รูปภาพเพิ่มเติม</div>
              <div className="portfolio-detail-gallery-grid">
                {gallery.length === 0 ? (
                  <div className="portfolio-detail-gallery-empty">ไม่มีรูปภาพเพิ่มเติม</div>
                ) : (
                  galleryToShow.map((img, idx) => (
                    <div key={img.image_id} className="portfolio-detail-gallery-item">
                      <img
                        src={`http://localhost:8080${img.image_url.replace(/^\./, "")}`}
                        alt={`gallery-${idx}`}
                        className="portfolio-detail-gallery-img"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Details */}
        <div className="portfolio-detail-right">
          {/* Portfolio Info */}
          <div className="portfolio-detail-info">
            <div className="portfolio-detail-title-section">
              <h1 className="portfolio-detail-title">{portfolio.title}</h1>
              
              <div className="portfolio-detail-badges">
                {portfolio.category && (
                  <span className="portfolio-detail-badge portfolio-detail-badge-category">
                    📂 {portfolio.category}
                  </span>
                )}
                {portfolio.price && (
                  <span className="portfolio-detail-badge portfolio-detail-badge-price">
                    💰 {portfolio.price}
                  </span>
                )}
              </div>
            </div>

            <div className="portfolio-detail-description">
              <h3 className="portfolio-detail-section-title">รายละเอียดผลงาน</h3>
              <div className="portfolio-detail-description-text">
                {portfolio.description || "ไม่มีคำอธิบาย"}
              </div>
            </div>
          </div>

          {/* Organizer Info */}
          {organizer && (
            <div className="portfolio-detail-organizer">
              <h3 className="portfolio-detail-section-title">ข้อมูลผู้จัดทำ</h3>
              <div className="portfolio-detail-organizer-card">
                <div className="portfolio-detail-organizer-avatar">
                  <img
                    src={
                      organizer.profile_image
                        ? `http://localhost:8080${organizer.profile_image.replace(/^\./, "")}`
                        : "https://placehold.co/80x80?text=👤"
                    }
                    alt={organizer.first_name}
                    className="portfolio-detail-organizer-img"
                  />
                </div>
                <div className="portfolio-detail-organizer-info">
                  <div className="portfolio-detail-organizer-name">
                    {organizer.first_name} {organizer.last_name}
                  </div>
                  <div className="portfolio-detail-organizer-role">
                    {organizer.expertise || "ผู้จัดงานมืออาชีพ"}
                  </div>
                  <div className="portfolio-detail-organizer-bio">
                    {organizer.bio || "ไม่มีข้อมูลคำอธิบาย"}
                  </div>
                  
                  <div className="portfolio-detail-organizer-actions">
                    <button
                      onClick={() => navigate(`/organizers/${organizer.organizer_id}`)}
                      className="portfolio-detail-btn portfolio-detail-btn-profile"
                    >
                      👀 ดูโปรไฟล์
                    </button>
                    {organizer.phone && (
                      <a
                        href={`tel:${organizer.phone}`}
                        className="portfolio-detail-btn portfolio-detail-btn-contact"
                      >
                        📞 ติดต่อ
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Portfolios */}
      {relatedPortfolios.length > 0 && (
        <div className="portfolio-detail-related">
          <div className="portfolio-detail-related-header">
            <h3 className="portfolio-detail-section-title">
              ผลงานอื่นๆ ของ {organizer?.first_name} {organizer?.last_name}
            </h3>
            <button
              onClick={() => navigate(`/organizers/${organizer?.organizer_id}`)}
              className="portfolio-detail-related-more"
            >
              ดูทั้งหมด →
            </button>
          </div>
          
          {loadingRelated ? (
            <div className="portfolio-detail-related-loading">กำลังโหลด...</div>
          ) : (
            <div className="portfolio-detail-related-grid">
              {relatedPortfolios.map((item) => (
                <div
                  className="portfolio-detail-related-card"
                  key={item.portfolio_id}
                  onClick={() => navigate(`/portfolios/${item.portfolio_id}`)}
                >
                  <div className="portfolio-detail-related-img-wrap">
                    <img
                      src={getRelatedCoverImage(item.portfolio_id)}
                      alt={item.title}
                      className="portfolio-detail-related-img"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/300x180?text=No+Image";
                      }}
                    />
                  </div>
                  <div className="portfolio-detail-related-info">
                    <div className="portfolio-detail-related-title">{item.title}</div>
                    <div className="portfolio-detail-related-category">
                      📂 {item.category || "ไม่ระบุหมวดหมู่"}
                    </div>
                    <div className="portfolio-detail-related-price">
                      💰 {item.price || "ติดต่อสอบถาม"}
                    </div>
                    <div className="portfolio-detail-related-desc">
                      {item.description?.length > 60 
                        ? `${item.description.slice(0, 60)}...` 
                        : item.description || "ไม่มีคำอธิบาย"
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioDetail;