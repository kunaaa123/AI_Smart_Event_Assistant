import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminFloatingButton.css";

const AdminFloatingButton = () => {
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

  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw || raw === "undefined") setUser(null);
        else setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", handler);
    window.addEventListener("user-profile-updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("user-profile-updated", handler);
    };
  }, []);

  if (!user || user.role !== "admin") return null;

  return (
    <button
      className="admin-fab"
      title="Admin dashboard"
      onClick={() => navigate("/admin")}
      aria-label="Admin"
    >
      <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
        <path d="M12 2l7 3v5c0 5-3.58 9.74-7 12-3.42-2.26-7-7-7-12V5l7-3z" fill="currentColor"/>
        <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" fill="#fff" opacity="0.95"/>
      </svg>
    </button>
  );
};

export default AdminFloatingButton;