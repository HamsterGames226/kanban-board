import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import api from '../../utils/api';
import { FiX, FiSave, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

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
  'linear-gradient(135deg, #16222a 0%, #3a6073 100%)',
  'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
];

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
];

const LABEL_COLORS = [
  '#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245',
  '#f0b232', '#00a8fc', '#9b59b6', '#2ecc71', '#e74c3c',
  '#1abc9c', '#3498db',
];

function BoardSettingsModal({ board, onClose, onUpdate }) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description || '');
  const [bgType, setBgType] = useState(board.background?.type || 'color');
  const [bgValue, setBgValue] = useState(board.background?.value || '#2f3136');
  const [imageUrl, setImageUrl] = useState(board.background?.type === 'image' ? board.background.value : '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Теги
  const [savedLabels, setSavedLabels] = useState(board.savedLabels || []);
  const [newLabelText, setNewLabelText] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#5865f2');
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // ID редактируемого тега
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'background' | 'labels'

  const showMsg = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

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

      showMsg(t('common.success'));
      onUpdate();
    } catch (err) {
      showMsg(err.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const addLabel = async () => {
    if (!newLabelText.trim()) return;
    try {
      let res;
      if (activeSection) {
        // Edit existing
        res = await api.put(`/boards/${board._id}/labels/${activeSection}`, {
          text: newLabelText,
          color: newLabelColor
        });
      } else {
        // Create new
        res = await api.post(`/boards/${board._id}/labels`, {
          text: newLabelText,
          color: newLabelColor
        });
      }
      setSavedLabels(res.data.savedLabels);
      setNewLabelText('');
      setShowAddLabel(false);
      setActiveSection(null);
      onUpdate();
    } catch (err) {
      showMsg(err.response?.data?.message || t('common.error'));
    }
  };

  const removeLabel = async (labelId) => {
    if (!window.confirm(t('common.delete') + '?')) return;
    try {
      const res = await api.delete(`/boards/${board._id}/labels/${labelId}`);
      setSavedLabels(res.data.savedLabels);
      onUpdate();
    } catch (err) {
      showMsg(err.response?.data?.message || t('common.error'));
    }
  };

  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="board-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('board.editBoardTitle')}</h2>
          <button className="card-modal-close" onClick={onClose}><FiX /></button>
        </div>

        {message && <div className="settings-message">{message}</div>}

        {/* Вкладки */}
        <div className="settings-tabs">
          <button className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}>
            {t('boardSettings.general')}
          </button>
          <button className={`settings-tab ${activeTab === 'background' ? 'active' : ''}`}
            onClick={() => setActiveTab('background')}>
            {t('boardSettings.background')}
          </button>
          <button className={`settings-tab ${activeTab === 'labels' ? 'active' : ''}`}
            onClick={() => setActiveTab('labels')}>
            {t('boardSettings.labels')}
            <span className="settings-tab-badge">{savedLabels.length}</span>
          </button>
        </div>

        <div className="settings-body">
          {/* ===== GENERAL ===== */}
          {activeTab === 'general' && (
            <>
              <div className="settings-section">
                <label className="settings-label">{t('board.boardTitleLabel')}</label>
                <input type="text" className="settings-input" value={title}
                  onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="settings-section">
                <label className="settings-label">{t('board.boardDescLabel')}</label>
                <textarea className="settings-textarea" value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('dashboard.boardDescPlaceholder')} rows={3} />
              </div>
            </>
          )}

          {/* ===== BACKGROUND ===== */}
          {activeTab === 'background' && (
            <div className="settings-section">
              <div className="bg-type-tabs">
                <button className={`bg-type-tab ${bgType === 'color' ? 'active' : ''}`}
                  onClick={() => setBgType('color')}>{t('board.bgColor')}</button>
                <button className={`bg-type-tab ${bgType === 'gradient' ? 'active' : ''}`}
                  onClick={() => setBgType('gradient')}>{t('board.bgGradient')}</button>
                <button className={`bg-type-tab ${bgType === 'image' ? 'active' : ''}`}
                  onClick={() => setBgType('image')}>{t('board.bgImage')}</button>
              </div>

              {bgType === 'color' && (
                <div className="bg-options-grid">
                  {BG_COLORS.map(c => (
                    <div key={c} className={`bg-option ${bgValue === c ? 'selected' : ''}`}
                      style={{ background: c }} onClick={() => setBgValue(c)} />
                  ))}
                </div>
              )}

              {bgType === 'gradient' && (
                <div className="bg-options-grid">
                  {BG_GRADIENTS.map(g => (
                    <div key={g} className={`bg-option ${bgValue === g ? 'selected' : ''}`}
                      style={{ background: g }} onClick={() => setBgValue(g)} />
                  ))}
                </div>
              )}

              {bgType === 'image' && (
                <div className="bg-image-section">
                  <div className="bg-image-gallery">
                    {BG_IMAGES.map(url => (
                      <div key={url} className={`bg-image-thumb ${imageUrl === url ? 'selected' : ''}`}
                        style={{ backgroundImage: `url(${url})` }}
                        onClick={() => setImageUrl(url)} />
                    ))}
                  </div>
                  <input type="url" className="settings-input" value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder={t('board.bgImagePlaceholder')}
                    style={{ marginTop: 12 }} />
                </div>
              )}

              {/* Preview */}
              <div style={{ marginTop: 16 }}>
                <label className="settings-label" style={{ fontSize: 11, marginBottom: 6 }}>Preview</label>
                <div className="bg-preview-box" style={
                  bgType === 'image' && imageUrl
                    ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover' }
                    : { background: bgType === 'gradient' ? bgValue : bgValue }
                }>
                  <div className="bg-preview-column" />
                  <div className="bg-preview-column" />
                  <div className="bg-preview-column" />
                </div>
              </div>
            </div>
          )}

          {/* ===== LABELS ===== */}
          {activeTab === 'labels' && (
            <div className="settings-section">
              <p className="settings-hint">{t('boardSettings.labelsHint')}</p>

              {/* Список сохранённых тегов */}
              <div className="saved-labels-list">
                {savedLabels.length === 0 && (
                  <div className="saved-labels-empty">{t('boardSettings.noLabels')}</div>
                )}
                {savedLabels.map((label, i) => (
                  <div key={label._id || i} className="saved-label-item">
                    <div className="saved-label-preview" style={{ background: label.color }}>
                      {label.text}
                    </div>
                    <div className="saved-label-actions">
                      <button className="saved-label-delete" onClick={() => removeLabel(label._id)} title={t('common.delete')}>
                        <FiTrash2 size={13} />
                      </button>
                      <button className="saved-label-edit" onClick={() => {
                        setNewLabelText(label.text);
                        setNewLabelColor(label.color);
                        setActiveSection(label._id);
                        setShowAddLabel(true);
                      }} title={t('common.edit')}>
                        <FiEdit2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Добавить тег */}
              {showAddLabel ? (
                <div className="add-saved-label-form">
                  <input
                    type="text"
                    className="settings-input"
                    value={newLabelText}
                    onChange={e => setNewLabelText(e.target.value)}
                    placeholder={t('boardSettings.labelTextPlaceholder')}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') addLabel();
                      if (e.key === 'Escape') { setShowAddLabel(false); setActiveSection(null); setNewLabelText(''); }
                    }}
                  />
                  <div className="add-label-color-row">
                    {LABEL_COLORS.map(c => (
                      <div
                        key={c}
                        className={`add-label-color-dot ${newLabelColor === c ? 'active' : ''}`}
                        style={{ background: c }}
                        onClick={() => setNewLabelColor(c)}
                      />
                    ))}
                  </div>
                  <div className="add-label-color-preview">
                    <div className="saved-label-preview" style={{ background: newLabelColor }}>
                      {newLabelText || '...'}
                    </div>
                  </div>
                  <div className="add-card-buttons">
                    <button className="btn-primary btn-sm" onClick={addLabel} disabled={!newLabelText.trim()}>
                      {activeSection ? t('common.save') : t('common.add')}
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => { setShowAddLabel(false); setActiveSection(null); setNewLabelText(''); }}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="add-saved-label-btn" onClick={() => { setShowAddLabel(true); setActiveSection(null); setNewLabelText(''); }}>
                  <FiPlus /> {t('boardSettings.addLabel')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
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