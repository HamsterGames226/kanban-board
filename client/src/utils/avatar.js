import { SERVER_URL } from './api';

export function getAvatarUrl(user) {
  if (!user) return null;
  if (user.customAvatar) {
    // Если уже полный URL
    if (user.customAvatar.startsWith('http')) return user.customAvatar;
    return `${SERVER_URL}${user.customAvatar}`;
  }
  return null;
}

export function getInitial(user) {
  if (!user) return '?';
  const name = user.displayName || user.username || '';
  return name[0]?.toUpperCase() || '?';
}

export function getAvatarColor(user) {
  if (!user) return '#5865f2';
  return user.avatar || '#5865f2';
}

// Универсальный компонент-рендерер аватарки
export function renderAvatar(user, size = 28, className = '') {
  const url = getAvatarUrl(user);
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.max(size * 0.4, 10),
    fontWeight: 700,
    color: 'white',
    flexShrink: 0,
    overflow: 'hidden',
  };

  if (url) {
    return (
      <div className={className} style={{ ...style, padding: 0 }}>
        <img
          src={url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    );
  }

  return (
    <div className={className} style={{ ...style, background: getAvatarColor(user) }}>
      {getInitial(user)}
    </div>
  );
}