import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { getAvatarUrl, getInitial, getAvatarColor } from '../../utils/avatar';
import api from '../../utils/api';
import { FiPlus, FiTrash2, FiUsers, FiClock, FiHash, FiArrowRight } from 'react-icons/fi';
import './Dashboard.css';

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchBoards(); }, []);

  const fetchBoards = async () => {
    try { const res = await api.get('/boards'); setBoards(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    try {
      const res = await api.post('/boards', { title: newBoardTitle, description: newBoardDesc });
      setBoards([res.data, ...boards]);
      setNewBoardTitle(''); setNewBoardDesc(''); setShowCreate(false);
    } catch (err) { setError(err.response?.data?.message || t('dashboard.createError')); }
  };

  const joinBoard = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    try {
      const res = await api.post(`/boards/join/${inviteCode}`);
      if (res.data.boardId) navigate(`/board/${res.data.boardId}`);
      else { setBoards([res.data, ...boards]); setInviteCode(''); setShowJoin(false); }
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
      if (err.response?.data?.boardId) navigate(`/board/${err.response.data.boardId}`);
    }
  };

  const deleteBoard = async (boardId, e) => {
    e.stopPropagation();
    if (!window.confirm(t('dashboard.deleteBoardConfirm'))) return;
    try {
      await api.delete(`/boards/${boardId}`);
      setBoards(boards.filter(b => b._id !== boardId));
    } catch (err) { setError(err.response?.data?.message || t('dashboard.deleteError')); }
  };

  const getBoardColor = (i) => ['#5865f2','#57f287','#fee75c','#eb459e','#ed4245','#f0b232'][i % 6];

  const renderMemberAvatar = (member) => {
    const u = member.user;
    const avatarUrl = getAvatarUrl(u);
    if (avatarUrl) return <img src={avatarUrl} alt="" className="member-mini-avatar" title={u?.username} key={u?._id} />;
    return (
      <div key={u?._id} className="member-mini-avatar" style={{ background: getAvatarColor(u) }} title={u?.username}>
        {getInitial(u)}
      </div>
    );
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /><p>{t('common.loading')}</p></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-title">{t('dashboard.quickActions')}</h3>
          <button className="sidebar-btn" onClick={() => { setShowCreate(true); setShowJoin(false); }}><FiPlus /><span>{t('dashboard.createBoard')}</span></button>
          <button className="sidebar-btn" onClick={() => { setShowJoin(true); setShowCreate(false); }}><FiArrowRight /><span>{t('dashboard.joinBoard')}</span></button>
        </div>
        <div className="sidebar-section">
          <h3 className="sidebar-title">{t('dashboard.yourBoards')}</h3>
          <div className="sidebar-boards">
            {boards.map((board, i) => (
              <div key={board._id} className="sidebar-board-item" onClick={() => navigate(`/board/${board._id}`)}>
                <div className="sidebar-board-icon" style={{ background: getBoardColor(i) }}><FiHash /></div>
                <span>{board.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>{t('dashboard.welcome', { name: user?.displayName || user?.username })}</h1>
          <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>{t('dashboard.createBoardTitle')}</h2>
              <p className="modal-subtitle">{t('dashboard.createBoardSubtitle')}</p>
              <form onSubmit={createBoard}>
                <div className="form-group">
                  <label>{t('dashboard.boardName')} <span className="required">{t('common.required')}</span></label>
                  <input type="text" value={newBoardTitle} onChange={e => setNewBoardTitle(e.target.value)} placeholder={t('dashboard.boardNamePlaceholder')} autoFocus required />
                </div>
                <div className="form-group">
                  <label>{t('dashboard.boardDescription')}</label>
                  <input type="text" value={newBoardDesc} onChange={e => setNewBoardDesc(e.target.value)} placeholder={t('dashboard.boardDescPlaceholder')} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</button>
                  <button type="submit" className="btn-primary">{t('common.create')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="modal-overlay" onClick={() => setShowJoin(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>{t('dashboard.joinBoardTitle')}</h2>
              <p className="modal-subtitle">{t('dashboard.joinBoardSubtitle')}</p>
              <form onSubmit={joinBoard}>
                <div className="form-group">
                  <label>{t('dashboard.inviteCode')} <span className="required">{t('common.required')}</span></label>
                  <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder={t('dashboard.inviteCodePlaceholder')} autoFocus required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowJoin(false)}>{t('common.cancel')}</button>
                  <button type="submit" className="btn-primary">{t('dashboard.join')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="boards-grid">
          <div className="board-card create-card" onClick={() => setShowCreate(true)}>
            <FiPlus className="create-icon" /><span>{t('dashboard.createBoard')}</span>
          </div>
          {boards.map((board, i) => (
            <div key={board._id} className="board-card" onClick={() => navigate(`/board/${board._id}`)}>
              <div className="board-card-header" style={{ background: getBoardColor(i) }}>
                <div className="board-card-title">{board.title}</div>
                {board.owner?._id === user?._id && (
                  <button className="board-delete-btn" onClick={e => deleteBoard(board._id, e)} title={t('common.delete')}><FiTrash2 /></button>
                )}
              </div>
              <div className="board-card-body">
                <p className="board-card-desc">{board.description || t('dashboard.noDescription')}</p>
                <div className="board-card-footer">
                  <div className="board-card-meta"><FiUsers /><span>{t('dashboard.members', { count: board.members?.length || 1 })}</span></div>
                  <div className="board-card-meta"><FiClock /><span>{new Date(board.updatedAt).toLocaleDateString()}</span></div>
                </div>
                <div className="board-card-members">
                  {board.members?.slice(0, 5).map(m => renderMemberAvatar(m))}
                  {board.members?.length > 5 && <div className="member-mini-avatar more">+{board.members.length - 5}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {boards.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>{t('dashboard.noBoards')}</h3>
            <p>{t('dashboard.noBoardsDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;