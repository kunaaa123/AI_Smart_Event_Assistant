import React from "react";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>กรุณาเข้าสู่ระบบ</h2>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 420,
      margin: "2rem auto",
      background: "rgba(255,255,255,0.7)",
      borderRadius: 18,
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      padding: "2.5rem 2rem"
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {user.profile_image ? (
          <img
            src={user.profile_image}
            alt="profile"
            width={90}
            height={90}
            style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #22223b" }}
          />
        ) : (
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: "#22223b",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: "bold",
              border: "2px solid #22223b"
            }}
          >
            {user.username ? user.username[0].toUpperCase() : "U"}
          </div>
        )}
        <h2 style={{ margin: 0 }}>{user.username}</h2>
        <div style={{ color: "#4a4e69", fontSize: "1.1rem" }}>{user.email}</div>
        <div style={{ color: "#8d99ae", fontSize: "1rem" }}>บทบาท: {user.role}</div>
        {/* เพิ่มปุ่มแก้ไขโปรไฟล์หรืออื่นๆ ได้ที่นี่ */}
      </div>
    </div>
  );
};

export default Profile;