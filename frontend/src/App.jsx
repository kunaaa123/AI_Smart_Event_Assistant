import React, { useState } from "react";
import Navbar from "./Navbar";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import GlassAlert from "./GlassAlert";
import Profile from "./profile";
import MyEvents from "./MyEvents";
import OrganizerPortfolios from "./OrganizerPortfolios";
import CreateEvent from "./CreateEvent";
import AddPortfolio from "./AddPortfolio";
import EventDetail from "./EventDetail";
import AiPage from "./AiPage";
import CreateThemeAi from "./CreateThemeAi";
import CreateInviteCard from "./CreateInviteCard";
import MyFavorites from "./MyFavorites";
import MyComments from "./MyComments";
import VenueList from "./VenueList";
import VenueDetail from "./VenueDetail";
import EventList from "./EventList";
import OrganizerList from "./OrganizerList";
import OrganizerDetail from "./OrganizerDetail";
import SearchResults from "./SearchResults";
import SendInvitationEmail from './SendInvitationEmail';
import PortfolioDetail from './PortfolioDetail';
import RequestOrganizerPage from "./RequestOrganizerPage";
import AdminRoute from "./admin/AdminRoute";
import AdminWelcome from "./admin/AdminWelcome";
import AdminLayout from "./admin/AdminLayout";
import AdminEvents from "./admin/AdminEvents";
import AdminUsers from "./admin/AdminUsers";
import ADCMPN from "./admin/ADCMPN";
import NewHome from "./NewHome"; // เพิ่ม import
import AdminRequests from "./admin/AdminRequests";
import AdminVenues from "./admin/AdminVenues";
import AdminFloatingButton from "./AdminFloatingButton";
import AdminReports from "./admin/AdminReports"; // <-- เพิ่ม
import AdminAIImages from "./admin/AdminAIImages"; // <-- มีอยู่แล้ว
import AdminManageAdmins from "./admin/AdminManageAdmins"; // <-- เพิ่ม
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Contact from "./pages/Contact";

function AppShell() {
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const showToast = (message, type = "success") => {
    setAlert({ show: true, message, type });
  };

  React.useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  React.useEffect(() => {
    // ปิด/เปิดคลาสโหมดแอดมิน เพื่อตัด margin/padding บนสุดออก
    document.body.classList.toggle("admin-mode", isAdminRoute);
  }, [isAdminRoute]);

  return (
    <div className="App">
      {!isAdminRoute && <Navbar setAlert={setAlert} />}
      {/* spacer: ป้องกันเนื้อหาถูกทับโดย fixed navbar */}
      {!isAdminRoute && <div className="app-navbar-spacer" aria-hidden />}
      <GlassAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login showToast={showToast} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-events" element={<MyEvents />} />
        <Route path="/organizer-portfolios" element={<OrganizerPortfolios />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/add-portfolio" element={<AddPortfolio />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/organizers" element={<OrganizerList />} />
        <Route path="/organizers/:id" element={<OrganizerDetail />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/ai" element={<AiPage />} />
        <Route path="/ai/theme" element={<CreateThemeAi />} />
        <Route path="/ai/invite" element={<CreateInviteCard />} />
        <Route path="/create-invite-card" element={<CreateInviteCard />} />
        <Route path="/my-favorites" element={<MyFavorites />} />
        <Route path="/my-comments" element={<MyComments />} />
        <Route path="/venues" element={<VenueList />} />
        <Route path="/venues/:id" element={<VenueDetail />} />
        <Route path="/send-invitation-email" element={<SendInvitationEmail />} />
        <Route path="/portfolios/:id" element={<PortfolioDetail />} />
        <Route path="/request-organizer" element={<RequestOrganizerPage />} />
        <Route path="/new-home" element={<NewHome />} /> {/* เส้นทางหน้าใหม่ */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminWelcome />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="venues" element={<AdminVenues />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="comments" element={<ADCMPN />} />
          <Route path="requests" element={<AdminRequests />} />
          {/* เพิ่มหน้าใหม่ */}
          <Route path="ai-images" element={<AdminAIImages />} />
          <Route path="admins" element={<AdminManageAdmins />} /> {/* <-- เพิ่ม */}
        </Route>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      {/* --- Floating admin button (แสดงเฉพาะผู้ที่เป็น admin) --- */}
      <AdminFloatingButton />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
