import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import "../styles/HomePage.css";

function HomePage({ showWelcomeBox = true }) {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setUsername(docSnap.data().username || "");
        }
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="homepage">
      <div className="background-lights" />
      <div className="bubbles-container">
        {/* Baloncukları JS ile oluşturacağız CSS ile animasyon */}
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`bubble bubble${i + 1}`} />
        ))}
      </div>
      {showWelcomeBox && (
        <div className="welcome-box">
          <h1>Hoşgeldin{username && `, ${username}`} 👋</h1>
          <p>Bugün harika bir gün! Hadi biraz GEVEZELİK edelim :) .</p>
        </div>
      )}
    </div>
  );
}

export default HomePage;
