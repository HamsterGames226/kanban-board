import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { FiLayout } from 'react-icons/fi';
import './Auth.css';

function Register() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError(t('auth.passwordsNotMatch')); return; }
    if (password.length < 6) { setError(t('auth.passwordMinLength')); return; }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><FiLayout /></div>
          <span className="auth-logo-text">TaskBoard</span>
        </div>
        <h1>{t('auth.createAccount')}</h1>
        <p className="subtitle">{t('auth.createSubtitle')}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('auth.username')} <span className="required">{t('common.required')}</span></label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={t('auth.chooseName')} required minLength={3} maxLength={30} />
          </div>
          <div className="form-group">
            <label>{t('auth.email')} <span className="required">{t('common.required')}</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth.enterEmail')} required />
          </div>
          <div className="form-group">
            <label>{t('auth.password')} <span className="required">{t('common.required')}</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.createPassword')} required minLength={6} />
          </div>
          <div className="form-group">
            <label>{t('auth.confirmPassword')} <span className="required">{t('common.required')}</span></label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('auth.repeatPassword')} required />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </button>
        </form>
        <p className="auth-footer">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;