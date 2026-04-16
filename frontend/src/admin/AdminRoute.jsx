import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import AdminVenues from "./AdminVenues";

const AdminRoute = ({ children }) => {
  let user = null;
  try {
    const raw = localStorage.getItem("user");
    user = raw && raw !== "undefined" ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }

  const location = useLocation();
  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

export default AdminRoute;

// ตัวอย่าง React Router v6:
// <Route path="/admin" element={<AdminLayout />}>
//       <Route index element={<AdminWelcome />} />
//       <Route path="events" element={<AdminEvents />} />
//       <Route path="venues" element={<AdminVenues />} />   // <-- เพิ่มบรรทัดนี้
//       <Route path="users" element={<AdminUsers />} />
//     </Route>