import React, { useState } from "react";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  setDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const getErrorMessage = (code) => {
  switch (code) {
    case "auth/invalid-email":
      return "Geçersiz e-posta adresi.";
    case "auth/email-already-in-use":
      return "Bu e-posta zaten kullanılıyor.";
    case "auth/weak-password":
      return "Şifre çok zayıf. En az 6 karakter olmalı.";
    case "auth/user-not-found":
      return "Kullanıcı bulunamadı.";
    case "auth/wrong-password":
      return "Yanlış şifre girdiniz.";
    case "auth/missing-password":
      return "Şifre Giriniz!";
    case "auth/invalid-credential":
      return "Geçersiz Şifre!";
    default:
      return "Bir hata oluştu: " + code;
  }
};

function LoginRegisterPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const checkUsernameExists = async (username) => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleRegister = async () => {
    setError(""); // Önce hatayı temizle
    if (!username || !email || !password) {
      setError("Tüm alanları doldurun.");
      return;
    }

    const exists = await checkUsernameExists(username);
    if (exists) {
      setError("Bu kullanıcı adı zaten kullanılıyor.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: email,
      });

      await signOut(auth);
      setIsRegister(false); // Giriş moduna geç
      setEmail("");
      setPassword("");
      setUsername("");
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
  };

  const handleLogin = async () => {
    setError(""); // Önce hatayı temizle
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // Giriş başarılıysa anasayfaya yönlendir
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
  };

  const handleGoogleLogin = async () => {
    setError(""); // Önce hatayı temizle
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          username: user.displayName || "unknown",
          email: user.email,
        });
      }

      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{isRegister ? "Kayıt Ol" : "Giriş Yap"}</h2>

      {isRegister && (
        <input
          placeholder="Kullanıcı Adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      )}
      <input
        placeholder="E-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />
      <input
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
      />

      <button onClick={isRegister ? handleRegister : handleLogin}>
        {isRegister ? "Kayıt Ol" : "Giriş Yap"}
      </button>

      {!isRegister && <button onClick={handleGoogleLogin}>Google ile Giriş</button>}

      <p>
        {isRegister ? (
          <>
            Zaten hesabın var mı?{" "}
            <span style={{ color: "blue", cursor: "pointer" }} onClick={() => setIsRegister(false)}>
              Giriş Yap
            </span>
          </>
        ) : (
          <>
            Hesabın yok mu?{" "}
            <span style={{ color: "blue", cursor: "pointer" }} onClick={() => setIsRegister(true)}>
              Kayıt Ol
            </span>
          </>
        )}
      </p>

      <p style={{ marginTop: "10px" }}>
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => navigate("/forgot-password")}
        >
          Şifremi Unuttum
        </span>
      </p>


      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default LoginRegisterPage;
