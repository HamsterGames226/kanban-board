import React, { useState } from 'react';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { useTranslation } from '../../i18n';
import { getAvatarUrl, getInitial, getAvatarColor } from '../../utils/avatar';
import { FiX, FiUserMinus, FiChevronDown } from 'react-icons/fi';

function MembersBar({ board, currentUser, onClose, onUpdate }) {
  const { t } = useTranslation();
  const { onlineUsers } = useSocket();
  const [roleMenuFor, setRoleMenuFor] = useState(null);

  const isUserOnline = (userId) => onlineUsers.some(u => u.userId === userId) || userId === currentUser._id;
  const currentRole = () => board.members.find(m => m.user?._id === currentUser._id)?.role;
  const canManageRoles = () => ['owner', 'admin'].includes(currentRole());
  const isOwner = () => currentRole() === 'owner';

  const removeMember = async (userId) => {
    const member = board.members.find(m => m.user?._id === userId);
    if (!window.confirm(t('members.removeMemberConfirm', { name: member?.user?.username }))) return;
    try { await api.delete(`/boards/${board._id}/members/${userId}`); onUpdate(); }
    catch (err) { alert(err.response?.data?.message || t('common.error')); }
  };

  const changeRole = async (userId, newRole) => {
    try { await api.put(`/boards/${board._id}/members/${userId}/role`, { role: newRole }); setRoleMenuFor(null); onUpdate(); }
    catch (err) { alert(err.response?.data?.message || t('common.error')); }
  };

  const leaveBoard = async () => {
    if (!window.confirm(t('members.leaveBoardConfirm'))) return;
    try { await api.delete(`/boards/${board._id}/members/${currentUser._id}`); }
    catch (err) { alert(err.response?.data?.message || t('common.error')); }
  };

  const getRoleColor = (role) => ({ owner: '#fee75c', admin: '#5865f2', member: 'var(--text-muted)', viewer: 'var(--text-muted)' })[role] || 'var(--text-muted)';

  const onlineMembers = board.members.filter(m => isUserOnline(m.user?._id));
  const offlineMembers = board.members.filter(m => !isUserOnline(m.user?._id));

  const renderMember = (member, isOnline) => {
    const u = member.user;
    const avatarUrl = getAvatarUrl(u);
    const canKick = canManageRoles() && u?._id !== currentUser._id && member.role !== 'owner'
      && !(currentRole() === 'admin' && member.role === 'admin');

    return (
      <div key={u?._id} className="member-item" style={{ opacity: isOnline ? 1 : 0.5 }}>
        {avatarUrl ? (
          <div className="member-avatar" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            {isOnline && <div className="member-online-dot" />}
          </div>
        ) : (
          <div className="member-avatar" style={{ background: getAvatarColor(u) }}>
            {getInitial(u)}
            {isOnline && <div className="member-online-dot" />}
          </div>
        )}
        <div className="member-info">
          <div className="member-name">
            {u?.displayName || u?.username}
            {u?._id === currentUser._id && ` ${t('members.you')}`}
          </div>
          <div className="member-role"
            style={{ color: getRoleColor(member.role), cursor: canManageRoles() && u?._id !== currentUser._id && member.role !== 'owner' ? 'pointer' : 'default' }}
            onClick={() => {
              if (canManageRoles() && u?._id !== currentUser._id && member.role !== 'owner')
                setRoleMenuFor(roleMenuFor === u?._id ? null : u?._id);
            }}>
            {t(`members.roles.${member.role}`)}
            {canManageRoles() && u?._id !== currentUser._id && member.role !== 'owner' && <FiChevronDown size={10} style={{ marginLeft: 4 }} />}
          </div>
          {roleMenuFor === u?._id && (
            <div style={{ background: 'var(--bg-floating)', borderRadius: 8, padding: 4, marginTop: 4, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-high)' }}>
              {isOwner() && <button className="role-option" onClick={() => changeRole(u?._id, 'admin')}>{t('members.roles.admin')}</button>}
              <button className="role-option" onClick={() => changeRole(u?._id, 'member')}>{t('members.roles.member')}</button>
              <button className="role-option" onClick={() => changeRole(u?._id, 'viewer')}>{t('members.roles.viewer')}</button>
            </div>
          )}
        </div>
        {canKick && (
          <button className="member-remove-btn" onClick={() => removeMember(u?._id)} title={t('members.removeMember')}>
            <FiUserMinus />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="members-bar">
      <div className="members-bar-header">
        <h3>{t('members.title')} — {board.members.length}</h3>
        <button className="members-bar-close" onClick={onClose}><FiX /></button>
      </div>
      <div className="members-list">
        {onlineMembers.length > 0 && (
          <><div className="members-category">{t('members.online')} — {onlineMembers.length}</div>
          {onlineMembers.map(m => renderMember(m, true))}</>
        )}
        {offlineMembers.length > 0 && (
          <><div className="members-category">{t('members.offline')} — {offlineMembers.length}</div>
          {offlineMembers.map(m => renderMember(m, false))}</>
        )}
      </div>
      {board.owner?.toString() !== currentUser._id && (
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)' }}>
          <button className="sidebar-action-btn danger" onClick={leaveBoard}>{t('members.leaveBoard')}</button>
        </div>
      )}
    </div>
  );
}

export default MembersBar;