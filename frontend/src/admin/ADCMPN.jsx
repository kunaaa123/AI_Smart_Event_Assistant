import React, { useEffect, useState } from "react";
import GlassAlert from "../GlassAlert"; // เพิ่ม import
import "./ADCMPN.css";
import useGlassConfirm from "../hooks/useGlassConfirm"; // เพิ่ม
import { useNavigate } from "react-router-dom";

const TYPE = {
  ORGANIZER: "organizer",
  MEMBER: "member",
};

const typeLabels = {
  [TYPE.ORGANIZER]: "ความคิดเห็นผู้จัดทำ",
  [TYPE.MEMBER]: "ความคิดเห็นสมาชิก",
};

function ADCMPN() {
  const [type, setType] = useState(TYPE.ORGANIZER);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [ConfirmUI, confirm] = useGlassConfirm(); // เพิ่ม
  const navigate = useNavigate();

  const goToItem = (r) => {
    // ถ้ามี event_id ไปหน้า event และส่ง state เพื่อให้หน้า event เลื่อน/ไฮไลท์รีวิวได้
    if (r.event_id) {
      // ใส่ hash ด้วยเพื่อรองรับ anchor หากฝั่ง EventDetail ใช้ location.hash
      navigate(`/events/${r.event_id}#review-${r.review_id}`, {
        state: { highlightReviewId: r.review_id },
      });
      return;
    }
    // ถ้าเป็นรีวิวผู้จัด ให้ไปหน้า organizer
    if (r.organizer_id) {
      navigate(`/organizers/${r.organizer_id}`, {
        state: { highlightReviewId: r.review_id },
      });
      return;
    }
    // fallback: ถ้าไม่มี id ใด ให้ไม่ทำอะไร
  };

  useEffect(() => {
    setLoading(true);
    const url =
      type === TYPE.ORGANIZER
        ? "http://localhost:8080/organizer_reviews"
        : "http://localhost:8080/event_reviews";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .finally(() => setLoading(false));
  }, [type]);

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
  };

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 2200);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  const handleDelete = async (reviewId) => {
    const ok = await confirm({
      title: "ยืนยันลบความคิดเห็น",
      message: "ต้องการลบความคิดเห็นนี้แบบถาวรหรือไม่?",
      type: "danger",
      confirmText: "ลบ",
      closeOnOverlay: false,
    });
    if (!ok) return;

    const url =
      type === TYPE.ORGANIZER
        ? `http://localhost:8080/organizer_reviews/${reviewId}`
        : `http://localhost:8080/event_reviews/${reviewId}`;
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
        showAlert("ลบความคิดเห็นเรียบร้อยแล้ว", "success");
      } else {
        const data = await res.json();
        showAlert(data.error || "เกิดข้อผิดพลาดในการลบ", "danger");
      }
    } catch {
      showAlert("เกิดข้อผิดพลาดในการเชื่อมต่อ", "danger");
    }
  };

  return (
    <div className="ADCMPN-container">
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      {ConfirmUI} {/* กล่องยืนยันส่วนกลาง */} 
      <h2 className="ADCMPN-title">ความคิดเห็นทั้งหมดในระบบ</h2>
      <div className="ADCMPN-type-switch">
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            className={`ADCMPN-type-btn${type === key ? " active" : ""}`}
            onClick={() => setType(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="ADCMPN-loading">กำลังโหลด...</div>
      ) : (
        <div className="ADCMPN-list">
          {reviews.length === 0 ? (
            <div className="ADCMPN-empty">ไม่มีความคิดเห็น</div>
          ) : (
            reviews.map((r) => (
              <div
                className="ADCMPN-card"
                key={r.review_id}
                onClick={() => goToItem(r)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") goToItem(r); }}
                style={{ cursor: "pointer" }}
              >
                <div className="ADCMPN-card-header">
                  <div className="ADCMPN-profile">
                    <div className="ADCMPN-avatar-wrapper">
                      <img
                        src={
                          r.profile_image
                            ? r.profile_image.startsWith("http")
                              ? r.profile_image
                              : `http://localhost:8080${r.profile_image.replace(/^\./, "")}`
                            : "/default-avatar.png"
                        }
                        alt={r.username || "avatar"}
                        className="ADCMPN-avatar"
                        onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                      />
                    </div>
                    <span className="ADCMPN-username">{r.username || "ไม่ระบุ"}</span>
                  </div>
                  <div className="ADCMPN-rating">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>
                </div>
                <div className="ADCMPN-card-body">
                  <div className="ADCMPN-comment">{r.comment}</div>
                  <div className="ADCMPN-meta">
                    {type === TYPE.ORGANIZER ? (
                      <>
                        <span>ผู้จัดงาน: {r.organizer_name || r.organizer_id}</span>
                      </>
                    ) : (
                      <>
                        <span>อีเว้นท์: {r.event_name || r.event_id}</span>
                      </>
                    )}
                    <span>{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="ADCMPN-card-actions">
                  <button
                    className="ADCMPN-delete-btn"
                    onClick={(ev) => { ev.stopPropagation(); handleDelete(r.review_id); }}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ADCMPN;