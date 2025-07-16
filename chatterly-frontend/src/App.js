import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginRegisterPage from "./LoginRegisterPage";
import HomePage from "./HomePage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import ProfilePage from "./ProfilePage";
import Navbar from "./Navbar";

const LayoutWithNavbar = ({ children }) => {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/forgot-password"];
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
    </>
  );
};

function App() {
  return (
    <Router>
      <LayoutWithNavbar>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginRegisterPage />} />
          <Route path="/register" element={<Navigate to="/login" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </LayoutWithNavbar>
    </Router>
  );
}

export default App;
