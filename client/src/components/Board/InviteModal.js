import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import api from '../../utils/api';
import { FiX, FiCopy, FiRefreshCw, FiSearch, FiUserPlus } from 'react-icons/fi';

function InviteModal({ board, onClose, onUpdate }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inviteCode, setInviteCode] = useState(board.inviteCode);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateCode = async () => {
    try { const res = await api.post(`/boards/${board._id}/regenerate-invite`); setInviteCode(res.data.inviteCode); }
    catch (err) { console.error(err); }
  };

  const searchUsers = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/auth/users/search?q=${query}`);
      const memberIds = board.members.map(m => m.user?._id);
      setSearchResults(res.data.filter(u => !memberIds.includes(u._id)));
    } catch (err) { console.error(err); }
  };

  const inviteUser = async (userId) => {
    try {
      await api.post(`/boards/${board._id}/invite`, { userId });
      setSearchResults(searchResults.filter(u => u._id !== userId));
      onUpdate();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="invite-modal-overlay" onClick={onClose}>
      <div className="invite-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: 'var(--header-primary)', fontSize: 20, fontWeight: 700 }}>
            {t('invite.title', { name: board.title })}
          </h2>
          <button className="card-modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-section" style={{ marginBottom: 20 }}>
          <span className="modal-section-title">{t('invite.searchUsers')}</span>
          <div style={{ position: 'relative' }}>
            <input type="text" value={searchQuery} onChange={e => searchUsers(e.target.value)}
              placeholder={t('invite.searchPlaceholder')}
              style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--input-background)', border: '1px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--text-normal)', fontSize: 14, outline: 'none' }}
            />
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
          </div>
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(u => (
                <div key={u._id} className="search-result-item">
                  <div className="search-result-info">
                    <div className="member-avatar" style={{ background: u.avatar || '#5865f2', width: 28, height: 28, fontSize: 11 }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="search-result-name">{u.username}</div>
                      <div className="search-result-email">{u.email}</div>
                    </div>
                  </div>
                  <button className="invite-btn" onClick={() => inviteUser(u._id)}>
                    <FiUserPlus style={{ marginRight: 4 }} />{t('invite.inviteBtn')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="invite-code-section">
          <span className="modal-section-title" style={{ marginBottom: 12, display: 'block' }}>
            {t('invite.shareCode')}
          </span>
          <div className="invite-code-display">
            <input className="invite-code" value={inviteCode || ''} readOnly />
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyInviteCode}>
              {copied ? t('common.copied') : <><FiCopy style={{ marginRight: 4 }} />{t('common.copy')}</>}
            </button>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
            onClick={regenerateCode}>
            <FiRefreshCw size={12} />{t('invite.generateNew')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteModal;