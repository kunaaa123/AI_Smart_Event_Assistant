import React, { useState } from 'react';
import './FavoriteButton.css';

const FavoriteButton = ({ eventID, userID, isFavorite, onToggle, size = "24" }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation(); // ป้องกันไม่ให้คลิกไปที่ event card
    if (!userID) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    
    setLoading(true);
    const success = await onToggle(eventID);
    if (!success) {
      alert('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    }
    setLoading(false);
  };

  return (
    <button
      className={`favorite-btn ${isFavorite ? 'favorite-btn--active' : ''} ${loading ? 'favorite-btn--loading' : ''}`}
      onClick={handleClick}
      disabled={loading}
      title={isFavorite ? 'ลบจากรายการโปรด' : 'เพิ่มรายการโปรด'}
      style={{ width: size, height: size }}
    >
      {loading ? (
        <div className="favorite-loading">⏳</div>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill={isFavorite ? "#ff4757" : "none"}
          stroke={isFavorite ? "#ff4757" : "#333"}
          strokeWidth="2"
          className="favorite-icon"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
    </button>
  );
};

export default FavoriteButton;