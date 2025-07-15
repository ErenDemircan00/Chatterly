import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setUsername(docSnap.data().username);
        }
      } else {
        navigate("/login");
      }
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Hoşgeldin, {username}</h2>
      <button onClick={() => signOut(auth).then(() => navigate("/login"))}>Çıkış Yap</button>
    </div>
  );
}

export default HomePage;
