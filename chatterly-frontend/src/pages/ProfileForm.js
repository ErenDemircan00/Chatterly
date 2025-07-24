import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import {
  doc, setDoc, query, collection, where, getDocs, deleteDoc, updateDoc, arrayRemove
} from 'firebase/firestore';
import {
  sendPasswordResetEmail, onAuthStateChanged, deleteUser, signOut
} from 'firebase/auth';
import { FaPen } from 'react-icons/fa';
import '../styles/ProfileForm.css';  

const ProfileForm = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoURL, setPhotoURL] = useState('');
  const [previewURL, setPreviewURL] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser.uid);
      } else {
        resetForm();
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setDisplayName(data.displayName || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setPhotoURL(data.photoURL || '');
        resetFileInputs();
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    }
  };

  const resetForm = () => {
    setUser(null);
    setDisplayName('');
    setUsername('');
    setBio('');
    setPhotoURL('');
    resetFileInputs();
  };

  const resetFileInputs = () => {
    setPreviewURL('');
    setPhotoFile(null);
  };

  // Resmi küçült ve Base64'e çevir
  const resizeAndConvertToBase64 = (file, maxWidth = 300, maxHeight = 300, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const base64String = canvas.toDataURL('image/jpeg', quality);
        resolve(base64String);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin.');
      return;
    }

    try {
      setLoading(true);
      const base64Image = await resizeAndConvertToBase64(file, 300, 300, 0.7);
      setPhotoFile(base64Image);
      setPreviewURL(base64Image);
    } catch (error) {
      alert('Resim işlenirken hata oluştu.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      alert('Lütfen giriş yapınız.');
      return;
    }

    if (!displayName.trim()) {
      alert('Ad Soyad alanı boş bırakılamaz.');
      return;
    }

    if (!username.trim()) {
      alert('Kullanıcı adı alanı boş bırakılamaz.');
      return;
    }

    setLoading(true);
    try {
      const finalPhotoURL = photoFile || photoURL;

      await setDoc(
        doc(db, 'users', username),
        {
          displayName: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          photoURL: finalPhotoURL,
          email: user.email,
          uid: user.uid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setPhotoURL(finalPhotoURL);
      resetFileInputs();

      alert('Profil başarıyla güncellendi!');
      if (onClose) onClose();

    } catch (error) {
      console.error('Profil kaydı hatası:', error);
      alert('Profil güncellenemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      alert('E-posta adresi bulunamadı.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      alert('Hata: ' + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm('Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      let usernameToDelete = '';
      if (!querySnapshot.empty) {
        usernameToDelete = querySnapshot.docs[0].data().username;
        await deleteDoc(doc(db, 'users', usernameToDelete));
      }

      const allUsersSnap = await getDocs(usersRef);
      for (const docu of allUsersSnap.docs) {
        const data = docu.data();
        if (data.friends && Array.isArray(data.friends) && data.friends.includes(usernameToDelete)) {
          await updateDoc(doc(db, 'users', data.username), {
            friends: arrayRemove(usernameToDelete)
          });
        }
      }

      await deleteUser(user);
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      alert('Hesap silinirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  return (
    <div className="profile-form">
      <div className="profile-photo-wrapper">
        <img
          src={previewURL || photoURL || 'https://www.w3schools.com/w3images/avatar2.png'}
          alt="Profil"
          className="profile-photo"
          onError={(e) => {
            e.target.src = 'https://www.w3schools.com/w3images/avatar2.png';
          }}
        />
        <label
          htmlFor="photo-upload"
          className={`photo-upload-label ${loading ? 'disabled' : ''}`}
          title="Profil fotoğrafını değiştir"
        >
          <FaPen size={16} />
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={loading}
          className="photo-upload-input"
        />
      </div>

      <div className="username-display">@{username || 'kullanici'}</div>

      <label>Ad Soyad <span className="required">*</span></label>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        maxLength={50}
        disabled={loading}
        className="form-input"
      />

      <label>Kullanıcı Adı</label>
      <input
        type="text"
        value={username}
        disabled
        className="form-input disabled-input"
      />

      <label>Açıklama</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={200}
        placeholder="Kendinizi tanıtın..."
        disabled={loading}
        className="form-input"
      />
      <small className="bio-counter">{bio.length}/200 karakter</small>

      <button
        className="btn save-btn"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "İşleniyor..." : "Kaydet"}
      </button>

      <button
        className="btn reset-btn"
        onClick={handlePasswordReset}
        disabled={loading}
      >
        Şifreyi Sıfırla
      </button>

      <button
        className="btn delete-btn"
        onClick={handleDeleteAccount}
        disabled={loading}
      >
        Hesabı Sil
      </button>
    </div>
  );
};

export default ProfileForm;
