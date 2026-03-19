import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { FiLayout } from 'react-icons/fi';
import './Auth.css';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginError'));
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
        <h1>{t('auth.welcomeBack')}</h1>
        <p className="subtitle">{t('auth.welcomeSubtitle')}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('auth.email')} <span className="required">{t('common.required')}</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth.enterEmail')} required />
          </div>
          <div className="form-group">
            <label>{t('auth.password')} <span className="required">{t('common.required')}</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.enterPassword')} required />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>
        <p className="auth-footer">
          {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;