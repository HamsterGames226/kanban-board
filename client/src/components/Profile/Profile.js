import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { getAvatarUrl, getInitial, getAvatarColor } from '../../utils/avatar';
import api from '../../utils/api';
import { FiCamera, FiTrash2, FiSave, FiLock, FiMail, FiEdit2 } from 'react-icons/fi';
import './Profile.css';

function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { t, locale, setLocale, getAvailableLocales } = useTranslation();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [statusText, setStatusText] = useState(user?.statusText || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar || '#5865f2');

  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);

  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const [message, setMessage] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  const availableLocales = getAvailableLocales();
  const colors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f0b232', '#00a8fc', '#9b59b6', '#2ecc71'];

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put('/profile', { displayName, bio, statusText, avatar: avatarColor });
      updateUser(res.data);
      showMsg(t('profile.saved'));
    } catch (err) {
      showMsg(err.response?.data?.message || t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(res.data);
      showMsg(t('profile.avatarUploaded'));
    } catch (err) {
      showMsg(err.response?.data?.message || t('profile.uploadError'), 'error');
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await api.delete('/profile/avatar');
      updateUser(res.data);
      showMsg(t('profile.avatarRemoved'));
    } catch (err) {
      showMsg(t('common.error'), 'error');
    }
  };

  const handleChangeUsername = async () => {
    try {
      const res = await api.put('/profile/username', { username: newUsername });
      updateUser(res.data);
      setShowUsernameEdit(false);
      showMsg(t('profile.usernameChanged'));
    } catch (err) {
      showMsg(err.response?.data?.message || t('common.error'), 'error');
    }
  };

  const handleChangeEmail = async () => {
    try {
      const res = await api.put('/profile/email', { email: newEmail, password: emailPassword });
      updateUser(res.data);
      setShowEmailEdit(false);
      setNewEmail('');
      setEmailPassword('');
      showMsg(t('profile.emailChanged'));
    } catch (err) {
      showMsg(err.response?.data?.message || t('common.error'), 'error');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      showMsg(t('auth.passwordsNotMatch'), 'error');
      return;
    }
    try {
      await api.put('/profile/password', { currentPassword, newPassword });
      setShowPasswordEdit(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showMsg(t('profile.passwordChanged'));
    } catch (err) {
      showMsg(err.response?.data?.message || t('common.error'), 'error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile', { data: { password: deletePassword } });
      logout();
    } catch (err) {
      showMsg(err.response?.data?.message || t('common.error'), 'error');
    }
  };

  const avatarUrl = getAvatarUrl(user);

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="profile-title">{t('profile.title')}</h1>

        {message.text && (
          <div className={`profile-message ${message.type}`}>{message.text}</div>
        )}

        {/* ===== АВАТАР ===== */}
        <div className="profile-section">
          <h2>{t('profile.avatar')}</h2>
          <div className="avatar-section">
            <div className="avatar-preview">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="avatar-large" />
              ) : (
                <div className="avatar-large" style={{ background: avatarColor }}>
                  {getInitial(user)}
                </div>
              )}
              <button className="avatar-upload-btn" onClick={() => fileInputRef.current?.click()}>
                <FiCamera />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            <div className="avatar-actions">
              <button className="btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                {t('profile.uploadPhoto')}
              </button>
              {user?.customAvatar && (
                <button className="btn-danger btn-sm" onClick={handleRemoveAvatar}>
                  <FiTrash2 /> {t('profile.removePhoto')}
                </button>
              )}
            </div>
          </div>

          <div className="avatar-color-section">
            <label>{t('profile.avatarColor')}</label>
            <div className="color-picker">
              {colors.map(c => (
                <div
                  key={c}
                  className={`color-option-lg ${avatarColor === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setAvatarColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ===== ПРОФИЛЬ ===== */}
        <div className="profile-section">
          <h2>{t('profile.profileSection')}</h2>

          <div className="form-group">
            <label>{t('profile.displayName')}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('profile.displayNamePlaceholder')}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>{t('profile.bio')}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              maxLength={200}
              rows={3}
              className="profile-textarea"
            />
            <span className="char-count">{bio.length}/200</span>
          </div>

          <div className="form-group">
            <label>{t('profile.statusText')}</label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder={t('profile.statusPlaceholder')}
              maxLength={100}
            />
          </div>

          <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
            <FiSave /> {saving ? t('profile.saving') : t('profile.saveProfile')}
          </button>
        </div>

        {/* ===== ЯЗЫК ===== */}
        <div className="profile-section">
          <h2>{t('profile.language')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
            {t('profile.languageDesc')}
          </p>
          <div className="language-grid">
            {availableLocales.map(l => (
              <button
                key={l.code}
                className={`language-option ${locale === l.code ? 'active' : ''}`}
                onClick={() => setLocale(l.code)}
              >
                <span className="language-flag">{l.flag}</span>
                <span className="language-name">{l.name}</span>
                {locale === l.code && <span className="language-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ===== АККАУНТ ===== */}
        <div className="profile-section">
          <h2>{t('profile.account')}</h2>

          {/* Username */}
          <div className="account-field">
            <div className="account-field-info">
              <label>{t('auth.username')}</label>
              <span>{user?.username}</span>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => setShowUsernameEdit(!showUsernameEdit)}>
              <FiEdit2 /> {t('common.edit')}
            </button>
          </div>
          {showUsernameEdit && (
            <div className="edit-section">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={t('profile.newUsername')}
                minLength={3}
              />
              <div className="edit-actions">
                <button className="btn-primary btn-sm" onClick={handleChangeUsername}>
                  {t('common.save')}
                </button>
                <button className="btn-ghost btn-sm" onClick={() => setShowUsernameEdit(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="account-field">
            <div className="account-field-info">
              <label>{t('auth.email')}</label>
              <span>{user?.email}</span>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => setShowEmailEdit(!showEmailEdit)}>
              <FiMail /> {t('common.edit')}
            </button>
          </div>
          {showEmailEdit && (
            <div className="edit-section">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('profile.newEmail')}
              />
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder={t('profile.currentPassword')}
              />
              <div className="edit-actions">
                <button className="btn-primary btn-sm" onClick={handleChangeEmail}>
                  {t('common.save')}
                </button>
                <button className="btn-ghost btn-sm" onClick={() => setShowEmailEdit(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          <div className="account-field">
            <div className="account-field-info">
              <label>{t('auth.password')}</label>
              <span>••••••••</span>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => setShowPasswordEdit(!showPasswordEdit)}>
              <FiLock /> {t('common.edit')}
            </button>
          </div>
          {showPasswordEdit && (
            <div className="edit-section">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('profile.currentPassword')}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile.newPassword')}
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder={t('profile.confirmNewPassword')}
              />
              <div className="edit-actions">
                <button className="btn-primary btn-sm" onClick={handleChangePassword}>
                  {t('common.save')}
                </button>
                <button className="btn-ghost btn-sm" onClick={() => setShowPasswordEdit(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== ОПАСНАЯ ЗОНА ===== */}
        <div className="profile-section danger-zone">
          <h2>{t('profile.dangerZone')}</h2>
          <p>{t('profile.dangerDesc')}</p>
          <button className="btn-danger" onClick={() => setShowDeleteAccount(!showDeleteAccount)}>
            <FiTrash2 /> {t('profile.deleteAccount')}
          </button>
          {showDeleteAccount && (
            <div className="edit-section">
              <p style={{ color: 'var(--red-400)', fontSize: 13 }}>
                {t('profile.deleteConfirmText')}
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t('profile.currentPassword')}
              />
              <div className="edit-actions">
                <button className="btn-danger btn-sm" onClick={handleDeleteAccount}>
                  {t('profile.deleteForever')}
                </button>
                <button className="btn-ghost btn-sm" onClick={() => setShowDeleteAccount(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;