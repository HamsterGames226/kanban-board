import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import api from '../../utils/api';
import { FiX, FiTrash2, FiCheck, FiTag, FiUsers, FiMessageSquare, FiCheckSquare, FiEyeOff } from 'react-icons/fi';

function CardModal({ card, boardId, members, userRole, onClose, onUpdate }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const canEdit = ['member', 'admin', 'owner'].includes(userRole);
  const isViewer = userRole === 'viewer';

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.slice(0, 10) : '');
  const [labels, setLabels] = useState(card.labels || []);
  const [assignees, setAssignees] = useState(card.assignees || []);
  const [checklist, setChecklist] = useState(card.checklist || []);
  const [comments, setComments] = useState(card.comments || []);
  const [newComment, setNewComment] = useState('');
  const [newLabelText, setNewLabelText] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#5865f2');
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [showAssignee, setShowAssignee] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [showAddCheck, setShowAddCheck] = useState(false);

  const labelColors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f0b232', '#00a8fc'];
  const saveTimeout = useRef(null);

  const autoSave = (updates) => {
    if (!canEdit) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try { await api.put(`/cards/${card._id}`, updates); } catch (err) { console.error(err); }
    }, 500);
  };

  const handleTitleChange = (v) => { if (!canEdit) return; setTitle(v); autoSave({ title: v }); };
  const handleDescChange = (v) => { if (!canEdit) return; setDescription(v); autoSave({ description: v }); };

  const handlePriorityChange = async (v) => {
    if (!canEdit) return;
    setPriority(v);
    try { await api.put(`/cards/${card._id}`, { priority: v }); } catch (err) { console.error(err); }
  };

  const handleDueDateChange = async (v) => {
    if (!canEdit) return;
    setDueDate(v);
    try { await api.put(`/cards/${card._id}`, { dueDate: v || null }); } catch (err) { console.error(err); }
  };

  const addLabel = async () => {
    if (!newLabelText.trim() || !canEdit) return;
    const nl = [...labels, { text: newLabelText, color: newLabelColor }];
    setLabels(nl); setNewLabelText(''); setShowAddLabel(false);
    try { await api.put(`/cards/${card._id}`, { labels: nl }); } catch (err) { console.error(err); }
  };

  const removeLabel = async (i) => {
    if (!canEdit) return;
    const nl = labels.filter((_, idx) => idx !== i); setLabels(nl);
    try { await api.put(`/cards/${card._id}`, { labels: nl }); } catch (err) { console.error(err); }
  };

  const toggleAssignee = async (member) => {
    if (!canEdit) return;
    const mid = member.user?._id || member._id;
    const isAssigned = assignees.some(a => a._id === mid);
    const na = isAssigned ? assignees.filter(a => a._id !== mid)
      : [...assignees, { _id: mid, username: member.user?.username || member.username, avatar: member.user?.avatar || member.avatar }];
    setAssignees(na);
    try { await api.put(`/cards/${card._id}`, { assignees: na.map(a => a._id) }); } catch (err) { console.error(err); }
  };

  // Комментарии — доступны ВСЕМ
  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/cards/${card._id}/comments`, { text: newComment });
      setComments(res.data.comments); setNewComment('');
    } catch (err) { console.error(err); }
  };

  const addCheckItem = async () => {
    if (!newCheckItem.trim() || !canEdit) return;
    const nc = [...checklist, { text: newCheckItem, completed: false }];
    setChecklist(nc); setNewCheckItem('');
    try { await api.put(`/cards/${card._id}`, { checklist: nc }); } catch (err) { console.error(err); }
  };

  const toggleCheckItem = async (i) => {
    if (!canEdit) return;
    const nc = checklist.map((item, idx) => idx === i ? { ...item, completed: !item.completed } : item);
    setChecklist(nc);
    try { await api.put(`/cards/${card._id}`, { checklist: nc }); } catch (err) { console.error(err); }
  };

  const removeCheckItem = async (i) => {
    if (!canEdit) return;
    const nc = checklist.filter((_, idx) => idx !== i); setChecklist(nc);
    try { await api.put(`/cards/${card._id}`, { checklist: nc }); } catch (err) { console.error(err); }
  };

  const deleteCard = async () => {
    if (!canEdit) return;
    if (!window.confirm(t('card.deleteCardConfirm'))) return;
    try { await api.delete(`/cards/${card._id}`); onClose(); } catch (err) { console.error(err); }
  };

  const checkDone = checklist.filter(c => c.completed).length;
  const checkTotal = checklist.length;
  const checkProgress = checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0;

  const formatTime = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 1) return t('card.justNow');
    if (mins < 60) return t('card.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('card.hoursAgo', { count: hours });
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal" onClick={e => e.stopPropagation()}>
        <div className="card-modal-header">
          {canEdit ? (
            <input type="text" className="card-modal-title-input" value={title}
              onChange={e => handleTitleChange(e.target.value)} />
          ) : (
            <h2 style={{ color: 'var(--header-primary)', fontSize: 22, fontWeight: 700 }}>{title}</h2>
          )}
          <button className="card-modal-close" onClick={onClose}><FiX /></button>
        </div>

        {isViewer && (
          <div className="viewer-banner" style={{ margin: '0 24px', borderRadius: 8 }}>
            <FiEyeOff size={14} /><span>{t('board.viewerCantEdit')}</span>
          </div>
        )}

        <div className="card-modal-body">
          <div className="card-modal-main">
            {/* Метки */}
            {labels.length > 0 && (
              <div className="modal-section">
                <span className="modal-section-title">{t('card.labels')}</span>
                <div className="labels-container">
                  {labels.map((label, i) => (
                    <div key={i} className="label-item" style={{ background: label.color }}>
                      {label.text}
                      {canEdit && <button className="label-remove" onClick={() => removeLabel(i)}>×</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Исполнители */}
            {assignees.length > 0 && (
              <div className="modal-section">
                <span className="modal-section-title">{t('card.assignees')}</span>
                <div className="assignees-list">
                  {assignees.map(a => (
                    <div key={a._id} className="assignee-chip">
                      <div className="assignee-chip-avatar" style={{ background: a.avatar || '#5865f2' }}>
                        {a.username?.[0]?.toUpperCase()}
                      </div>
                      {a.username}
                      {canEdit && <button className="assignee-remove" onClick={() => toggleAssignee(a)}>×</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Описание */}
            <div className="modal-section">
              <span className="modal-section-title">{t('card.description')}</span>
              {canEdit ? (
                <textarea className="card-modal-desc" value={description}
                  onChange={e => handleDescChange(e.target.value)}
                  placeholder={t('card.descriptionPlaceholder')} />
              ) : (
                <p style={{ color: 'var(--text-normal)', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {description || t('card.descriptionPlaceholder')}
                </p>
              )}
            </div>

            {/* Чеклист */}
            {checklist.length > 0 && (
              <div className="modal-section">
                <span className="modal-section-title">
                  <FiCheckSquare style={{ marginRight: 6 }} />
                  {t('card.checklist')} ({checkDone}/{checkTotal})
                </span>
                <div className="checklist-progress">
                  <div className={`checklist-progress-bar ${checkProgress === 100 ? 'complete' : ''}`}
                    style={{ width: `${checkProgress}%` }} />
                </div>
                {checklist.map((item, i) => (
                  <div key={i} className="checklist-item">
                    <div className={`checklist-checkbox ${item.completed ? 'checked' : ''}`}
                      onClick={() => toggleCheckItem(i)}
                      style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                      {item.completed && <FiCheck size={12} color="white" />}
                    </div>
                    <span className={`checklist-text ${item.completed ? 'completed' : ''}`}>{item.text}</span>
                    {canEdit && <button className="assignee-remove" onClick={() => removeCheckItem(i)} style={{ marginLeft: 'auto' }}>×</button>}
                  </div>
                ))}
              </div>
            )}

            {showAddCheck && canEdit && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                  placeholder={t('card.checklistItem')} className="comment-input" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') addCheckItem(); if (e.key === 'Escape') setShowAddCheck(false); }} />
                <button className="btn-primary btn-sm" onClick={addCheckItem}>{t('common.add')}</button>
              </div>
            )}

            {/* Комментарии — доступны всем */}
            <div className="modal-section comments-section">
              <span className="modal-section-title">
                <FiMessageSquare style={{ marginRight: 6 }} />
                {t('card.comments')} ({comments.length})
              </span>
              <div className="comment-input-wrapper">
                <div className="comment-avatar" style={{ background: user?.avatar || '#5865f2' }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <input type="text" className="comment-input" value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={t('card.commentPlaceholder')}
                  onKeyDown={e => { if (e.key === 'Enter') addComment(); }} />
              </div>
              <div className="comment-list">
                {comments.map((comment, i) => (
                  <div key={i} className="comment-item">
                    <div className="comment-avatar" style={{ background: comment.user?.avatar || '#5865f2' }}>
                      {comment.user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="comment-content">
                      <span className="comment-author">
                        {comment.user?.username}
                        <span className="comment-time">{formatTime(comment.createdAt)}</span>
                      </span>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="card-modal-sidebar">
            {canEdit && (
              <>
                <div className="modal-section">
                  <span className="modal-section-title">{t('card.priority')}</span>
                  <select className="priority-select" value={priority} onChange={e => handlePriorityChange(e.target.value)}>
                    <option value="none">{t('card.priorities.none')}</option>
                    <option value="low">{t('card.priorities.low')}</option>
                    <option value="medium">{t('card.priorities.medium')}</option>
                    <option value="high">{t('card.priorities.high')}</option>
                    <option value="critical">{t('card.priorities.critical')}</option>
                  </select>
                </div>

                <div className="modal-section">
                  <span className="modal-section-title">{t('card.dueDate')}</span>
                  <input type="date" className="date-input" value={dueDate}
                    onChange={e => handleDueDateChange(e.target.value)} />
                </div>

                <button className="sidebar-action-btn" onClick={() => setShowAddLabel(!showAddLabel)}>
                  <FiTag /><span>{t('card.addLabel')}</span>
                </button>

                {showAddLabel && (
                  <div className="add-label-form">
                    <input type="text" value={newLabelText} onChange={e => setNewLabelText(e.target.value)}
                      placeholder={t('card.labelText')} onKeyDown={e => { if (e.key === 'Enter') addLabel(); }} />
                    <div className="color-options">
                      {labelColors.map(c => (
                        <div key={c} className={`color-option ${newLabelColor === c ? 'selected' : ''}`}
                          style={{ background: c }} onClick={() => setNewLabelColor(c)} />
                      ))}
                    </div>
                    <button className="btn-primary btn-sm" onClick={addLabel} style={{ width: '100%' }}>{t('common.add')}</button>
                  </div>
                )}

                <button className="sidebar-action-btn" onClick={() => setShowAssignee(!showAssignee)}>
                  <FiUsers /><span>{t('card.assignees')}</span>
                </button>

                {showAssignee && (
                  <div className="search-results">
                    {members?.map(member => {
                      const isAssigned = assignees.some(a => a._id === (member.user?._id || member._id));
                      return (
                        <div key={member.user?._id} className="search-result-item" onClick={() => toggleAssignee(member)}>
                          <div className="search-result-info">
                            <div className="member-avatar" style={{ background: member.user?.avatar || '#5865f2', width: 24, height: 24, fontSize: 10 }}>
                              {member.user?.username?.[0]?.toUpperCase()}
                            </div>
                            <span className="search-result-name">{member.user?.username}</span>
                          </div>
                          {isAssigned && <FiCheck color="var(--green-360)" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                <button className="sidebar-action-btn" onClick={() => setShowAddCheck(!showAddCheck)}>
                  <FiCheckSquare /><span>{t('card.checklist')}</span>
                </button>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 8 }}>
                  <button className="sidebar-action-btn danger" onClick={deleteCard}>
                    <FiTrash2 /><span>{t('card.deleteCard')}</span>
                  </button>
                </div>
              </>
            )}

            {isViewer && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>
                <p><strong>{t('card.priority')}:</strong> {t(`card.priorities.${priority}`)}</p>
                {dueDate && <p><strong>{t('card.dueDate')}:</strong> {new Date(dueDate).toLocaleDateString()}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardModal;