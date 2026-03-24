import React, { useState, useEffect, useRef } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useTranslation } from '../../i18n';
import { renderAvatar } from '../../utils/avatar';
import api from '../../utils/api';
import CardContextMenu from './CardContextMenu';
import MarkdownRenderer from './MarkdownRenderer';
import {
  FiPlus, FiEdit2, FiTrash2, FiMoreHorizontal,
  FiDroplet, FiMaximize2, FiMinimize2, FiCopy, FiArchive
} from 'react-icons/fi';
import { BsClock, BsChatDots, BsCheckSquare } from 'react-icons/bs';

const COLUMN_COLORS = [
  '#ed4245', '#f0b232', '#fee75c', '#57f287', '#23a559',
  '#5865f2', '#00a8fc', '#eb459e', '#9b59b6', '#4e5058',
];

function Column({
  column, boardId, dragHandleProps, onCardClick, onUpdate,
  members, userRole, allColumns, showDescPreview,
  forceAddCard, onCancelQuickAdd
}) {
  const { t } = useTranslation();
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardPriority, setNewCardPriority] = useState('none');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [contextMenu, setContextMenu] = useState(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const columnMenuRef = useRef(null);
  const addCardRef = useRef(null);

  const canEdit = ['member', 'admin', 'owner'].includes(userRole);
  const canDeleteColumn = ['admin', 'owner'].includes(userRole);

  // Быстрое добавление по горячей клавише
  useEffect(() => {
    if (forceAddCard) {
      setAddingCard(true);
      setTimeout(() => {
        if (addCardRef.current) addCardRef.current.focus();
      }, 50);
    }
  }, [forceAddCard]);

  // Закрыть меню при клике вне
  useEffect(() => {
    if (!showColumnMenu) return;
    const handle = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setShowColumnMenu(false);
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showColumnMenu]);

  const cancelAddCard = () => {
    setAddingCard(false);
    setNewCardTitle('');
    setNewCardPriority('none');
    if (onCancelQuickAdd) onCancelQuickAdd();
  };

  const addCard = async () => {
    if (!newCardTitle.trim() || !canEdit) return;
    try {
      await api.post('/cards', {
        title: newCardTitle,
        columnId: column._id,
        boardId,
        priority: newCardPriority
      });
      setNewCardTitle('');
      setNewCardPriority('none');
      // Не закрываем форму — можно добавлять подряд
    } catch (err) { console.error(err); }
  };

  const updateColumn = async () => {
    if (!editTitle.trim() || !canEdit) return;
    try {
      await api.put(`/columns/${column._id}`, { title: editTitle });
      setEditing(false);
    } catch (err) { console.error(err); }
  };

  const changeColor = async (color) => {
    try {
      await api.put(`/columns/${column._id}`, { color });
      setShowColorPicker(false);
      setShowColumnMenu(false);
    } catch (err) { console.error(err); }
  };

  const deleteColumn = async () => {
    if (!canDeleteColumn) return;
    if (!window.confirm(t('board.deleteColumnConfirm', { name: column.title }))) return;
    try { await api.delete(`/columns/${column._id}`); }
    catch (err) { alert(err.response?.data?.message || t('common.error')); }
  };

  const duplicateColumn = async () => {
    try {
      const res = await api.post('/columns', {
        title: `${column.title} (${t('contextMenu.copyLabel')})`,
        boardId,
        color: column.color
      });
      // Копируем карточки
      for (const card of column.cards || []) {
        await api.post('/cards', {
          title: card.title,
          description: card.description,
          columnId: res.data._id,
          boardId,
          priority: card.priority
        });
      }
      onUpdate();
      setShowColumnMenu(false);
    } catch (err) { console.error(err); }
  };

  const handleCardContextMenu = (e, card) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ card, position: { x: e.clientX, y: e.clientY } });
  };

  const formatDueDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const days = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: t('board.due.overdue'), className: 'overdue' };
    if (days === 0) return { text: t('board.due.today'), className: 'soon' };
    if (days === 1) return { text: t('board.due.tomorrow'), className: 'soon' };
    if (days <= 7) return { text: t('board.due.days', { count: days }), className: 'soon' };
    return { text: d.toLocaleDateString(), className: '' };
  };

  const truncateDesc = (text, maxLen = 80) => {
    if (!text) return '';
    const plain = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/>\s/g, '')
      .replace(/---/g, '')
      .trim();
    return plain.length <= maxLen ? plain : plain.substring(0, maxLen) + '...';
  };

  const cardCount = column.cards?.length || 0;

  // ===== Свёрнутый столбец =====
  if (collapsed) {
    return (
      <div className="column column-collapsed" onClick={() => setCollapsed(false)}>
        <div className="column-collapsed-color" style={{ background: column.color }} />
        <div className="column-collapsed-title">{column.title}</div>
        <div className="column-collapsed-count">{cardCount}</div>
        <FiMaximize2 className="column-collapsed-expand" />
      </div>
    );
  }

  return (
    <div className="column">
      {/* ===== ШАПКА СТОЛБЦА ===== */}
      <div className="column-header" {...dragHandleProps}>
        <div className="column-header-left">
          <div
            className="column-color-dot"
            style={{ background: column.color }}
            onClick={() => canEdit && setShowColorPicker(!showColorPicker)}
            title={canEdit ? t('column.changeColor') : ''}
          />
          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={updateColumn}
              autoFocus
              className="column-title-input"
              onKeyDown={e => {
                if (e.key === 'Enter') updateColumn();
                if (e.key === 'Escape') { setEditing(false); setEditTitle(column.title); }
              }}
            />
          ) : (
            <span
              className="column-title"
              onDoubleClick={() => canEdit && setEditing(true)}
            >
              {column.title}
            </span>
          )}
          <span className="column-count">{cardCount}</span>
        </div>

        {canEdit && (
          <div className="column-header-actions">
            <button
              className="column-action-btn"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
            >
              <FiMoreHorizontal />
            </button>
          </div>
        )}

        {/* Выпадающее меню столбца */}
        {showColumnMenu && (
          <div className="column-dropdown" ref={columnMenuRef}>
            <button className="column-dropdown-item" onClick={() => { setEditing(true); setShowColumnMenu(false); }}>
              <FiEdit2 /><span>{t('column.rename')}</span>
            </button>
            <button className="column-dropdown-item" onClick={() => setShowColorPicker(!showColorPicker)}>
              <FiDroplet /><span>{t('column.changeColor')}</span>
            </button>

            {showColorPicker && (
              <div className="column-color-grid">
                {COLUMN_COLORS.map(c => (
                  <div
                    key={c}
                    className={`column-color-option ${column.color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => changeColor(c)}
                  />
                ))}
              </div>
            )}

            <button className="column-dropdown-item" onClick={() => { setCollapsed(true); setShowColumnMenu(false); }}>
              <FiMinimize2 /><span>{t('column.collapse')}</span>
            </button>
            <button className="column-dropdown-item" onClick={duplicateColumn}>
              <FiCopy /><span>{t('column.duplicate')}</span>
            </button>

            {canDeleteColumn && (
              <>
                <div className="column-dropdown-divider" />
                <button className="column-dropdown-item danger" onClick={() => { deleteColumn(); setShowColumnMenu(false); }}>
                  <FiTrash2 /><span>{t('column.delete')}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ===== КАРТОЧКИ ===== */}
      <Droppable droppableId={column._id} type="card">
        {(provided, snapshot) => (
          <div
            className={`column-cards ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <div className="column-cards-inner">
              {column.cards?.map((cardData, index) => {
                const due = formatDueDate(cardData.dueDate);
                const checkDone = cardData.checklist?.filter(c => c.completed).length || 0;
                const checkTotal = cardData.checklist?.length || 0;
                const descPreview = showDescPreview ? truncateDesc(cardData.description) : '';

                return (
                  <Draggable key={cardData._id} draggableId={cardData._id} index={index}
                    isDragDisabled={!canEdit}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`card ${snapshot.isDragging ? 'dragging' : ''}`}
                        onClick={() => onCardClick(cardData)}
                        onContextMenu={(e) => handleCardContextMenu(e, cardData)}
                      >
                        <div className={`card-priority-bar ${cardData.priority}`} />

                        {cardData.labels?.length > 0 && (
                          <div className="card-labels">
                            {cardData.labels.map((label, i) => (
                              <span key={i} className="card-label" style={{ background: label.color }}>
                                {label.text}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="card-title">{cardData.title}</div>

                        {descPreview && (
                          <div className="card-desc-preview">{descPreview}</div>
                        )}

                        <div className="card-footer">
                          <div className="card-meta">
                            {cardData.priority !== 'none' && (
                              <span className={`priority-badge ${cardData.priority}`}>
                                {t(`card.priorityLabels.${cardData.priority}`)}
                              </span>
                            )}
                            {due && (
                              <span className={`card-due ${due.className}`}>
                                <BsClock size={11} />{due.text}
                              </span>
                            )}
                            {cardData.comments?.length > 0 && (
                              <span className="card-meta-item">
                                <BsChatDots size={12} />{cardData.comments.length}
                              </span>
                            )}
                            {checkTotal > 0 && (
                              <span className={`card-meta-item ${checkDone === checkTotal ? 'check-done' : ''}`}>
                                <BsCheckSquare size={11} />{checkDone}/{checkTotal}
                              </span>
                            )}
                          </div>

                          {cardData.assignees?.length > 0 && (
                            <div className="card-assignees">
                              {cardData.assignees.slice(0, 3).map(a => (
                                <React.Fragment key={a._id}>
                                  {renderAvatar(a, 22, 'card-assignee-avatar')}
                                </React.Fragment>
                              ))}
                              {cardData.assignees.length > 3 && (
                                <div className="card-assignee-avatar card-assignee-more">
                                  +{cardData.assignees.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>

      {/* ===== ДОБАВИТЬ КАРТОЧКУ ===== */}
      {canEdit && (
        addingCard ? (
          <div className="add-card-section">
            <div className="add-card-form-new">
              <textarea
                ref={addCardRef}
                className="add-card-textarea"
                value={newCardTitle}
                onChange={e => setNewCardTitle(e.target.value)}
                placeholder={t('board.cardTitlePlaceholder')}
                autoFocus
                rows={2}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addCard(); }
                  if (e.key === 'Escape') cancelAddCard();
                }}
              />
              <div className="add-card-options">
                <div className="add-card-priority-picker">
                  {['none', 'low', 'medium', 'high', 'critical'].map(p => (
                    <button
                      key={p}
                      className={`priority-dot-btn ${newCardPriority === p ? 'active' : ''}`}
                      onClick={() => setNewCardPriority(p)}
                      title={t(`card.priorities.${p}`)}
                    >
                      <div className={`priority-dot-color ${p}`} />
                    </button>
                  ))}
                </div>
                <div className="add-card-buttons">
                  <button className="btn-primary btn-sm" onClick={addCard} disabled={!newCardTitle.trim()}>
                    {t('common.add')}
                  </button>
                  <button className="btn-ghost btn-sm" onClick={cancelAddCard}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button className="add-card-btn" onClick={() => setAddingCard(true)}>
            <FiPlus /><span>{t('board.addCard')}</span>
          </button>
        )
      )}

      {/* Контекстное меню */}
      {contextMenu && (
        <CardContextMenu
          card={contextMenu.card}
          boardId={boardId}
          columns={allColumns}
          members={members}
          userRole={userRole}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onUpdate={onUpdate}
          onOpenCard={onCardClick}
        />
      )}
    </div>
  );
}

export default Column;