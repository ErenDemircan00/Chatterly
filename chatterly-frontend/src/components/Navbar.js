import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({
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
                  navigate(`/profile/${user.id}`); // Profili açar
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

      {/* Çıkış Yap Butonu */}
      <button onClick={handleLogout} style={{ marginLeft: "auto" }}>
        Çıkış Yap
      </button>
    </nav>
  );
}

export default Navbar;
