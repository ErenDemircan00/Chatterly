// src/ProfileDrawer.js
import React from 'react';
import '../styles/ProfileDrawer.css';
import { FaTimes } from 'react-icons/fa';
import ProfileForm from '../pages/ProfileForm';

const ProfileDrawer = ({ isOpen, onClose }) => {
  return (
    <div className={`drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-content">
        <div className="drawer-header">
          <FaTimes size={20} onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>
        <ProfileForm />
      </div>
    </div>
  );
};

export default ProfileDrawer;
