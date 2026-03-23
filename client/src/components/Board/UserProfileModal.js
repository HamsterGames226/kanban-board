import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { renderAvatar } from '../../utils/avatar';
import api from '../../utils/api';
import { FiX, FiCalendar, FiMail, FiMessageSquare } from 'react-icons/fi';
import './UserProfileModal.css';

function UserProfileModal({ userId, onClose }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/profile/user/${userId}`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="user-profile-overlay" onClick={onClose}>
        <div className="user-profile-modal" onClick={e => e.stopPropagation()}>
          <div className="loading-spinner" style={{ margin: '40px auto' }} />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const joinDate = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={e => e.stopPropagation()}>
        {/* Banner */}
        <div className="up-banner" style={{ background: profile.avatar || '#5865f2' }} />

        {/* Avatar */}
        <div className="up-avatar-section">
          {renderAvatar(profile, 80, 'up-avatar')}
          <div className={`up-status-dot ${profile.status}`} />
        </div>

        {/* Close */}
        <button className="up-close" onClick={onClose}><FiX /></button>

        {/* Info */}
        <div className="up-body">
          <div className="up-name-section">
            <h2 className="up-display-name">{profile.displayName || profile.username}</h2>
            <span className="up-username">@{profile.username}</span>
          </div>

          {profile.statusText && (
            <div className="up-status-text">
              <FiMessageSquare size={14} />
              <span>{profile.statusText}</span>
            </div>
          )}

          <div className="up-divider" />

          {profile.bio && (
            <div className="up-section">
              <h3>{t('profile.bio')}</h3>
              <p>{profile.bio}</p>
            </div>
          )}

          <div className="up-section">
            <h3>{t('profile.memberSince')}</h3>
            <div className="up-meta-item">
              <FiCalendar size={14} />
              <span>{joinDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;