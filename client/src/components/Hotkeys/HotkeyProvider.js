import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const HotkeyContext = createContext(null);

export function HotkeyProvider({ children }) {
  const [showHelp, setShowHelp] = useState(false);
  const handlersRef = useRef({});

  const registerHotkey = useCallback((key, handler) => {
    handlersRef.current[key] = handler;
    return () => {
      delete handlersRef.current[key];
    };
  }, []);

  const unregisterAll = useCallback(() => {
    handlersRef.current = {};
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;

      // ? — помощь (работает всегда)
      if (e.key === '?') {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        // Передаём escape дальше
        if (handlersRef.current['Escape']) {
          handlersRef.current['Escape']();
          return;
        }
        return;
      }

      // Не обрабатываем если в инпуте (кроме Escape)
      if (isInput) return;

      // Собираем комбо
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const key = e.key;

      // Проверяем комбинации с модификаторами
      if (ctrl || alt) {
        const parts = [];
        if (ctrl) parts.push('Ctrl');
        if (shift) parts.push('Shift');
        if (alt) parts.push('Alt');
        parts.push(key.toUpperCase());
        const combo = parts.join('+');

        if (handlersRef.current[combo]) {
          e.preventDefault();
          handlersRef.current[combo]();
          return;
        }
      }

      // Shift + буква
      if (shift && key.length === 1) {
        const combo = `Shift+${key.toUpperCase()}`;
        if (handlersRef.current[combo]) {
          e.preventDefault();
          handlersRef.current[combo]();
          return;
        }
      }

      // Одиночная клавиша
      const singleKey = key.length === 1 ? key.toLowerCase() : key;
      if (handlersRef.current[singleKey]) {
        e.preventDefault();
        handlersRef.current[singleKey]();
        return;
      }

      // Delete / Backspace
      if (handlersRef.current[key]) {
        e.preventDefault();
        handlersRef.current[key]();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp]);

  return (
    <HotkeyContext.Provider value={{ showHelp, setShowHelp, registerHotkey, unregisterAll }}>
      {children}
    </HotkeyContext.Provider>
  );
}

export function useHotkeys() {
  const ctx = useContext(HotkeyContext);
  if (!ctx) throw new Error('useHotkeys must be used within HotkeyProvider');
  return ctx;
}