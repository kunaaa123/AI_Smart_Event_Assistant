import React, { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import "./AdminReports.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const fetchJSON = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const parseDate = (v) => {
  const s = v?.created_at || v?.createdAt || v?.created || v?.created_at_time;
  if (!s) return null;

  // 1) ลอง parse แบบมาตรฐานก่อน (RFC3339 เช่น 2025-07-01T07:52:48Z)
  let d = dayjs(s);
  if (d.isValid()) return d;

  // 2) ลองรูปแบบ MySQL "YYYY-MM-DD HH:mm:ss"
  d = dayjs(s, "YYYY-MM-DD HH:mm:ss", true);
  if (d.isValid()) return d;

  // 3) แปลงเป็นรูปแบบคล้าย ISO แล้วลองใหม่
  if (typeof s === "string" && !s.includes("T")) {
    const iso = `${s.replace(" ", "T")}Z`;
    d = dayjs(iso);
    if (d.isValid()) return d;
  }

  return null;
};

const AdminWelcome = () => {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventReviews, setEventReviews] = useState([]);
  const [organizerReviews, setOrganizerReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // ย้อนหลัง 12 เดือน
  const [start, setStart] = useState(dayjs().subtract(11, "month").startOf("month"));
  const [end, setEnd] = useState(dayjs().endOf("month"));

  // เพิ่ม state ควบคุมหมวดกราฟ
  // users_all = ผู้ใช้ทุกประเภท, members = ผู้ใช้ทั่วไป, organizers = ผู้จัดทำอีเว้นท์, events = อีเว้นท์
  const [chartView, setChartView] = useState("users_all");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const [u, e, er, or] = await Promise.all([
        fetchJSON("http://localhost:8080/users"),
        fetchJSON("http://localhost:8080/events"),
        fetchJSON("http://localhost:8080/event_reviews"),     // รวมรีวิวอีเว้นท์
        fetchJSON("http://localhost:8080/organizer_reviews"), // รวมรีวิวผู้จัด
      ]);
      if (!alive) return;
      setUsers(u);
      setEvents(e);
      setEventReviews(er);
      setOrganizerReviews(or);
      setLoading(false);
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  // กรองข้อมูลตามช่วงวันที่ (สำหรับกราฟ)
  const inRange = useCallback(
    (d) =>
      d &&
      (d.isAfter(start) || d.isSame(start, "day")) &&
      (d.isBefore(end) || d.isSame(end, "day")),
    [start, end]
  );

  const usersInRange = useMemo(
    () => users.filter((u) => inRange(parseDate(u))),
    [users, inRange]
  );
  const eventsInRange = useMemo(
    () => events.filter((e) => inRange(parseDate(e))),
    [events, inRange]
  );

  // แยกผู้ใช้ตามบทบาท (ใช้กับกราฟ)
  const membersInRange = useMemo(
    () => usersInRange.filter((u) => u.role === "member"),
    [usersInRange]
  );
  const organizersInRangeOnly = useMemo(
    () => usersInRange.filter((u) => u.role === "organizer"),
    [usersInRange]
  );

  // นับบทบาทผู้ใช้
  const totalUsers = users.length;
  const membersCount = useMemo(() => users.filter((u) => u.role === "member").length, [users]);
  const organizersCount = useMemo(() => users.filter((u) => u.role === "organizer").length, [users]);

  // Labels รายเดือน
  const monthLabels = useMemo(() => {
    const labels = [];
    let cursor = start.startOf("month");
    const last = end.endOf("month");
    while (cursor.isBefore(last) || cursor.isSame(last, "month")) {
      labels.push(cursor.format("MMM YYYY"));
      cursor = cursor.add(1, "month");
    }
    return labels;
  }, [start, end]);

  // นับจำนวนต่อเดือน
  const countByMonth = useCallback(
    (arr) => {
      const map = {};
      for (const item of arr) {
        const d = parseDate(item);
        if (!d) continue;
        const key = d.format("MMM YYYY");
        map[key] = (map[key] || 0) + 1;
      }
      return monthLabels.map((m) => map[m] || 0);
    },
    [monthLabels]
  );

  // ชุดข้อมูลรายเดือน
  const membersMonthly = useMemo(() => countByMonth(membersInRange), [membersInRange, countByMonth]);
  const organizersMonthly = useMemo(() => countByMonth(organizersInRangeOnly), [organizersInRangeOnly, countByMonth]);
  const eventsMonthly = useMemo(() => countByMonth(eventsInRange), [eventsInRange, countByMonth]);

  // กำหนดชุดข้อมูลของกราฟตาม chartView
  const chartData = useMemo(() => {
    const makeFill = (color) => (ctx) => {
      const { ctx: c, chartArea } = ctx.chart;
      if (!chartArea) return color.replace("1)", "0.12)");
      const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, color.replace("1)", "0.25)"));
      g.addColorStop(1, color.replace("1)", "0.04)"));
      return g;
    };

    const base = {
      labels: monthLabels,
      datasets: [],
    };

    switch (chartView) {
      case "members":
        base.datasets = [{
          label: "ผู้ใช้ทั่วไปใหม่",
          data: membersMonthly,
          fill: true,
          tension: 0.35,
          borderColor: "rgba(79,70,229,1)",
          backgroundColor: makeFill("rgba(79,70,229,1)"),
          pointRadius: 0,
        }];
        break;
      case "organizers":
        base.datasets = [{
          label: "ผู้จัดทำอีเว้นท์ใหม่",
          data: organizersMonthly,
          fill: true,
          tension: 0.35,
          borderColor: "rgba(245,158,11,1)",
          backgroundColor: makeFill("rgba(245,158,11,1)"),
          pointRadius: 0,
        }];
        break;
      case "events":
        base.datasets = [{
          label: "อีเว้นท์ใหม่",
          data: eventsMonthly,
          fill: true,
          tension: 0.35,
          borderColor: "rgba(34,197,94,1)",
          backgroundColor: makeFill("rgba(34,197,94,1)"),
          pointRadius: 0,
        }];
        break;
      default: // users_all
        base.datasets = [
          {
            label: "ผู้ใช้ทั่วไปใหม่",
            data: membersMonthly,
            fill: true,
            tension: 0.35,
            borderColor: "rgba(79,70,229,1)",
            backgroundColor: makeFill("rgba(79,70,229,1)"),
            pointRadius: 0,
          },
          {
            label: "ผู้จัดทำอีเว้นท์ใหม่",
            data: organizersMonthly,
            fill: true,
            tension: 0.35,
            borderColor: "rgba(245,158,11,1)",
            backgroundColor: makeFill("rgba(245,158,11,1)"),
            pointRadius: 0,
          },
        ];
    }
    return base;
  }, [chartView, monthLabels, membersMonthly, organizersMonthly, eventsMonthly]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { boxWidth: 12 } },
      tooltip: { mode: "index", intersect: false },
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "rgba(0,0,0,0.06)" }, beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  const totalReviews = (eventReviews?.length || 0) + (organizerReviews?.length || 0);

  // helper สำหรับสไตล์ active ของการ์ด
  const cardStyle = (isActive) => ({
    cursor: "pointer",
    outline: isActive ? "2px solid #4f46e5" : "none",
    boxShadow: isActive ? "0 0 0 3px rgba(79,70,229,0.15)" : "none",
  });

  return (
    <div className="admin-reports">
      <div className="admin-reports-header">
        <div className="admin-reports-title">ผู้ใช้งานทั้งหมด</div>
        <div className="admin-reports-filters">
          <label className="admin-filter">
            เริ่ม
            <input
              type="date"
              value={start.format("YYYY-MM-DD")}
              onChange={(e) => setStart(dayjs(e.target.value).startOf("day"))}
            />
          </label>
          <label className="admin-filter">
            สิ้นสุด
            <input
              type="date"
              value={end.format("YYYY-MM-DD")}
              onChange={(e) => setEnd(dayjs(e.target.value).endOf("day"))}
            />
          </label>
        </div>
      </div>

      <div className="admin-chart-card">
        {loading ? (
          <div className="admin-loading">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="admin-chart-wrap">
            <Line data={chartData} options={chartOptions} height={320} />
          </div>
        )}
      </div>

      <div className="admin-stats-grid">
        <div
          className="admin-stat-card"
          onClick={() => setChartView("users_all")}
          style={cardStyle(chartView === "users_all")}
          title="คลิกเพื่อแสดงกราฟผู้ใช้แยกตามบทบาท"
        >
          <div className="admin-stat-label">ผู้ใช้ทั้งหมด</div>
          <div className="admin-stat-value">{totalUsers}</div>
        </div>

        <div
          className="admin-stat-card"
          onClick={() => setChartView("members")}
          style={cardStyle(chartView === "members")}
          title="คลิกเพื่อแสดงกราฟเฉพาะผู้ใช้ทั่วไป"
        >
          <div className="admin-stat-label">ผู้ใช้ทั่วไป</div>
          <div className="admin-stat-value">{membersCount}</div>
        </div>

        <div
          className="admin-stat-card"
          onClick={() => setChartView("organizers")}
          style={cardStyle(chartView === "organizers")}
          title="คลิกเพื่อแสดงกราฟเฉพาะผู้จัดทำอีเว้นท์"
        >
          <div className="admin-stat-label">ผู้จัดทำอีเว้นท์</div>
          <div className="admin-stat-value">{organizersCount}</div>
        </div>

        <div
          className="admin-stat-card"
          onClick={() => setChartView("events")}
          style={cardStyle(chartView === "events")}
          title="คลิกเพื่อแสดงกราฟอีเว้นท์ใหม่ต่อเดือน"
        >
          <div className="admin-stat-label">อีเว้นท์ทั้งหมด</div>
          <div className="admin-stat-value">{events.length}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">ความคิดเห็นทั้งหมด</div>
          <div className="admin-stat-value">{totalReviews}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminWelcome;
