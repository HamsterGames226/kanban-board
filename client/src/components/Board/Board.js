import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTranslation } from '../../i18n';
import { useHotkeys } from '../Hotkeys/HotkeyProvider';
import { renderAvatar } from '../../utils/avatar';
import api from '../../utils/api';
import ColumnComponent from './Column';
import CardModal from './CardModal';
import InviteModal from './InviteModal';
import MembersBar from './MembersBar';
import BoardSettingsModal from './BoardSettingsModal';
import CalendarView from './CalendarView';
import GraphView from './GraphView';
import { FiPlus, FiUserPlus, FiUsers, FiSettings, FiEyeOff, FiColumns, FiCalendar, FiShare2 } from 'react-icons/fi';
import './Board.css';

function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const { t } = useTranslation();
  const { registerHotkey, unregisterAll } = useHotkeys();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [quickAddColumnIndex, setQuickAddColumnIndex] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');

  const [showDescPreview] = useState(() => {
    return localStorage.getItem('showDescPreview') !== 'false';
  });

  // ===== Роли =====
  const getUserRole = useCallback(() => {
    const member = board?.members?.find(m => m.user?._id === user._id);
    return member?.role || 'viewer';
  }, [board, user._id]);

  const isViewer = useCallback(() => getUserRole() === 'viewer', [getUserRole]);
  const canEdit = useCallback(() => ['member', 'admin', 'owner'].includes(getUserRole()), [getUserRole]);
  const isAdminOrOwner = useCallback(() => ['admin', 'owner'].includes(getUserRole()), [getUserRole]);

  // ===== Загрузка доски =====
  const fetchBoard = useCallback(async () => {
    try {
      const res = await api.get(`/boards/${id}`);
      setBoard(res.data);

      if (selectedCard) {
        for (const col of res.data.columns) {
          const updated = col.cards.find(c => c._id === selectedCard._id);
          if (updated) { setSelectedCard(updated); break; }
        }
      }
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  // ===== Горячие клавиши =====
  useEffect(() => {
    const unsubs = [];

    // H — на главную
    unsubs.push(registerHotkey('h', () => {
      if (!selectedCard && !showInvite && !showSettings) {
        navigate('/dashboard');
      }
    }));

    // P — профиль
    unsubs.push(registerHotkey('p', () => {
      if (!selectedCard && !showInvite && !showSettings) {
        navigate('/profile');
      }
    }));

    // N — новая карточка (в первом столбце)
    unsubs.push(registerHotkey('n', () => {
      if (!selectedCard && !showInvite && !showSettings && board?.columns?.length > 0) {
        setQuickAddColumnIndex(0);
      }
    }));

    // Shift+N — новый столбец
    unsubs.push(registerHotkey('Shift+N', () => {
      if (!selectedCard && !showInvite && !showSettings) {
        setAddingColumn(true);
        // Фокус на input через небольшую задержку
        setTimeout(() => {
          const input = document.querySelector('.add-column-form input');
          if (input) input.focus();
        }, 100);
      }
    }));

    // M — участники
    unsubs.push(registerHotkey('m', () => {
      if (!selectedCard && !showInvite && !showSettings) {
        setShowMembers(prev => !prev);
      }
    }));

    // I — пригласить
    unsubs.push(registerHotkey('i', () => {
      if (!selectedCard && !showSettings) {
        setShowInvite(prev => !prev);
      }
    }));

    // G — настройки доски (для admin/owner)
    unsubs.push(registerHotkey('g', () => {
      if (!selectedCard && !showInvite && board) {
        const role = board.members?.find(m => m.user?._id === user._id)?.role;
        if (role === 'admin' || role === 'owner') {
          setShowSettings(prev => !prev);
        }
      }
    }));

    // Escape — закрыть всё
    unsubs.push(registerHotkey('Escape', () => {
      if (selectedCard) { setSelectedCard(null); return; }
      if (showInvite) { setShowInvite(false); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (showMembers) { setShowMembers(false); return; }
      if (addingColumn) { setAddingColumn(false); return; }
      if (quickAddColumnIndex !== null) { setQuickAddColumnIndex(null); return; }
    }));

    // 1, 2, 3 — переключение видов
    unsubs.push(registerHotkey('1', () => {
      if (!selectedCard && !showInvite && !showSettings) setViewMode('kanban');
    }));
    unsubs.push(registerHotkey('2', () => {
      if (!selectedCard && !showInvite && !showSettings) setViewMode('calendar');
    }));
    unsubs.push(registerHotkey('3', () => {
      if (!selectedCard && !showInvite && !showSettings) setViewMode('graph');
    }));

    return () => {
      unsubs.forEach(fn => fn && fn());
    };
  }, [
    registerHotkey, navigate, board, user._id,
    selectedCard, showInvite, showSettings, showMembers,
    addingColumn, quickAddColumnIndex
  ]);

  // ===== Socket =====
  useEffect(() => {
    if (!socket || !id || !connected) return;
    socket.emit('board:join', id);

    const handleRefresh = () => fetchBoard();
    const handleMemberRemoved = ({ userId }) => {
      if (userId === user._id) navigate('/dashboard');
      else fetchBoard();
    };
    const handleBoardDeleted = ({ boardId }) => {
      if (boardId === id) navigate('/dashboard');
    };

    socket.on('board:refresh', handleRefresh);
    socket.on('member:joined', handleRefresh);
    socket.on('member:removed', handleMemberRemoved);
    socket.on('board:deleted', handleBoardDeleted);

    return () => {
      socket.emit('board:leave', id);
      socket.off('board:refresh', handleRefresh);
      socket.off('member:joined', handleRefresh);
      socket.off('member:removed', handleMemberRemoved);
      socket.off('board:deleted', handleBoardDeleted);
    };
  }, [socket, id, connected, user._id, navigate, fetchBoard]);

  // ===== Drag & Drop =====
  const handleDragEnd = async (result) => {
    if (isViewer()) return;
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'column') {
      const newColumns = Array.from(board.columns);
      const [moved] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, moved);
      setBoard(prev => ({ ...prev, columns: newColumns }));
      try {
        await api.put(`/columns/reorder/${board._id}`, { columnOrder: newColumns.map(c => c._id) });
      } catch { fetchBoard(); }
      return;
    }

    const sourceColumn = board.columns.find(c => c._id === source.droppableId);
    const destColumn = board.columns.find(c => c._id === destination.droppableId);
    if (!sourceColumn || !destColumn) return;

    const sourceCards = Array.from(sourceColumn.cards);
    const [movedCard] = sourceCards.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceCards.splice(destination.index, 0, movedCard);
      setBoard(prev => ({
        ...prev, columns: prev.columns.map(col =>
          col._id === source.droppableId ? { ...col, cards: sourceCards } : col)
      }));
    } else {
      const destCards = Array.from(destColumn.cards);
      destCards.splice(destination.index, 0, movedCard);
      setBoard(prev => ({
        ...prev, columns: prev.columns.map(col => {
          if (col._id === source.droppableId) return { ...col, cards: sourceCards };
          if (col._id === destination.droppableId) return { ...col, cards: destCards };
          return col;
        })
      }));
    }

    try {
      await api.put(`/cards/${movedCard._id}/move`, {
        sourceColumnId: source.droppableId,
        destColumnId: destination.droppableId,
        newOrder: destination.index
      });
    } catch { fetchBoard(); }
  };

  // ===== Добавить столбец =====
  const addColumn = async () => {
    if (!newColumnTitle.trim() || isViewer()) return;
    try {
      await api.post('/columns', { title: newColumnTitle, boardId: board._id });
      setNewColumnTitle('');
      setAddingColumn(false);
    } catch (err) { console.error(err); }
  };

  // ===== Фон доски =====
  const getBoardBackground = () => {
    const bg = board?.background;
    if (!bg || !bg.value) return {};
    switch (bg.type) {
      case 'color': return { background: bg.value };
      case 'gradient': return { background: bg.value };
      case 'image': return {
        backgroundImage: `url(${bg.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
      default: return {};
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner" /><p>{t('board.loadingBoard')}</p></div>;
  }

  if (!board) {
    return <div className="loading-screen"><p>{t('board.boardNotFound')}</p></div>;
  }

  return (
    <div className="board-page">
      {!connected && <div className="reconnecting-bar">{t('common.reconnecting')}</div>}

      {isViewer() && (
        <div className="viewer-banner">
          <FiEyeOff size={14} /><span>{t('board.viewerCantEdit')}</span>
        </div>
      )}

      {/* ===== ШАПКА ===== */}
      <div className="board-header">
        <div className="board-header-left">
          <h2 className="board-title">{board.title}</h2>
          {board.description && <span className="board-desc">{board.description}</span>}
        </div>

        <div className="board-header-right">
          <div className="board-members-preview">
            {board.members?.slice(0, 5).map(member => (
              <div key={member.user?._id} className="header-member-avatar-wrap"
                title={`${member.user?.displayName || member.user?.username} — ${t(`members.roleNames.${member.role}`)}`}>
                {renderAvatar(member.user, 28, 'header-member-avatar')}
              </div>
            ))}
            {board.members?.length > 5 && (
              <div className="header-member-avatar more">+{board.members.length - 5}</div>
            )}
          </div>

          <div className="view-switcher-premium">
            <button className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`} 
              onClick={() => setViewMode('kanban')} title={t('board.kanban')}>
              <FiColumns />
            </button>
            <button className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')} title={t('board.calendar')}>
              <FiCalendar />
            </button>
            <button className={`view-btn ${viewMode === 'graph' ? 'active' : ''}`}
              onClick={() => setViewMode('graph')} title={t('board.graph')}>
              <FiShare2 />
            </button>
          </div>

          <button className="board-action-btn" onClick={() => setShowMembers(!showMembers)}
            title="M">
            <FiUsers /><span>{t('board.members')}</span>
          </button>

          {isAdminOrOwner() && (
            <button className="board-action-btn" onClick={() => setShowSettings(true)}
              title="G">
              <FiSettings /><span>{t('nav.settings')}</span>
            </button>
          )}

          <button className="board-action-btn accent" onClick={() => setShowInvite(true)}
            title="I">
            <FiUserPlus /><span>{t('board.invite')}</span>
          </button>
        </div>
      </div>

      {/* ===== КОНТЕНТ ===== */}
      <div className="board-container" style={getBoardBackground()}>
        {viewMode === 'calendar' ? (
          <CalendarView 
            columns={board.columns} 
            onCardClick={setSelectedCard}
            savedLabels={board.savedLabels}
            boardId={board._id}
            members={board.members}
            userRole={getUserRole()}
            onUpdate={fetchBoard}
          />
        ) : viewMode === 'graph' ? (
          <GraphView 
            board={board} 
            onCardClick={setSelectedCard}
            boardId={board._id}
            members={board.members}
            userRole={getUserRole()}
            onUpdate={fetchBoard}
          />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board" direction="horizontal" type="column">
              {(provided) => (
                <div className="board-columns" ref={provided.innerRef} {...provided.droppableProps}>
                  {board.columns.map((column, index) => (
                    <Draggable key={column._id} draggableId={column._id} index={index}
                      isDragDisabled={isViewer()}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}
                          className={`column-wrapper ${snapshot.isDragging ? 'dragging' : ''}`}>
                          <ColumnComponent
                            column={column}
                            boardId={board._id}
                            dragHandleProps={provided.dragHandleProps}
                            onCardClick={setSelectedCard}
                            onUpdate={fetchBoard}
                            members={board.members}
                            userRole={getUserRole()}
                            allColumns={board.columns}
                            showDescPreview={showDescPreview}
                            savedLabels={board.savedLabels}
                            forceAddCard={quickAddColumnIndex === index}
                            onCancelQuickAdd={() => setQuickAddColumnIndex(null)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {canEdit() && (
                    <div className="add-column-wrapper">
                      {addingColumn ? (
                        <div className="add-column-form">
                          <input type="text" value={newColumnTitle}
                            onChange={(e) => setNewColumnTitle(e.target.value)}
                            placeholder={t('board.columnTitle')} autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addColumn();
                              if (e.key === 'Escape') setAddingColumn(false);
                            }}
                          />
                          <div className="add-column-actions">
                            <button className="btn-primary btn-sm" onClick={addColumn}>{t('common.add')}</button>
                            <button className="btn-ghost btn-sm" onClick={() => setAddingColumn(false)}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <button className="add-column-btn" onClick={() => setAddingColumn(true)}>
                          <FiPlus /><span>{t('board.addColumn')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {showMembers && (
          <MembersBar board={board} currentUser={user}
            onClose={() => setShowMembers(false)} onUpdate={fetchBoard} />
        )}
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={board._id}
          members={board.members}
          userRole={getUserRole()}
          savedLabels={board.savedLabels}
          onClose={() => setSelectedCard(null)}
          onUpdate={fetchBoard}
        />
      )}
      {showInvite && (
        <InviteModal board={board} onClose={() => setShowInvite(false)} onUpdate={fetchBoard} />
      )}
      {showSettings && (
        <BoardSettingsModal board={board} onClose={() => setShowSettings(false)} onUpdate={fetchBoard} />
      )}
    </div>
  );
}

export default Board;