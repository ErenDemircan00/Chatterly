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
  const [requestStatus, setRequestStatus] = useState(''); // '', 'sent', 'pending', 'friends'

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

  // Karşılıklı arkadaşlık ve istek durumu kontrolü
  useEffect(() => {
    if (currentUser && user) {
      const aktiften = currentUser.friends && currentUser.friends.includes(userId);
      const profilden = user.friends && user.friends.includes(currentUser.username);
      if (aktiften && profilden) {
        setIsFriend(true);
        setRequestStatus('friends');
      } else if (user.friendRequests && user.friendRequests.includes(currentUser.username)) {
        setRequestStatus('sent'); // İstek gönderildi
      } else if (currentUser.friendRequests && currentUser.friendRequests.includes(userId)) {
        setRequestStatus('pending'); // Sana istek geldi
      } else {
        setIsFriend(false);
        setRequestStatus('');
      }
    }
  }, [currentUser, user, userId]);

  // Arkadaşlık isteği gönder
  const handleSendRequest = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        friendRequests: arrayUnion(currentUser.username)
      });
      setRequestStatus('sent');
    } catch (err) {
      alert("İstek gönderilirken hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // İstek kabul et
  const handleAcceptRequest = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Kendi friends dizine userId'yi ekle, friendRequests'ten çıkar
      await updateDoc(doc(db, "users", currentUser.username), {
        friends: arrayUnion(userId),
        friendRequests: arrayRemove(userId)
      });
      // 2. Karşı tarafın friends dizisine kendini ekle
      await updateDoc(doc(db, "users", userId), {
        friends: arrayUnion(currentUser.username)
      });
      setIsFriend(true);
      setRequestStatus('friends');
    } catch (err) {
      alert("İstek kabul edilirken hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // İstek reddet
  const handleRejectRequest = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", currentUser.username), {
        friendRequests: arrayRemove(userId)
      });
      setRequestStatus('');
    } catch (err) {
      alert("İstek reddedilirken hata oluştu: " + err.message);
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
    <div className="other-profile-page green-bg-animated">
      {/* Hareketli soft yeşil arka plan baloncukları */}
      <div className="profile-bubbles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`profile-bubble bubble${i + 1}`} />
        ))}
      </div>
      <div className="other-profile-box soft-glass">
        <div className="profile-photo-wrapper" style={{ marginBottom: 20 }}>
          <img
            src={profileImage}
            alt="Profil"
            className="profile-photo"
            width={120}
            height={120}
          />
        </div>
        <div className="username-display" style={{ fontWeight: 700, fontSize: 22, marginBottom: 4, color: '#1b5e20' }}>@{username}</div>
        <div style={{ color: "#388e3c", fontSize: 15, marginBottom: 12 }}>{fullname}</div>
        <div style={{ marginBottom: 18, background: "rgba(232, 245, 233, 0.7)", borderRadius: 8, padding: 12 }}>
          <strong style={{ color: "#388e3c" }}>Açıklama:</strong>
          <div style={{ color: "#222", marginTop: 4, fontSize: 15 }}>{description}</div>
        </div>
        <div style={{ marginTop: 18 }}>
          {requestStatus === 'friends' && (
            <button disabled className="btn friend-btn">Arkadaş</button>
          )}
          {requestStatus === 'sent' && (
            <button disabled className="btn sent-btn">İstek Gönderildi</button>
          )}
          {requestStatus === 'pending' && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <button onClick={handleAcceptRequest} disabled={loading} className="btn accept-btn">Kabul Et</button>
              <button onClick={handleRejectRequest} disabled={loading} className="btn reject-btn">Reddet</button>
            </div>
          )}
          {requestStatus === '' && !isFriend && (
            <button onClick={handleSendRequest} disabled={loading} className="btn send-btn">Arkadaşlık İsteği Gönder</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OtherProfile;
