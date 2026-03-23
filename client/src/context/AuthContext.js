import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

// В начальном состоянии пользователя добавляется через localStorage
const loadSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('boardSettings') || '{}');
  } catch { return {}; }
};

const saveSettings = (settings) => {
  localStorage.setItem('boardSettings', JSON.stringify(settings));
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { 
      setLoading(false); 
      return; 
    }
    try {
      const res = await api.get('/auth/me');
      // При загрузке пользователя объединяем данные с сервера с локальными настройками
      setUser({
        ...res.data.user,
        settings: loadSettings()
      });
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadUser(); 
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser({
      ...res.data.user,
      settings: loadSettings()
    });
    return res.data;
  };

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', res.data.token);
    setUser({
      ...res.data.user,
      settings: loadSettings()
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (newData) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...newData };
      // Если в newData были переданы настройки, сохраняем их в localStorage
      if (newData.settings) {
        saveSettings(newData.settings);
      }
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}