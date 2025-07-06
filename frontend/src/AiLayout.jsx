import React from "react";
import "./AiLayout.css";

const menu = [
  {
    icon: (
      <svg width="22" height="22" fill="none">
        <path
          d="M4 9.5V17a1 1 0 0 0 1 1h3v-4h4v4h3a1 1 0 0 0 1-1V9.5L11 5 4 9.5Z"
          stroke="#222"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M2 10.5 11 4l9 6.5"
          stroke="#222"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    label: "หน้าหลัก",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none">
        <circle cx="11" cy="7" r="3" stroke="#222" strokeWidth="1.5" />
        <path
          d="M4 18c0-3.314 3.134-6 7-6s7 2.686 7 6"
          stroke="#222"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: "โปรไฟล์",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none">
        <rect
          x="3"
          y="6"
          width="16"
          height="10"
          rx="2"
          stroke="#222"
          strokeWidth="1.5"
        />
        <path
          d="M7 10h8"
          stroke="#222"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: "ขอคำแนะนำ",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none">
        <path
          d="M11 19s-7-4.5-7-9.5A4.5 4.5 0 0 1 11 5a4.5 4.5 0 0 1 7 4.5C18 14.5 11 19 11 19Z"
          stroke="#222"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    label: "รายการโปร",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none">
        <rect
          x="3"
          y="7"
          width="16"
          height="10"
          rx="2"
          stroke="#222"
          strokeWidth="1.5"
        />
        <path d="M7 7V5a4 4 0 0 1 8 0v2" stroke="#222" strokeWidth="1.5" />
      </svg>
    ),
    label: "สร้างบัตรเชิญ",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none">
        <path
          d="M4 17l2-5 5-2 5 2 2 5"
          stroke="#222"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="9" r="2" stroke="#222" strokeWidth="1.5" />
      </svg>
    ),
    label: "สร้างธีม",
  },
];

function AiLayout({ children }) {
  return (
    <div className="ai-layout-root">
      <aside className="ai-layout-sidebar">
        <nav>
          <ul className="ai-layout-menu">
            {menu.map((item, idx) => (
              <li className="ai-layout-menu-item" key={idx}>
                <span className="ai-layout-menu-icon">{item.icon}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="ai-layout-content">{children}</main>
    </div>
  );
}

export default AiLayout;