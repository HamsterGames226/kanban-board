import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n';
import api from '../../utils/api';
import {
  FiEdit2, FiTrash2, FiCopy, FiArrowRight, FiFlag,
  FiCalendar, FiUsers, FiTag, FiCheckSquare, FiExternalLink,
  FiChevronRight, FiArchive
} from 'react-icons/fi';
import './CardContextMenu.css';

function CardContextMenu({ card, boardId, columns, members, userRole, position, onClose, onUpdate, onOpenCard }) {
  const { t } = useTranslation();
  const menuRef = useRef(null);
  const [subMenu, setSubMenu] = useState(null); // 'move' | 'priority' | 'assign'
  const canEdit = ['member', 'admin', 'owner'].includes(userRole);

  // Закрытие по клику вне меню
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    const handleScroll = () => onClose();

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Позиционирование — не выходить за экран
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const pad = 8;

    if (rect.right > window.innerWidth - pad) {
      menuRef.current.style.left = `${position.x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight - pad) {
      menuRef.current.style.top = `${position.y - rect.height}px`;
    }
  }, [position, subMenu]);

  // ===== Действия =====
  const handleOpen = () => {
    onOpenCard(card);
    onClose();
  };

  const handleDuplicate = async () => {
    if (!canEdit) return;
    try {
      await api.post('/cards', {
        title: `${card.title} (${t('contextMenu.copyLabel')})`,
        description: card.description,
        columnId: card.column,
        boardId,
        priority: card.priority,
      });
      onUpdate();
    } catch (err) { console.error(err); }
    onClose();
  };

  const handleMove = async (targetColumnId) => {
    if (!canEdit) return;
    try {
      await api.put(`/cards/${card._id}/move`, {
        sourceColumnId: card.column,
        destColumnId: targetColumnId,
        newOrder: 0,
      });
      onUpdate();
    } catch (err) { console.error(err); }
    onClose();
  };

  const handlePriority = async (priority) => {
    if (!canEdit) return;
    try {
      await api.put(`/cards/${card._id}`, { priority });
      onUpdate();
    } catch (err) { console.error(err); }
    onClose();
  };

  const handleAssign = async (userId) => {
    if (!canEdit) return;
    const currentAssignees = card.assignees?.map(a => a._id) || [];
    const isAssigned = currentAssignees.includes(userId);
    const newAssignees = isAssigned
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];

    try {
      await api.put(`/cards/${card._id}`, { assignees: newAssignees });
      onUpdate();
    } catch (err) { console.error(err); }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/board/${boardId}?card=${card._id}`;
    navigator.clipboard.writeText(url);
    onClose();
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    if (!window.confirm(t('card.deleteCardConfirm'))) return;
    try {
      await api.delete(`/cards/${card._id}`);
      onUpdate();
    } catch (err) { console.error(err); }
    onClose();
  };

  const priorities = [
    { value: 'critical', label: t('card.priorities.critical'), color: '#ed4245' },
    { value: 'high', label: t('card.priorities.high'), color: '#f0b232' },
    { value: 'medium', label: t('card.priorities.medium'), color: '#fee75c' },
    { value: 'low', label: t('card.priorities.low'), color: '#5865f2' },
    { value: 'none', label: t('card.priorities.none'), color: '#4e5058' },
  ];

  // Текущий столбец карточки
  const currentColumn = columns?.find(c => c._id === card.column);
  const otherColumns = columns?.filter(c => c._id !== card.column) || [];

  return (
    <div className="ctx-menu" ref={menuRef}
      style={{ top: position.y, left: position.x }}>

      {/* Основное меню */}
      {!subMenu && (
        <>
          <div className="ctx-group">
            <button className="ctx-item" onClick={handleOpen}>
              <FiExternalLink />
              <span>{t('contextMenu.open')}</span>
            </button>
          </div>

          {canEdit && (
            <>
              <div className="ctx-divider" />
              <div className="ctx-group">
                <button className="ctx-item has-sub" onClick={() => setSubMenu('move')}>
                  <FiArrowRight />
                  <span>{t('contextMenu.moveTo')}</span>
                  <FiChevronRight className="ctx-arrow" />
                </button>
                <button className="ctx-item has-sub" onClick={() => setSubMenu('priority')}>
                  <FiFlag />
                  <span>{t('contextMenu.setPriority')}</span>
                  <FiChevronRight className="ctx-arrow" />
                </button>
                <button className="ctx-item has-sub" onClick={() => setSubMenu('assign')}>
                  <FiUsers />
                  <span>{t('contextMenu.assign')}</span>
                  <FiChevronRight className="ctx-arrow" />
                </button>
              </div>

              <div className="ctx-divider" />
              <div className="ctx-group">
                <button className="ctx-item" onClick={handleDuplicate}>
                  <FiCopy />
                  <span>{t('contextMenu.duplicate')}</span>
                </button>
                <button className="ctx-item" onClick={handleCopyLink}>
                  <FiExternalLink />
                  <span>{t('contextMenu.copyLink')}</span>
                </button>
              </div>
            </>
          )}

          {canEdit && (
            <>
              <div className="ctx-divider" />
              <div className="ctx-group">
                <button className="ctx-item danger" onClick={handleDelete}>
                  <FiTrash2 />
                  <span>{t('contextMenu.delete')}</span>
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Подменю: переместить */}
      {subMenu === 'move' && (
        <>
          <div className="ctx-sub-header">
            <button className="ctx-back" onClick={() => setSubMenu(null)}>←</button>
            <span>{t('contextMenu.moveTo')}</span>
          </div>
          <div className="ctx-divider" />
          {currentColumn && (
            <div className="ctx-current-col">
              <div className="ctx-col-dot" style={{ background: currentColumn.color }} />
              {currentColumn.title}
              <span className="ctx-current-badge">{t('contextMenu.current')}</span>
            </div>
          )}
          {otherColumns.map(col => (
            <button key={col._id} className="ctx-item" onClick={() => handleMove(col._id)}>
              <div className="ctx-col-dot" style={{ background: col.color }} />
              <span>{col.title}</span>
            </button>
          ))}
        </>
      )}

      {/* Подменю: приоритет */}
      {subMenu === 'priority' && (
        <>
          <div className="ctx-sub-header">
            <button className="ctx-back" onClick={() => setSubMenu(null)}>←</button>
            <span>{t('contextMenu.setPriority')}</span>
          </div>
          <div className="ctx-divider" />
          {priorities.map(p => (
            <button key={p.value} className="ctx-item" onClick={() => handlePriority(p.value)}>
              <div className="ctx-priority-dot" style={{ background: p.color }} />
              <span>{p.label}</span>
              {card.priority === p.value && <FiCheckSquare className="ctx-check" />}
            </button>
          ))}
        </>
      )}

      {/* Подменю: назначить */}
      {subMenu === 'assign' && (
        <>
          <div className="ctx-sub-header">
            <button className="ctx-back" onClick={() => setSubMenu(null)}>←</button>
            <span>{t('contextMenu.assign')}</span>
          </div>
          <div className="ctx-divider" />
          {members?.map(member => {
            const u = member.user;
            const isAssigned = card.assignees?.some(a => a._id === u?._id);
            return (
              <button key={u?._id} className="ctx-item" onClick={() => handleAssign(u?._id)}>
                <div className="ctx-member-avatar" style={{ background: u?.avatar || '#5865f2' }}>
                  {u?.username?.[0]?.toUpperCase()}
                </div>
                <span>{u?.displayName || u?.username}</span>
                {isAssigned && <FiCheckSquare className="ctx-check" />}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}

export default CardContextMenu;