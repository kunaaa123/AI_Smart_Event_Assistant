import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProfileLayout from "./ProfileLayout";
import GlassAlert from "./GlassAlert"; // เพิ่ม import
import GCFFEConfirm from "./GCFFEConfirm"; // เพิ่ม
import "./MyComments.css";

const MyComments = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventImages, setEventImages] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, comment: "" });
  const [updating, setUpdating] = useState(false);
  
  // เพิ่ม state สำหรับ GlassAlert
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  // คอนเฟิร์มสำหรับหน้าบ้าน (GCFFEConfirm)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOpts, setConfirmOpts] = useState({
    title: "ยืนยันการทำรายการ",
    message: "คุณแน่ใจหรือไม่?",
    type: "warning",
    confirmText: "ยืนยัน",
    cancelText: "ยกเลิก",
    closeOnOverlay: true,
  });
  const confirmResolverRef = useRef(null);
  const ask = (opts = {}) =>
    new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmOpts((prev) => ({ ...prev, ...opts }));
      setConfirmOpen(true);
    });
  const onConfirm = () => {
    setConfirmOpen(false);
    confirmResolverRef.current?.(true);
    confirmResolverRef.current = null;
  };
  const onCancel = () => {
    setConfirmOpen(false);
    confirmResolverRef.current?.(false);
    confirmResolverRef.current = null;
  };

  // ฟังก์ชันแสดง alert
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
  };

  const fetchEventImages = async (eventId) => {
    if (!eventId || eventImages[eventId]) return;
    try {
      const res = await fetch(`http://localhost:8080/events/${eventId}/images`);
      if (res.ok) {
        const imgs = await res.json();
        if (Array.isArray(imgs) && imgs.length > 0) {
          setEventImages(prev => ({
            ...prev,
            [eventId]: imgs
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching event images:", error);
    }
  };

  const getEventCoverImage = (eventId) => {
    const imgs = eventImages[eventId];
    if (!imgs || imgs.length === 0) {
      return "https://placehold.co/280x180?text=Event";
    }
    const coverImg = imgs.find(img => img.is_cover) || imgs[0];
    return `http://localhost:8080${coverImg.image_url.replace(/^\./, "")}`;
  };

  useEffect(() => {
    if (!user.user_id) {
      setLoading(false);
      return;
    }
    const fetchUserComments = async () => {
      try {
        const url = `http://localhost:8080/reviews/user/${user.user_id}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const commentsData = Array.isArray(data) ? data : [];
          setComments(commentsData);
          commentsData.forEach(comment => {
            if (comment.event_id) {
              fetchEventImages(comment.event_id);
            }
          });
          setError(null);
        } else {
          const errorText = await res.text();
          setError(`HTTP ${res.status}: ${errorText}`);
          setComments([]);
        }
      } catch (error) {
        setError(error.message);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUserComments();
  }, [user.user_id]);

  // Auto hide alert after 3 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  const handleStartEdit = (comment) => {
    setEditingId(comment.review_id);
    setEditForm({
      rating: comment.rating,
      comment: comment.comment
    });
  };

  const handleCancelEdit = async () => {
    if (editingId == null) return;
    const original = comments.find(c => c.review_id === editingId);
    const changed =
      original &&
      (String(original.comment || "") !== String(editForm.comment || "") ||
       Number(original.rating) !== Number(editForm.rating));
    if (changed) {
      const ok = await ask({
        title: "ละทิ้งการแก้ไข?",
        message: "การเปลี่ยนแปลงจะไม่ถูกบันทึก ต้องการยกเลิกหรือไม่?",
        type: "warning",
        confirmText: "ละทิ้ง",
        closeOnOverlay: true,
      });
      if (!ok) return;
    }
    setEditingId(null);
    setEditForm({ rating: 0, comment: "" });
  };

  const handleSaveEdit = async (reviewId, eventId) => {
    if (!editForm.comment.trim()) {
      showAlert("กรุณาเขียนความคิดเห็น", "warning");
      return;
    }
    if (editForm.rating < 1 || editForm.rating > 5) {
      showAlert("กรุณาให้คะแนน 1-5 ดาว", "warning");
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`http://localhost:8080/events/${eventId}/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: editForm.rating,
          comment: editForm.comment,
        }),
      });
      if (res.ok) {
        setComments(prev => prev.map(comment =>
          comment.review_id === reviewId
            ? { ...comment, rating: editForm.rating, comment: editForm.comment }
            : comment
        ));
        setEditingId(null);
        setEditForm({ rating: 0, comment: "" });
        showAlert("แก้ไขความคิดเห็นสำเร็จ!", "success");
      } else {
        showAlert("เกิดข้อผิดพลาดในการแก้ไข", "danger");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      showAlert("เกิดข้อผิดพลาดในการแก้ไข", "danger");
    }
    setUpdating(false);
  };

  const handleDeleteComment = async (reviewId, eventId) => {
    const ok = await ask({
      title: "ยืนยันลบความคิดเห็น",
      message: "ต้องการลบความคิดเห็นนี้หรือไม่?",
      type: "danger",
      confirmText: "ลบ",
      closeOnOverlay: false,
    });
    if (!ok) return; // ผู้ใช้ยกเลิก ไม่ต้องแจ้ง error

    try {
      const res = await fetch(`http://localhost:8080/events/${eventId}/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments(prev => prev.filter(comment => comment.review_id !== reviewId));
        showAlert("ลบความคิดเห็นสำเร็จ!", "success");
      } else {
        showAlert("เกิดข้อผิดพลาดในการลบ", "danger");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      showAlert("เกิดข้อผิดพลาดในการลบ", "danger");
    }
  };

  return (
    <ProfileLayout user={user} sectionName="คอมเมนต์ของฉัน">
      {/* GCFFE Confirm */}
      <GCFFEConfirm
        open={confirmOpen}
        title={confirmOpts.title}
        message={confirmOpts.message}
        type={confirmOpts.type}
        confirmText={confirmOpts.confirmText}
        cancelText={confirmOpts.cancelText}
        closeOnOverlay={confirmOpts.closeOnOverlay}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

      {/* เพิ่ม GlassAlert */}
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      
      {/* Header & Count OUTSIDE the main border */}
      <div className="my-comments-header-outer" style={{ marginBottom: 0 }}>
        <h2 className="my-comments-title">คอมเมนต์ของฉัน</h2>
        <div className="my-comments-actions">
          <div className="my-comments-count">
            {comments.length} รายการ
          </div>
        </div>
      </div>
      <div className="my-comments-main-border">
        <div className="my-comments-container">
          {loading ? (
            <div className="my-comments-loading">กำลังโหลด...</div>
          ) : error ? (
            <div className="my-comments-empty">
              <div className="my-comments-empty-icon">⚠️</div>
              <h3>เกิดข้อผิดพลาด</h3>
              <p>{error}</p>
              <small>กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ</small>
            </div>
          ) : comments.length === 0 ? (
            <div className="my-comments-empty">
              <div className="my-comments-empty-icon">💭</div>
              <h3>ยังไม่มีความคิดเห็น</h3>
              <p>คุณยังไม่ได้แสดงความคิดเห็นเกี่ยวกับอีเว้นท์ใดๆ</p>
              <p>เริ่มต้นแสดงความคิดเห็นเพื่อช่วยผู้อื่นในการตัดสินใจ</p>
              <button className="my-comment-action-btn" onClick={() => navigate("/events")}>
                <span>🎭</span>
                สำรวจอีเว้นท์
              </button>
            </div>
          ) : (
            <div className="my-comments-scroll-container">
              <div className="my-comments-list-grid">
                {comments.map((comment) => (
                  <div className="my-comment-card-horizontal" key={comment.review_id}>
                    <div
                      className="my-comment-img-horizontal"
                      onClick={() => navigate(`/events/${comment.event_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={getEventCoverImage(comment.event_id)}
                        alt={comment.event_name}
                        className="my-comment-img-horizontal"
                      />
                    </div>
                    <div className="my-comment-info-horizontal">
                      <div
                        className="my-comment-info-title-horizontal"
                        onClick={() => navigate(`/events/${comment.event_id}`)}
                      >
                        {comment.event_name}
                      </div>
                      <div className="my-comment-info-organizer-horizontal">
                        {comment.organizer_name || "ไม่ระบุผู้จัด"}
                      </div>
                      <div style={{ margin: "10px 0" }}>
                        {editingId === comment.review_id ? (
                          <div>
                            <div>
                              {[1,2,3,4,5].map((n) => (
                                <span
                                  key={n}
                                  style={{
                                    color: n <= editForm.rating ? "#fbbf24" : "#ddd",
                                    cursor: "pointer",
                                    fontSize: "1.2rem",
                                    transition: "all 0.2s ease"
                                  }}
                                  onClick={() => setEditForm({...editForm, rating: n})}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div>
                              {"★".repeat(comment.rating)}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        {editingId === comment.review_id ? (
                          <div>
                            <textarea
                              className="my-comments-form-textarea"
                              value={editForm.comment}
                              onChange={(e) => setEditForm({...editForm, comment: e.target.value})}
                              placeholder="แก้ไขความคิดเห็นของคุณ..."
                              rows={3}
                              disabled={updating}
                            />
                            {/* ย้ายปุ่มมาอยู่ใต้ textarea */}
                            <div className="my-comment-actions" style={{ marginTop: '8px' }}>
                              <button
                                className="my-comment-action-btn"
                                onClick={() => handleSaveEdit(comment.review_id, comment.event_id)}
                                disabled={updating}
                              >
                                <span>💾</span>
                                {updating ? "บันทึก..." : "บันทึก"}
                              </button>
                              <button
                                className="my-comment-action-btn"
                                onClick={handleCancelEdit}
                                disabled={updating}
                              >
                                <span>❌</span>
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ margin: "8px 0", color: "#374151", flex: 1 }}>
                              "{comment.comment}"
                            </p>
                            {/* ย้ายปุ่มมาอยู่ข้างข้อความ */}
                            <div className="my-comment-actions" style={{ marginLeft: '12px', flexShrink: 0 }}>
                              <button
                                className="my-comment-action-btn"
                                onClick={() => handleStartEdit(comment)}
                                title="แก้ไขความคิดเห็น"
                              >
                                <span>✏️</span>
                                แก้ไข
                              </button>
                              <button
                                className="my-comment-action-btn"
                                onClick={() => handleDeleteComment(comment.review_id, comment.event_id)}
                                title="ลบความคิดเห็น"
                              >
                                <span>🗑️</span>
                                ลบ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default MyComments;