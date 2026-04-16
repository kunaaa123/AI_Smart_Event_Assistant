import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OrganizerList.css";

const OrganizerList = () => {
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrganizers = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8080/organizers");
        let orgs = await res.json();
        
        if (!Array.isArray(orgs)) {
          setOrganizers([]);
          return;
        }

        // ดึงรีวิวและข้อมูลผู้ใช้จริงของแต่ละ organizer
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
              const avgRating = ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;

              // ดึงข้อมูลผู้ใช้จริงเพื่อเอารูปโปรไฟล์
              let userData = {};
              try {
                const userRes = await fetch(`http://localhost:8080/users/${org.user_id}`);
                if (userRes.ok) {
                  userData = await userRes.json();
                }
              } catch (userError) {
                console.error(`Error fetching user data for organizer ${org.organizer_id}:`, userError);
              }

              return {
                ...org,
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
                avgRating: 0,
                totalReviews: 0,
                profile_image: null
              };
            }
          })
        );

        // เรียงตามคะแนนจากมากไปน้อย
        setOrganizers(orgsWithRating.sort((a, b) => b.avgRating - a.avgRating));
      } catch (error) {
        console.error("Error fetching organizers:", error);
        setOrganizers([]);
      }
      setLoading(false);
    };

    fetchOrganizers();
  }, []);

  // กรอง organizers ตามการค้นหา
  const filteredOrganizers = organizers.filter((org) =>
    `${org.first_name || ""} ${org.last_name || ""}`.toLowerCase().includes(search.toLowerCase()) ||
    org.username?.toLowerCase().includes(search.toLowerCase()) ||
    org.expertise?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="organizer-list-container">
      <div className="organizer-list-header">
        <h1>ผู้จัดงานทั้งหมด</h1>
        <div className="organizer-list-search">
          <input
            type="text"
            placeholder="ค้นหาผู้จัดงาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="organizer-list-search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="organizer-list-loading">กำลังโหลด...</div>
      ) : filteredOrganizers.length === 0 ? (
        <div className="organizer-list-empty">
          <h3>ไม่พบผู้จัดงาน</h3>
          <p>ลองค้นหาด้วยคำอื่น หรือกลับมาดูใหม่ภายหลัง</p>
        </div>
      ) : (
        <div className="organizer-list-grid">
          {filteredOrganizers.map((org) => (
            <div
              className="organizer-list-card"
              key={org.organizer_id}
              onClick={() => navigate(`/organizers/${org.organizer_id}`)}
            >
              <div className="organizer-list-img-wrap">
                <img
                  src={
                    org.profile_image
                      ? org.profile_image.startsWith("http")
                        ? org.profile_image
                        : `http://localhost:8080${org.profile_image.replace(/^\./, "")}`
                      : "/default-avatar.png"
                  }
                  alt={org.first_name}
                  className="organizer-list-img"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
              </div>
              <div className="organizer-list-info">
                <div className="organizer-list-title">
                  {`${org.first_name || ""} ${org.last_name || ""}`.trim() || org.username}
                </div>
                <div className="organizer-list-expertise">
                  {org.expertise || "ผู้จัดงานมืออาชีพ"}
                </div>
                <div className="organizer-list-rating">
                  <span className="organizer-list-stars">
                    {"★".repeat(Math.round(org.avgRating))}
                    {"☆".repeat(5 - Math.round(org.avgRating))}
                  </span>
                  <span className="organizer-list-rating-num">
                    {org.avgRating > 0 ? org.avgRating.toFixed(1) : "ยังไม่มีคะแนน"}
                  </span>
                  <span className="organizer-list-rating-count">
                    ({org.totalReviews} รีวิว)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerList;