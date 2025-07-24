import React, { useState } from "react";
import { auth } from "../firebase/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import "../styles/ForgotPasswordPage.css";

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
    <div className="forgot-password-page">
      <div className="background-animations" />
      <div className="container forgot-password-box">
        <h2 className="title">Şifre Sıfırlama</h2>
        <input
          type="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />
        <button onClick={handleReset} className="form-button">
          Şifre Sıfırlama Linki Gönder
        </button>
        <button onClick={() => navigate("/login")} className="form-button google">
          Giriş ekranına dön
        </button>
        {message && <p className="message success">{message}</p>}
        {error && <p className="message error">{error}</p>}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
