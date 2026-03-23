import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import api from '../../utils/api';
import { FiX, FiSave } from 'react-icons/fi';

const BG_COLORS = [
  '#2f3136', '#1a1a2e', '#16213e', '#0f3460', '#1b1b2f',
  '#2d132c', '#3a0ca3', '#1b4332', '#2d3436', '#222f3e',
  '#341f97', '#5f27cd', '#10ac84', '#01a3a4', '#c0392b',
];

const BG_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
  'linear-gradient(135deg, #16222a 0%, #3a6073 100%)',
  'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
];
const BG_IMAGES = [
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=800',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
];

function BoardSettingsModal({ board, onClose, onUpdate }) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description || '');
  const [bgType, setBgType] = useState(board.background?.type || 'color');
  const [bgValue, setBgValue] = useState(board.background?.value || '#2f3136');
  const [imageUrl, setImageUrl] = useState(
    board.background?.type === 'image' ? board.background.value : ''
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalValue = bgValue;
      if (bgType === 'image') finalValue = imageUrl;

      await api.put(`/boards/${board._id}`, {
        title,
        description,
        background: { type: bgType, value: finalValue }
      });

      setMessage(t('profile.saved'));
      setTimeout(() => setMessage(''), 2000);
      onUpdate();
    } catch (err) {
      setMessage(err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="board-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2>{t('board.editBoardTitle')}</h2>
          <button className="card-modal-close" onClick={onClose}><FiX /></button>
        </div>

        {message && (
          <div className="settings-message">{message}</div>
        )}

        {/* Title & Description */}
        <div className="settings-section">
          <label className="settings-label">{t('board.boardTitleLabel')}</label>
          <input
            type="text"
            className="settings-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="settings-section">
          <label className="settings-label">{t('board.boardDescLabel')}</label>
          <textarea
            className="settings-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('dashboard.boardDescPlaceholder')}
            rows={3}
          />
        </div>

        {/* Background */}
        <div className="settings-section">
          <label className="settings-label">{t('board.boardBackground')}</label>

          {/* Type tabs */}
          <div className="bg-type-tabs">
            <button
              className={`bg-type-tab ${bgType === 'color' ? 'active' : ''}`}
              onClick={() => setBgType('color')}
            >
              {t('board.bgColor')}
            </button>
            <button
              className={`bg-type-tab ${bgType === 'gradient' ? 'active' : ''}`}
              onClick={() => setBgType('gradient')}
            >
              {t('board.bgGradient')}
            </button>
            <button
              className={`bg-type-tab ${bgType === 'image' ? 'active' : ''}`}
              onClick={() => setBgType('image')}
            >
              {t('board.bgImage')}
            </button>
          </div>

          {/* Colors */}
          {bgType === 'color' && (
            <div className="bg-options-grid">
              {BG_COLORS.map(color => (
                <div
                  key={color}
                  className={`bg-option ${bgValue === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setBgValue(color)}
                />
              ))}
            </div>
          )}

          {/* Gradients */}
          {bgType === 'gradient' && (
            <div className="bg-options-grid">
              {BG_GRADIENTS.map(grad => (
                <div
                  key={grad}
                  className={`bg-option ${bgValue === grad ? 'selected' : ''}`}
                  style={{ background: grad }}
                  onClick={() => setBgValue(grad)}
                />
              ))}
            </div>
          )}

          {/* Image URL */}
          {bgType === 'image' && (
            <div className="bg-image-section">
              <div className="bg-image-gallery">
                {BG_IMAGES.map(url => (
                  <div
                    key={url}
                    className={`bg-image-thumb ${imageUrl === url ? 'selected' : ''}`}
                    style={{ backgroundImage: `url(${url})` }}
                    onClick={() => setImageUrl(url)}
                  />
                ))}
              </div>
              <div style={{ marginTop: 12, position: 'relative' }}>
                <input
                  type="url"
                  className="settings-input"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={t('board.bgImagePlaceholder')}
                />
              </div>
              {imageUrl && (
                <div className="bg-image-preview">
                  <img src={imageUrl} alt="Preview"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="bg-preview-section">
            <label className="settings-label" style={{ fontSize: 11 }}>Preview</label>
            <div
              className="bg-preview-box"
              style={
                bgType === 'image' && imageUrl
                  ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: bgValue }
              }
            >
              <div className="bg-preview-column" />
              <div className="bg-preview-column" />
              <div className="bg-preview-column" />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <FiSave /> {saving ? t('profile.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BoardSettingsModal;