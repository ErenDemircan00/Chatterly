import React, { useState, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';

const ProfileForm = ({ onClose }) => {
  const [user, setUser] = useState(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoURL, setPhotoURL] = useState('');
  const [previewURL, setPreviewURL] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.displayName || '');
          setUsername(data.username || '');
          setBio(data.bio || '');
          setPhotoURL(data.photoURL || '');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    if (file) {
      setPreviewURL(URL.createObjectURL(file));
    } else {
      setPreviewURL('');
    }
  };

  const handlePhotoUpload = async () => {
    if (photoFile && user) {
      try {
        const storageRef = ref(storage, `profilePhotos/${user.uid}/profile.jpg`);
        await uploadBytes(storageRef, photoFile);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
        throw new Error('Fotoğraf yüklenemedi: ' + error.message);
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!user) {
      alert('Lütfen giriş yapınız.');
      return;
    }

    try {
      const uploadedPhotoURL = await handlePhotoUpload();
      const finalPhotoURL = uploadedPhotoURL || photoURL;

      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName,
          username,
          bio,
          photoURL: finalPhotoURL,
          email: user.email,
        },
        { merge: true }
      );

      setPhotoURL(finalPhotoURL);
      alert('Profil güncellendi!');
      if (onClose) onClose();
    } catch (error) {
      console.error('Profil kaydı hatası:', error);
      alert('Profil güncellenemedi: ' + error.message);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (error) {
      alert('Hata: ' + error.message);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {(previewURL || photoURL) && (
          <img
            src={previewURL || photoURL}
            alt="Profil"
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              objectFit: 'cover',
              marginBottom: 10,
              border: '2px solid #4CAF50',
            }}
          />
        )}
        <div style={{ fontWeight: 'bold', fontSize: 18 }}>@{username || 'kullanici'}</div>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Ad Soyad:</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Kullanıcı Adı:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Açıklama:</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Profil Fotoğrafı:</label><br />
        <input type="file" onChange={handlePhotoChange} style={{ marginTop: 8 }} />
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleSave}
          style={{ padding: 10, backgroundColor: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Kaydet
        </button>
        <button
          onClick={handlePasswordReset}
          style={{ padding: 10, backgroundColor: '#f44336', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Şifreyi Sıfırla
        </button>
      </div>
    </div>
  );
};

export default ProfileForm;
