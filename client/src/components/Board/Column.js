import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useTranslation } from '../../i18n';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { BsClock, BsChatDots, BsCheckSquare } from 'react-icons/bs';

function Column({ column, boardId, dragHandleProps, onCardClick, onUpdate, members, userRole }) {
  const { t } = useTranslation();
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const canEdit = ['member', 'admin', 'owner'].includes(userRole);
  const canDeleteColumn = ['admin', 'owner'].includes(userRole);

  const addCard = async () => {
    if (!newCardTitle.trim() || !canEdit) return;
    try {
      await api.post('/cards', { title: newCardTitle, columnId: column._id, boardId });
      setNewCardTitle('');
      setAddingCard(false);
    } catch (err) { console.error(err); }
  };

  const updateColumn = async () => {
    if (!editTitle.trim() || !canEdit) return;
    try { await api.put(`/columns/${column._id}`, { title: editTitle }); setEditing(false); }
    catch (err) { console.error(err); }
  };

  const deleteColumn = async () => {
    if (!canDeleteColumn) return;
    if (!window.confirm(t('board.deleteColumnConfirm', { name: column.title }))) return;
    try { await api.delete(`/columns/${column._id}`); }
    catch (err) { alert(err.response?.data?.message || t('common.error')); }
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

  return (
    <div className="column">
      <div className="column-header" {...dragHandleProps}>
        <div className="column-header-left">
          <div className="column-color-dot" style={{ background: column.color }} />
          {editing ? (
            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
              onBlur={updateColumn} autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') updateColumn();
                if (e.key === 'Escape') { setEditing(false); setEditTitle(column.title); }
              }}
              style={{
                background: 'var(--input-background)', border: '1px solid var(--brand-500)',
                borderRadius: 4, color: 'var(--text-normal)', fontSize: 13,
                fontWeight: 700, padding: '2px 6px', outline: 'none', width: 120
              }}
            />
          ) : (
            <span className="column-title">{column.title}</span>
          )}
          <span className="column-count">{column.cards?.length || 0}</span>
        </div>

        {/* Кнопки — только для тех кто может */}
        {canEdit && (
          <div className="column-actions">
            <button className="column-action-btn"
              onClick={() => { setEditing(true); setEditTitle(column.title); }}>
              <FiEdit2 />
            </button>
            {canDeleteColumn && (
              <button className="column-action-btn danger" onClick={deleteColumn}>
                <FiTrash2 />
              </button>
            )}
          </div>
        )}
      </div>

      <Droppable droppableId={column._id} type="card">
        {(provided, snapshot) => (
          <div className="column-cards" ref={provided.innerRef} {...provided.droppableProps}
            style={{ background: snapshot.isDraggingOver ? 'rgba(88, 101, 242, 0.05)' : 'transparent' }}>
            <div className="column-cards-inner">
              {column.cards?.map((card, index) => {
                const due = formatDueDate(card.dueDate);
                const checkDone = card.checklist?.filter(c => c.completed).length || 0;
                const checkTotal = card.checklist?.length || 0;

                return (
                  <Draggable key={card._id} draggableId={card._id} index={index}
                    isDragDisabled={!canEdit}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                        className={`card ${snapshot.isDragging ? 'dragging' : ''}`}
                        onClick={() => onCardClick(card)}>
                        <div className={`card-priority-bar ${card.priority}`} />
                        {card.labels?.length > 0 && (
                          <div className="card-labels">
                            {card.labels.map((label, i) => (
                              <span key={i} className="card-label" style={{ background: label.color }}>{label.text}</span>
                            ))}
                          </div>
                        )}
                        <div className="card-title">{card.title}</div>
                        <div className="card-footer">
                          <div className="card-meta">
                            {card.priority !== 'none' && (
                              <span className={`priority-badge ${card.priority}`}>
                                {t(`card.priorityLabels.${card.priority}`)}
                              </span>
                            )}
                            {due && <span className={`card-due ${due.className}`}><BsClock size={11} />{due.text}</span>}
                            {card.comments?.length > 0 && <span className="card-meta-item"><BsChatDots size={12} />{card.comments.length}</span>}
                            {checkTotal > 0 && <span className="card-meta-item"><BsCheckSquare size={11} />{checkDone}/{checkTotal}</span>}
                          </div>
                          {card.assignees?.length > 0 && (
                            <div className="card-assignees">
                              {card.assignees.slice(0, 3).map(a => (
                                <div key={a._id} className="card-assignee-avatar"
                                  style={{ background: a.avatar || '#5865f2' }} title={a.username}>
                                  {a.username?.[0]?.toUpperCase()}
                                </div>
                              ))}
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

      {/* Добавить карточку — только member+ */}
      {canEdit && (
        addingCard ? (
          <div className="add-card-form">
            <textarea className="add-card-input" value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              placeholder={t('board.cardTitle')} autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addCard(); }
                if (e.key === 'Escape') setAddingCard(false);
              }}
            />
            <div className="add-card-actions">
              <button className="btn-primary btn-sm" onClick={addCard}>{t('common.add')}</button>
              <button className="btn-ghost btn-sm" onClick={() => setAddingCard(false)}>✕</button>
            </div>
          </div>
        ) : (
          <button className="add-card-btn" onClick={() => setAddingCard(true)}>
            <FiPlus /><span>{t('board.addCard')}</span>
          </button>
        )
      )}
    </div>
  );
}

export default Column;