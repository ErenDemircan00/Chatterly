// src/ForgotPasswordPage.js
import React, { useState } from "react";
import { auth } from "./firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    setMessage("");
    setError("");

    if (!email) {
      setError("Lütfen e-posta adresinizi girin.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("Bu e-posta adresine ait bir kullanıcı bulunamadı.");
      } else if (err.code === "auth/invalid-email") {
        setError("Geçersiz e-posta adresi.");
      } else {
        setError("Bir hata oluştu: " + err.message);
      }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Şifremi Unuttum</h2>
      <input
        type="email"
        placeholder="E-posta adresiniz"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleReset}>Şifre Sıfırlama Maili Gönder</button>
      <br />
      <button onClick={() => navigate("/login")}>Girişe Dön</button>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default ForgotPasswordPage;
