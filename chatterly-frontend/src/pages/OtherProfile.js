import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";

const placeholderImg = "https://ui-avatars.com/api/?name=Profil&background=ddd&color=555&size=150";

function OtherProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(false);

  // Silinen kullanıcıları friends listesinden otomatik temizle
  useEffect(() => {
    const cleanUpFriends = async (userDoc) => {
      if (!userDoc || !userDoc.friends || !Array.isArray(userDoc.friends)) return;
      const validFriends = [];
      for (const friendId of userDoc.friends) {
        const friendRef = doc(db, "users", friendId);
        const friendSnap = await getDoc(friendRef);
        if (friendSnap.exists()) {
          validFriends.push(friendId);
        } else {
          // Silinmiş kullanıcıyı listeden çıkar
          await updateDoc(doc(db, "users", userDoc.username), {
            friends: arrayRemove(friendId)
          });
        }
      }
      // Eğer bir değişiklik olduysa, state'i güncelle
      if (validFriends.length !== userDoc.friends.length) {
        setCurrentUser({ ...userDoc, friends: validFriends });
      }
    };

    // Aktif kullanıcıyı al
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Doğru kullanıcıyı bulmak için uid ile sorgula
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", firebaseUser.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          setCurrentUser(userDoc);
          cleanUpFriends(userDoc);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Profil sahibini çek
  useEffect(() => {
    const fetchUser = async () => {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUser({ id: docSnap.id, ...docSnap.data() });
      } else {
        setUser(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Karşılıklı arkadaşlık kontrolü
  useEffect(() => {
    if (currentUser && user) {
      const aktiften = currentUser.friends && currentUser.friends.includes(userId);
      const profilden = user.friends && user.friends.includes(currentUser.username);
      setIsFriend(aktiften || profilden);
    }
  }, [currentUser, user, userId]);

  const handleAddFriend = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", currentUser.username);
      await updateDoc(userRef, {
        friends: arrayUnion(userId)
      });
      setIsFriend(true);
    } catch (err) {
      alert("Arkadaş eklenirken hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user === null) return <p>Yükleniyor...</p>;
  if (user === false) return <p>Kullanıcı bulunamadı.</p>;

  const username = user.username || "Kullanıcı";
  const fullname = user.displayName || "Ad Soyad yok";
  const description = user.bio || "Açıklama yok.";
  const profileImage = (user.photoURL && user.photoURL.trim() !== "") ? user.photoURL : placeholderImg;

  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f6fa"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: 36,
        minWidth: 320,
        maxWidth: 380,
        width: "100%",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: 20 }}>
          <img
            src={profileImage}
            alt="Profil"
            width={140}
            height={140}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              border: "4px solid #f5f6fa"
            }}
          />
        </div>
        <h2 style={{ margin: "10px 0 4px 0", fontWeight: 700, fontSize: 26 }}>{username} </h2>
        <div style={{ color: "#888", fontSize: 15, marginBottom: 18 }}>{fullname}</div>
        <div style={{ marginBottom: 16 }}>
          <strong>Açıklama:</strong>
          <div style={{ color: "#444", marginTop: 4 }}>{description}</div>
        </div>
        {currentUser && currentUser.username !== userId && (
          <button
            onClick={handleAddFriend}
            disabled={isFriend || loading}
            style={{
              background: isFriend ? "#aaa" : "#4CAF50",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 16,
              cursor: isFriend ? "not-allowed" : "pointer",
              marginTop: 12
            }}
          >
            {isFriend ? "Arkadaş" : loading ? "Ekleniyor..." : "Arkadaş Ekle"}
          </button>
        )}
      </div>
    </div>
  );
}

export default OtherProfile;
