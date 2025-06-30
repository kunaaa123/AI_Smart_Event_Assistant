import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import './Navbar.css'; // ถ้าคุณเขียนไว้ในไฟล์ Navbar.css


const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw || raw === "undefined") return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const searchBoxRef = useRef();

  // ฟังก์ชันค้นหา event และ organizer
  const handleSearch = async (value) => {
    setSearch(value);
    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchPopup(false);
      return;
    }
    // ดึงข้อมูล event และ organizer
    const [eventsRes, organizersRes] = await Promise.all([
      fetch("http://localhost:8080/events").then((r) => r.json()),
      fetch("http://localhost:8080/organizers").then((r) => r.json()),
    ]);
    // filter event
    const eventResults = (Array.isArray(eventsRes) ? eventsRes : []).filter(
      (e) =>
        e.name?.toLowerCase().includes(value.toLowerCase()) ||
        e.description?.toLowerCase().includes(value.toLowerCase())
    );
    // ดึงรูปปกของแต่ละ event
    const eventResultsWithCover = await Promise.all(
      eventResults.map(async (e) => {
        let coverImg = null;
        try {
          const imgRes = await fetch(`http://localhost:8080/events/${e.event_id}/images`);
          let imgs = await imgRes.json();
          if (Array.isArray(imgs) && imgs.length > 0) {
            coverImg = imgs.find((img) => img.is_cover) || imgs[0];
          }
        } catch {
          // Ignore errors when fetching event images
        }
        return {
          ...e,
          event_image: coverImg ? coverImg.image_url : null,
        };
      })
    );
    // filter organizer
    const organizerResults = (Array.isArray(organizersRes) ? organizersRes : []).filter(
      (o) =>
        `${o.first_name || ""} ${o.last_name || ""}`.toLowerCase().includes(value.toLowerCase()) ||
        o.username?.toLowerCase().includes(value.toLowerCase()) ||
        o.expertise?.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults([
      ...eventResultsWithCover.map((e) => ({ type: "event", ...e })),
      ...organizerResults.map((o) => ({ type: "organizer", ...o })),
    ]);
    setShowSearchPopup(true);
  };

  // ปิด popup เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSearchPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ฟัง event storage และอัปเดต user เมื่อ localStorage เปลี่ยน
  useEffect(() => {
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw || raw === "undefined") setUser(null);
        else setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("user-profile-updated", handleStorage); // เพิ่มบรรทัดนี้
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("user-profile-updated", handleStorage); // เพิ่มบรรทัดนี้
    };
  }, []);

  // เพิ่มฟังก์ชัน refresh user เมื่อกลับมาที่หน้า (เช่นหลัง login/register)
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined") setUser(null);
    else setUser(JSON.parse(raw));
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3">
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center gap-2" href="/">
          <img
            src="Bannerimg/logo.png"
            alt="Logo"
            width="46"
            height="46"
            style={{ borderRadius: 8 }}
          />
          <span className="fw-bold fs-5">Smart AI Event Assistant</span>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-3">
            <li className="nav-item">
              <button
                className="nav-link btn btn-link"
                onClick={() => navigate("/")}
              >
                หน้าหลัก
              </button>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                ติดต่อฉัน
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                รายการโปรด
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                อีเว้นท์ของฉัน
              </a>
            </li>
          </ul>
          <form className="d-flex me-3 position-relative" role="search" ref={searchBoxRef} autoComplete="off">
            <input
              className="form-control"
              type="search"
              placeholder="ค้นหา"
              aria-label="Search"
              style={{ minWidth: 180 }}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => search && setShowSearchPopup(true)}
            />
            {/* Popup Search Result */}
            {showSearchPopup && searchResults.length > 0 && (
              <div className="navbar-search-popup">
                {searchResults.map((item, idx) =>
                  item.type === "event" ? (
                    <div
                      key={`event-${item.event_id}-${idx}`}
                      className="navbar-search-item navbar-search-item-flex"
                      onClick={() => {
                        setShowSearchPopup(false);
                        setSearch("");
                        navigate(`/events/${item.event_id}`);
                      }}
                    >
                      <img
                        src={
                          item.event_image
                            ? item.event_image.startsWith("http")
                              ? item.event_image
                              : `http://localhost:8080${item.event_image.replace(/^\./, "")}`
                            : "https://placehold.co/48x48?text=No+Image"
                        }
                        alt={item.name}
                        className="navbar-search-thumb"
                      />
                      <div className="navbar-search-info">
                        <div>
                          <span className="navbar-search-type">[Event]</span>
                          <span className="navbar-search-title">{item.name}</span>
                        </div>
                        <div className="navbar-search-desc">
                          {item.description?.slice(0, 48) || "-"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={`org-${item.organizer_id}-${idx}`}
                      className="navbar-search-item navbar-search-item-flex"
                      onClick={() => {
                        setShowSearchPopup(false);
                        setSearch("");
                        navigate(`/organizers/${item.organizer_id}`);
                      }}
                    >
                      <img
                        src={
                          item.profile_image
                            ? item.profile_image.startsWith("http")
                              ? item.profile_image
                              : `http://localhost:8080${item.profile_image.replace(/^\./, "")}`
                            : "/default-avatar.png"
                        }
                        alt={item.first_name}
                        className="navbar-search-thumb"
                      />
                      <div className="navbar-search-info">
                        <div>
                          <span className="navbar-search-type">[Organizer]</span>
                          <span className="navbar-search-title">
                            {item.first_name} {item.last_name}
                          </span>
                        </div>
                        <div className="navbar-search-desc">
                          {item.expertise || "-"}
                        </div>
                      </div>
                    </div>
                  )
                )}
                {searchResults.length === 0 && (
                  <div className="navbar-search-item">ไม่พบข้อมูล</div>
                )}
              </div>
            )}
          </form>
          {user ? (
            <div className="d-flex align-items-center gap-2">
              <div
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/profile")}
                title="โปรไฟล์"
              >
                <img
                  src={
                    user.profile_image
                      ? user.profile_image.startsWith("http")
                        ? user.profile_image
                        : `http://localhost:8080${user.profile_image}`
                      : "/default-avatar.png"
                  }
                  alt="avatar"
                  className="navbar-avatar" // เปลี่ยนตรงนี้
                />
              </div>
              <span className="fw-semibold">{user.username}</span>
              <button
                className="btn btn-outline-secondary btn-sm ms-2"
                onClick={() => {
                  localStorage.removeItem("user");
                  window.location.href = "/";
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate("/login")}
              >
                เข้าสู่ระบบ
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/register")}
              >
                สมัครสมาชิก
              </button>
            </div>
          )}
        </div>
      </div>

    </nav>
  );
};

export default Navbar;