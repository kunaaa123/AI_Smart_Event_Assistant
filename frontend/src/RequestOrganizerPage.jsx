import React, { useState } from "react";
import RequestOrganizerForm from "./RequestOrganizerForm";

const RequestOrganizerPage = () => {
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
  }, []);
  const [form, setForm] = useState({
    organizer_name: "",
    category: "",
    email: user.email || "",
    price: "",
    phone: user.phone || "",
    description: "",
  });

  if (["organizer", "admin"].includes((user?.role || "").toLowerCase())) {
    return (
      <div style={{ padding: 24 }}>
        <h2>คุณเป็นผู้จัดอีเวนท์อยู่แล้ว</h2>
        <p>ไปที่ “อีเว้นท์ของฉัน” หรือ “ผลงานของผู้จัดทำ” เพื่อจัดการงานของคุณ</p>
      </div>
    );
  }

  return (
    <RequestOrganizerForm
      show={true}
      onClose={() => {}}
      form={form}
      onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
      onImageChange={() => {}}
      onResult={() => {}}
    />
  );
};

export default RequestOrganizerPage;