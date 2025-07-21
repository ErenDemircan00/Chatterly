import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { FaPen } from 'react-icons/fa';

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
        // Boyutları hesapla
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
        
        // Resmi çiz
        ctx.drawImage(img, 0, 0, width, height);
        
        // Base64 string al
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
      
      // Resmi küçült ve base64'e çevir
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
      // Yeni fotoğraf seçildiyse onu kullan, yoksa eski URL'i koru
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

      // State'leri güncelle
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

  // Preview URL temizleme
  useEffect(() => {
    return () => {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={previewURL || photoURL || 'https://www.w3schools.com/w3images/avatar2.png'}
            alt="Profil"
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #4CAF50'
            }}
            onError={(e) => {
              e.target.src = 'https://www.w3schools.com/w3images/avatar2.png';
            }}
          />
          <label
            htmlFor="photo-upload"
            style={{
              position: 'absolute',
              bottom: 5,
              right: 5,
              backgroundColor: '#fff',
              borderRadius: '50%',
              padding: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 4px rgba(0,0,0,0.3)',
            }}
            title="Profil fotoğrafını değiştir"
          >
            <FaPen size={14} />
          </label>
        </div>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
          disabled={loading}
        />
        
        <div style={{ fontWeight: 'bold', fontSize: 18, marginTop: 10 }}>
          @{username || 'kullanici'}
        </div>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Ad Soyad: <span style={{ color: 'red' }}>*</span></label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
          maxLength={50}
          required
          disabled={loading}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Kullanıcı Adı:</label>
        <input
          type="text"
          value={username}
          style={{ 
            width: '100%', 
            padding: 8, 
            marginTop: 4, 
            backgroundColor: '#f5f5f5' 
          }}
          disabled
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>Açıklama:</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4, minHeight: 60 }}
          maxLength={200}
          placeholder="Kendinizi tanıtın..."
          disabled={loading}
        />
        <small style={{ color: '#666' }}>
          {bio.length}/200 karakter
        </small>
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleSave}
          style={{ 
            padding: 10, 
            backgroundColor: loading ? '#ccc' : '#4CAF50', 
            color: '#fff', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: 5,
            fontSize: 16
          }}
          disabled={loading}
        >
          {loading ? "İşleniyor..." : "Kaydet"}
        </button>
        
        <button
          onClick={handlePasswordReset}
          style={{ 
            padding: 10, 
            backgroundColor: '#f44336', 
            color: '#fff', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: 5,
            fontSize: 16
          }}
          disabled={loading}
        >
          Şifreyi Sıfırla
        </button>
      </div>
    </div>
  );
};

export default ProfileForm;