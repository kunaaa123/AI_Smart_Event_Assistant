import React, { useState } from "react";
import Navbar from "./Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import "./App.css"; // Assuming you have some global styles

function App() {
  const [alert, setAlert] = useState({ message: "", type: "success", show: false });

  const showToast = (message, type = "success") => {
    setAlert({ message, type, show: true });
    setTimeout(() => setAlert((a) => ({ ...a, show: false })), 2500);
  };

  return (
    <Router>
      <Navbar />
      <GlassAlert
        message={alert.message}
        type={alert.type}
        show={alert.show}
        onClose={() => setAlert((a) => ({ ...a, show: false }))}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login showToast={showToast} />} />
        <Route path="/register" element={<Register showToast={showToast} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-events" element={<MyEvents />} />
        <Route path="/organizer-portfolios" element={<OrganizerPortfolios />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/add-portfolio" element={<AddPortfolio />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/ai" element={<AiPage />} />
      </Routes>
    </Router>
  );
}

export default App;
