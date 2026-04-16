import React, { useEffect, useRef } from "react";
import anime from "animejs/lib/anime.es.js";
import "./NewHome.css";

const NewHome = () => {
  const tlRef = useRef(null);

  const startAnimation = () => {
    // รีเซ็ตสภาพก่อนเล่นใหม่
    anime.set(".new-hero-title, .new-hero-subtitle, .new-card", {
      opacity: 0,
      translateY: 0,
    });

    const tl = anime
      .timeline({ easing: "easeOutExpo", duration: 700 })
      .add({
        targets: ".new-hero-title",
        translateY: [20, 0],
        opacity: [0, 1],
      })
      .add(
        {
          targets: ".new-hero-subtitle",
          translateY: [10, 0],
          opacity: [0, 1],
        },
        "-=400"
      )
      .add(
        {
          targets: ".new-card",
          opacity: [0, 1],
          translateY: [30, 0],
          delay: anime.stagger(120),
        },
        "-=250"
      );

    tlRef.current = tl;
  };

  useEffect(() => {
    startAnimation();
    return () => tlRef.current?.pause();
  }, []);

  return (
    <div className="new-home-page">
      <div className="new-home-container">
        <h1 className="new-hero-title">New Home</h1>
        <p className="new-hero-subtitle">ตัวอย่างแอนิเมชันด้วย anime.js</p>

        <div className="new-grid">
          <div className="new-card">
            <h3 className="new-card-title">บล็อก A</h3>
            <p className="new-card-desc">การ์ดตัวอย่างสำหรับเดโม</p>
          </div>
          <div className="new-card">
            <h3 className="new-card-title">บล็อก B</h3>
            <p className="new-card-desc">รองรับ SVG/CSS/DOM</p>
          </div>
          <div className="new-card">
            <h3 className="new-card-title">บล็อก C</h3>
            <p className="new-card-desc">ใช้ timeline/stagger ได้</p>
          </div>
        </div>

        <button className="new-btn" onClick={startAnimation}>
          เล่นแอนิเมชันอีกครั้ง
        </button>
      </div>
    </div>
  );
};

export default NewHome;