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
} from "firebase/firestore";
import { FaBell, FaCheck, FaTimes } from "react-icons/fa";

function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  // Aktif kullanıcıyı ve isteklerini dinle
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
    const fetchUsers = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllUsers(usersList);
    };
    fetchUsers();
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term === "") {
      setFilteredUsers([]);
    } else {
      const filtered = allUsers.filter((user) =>
        user.username.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
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
    <nav
      style={{
        padding: "10px",
        display: "flex",
        gap: "20px",
        alignItems: "center",
        backgroundColor: "#f2f2f2",
      }}
    >
      <Link to="/">Anasayfa</Link>
      <Link to="/profile">Profil</Link>

      {/* Arama alanı */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Kullanıcı ara..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ padding: "5px" }}
        />
        {filteredUsers.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "30px",
              left: 0,
              backgroundColor: "white",
              border: "1px solid #ccc",
              listStyle: "none",
              padding: "5px",
              margin: 0,
              width: "200px",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 1000,
            }}
          >
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                onClick={() => {
                  navigate(`/profile/${user.id}`);
                  setSearchTerm("");
                  setFilteredUsers([]);
                }}
                style={{ padding: "5px", cursor: "pointer" }}
              >
                {user.username}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bildirimler Alanı */}
      {currentUser && (
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <FaBell size={20} />
            {requests.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  padding: "1px 5px",
                  fontSize: 10,
                }}
              >
                {requests.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                top: 40,
                right: 0,
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 12,
                width: 320,
                zIndex: 1001,
                boxShadow: "0 5px 15px rgba(0,0,0,0.12)",
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '10px 15px',
                borderBottom: '1px solid #eee',
                fontWeight: 'bold',
                fontSize: 16
              }}>
                Arkadaşlık İstekleri
              </div>
              {requests.length > 0 ? (
                requests.map((username) => (
                  <div
                    key={username}
                    style={{
                      padding: "12px 15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #f0f0f0",
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <span style={{ fontSize: 14 }}>
                      <b style={{ fontWeight: 600 }}>{username}</b> size arkadaş olmak istiyor.
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleAcceptRequest(username)}
                        style={{
                          background: '#e0f2f1',
                          color: '#00796b',
                          border: 'none',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Kabul Et"
                      >
                        <FaCheck size={14} />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(username)}
                        style={{
                          background: '#ffebee',
                          color: '#c62828',
                          border: 'none',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Reddet"
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: "center", color: '#888' }}>
                  Yeni istek yok.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <button onClick={handleLogout}>Çıkış Yap</button>
    </nav>
  );
}

export default Navbar;
