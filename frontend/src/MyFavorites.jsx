import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProfileLayout from "./ProfileLayout";
import FavoriteButton from "./components/FavoriteButton";
import { useFavorites } from "./hooks/useFavorites";
import GCFFEConfirm from "./GCFFEConfirm"; // เพิ่ม
import "./MyFavorites.css";

const MyFavorites = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const { favorites, loading, addToFavorites, removeFromFavorites, checkIsFavorite } = useFavorites(user.user_id);
  const [eventImages, setEventImages] = useState({});

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

  // ดึงรูปภาพสำหรับแต่ละ event
  const fetchEventImages = async (event_id) => {
    if (!event_id || event_id === 0) {
      console.error("Invalid event_id:", event_id);
      return;
    }
    
    try {
      console.log(`Fetching images for event ${event_id}`);
      const res = await fetch(`http://localhost:8080/events/${event_id}/images`);
      if (res.ok) {
        const imgs = await res.json();
        if (Array.isArray(imgs) && imgs.length > 0) {
          console.log(`Found ${imgs.length} images for event ${event_id}:`, imgs);
          setEventImages(prev => ({ ...prev, [event_id]: imgs }));
        } else {
          console.log(`No images found for event ${event_id}`);
        }
      } else {
        console.error(`Failed to fetch images for event ${event_id}: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to fetch images for event", event_id, err);
    }
  };

  // ดึงรูปภาพเมื่อมี favorites ใหม่
  useEffect(() => {
    if (favorites.length === 0) return;
    
    console.log("Processing favorites:", favorites);
    
    const fetched = new Set();
    favorites.forEach((favorite, index) => {
      console.log(`Favorite ${index}:`, favorite);
      
      // ตรวจสอบข้อมูล event
      if (favorite.event && favorite.event.event_id && favorite.event.event_id !== 0) {
        const eventId = favorite.event.event_id;
        if (!eventImages[eventId] && !fetched.has(eventId)) {
          fetchEventImages(eventId);
          fetched.add(eventId);
        }
      } else {
        console.error("Invalid event data in favorite:", favorite);
      }
    });
  }, [favorites]);

  // Debug favorites and eventImages changes
  useEffect(() => {
    console.log("Favorites updated:", favorites);
    console.log("Event images:", eventImages);
  }, [favorites, eventImages]);

  const handleFavoriteToggle = async (eventID) => {
    const isFav = checkIsFavorite(eventID);
    if (isFav) {
      const fav = favorites.find((f) => f.event?.event_id === eventID);
      const name = fav?.event?.name || `#${eventID}`;
      const ok = await ask({
        title: "ยืนยันลบจากรายการโปรด",
        message: `ต้องการลบ "${name}" ออกจากรายการโปรดหรือไม่?`,
        type: "danger",
        confirmText: "ลบ",
        closeOnOverlay: false,
      });
      if (!ok) return true; // เปลี่ยนจาก false -> true เมื่อยกเลิก
      return await removeFromFavorites(eventID);
    } else {
      const ok = await ask({
        title: "ยืนยันเพิ่มเป็นรายการโปรด",
        message: "ต้องการเพิ่มอีเว้นท์นี้ในรายการโปรดหรือไม่?",
        type: "success",
        confirmText: "เพิ่ม",
        closeOnOverlay: true,
      });
      if (!ok) return true; // เปลี่ยนจาก false -> true เมื่อยกเลิก
      return await addToFavorites(eventID);
    }
  };

  const getCoverImage = (event_id) => {
    if (!event_id || event_id === 0) {
      console.log("No valid event_id for getCoverImage");
      return "https://placehold.co/300x180?text=No+Image";
    }
    
    const imgs = eventImages[event_id];
    console.log(`Getting cover for event ${event_id}:`, imgs);
    
    if (!imgs || imgs.length === 0) return "https://placehold.co/300x180?text=No+Image";
    
    const coverImg = imgs.find(img => img.is_cover) || imgs[0];
    const imageUrl = `http://localhost:8080${coverImg.image_url.replace(/^\./, "")}`;
    console.log("Final image URL:", imageUrl);
    return imageUrl;
  };

  // แก้ไขฟังก์ชันการคลิกไปหน้า EventDetail
  const handleEventClick = (event) => {
    console.log("Clicked event:", event);
    if (event && event.event_id && event.event_id !== 0) {
      navigate(`/events/${event.event_id}`);
    } else {
      console.error("Invalid event for navigation:", event);
      alert("ไม่สามารถเปิดหน้าอีเว้นท์ได้ ข้อมูลไม่ถูกต้อง");
    }
  };

  return (
    <ProfileLayout user={user} sectionName="รายการโปรด">
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
      {/* Header */}
      <div className="my-favorites-header-outer">
        <h2 className="my-favorites-title">รายการโปรดของฉัน</h2>
        <div className="my-favorites-count">
          {favorites.length} รายการ
        </div>
      </div>

      {/* แสดงรายการโปรดโดยตรง */}
      {loading ? (
        <div className="my-favorites-loading">กำลังโหลด...</div>
      ) : favorites.length === 0 ? (
        <div className="my-favorites-empty">
          <div className="my-favorites-empty-icon">💝</div>
          <div className="my-favorites-empty-title">ยังไม่มีรายการโปรด</div>
          <div className="my-favorites-empty-desc">
            เริ่มเพิ่มอีเว้นท์ที่คุณชอบลงในรายการโปรดกันเถอะ!
          </div>
          <button 
            className="my-favorites-browse-btn"
            onClick={() => navigate("/")}
          >
            เรียกดูอีเว้นท์
          </button>
        </div>
      ) : (
        // กรอบล้อมเฉพาะรายการอีเว้นท์
        <div className="my-favorites-main-border">
          <div className="my-favorites-list-grid">
            {favorites.map((favorite) => {
              // ตรวจสอบข้อมูล event ก่อนการ render
              if (!favorite.event || !favorite.event.event_id || favorite.event.event_id === 0) {
                console.error("Invalid favorite event data:", favorite);
                return null; // ข้ามการ render card นี้
              }

              return (
                <div
                  key={favorite.favorite_id}
                  className="my-favorite-card-grid"
                  onClick={() => handleEventClick(favorite.event)}
                >
                  <div className="my-favorite-img-wrap">
                    <img
                      src={getCoverImage(favorite.event.event_id)}
                      alt={favorite.event.name || "Event"}
                      className="my-favorite-img"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/300x180?text=No+Image";
                      }}
                    />
                    {/* ย้ายปุ่มหัวใจมาอยู่บนภาพ */}
                    <div className="my-favorite-actions">
                      <div 
                        className="my-favorite-action-btn" 
                        title="ลบจากรายการโปรด"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFavoriteToggle(favorite.event.event_id);
                        }}
                      >
                        <FavoriteButton
                          eventID={favorite.event.event_id}
                          userID={user.user_id}
                          isFavorite={true}
                          onToggle={handleFavoriteToggle}
                          size="22"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="my-favorite-info">
                    <div className="my-favorite-info-title">{favorite.event.name || "ไม่มีชื่ออีเว้นท์"}</div>
                    <div className="my-favorite-info-desc">
                      {favorite.event.description?.length > 50 
                        ? `${favorite.event.description.slice(0, 50)}...` 
                        : favorite.event.description || "ไม่มีคำอธิบาย"}
                    </div>
                    <div className="my-favorite-added-date">
                      เพิ่มเมื่อ: {favorite.created_at ? new Date(favorite.created_at).toLocaleDateString('th-TH') : "ไม่ทราบวันที่"}
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </ProfileLayout>
  );
};

export default MyFavorites;