import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { getAvatarUrl, getInitial, getAvatarColor } from '../../utils/avatar';
import { FiLayout, FiLogOut, FiHome, FiChevronDown, FiSettings } from 'react-icons/fi';
import './Navbar.css';

function Navbar() {
  const { t, locale, setLocale, getAvailableLocales } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const avatarUrl = getAvatarUrl(user);
  const availableLocales = getAvailableLocales();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-logo"><FiLayout /></div>
          <span>TaskBoard</span>
        </Link>
      </div>
      <div className="navbar-center">
        <Link to="/dashboard" className="nav-link"><FiHome /><span>{t('nav.home')}</span></Link>
      </div>
      <div className="navbar-right">
        {/* Language switcher */}
        <div className="lang-switcher">
          {availableLocales.map(l => (
            <button
              key={l.code}
              className={`lang-btn ${locale === l.code ? 'active' : ''}`}
              onClick={() => setLocale(l.code)}
              title={l.name}
            >
              {l.flag}
            </button>
          ))}
        </div>

        <div className="user-menu" onClick={() => setShowDropdown(!showDropdown)}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="user-avatar-img" />
          ) : (
            <div className="user-avatar" style={{ background: getAvatarColor(user) }}>
              {getInitial(user)}
            </div>
          )}
          <span className="user-name">{user?.displayName || user?.username}</span>
          <FiChevronDown className={`dropdown-arrow ${showDropdown ? 'open' : ''}`} />
          {showDropdown && (
            <>
              <div className="dropdown-overlay" onClick={e => { e.stopPropagation(); setShowDropdown(false); }} />
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="user-avatar-img large" />
                  ) : (
                    <div className="user-avatar large" style={{ background: getAvatarColor(user) }}>
                      {getInitial(user)}
                    </div>
                  )}
                  <div>
                    <div className="dropdown-username">{user?.displayName || user?.username}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                  <FiSettings /><span>{t('nav.settings')}</span>
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <FiLogOut /><span>{t('auth.logout')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;