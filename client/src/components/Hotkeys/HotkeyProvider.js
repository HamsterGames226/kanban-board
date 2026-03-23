import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const HotkeyContext = createContext(null);

export function HotkeyProvider({ children }) {
  const [showHelp, setShowHelp] = useState(false);
  const [handlers, setHandlers] = useState({});

  const registerHotkey = useCallback((key, handler) => {
    setHandlers(prev => ({ ...prev, [key]: handler }));
    return () => setHandlers(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Игнорируем если фокус в инпуте
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;

      // ? или Shift+/ — помощь (работает всегда)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // Escape — закрыть помощь
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
        return;
      }

      if (isInput) return;

      const combo = [
        e.ctrlKey || e.metaKey ? 'ctrl' : '',
        e.shiftKey ? 'shift' : '',
        e.altKey ? 'alt' : '',
        e.key.toLowerCase()
      ].filter(Boolean).join('+');

      if (handlers[combo]) {
        e.preventDefault();
        handlers[combo]();
      }

      // Одиночные клавиши
      if (handlers[e.key.toLowerCase()]) {
        e.preventDefault();
        handlers[e.key.toLowerCase()]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, showHelp]);

  return (
    <HotkeyContext.Provider value={{ showHelp, setShowHelp, registerHotkey }}>
      {children}
    </HotkeyContext.Provider>
  );
}

export function useHotkeys() {
  const ctx = useContext(HotkeyContext);
  if (!ctx) throw new Error('useHotkeys must be used within HotkeyProvider');
  return ctx;
}