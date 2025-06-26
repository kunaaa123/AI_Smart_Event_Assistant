import React, { useState } from "react";
import Navbar from "./Navbar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import GlassAlert from "./GlassAlert";
import Profile from "./Profile";

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
      </Routes>
    </Router>
  );
}

export default App;
