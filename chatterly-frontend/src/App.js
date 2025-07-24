import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import HomePage from "./pages/HomePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import OtherProfile from "./pages/OtherProfile";
import Navbar from "./components/Navbar";
import ChatPage from "./pages/ChatPage";

const LayoutWithNavbar = ({ children, onMessageButtonClick }) => {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/forgot-password"];
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar onMessageButtonClick={onMessageButtonClick} />}
      {children}
    </>
  );
};

function App() {
  const [showWelcomeBox, setShowWelcomeBox] = useState(true);

  return (
    <Router>
      <LayoutWithNavbar onMessageButtonClick={() => setShowWelcomeBox(false)}>
        <Routes>
          <Route path="/" element={<HomePage showWelcomeBox={showWelcomeBox} />} />
          <Route path="/login" element={<LoginRegisterPage />} />
          <Route path="/register" element={<Navigate to="/login" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<OtherProfile />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </LayoutWithNavbar>
    </Router>
  );
}

export default App;
