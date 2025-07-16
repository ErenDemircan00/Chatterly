// src/Navbar.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { auth } from "./firebase";
import ProfileDrawer from "./ProfileDrawer";

const Navbar = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const user = auth.currentUser;

  return (
    <>
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        padding: "10px 20px",
        background: "#eee"
      }}>
        {user && (
          <FaUserCircle
            size={28}
            style={{ cursor: "pointer" }}
            onClick={() => setDrawerOpen(true)}
            title="Profil"
          />
        )}
      </div>
      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

export default Navbar;
