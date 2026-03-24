import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { renderAvatar } from '../../utils/avatar';
import api from '../../utils/api';
import MarkdownEditor from './MarkdownEditor';
import MarkdownRenderer from './MarkdownRenderer';
import {
  FiX, FiTrash2, FiCheck, FiTag, FiUsers,
  FiMessageSquare, FiCheckSquare, FiEyeOff, FiEdit2,
  FiCalendar, FiFlag, FiPlus
} from 'react-icons/fi';

function CardModal({ card, boardId, members, userRole, savedLabels = [], onClose, onUpdate }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const canEdit = ['member', 'admin', 'owner'].includes(userRole);
  const isViewer = userRole === 'viewer';

  const [title, setTitle] = useState(card.title);
  const [editingTitle, setEditingTitle] = useState(false);
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
  const [showLabelPanel, setShowLabelPanel] = useState(false);
  const [showAssigneePanel, setShowAssigneePanel] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [showAddCheck, setShowAddCheck] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // 'labels' | 'assignees' | 'checklist'

  const labelColors = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f0b232', '#00a8fc'];
  const descTimeout = useRef(null);

  // ===== Сохранение =====
  const saveTitle = async () => {
    if (!title.trim() || !canEdit) return;
    try { await api.put(`/cards/${card._id}`, { title: title.trim() }); setEditingTitle(false); }
    catch (err) { console.error(err); }
  };

  const handleDescChange = (v) => {
    if (!canEdit) return;
    setDescription(v);
    if (descTimeout.current) clearTimeout(descTimeout.current);
    descTimeout.current = setTimeout(async () => {
      try { await api.put(`/cards/${card._id}`, { description: v }); }
      catch (err) { console.error(err); }
    }, 800);
  };

  const handlePriorityChange = async (v) => {
    if (!canEdit) return;
    setPriority(v);
    try { await api.put(`/cards/${card._id}`, { priority: v }); }
    catch (err) { console.error(err); }
  };

  const handleDueDateChange = async (v) => {
    if (!canEdit) return;
    setDueDate(v);
    try { await api.put(`/cards/${card._id}`, { dueDate: v || null }); }
    catch (err) { console.error(err); }
  };

  // ===== Теги =====
  const addQuickLabel = async (label) => {
    if (!canEdit) return;
    const alreadyAdded = labels.some(l => l.text === label.text && l.color === label.color);
    if (alreadyAdded) return;
    const nl = [...labels, { text: label.text, color: label.color }];
    setLabels(nl);
    try { await api.put(`/cards/${card._id}`, { labels: nl }); }
    catch (err) { console.error(err); }
  };

  const addCustomLabel = async () => {
    if (!newLabelText.trim() || !canEdit) return;
    const nl = [...labels, { text: newLabelText, color: newLabelColor }];
    setLabels(nl);
    setNewLabelText('');
    try { await api.put(`/cards/${card._id}`, { labels: nl }); }
    catch (err) { console.error(err); }
  };

  const removeLabel = async (i) => {
    if (!canEdit) return;
    const nl = labels.filter((_, idx) => idx !== i);
    setLabels(nl);
    try { await api.put(`/cards/${card._id}`, { labels: nl }); }
    catch (err) { console.error(err); }
  };

  // ===== Исполнители =====
  const toggleAssignee = async (member) => {
    if (!canEdit) return;
    const mid = member.user?._id || member._id;
    const isAssigned = assignees.some(a => a._id === mid);
    const na = isAssigned
      ? assignees.filter(a => a._id !== mid)
      : [...assignees, { _id: mid, username: member.user?.username || member.username, avatar: member.user?.avatar || member.avatar }];
    setAssignees(na);
    try { await api.put(`/cards/${card._id}`, { assignees: na.map(a => a._id) }); }
    catch (err) { console.error(err); }
  };

  // ===== Комментарии =====
  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/cards/${card._id}/comments`, { text: newComment });
      setComments(res.data.comments);
      setNewComment('');
    } catch (err) { console.error(err); }
  };

  // ===== Чеклист =====
  const addCheckItem = async () => {
    if (!newCheckItem.trim() || !canEdit) return;
    const nc = [...checklist, { text: newCheckItem, completed: false }];
    setChecklist(nc);
    setNewCheckItem('');
    try { await api.put(`/cards/${card._id}`, { checklist: nc }); }
    catch (err) { console.error(err); }
  };

  const toggleCheckItem = async (i) => {
    if (!canEdit) return;
    const nc = checklist.map((item, idx) => idx === i ? { ...item, completed: !item.completed } : item);
    setChecklist(nc);
    try { await api.put(`/cards/${card._id}`, { checklist: nc }); }
    catch (err) { console.error(err); }
  };

  const removeCheckItem = async (i) => {
    if (!canEdit) return;
    const nc = checklist.filter((_, idx) => idx !== i);
    setChecklist(nc);
    try { await api.put(`/cards/${card._id}`, { checklist: nc }); }
    catch (err) { console.error(err); }
  };

  const deleteCard = async () => {
    if (!canEdit || !window.confirm(t('card.deleteCardConfirm'))) return;
    try { await api.delete(`/cards/${card._id}`); onClose(); }
    catch (err) { console.error(err); }
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
      <div className="card-modal-new" onClick={e => e.stopPropagation()}>

        {/* ===== HEADER ===== */}
        <div className="cm-header">
          <div className="cm-header-left">
            {editingTitle && canEdit ? (
              <input type="text" className="cm-title-input" value={title}
                onChange={e => setTitle(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(card.title); setEditingTitle(false); } }}
                onBlur={saveTitle} />
            ) : (
              <div className="cm-title-row" onClick={() => canEdit && setEditingTitle(true)}>
                <h2 className="cm-title">{title}</h2>
                {canEdit && <FiEdit2 className="cm-title-edit-icon" />}
              </div>
            )}

            {/* Priority + Due inline */}
            <div className="cm-meta-row">
              {priority !== 'none' && (
                <span className={`priority-badge ${priority}`}>
                  {t(`card.priorityLabels.${priority}`)}
                </span>
              )}
              {dueDate && (
                <span className="cm-due-badge">
                  <FiCalendar size={11} />
                  {new Date(dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button className="cm-close" onClick={onClose}><FiX /></button>
        </div>

        {isViewer && (
          <div className="viewer-banner" style={{ margin: '0 20px', borderRadius: 8 }}>
            <FiEyeOff size={14} /><span>{t('board.viewerCantEdit')}</span>
          </div>
        )}

        {/* ===== BODY ===== */}
        <div className="cm-body">
          <div className="cm-main">

            {/* Текущие метки */}
            {labels.length > 0 && (
              <div className="cm-section">
                <div className="cm-section-title">{t('card.labels')}</div>
                <div className="cm-labels-row">
                  {labels.map((label, i) => (
                    <div key={i} className="cm-label" style={{ background: label.color }}>
                      <span>{label.text}</span>
                      {canEdit && <button className="cm-label-x" onClick={() => removeLabel(i)}>×</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Исполнители */}
            {assignees.length > 0 && (
              <div className="cm-section">
                <div className="cm-section-title">{t('card.assignees')}</div>
                <div className="cm-assignees-row">
                  {assignees.map(a => (
                    <div key={a._id} className="cm-assignee">
                      {renderAvatar(a, 24)}
                      <span>{a.username}</span>
                      {canEdit && <button className="cm-assignee-x" onClick={() => toggleAssignee(a)}>×</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Описание */}
            <div className="cm-section">
              <div className="cm-section-title">{t('card.description')}</div>
              {canEdit ? (
                <MarkdownEditor value={description} onChange={handleDescChange}
                  placeholder={t('card.descriptionPlaceholder')} />
              ) : (
                <div className="cm-desc-view">
                  {description ? <MarkdownRenderer content={description} /> :
                    <p className="cm-placeholder">{t('card.descriptionPlaceholder')}</p>}
                </div>
              )}
            </div>

            {/* Чеклист */}
            {(checklist.length > 0 || showAddCheck) && (
              <div className="cm-section">
                <div className="cm-section-title">
                  <FiCheckSquare size={14} />
                  {t('card.checklist')} ({checkDone}/{checkTotal})
                </div>
                {checkTotal > 0 && (
                  <div className="cm-progress">
                    <div className={`cm-progress-bar ${checkProgress === 100 ? 'done' : ''}`}
                      style={{ width: `${checkProgress}%` }} />
                  </div>
                )}
                <div className="cm-checklist">
                  {checklist.map((item, i) => (
                    <div key={i} className="cm-check-item">
                      <div className={`cm-checkbox ${item.completed ? 'checked' : ''}`}
                        onClick={() => toggleCheckItem(i)}
                        style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                        {item.completed && <FiCheck size={11} color="white" />}
                      </div>
                      <span className={item.completed ? 'completed' : ''}>{item.text}</span>
                      {canEdit && <button className="cm-check-x" onClick={() => removeCheckItem(i)}>×</button>}
                    </div>
                  ))}
                </div>
                {showAddCheck && canEdit && (
                  <div className="cm-check-add">
                    <input type="text" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                      placeholder={t('card.checklistItem')} autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') addCheckItem(); if (e.key === 'Escape') setShowAddCheck(false); }} />
                    <button className="btn-primary btn-sm" onClick={addCheckItem}>{t('common.add')}</button>
                  </div>
                )}
              </div>
            )}

            {/* Комментарии */}
            <div className="cm-section">
              <div className="cm-section-title">
                <FiMessageSquare size={14} />
                {t('card.comments')} ({comments.length})
              </div>
              <div className="cm-comment-input-row">
                {renderAvatar(user, 28)}
                <input type="text" className="cm-comment-input" value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={t('card.commentPlaceholder')}
                  onKeyDown={e => { if (e.key === 'Enter') addComment(); }} />
              </div>
              <div className="cm-comments-list">
                {comments.map((c, i) => (
                  <div key={i} className="cm-comment">
                    {renderAvatar(c.user, 28)}
                    <div className="cm-comment-body">
                      <div className="cm-comment-header">
                        <span className="cm-comment-author">{c.user?.username}</span>
                        <span className="cm-comment-time">{formatTime(c.createdAt)}</span>
                      </div>
                      <p className="cm-comment-text">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="cm-sidebar">
            {canEdit && (
              <>
                {/* Приоритет */}
                <div className="cm-sb-section">
                  <div className="cm-sb-title">{t('card.priority')}</div>
                  <div className="cm-priority-grid">
                    {['none', 'low', 'medium', 'high', 'critical'].map(p => (
                      <button key={p} className={`cm-priority-btn ${priority === p ? 'active' : ''} ${p}`}
                        onClick={() => handlePriorityChange(p)}>
                        <div className={`priority-dot-color ${p}`} />
                        <span>{t(`card.priorities.${p}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Срок */}
                <div className="cm-sb-section">
                  <div className="cm-sb-title">{t('card.dueDate')}</div>
                  <input type="date" className="cm-date-input" value={dueDate}
                    onChange={e => handleDueDateChange(e.target.value)} />
                  {dueDate && (
                    <button className="cm-clear-date" onClick={() => handleDueDateChange('')}>
                      {t('common.delete')}
                    </button>
                  )}
                </div>

                {/* Теги */}
                <div className="cm-sb-section">
                  <div className="cm-sb-title">{t('card.labels')}</div>

                  {/* Быстрые теги доски */}
                  {savedLabels.length > 0 && (
                    <div className="cm-quick-labels">
                      {savedLabels.map((sl, i) => {
                        const added = labels.some(l => l.text === sl.text && l.color === sl.color);
                        return (
                          <button key={i} className={`cm-quick-label ${added ? 'added' : ''}`}
                            style={{ background: sl.color }}
                            onClick={() => addQuickLabel(sl)} disabled={added}>
                            {added && <FiCheck size={10} />}
                            {sl.text}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Новый тег */}
                  {showLabelPanel ? (
                    <div className="cm-add-label-form">
                      <input type="text" value={newLabelText} onChange={e => setNewLabelText(e.target.value)}
                        placeholder={t('card.labelText')} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') addCustomLabel(); }} />
                      <div className="cm-label-colors">
                        {labelColors.map(c => (
                          <div key={c} className={`cm-label-color ${newLabelColor === c ? 'active' : ''}`}
                            style={{ background: c }} onClick={() => setNewLabelColor(c)} />
                        ))}
                      </div>
                      <div className="cm-add-label-actions">
                        <button className="btn-primary btn-sm" onClick={addCustomLabel}
                          disabled={!newLabelText.trim()}>{t('common.add')}</button>
                        <button className="btn-ghost btn-sm" onClick={() => setShowLabelPanel(false)}>
                          {t('common.cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <button className="cm-sb-btn" onClick={() => setShowLabelPanel(true)}>
                      <FiPlus size={13} />{t('card.addLabel')}
                    </button>
                  )}
                </div>

                {/* Исполнители */}
                <div className="cm-sb-section">
                  <div className="cm-sb-title">{t('card.assignees')}</div>
                  <div className="cm-assignee-list">
                    {members?.map(member => {
                      const u = member.user;
                      const isAssigned = assignees.some(a => a._id === u?._id);
                      return (
                        <button key={u?._id} className={`cm-assignee-option ${isAssigned ? 'active' : ''}`}
                          onClick={() => toggleAssignee(member)}>
                          {renderAvatar(u, 22)}
                          <span>{u?.displayName || u?.username}</span>
                          {isAssigned && <FiCheck size={13} className="cm-assignee-check" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Чеклист */}
                <button className="cm-sb-btn" onClick={() => setShowAddCheck(!showAddCheck)}>
                  <FiCheckSquare size={13} />{t('card.checklist')}
                </button>

                {/* Удалить */}
                <div className="cm-sb-danger">
                  <button className="cm-sb-btn danger" onClick={deleteCard}>
                    <FiTrash2 size={13} />{t('card.deleteCard')}
                  </button>
                </div>
              </>
            )}

            {isViewer && (
              <div className="cm-sb-viewer">
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