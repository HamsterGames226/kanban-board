import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTranslation } from '../../i18n';
import { renderAvatar } from '../../utils/avatar';
import api from '../../utils/api';
import ColumnComponent from './Column';
import CardModal from './CardModal';
import InviteModal from './InviteModal';
import MembersBar from './MembersBar';
import BoardSettingsModal from './BoardSettingsModal';
import { FiPlus, FiUserPlus, FiUsers, FiSettings, FiEyeOff } from 'react-icons/fi';
import './Board.css';

function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const { t } = useTranslation();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);

  // ===== Роль текущего пользователя =====
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
    if (isViewer()) return; // Наблюдатели не могут перетаскивать

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
      } catch (err) { fetchBoard(); }
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
    } catch (err) { fetchBoard(); }
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
      case 'color':
        return { background: bg.value };
      case 'gradient':
        return { background: bg.value };
      case 'image':
        return {
          backgroundImage: `url(${bg.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      default:
        return {};
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>{t('board.loadingBoard')}</p>
      </div>
    );
  }

  if (!board) {
    return <div className="loading-screen"><p>{t('board.boardNotFound')}</p></div>;
  }

  return (
    <div className="board-page">
      {!connected && (
        <div className="reconnecting-bar">{t('common.reconnecting')}</div>
      )}

      {/* Баннер наблюдателя */}
      {isViewer() && (
        <div className="viewer-banner">
          <FiEyeOff size={14} />
          <span>{t('board.viewerCantEdit')}</span>
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

          <button className="board-action-btn" onClick={() => setShowMembers(!showMembers)}>
            <FiUsers /><span>{t('board.members')}</span>
          </button>

          {isAdminOrOwner() && (
            <button className="board-action-btn" onClick={() => setShowSettings(true)}>
              <FiSettings /><span>{t('nav.settings')}</span>
            </button>
          )}

          <button className="board-action-btn accent" onClick={() => setShowInvite(true)}>
            <FiUserPlus /><span>{t('board.invite')}</span>
          </button>
        </div>
      </div>

      {/* ===== КОНТЕНТ ===== */}
      <div className="board-container" style={getBoardBackground()}>
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
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Добавить столбец — только для member+ */}
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

        {showMembers && (
          <MembersBar board={board} currentUser={user}
            onClose={() => setShowMembers(false)} onUpdate={fetchBoard} />
        )}
      </div>

      {/* Модалки */}
      {selectedCard && (
        <CardModal card={selectedCard} boardId={board._id} members={board.members}
          userRole={getUserRole()} onClose={() => setSelectedCard(null)} onUpdate={fetchBoard} />
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