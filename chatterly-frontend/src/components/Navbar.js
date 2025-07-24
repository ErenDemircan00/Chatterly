import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { FaBell, FaCheck, FaTimes } from "react-icons/fa";

function Navbar({ onMessageButtonClick }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", firebaseUser.uid));
        const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const userDoc = {
              id: querySnapshot.docs[0].id,
              ...querySnapshot.docs[0].data(),
            };
            setCurrentUser(userDoc);
          }
        });
        return () => unsubscribeSnapshot();
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
        setFriends([]);
        return;
      }

      const friendProfiles = await Promise.all(
        currentUser.friends.map(async (friendUsername) => {
          const docRef = doc(db, "users", friendUsername);
          const docSnap = await getDoc(docRef);
          return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        })
      );
      setFriends(friendProfiles.filter(Boolean));
    };
    fetchFriends();
  }, [currentUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Kullanıcılar:', usersList); // DEBUG
        setAllUsers(usersList);
        if (usersList.length === 0) {
          alert('Firestore\'da hiç kullanıcı bulunamadı!');
        }
      } catch (err) {
        console.error('Firestore kullanıcı çekme hatası:', err);
        alert('Kullanıcılar yüklenemedi: ' + err.message);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log('filteredUsers:', filteredUsers, 'searchTerm:', searchTerm);
  }, [filteredUsers, searchTerm]);

  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term === "") setFilteredUsers([]);
    else {
      setFilteredUsers(
        allUsers.filter((user) =>
          user.username && user.username.toLowerCase().includes(term)
        )
      );
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleAcceptRequest = async (requesterUsername) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.username), {
        friends: arrayUnion(requesterUsername),
        friendRequests: arrayRemove(requesterUsername),
      });
      await updateDoc(doc(db, "users", requesterUsername), {
        friends: arrayUnion(currentUser.username),
      });
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  const handleRejectRequest = async (requesterUsername) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.username), {
        friendRequests: arrayRemove(requesterUsername),
      });
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  const requests = currentUser?.friendRequests || [];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-bg-animation" />

        <Link to="/" className="nav-link">Anasayfa</Link>
        <Link to="/profile" className="nav-link">Profil</Link>

        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Kullanıcı ara..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {/* DEBUG: Arama sonucu ve terimi ekrana yaz */}
          <div style={{ color: 'yellow', fontSize: 12 }}>
            Sonuç: {filteredUsers.length} | Arama: {searchTerm}
          </div>
          {filteredUsers.length > 0 && (
            <ul className="search-results">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  className="search-item"
                  onClick={() => {
                    navigate(`/profile/${user.id}`);
                    setSearchTerm("");
                    setFilteredUsers([]);
                  }}
                >
                  {user.username}
                </li>
              ))}
            </ul>
          )}
        </div>

        {currentUser && (
          <button className="green-button" onClick={() => {
            setShowFriendsModal(true);
            if (onMessageButtonClick) onMessageButtonClick();
          }}>
            Mesaj Gönder
          </button>
        )}

        {showFriendsModal && (
          <div className="modal-overlay" onClick={() => setShowFriendsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Arkadaşlarına Mesaj Gönder</h3>
              {friends.length === 0 ? (
                <p className="text-muted">Hiç arkadaşın yok.</p>
              ) : (
                <ul className="friend-list">
                  {friends.map((friend) => (
                    <li key={friend.id} onClick={() => { navigate(`/chat?user=${friend.username}`); setShowFriendsModal(false); }}>
                      @{friend.username} <span>{friend.displayName}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button className="gray-button" onClick={() => setShowFriendsModal(false)}>
                Kapat
              </button>
            </div>
          </div>
        )}

        {currentUser && (
          <div className="notifications">
            <button className="icon-button" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <FaBell />
              {requests.length > 0 && <span className="badge">{requests.length}</span>}
            </button>
            {notificationsOpen && (
              <div className="notification-box" style={{ zIndex: 9999, position: 'fixed', top: 60, right: 40 }}>
                <div className="notification-header">Arkadaşlık İstekleri</div>
                {requests.length > 0 ? (
                  requests.map((username) => (
                    <div key={username} className="notification-item">
                      <span><b>{username}</b> size arkadaş olmak istiyor.</span>
                      <div className="notification-buttons">
                        <button className="accept-button" onClick={() => handleAcceptRequest(username)}><FaCheck /></button>
                        <button className="reject-button" onClick={() => handleRejectRequest(username)}><FaTimes /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted">Yeni istek yok.</div>
                )}
              </div>
            )}
          </div>
        )}

        <button className="logout-button" onClick={handleLogout}>Çıkış Yap</button>
      </nav>

      {/* Stil bloğu */}
      <style>{`
        .navbar {
          position: relative;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 15px 30px;
          background-color: #101f10;
          color: white;
          overflow: hidden;
          z-index: 1;
        }

        .navbar-bg-animation {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, rgba(0, 255, 136, 0.3), transparent 60%);
          animation: floatLight 10s infinite linear;
          z-index: 0;
        }

        @keyframes floatLight {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20%, 10%) rotate(180deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }

        .nav-link {
          position: relative;
          z-index: 1;
          color: #00e676;
          font-weight: bold;
          text-decoration: none;
        }

        .search-wrapper { position: relative; z-index: 1; }
        .search-input {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #00e676;
          outline: none;
        }

        .search-results {
          position: fixed;
          top: 60px;
          left: 40px;
          width: 220px;
          max-height: 200px;
          background: #fff;
          color: black;
          overflow-y: auto;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.18);
          z-index: 9999;
        }

        .search-item {
          padding: 6px 10px;
          cursor: pointer;
        }
        .search-item:hover {
          background-color: #eee;
        }

        .green-button {
          background: #00e676;
          color: #000;
          padding: 6px 18px;
          border-radius: 6px;
          font-weight: bold;
          border: none;
          cursor: pointer;
        }

        .gray-button {
          background: #ddd;
          color: #000;
          padding: 6px 18px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: bold;
        }

        .icon-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          position: relative;
        }

        .badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: red;
          color: white;
          font-size: 10px;
          border-radius: 50%;
          padding: 2px 6px;
        }

        .notification-box {
          position: absolute;
          top: 40px;
          right: 0;
          background: white;
          color: black;
          width: 300px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          z-index: 200;
        }

        .notification-header {
          padding: 12px 16px;
          background: #00e676;
          color: black;
          font-weight: bold;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 16px;
          align-items: center;
          border-bottom: 1px solid #eee;
        }

        .notification-buttons button {
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
        }

        .accept-button {
          background: #c8facc;
          color: green;
        }

        .reject-button {
          background: #ffd4d4;
          color: darkred;
        }

        .logout-button {
          margin-left: auto;
          background: transparent;
          border: 1px solid #00e676;
          color: #00e676;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 300;
        }

        .modal-content {
          background: rgba(13, 156, 25, 0.4);
          padding: 24px;
          border-radius: 12px;
          min-width: 300px;
          max-width: 400px;
          text-align: center;
        }

        .friend-list li {
          padding: 10px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }

        .friend-list li:hover {
          background: #727272ff;
        }

        .text-muted {
          color: #999;
          font-size: 14px;
          padding: 12px;
        }
      `}</style>
    </>
  );
}

export default Navbar;
