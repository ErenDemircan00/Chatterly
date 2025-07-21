import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

function OtherProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUser(docSnap.data());
      } else {
        console.log("Kullanıcı bulunamadı");
      }
    };

    fetchUser();
  }, [userId]);

  if (!user) return <p>Yükleniyor...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{user.username} Profili</h2>
      {user.profileImage && (
        <img
          src={user.profileImage}
          alt="Profil"
          width={150}
          style={{ borderRadius: "50%", marginBottom: 10 }}
        />
      )}
      <p><strong>Ad Soyad:</strong> {user.fullname}</p>
      <p><strong>Kullanıcı Adı:</strong> {user.username}</p>
      <p><strong>Açıklama:</strong> {user.description || "Açıklama yok."}</p>
    </div>
  );
}

export default OtherProfile;
