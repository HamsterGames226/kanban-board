import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ru from './locales/ru';
import en from './locales/en';

// Реестр всех языков — добавляй новые сюда
const locales = {
  ru: { name: 'Русский', flag: '🇷🇺', data: ru },
  en: { name: 'English', flag: '🇬🇧', data: en },
  // Пример добавления нового языка:
  // de: { name: 'Deutsch', flag: '🇩🇪', data: de },
  // fr: { name: 'Français', flag: '🇫🇷', data: fr },
  // es: { name: 'Español', flag: '🇪🇸', data: es },
  // uk: { name: 'Українська', flag: '🇺🇦', data: uk },
  // ja: { name: '日本語', flag: '🇯🇵', data: ja },
};

const I18nContext = createContext(null);

/**
 * Получить значение по вложенному ключу 'auth.login' из объекта
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * Подставить переменные: 'Привет, {name}!' → 'Привет, Вася!'
 */
function interpolate(str, vars) {
  if (!str || !vars || typeof str !== 'string') return str;
  return Object.entries(vars).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }, str);
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    // Приоритет: localStorage → настройка пользователя → браузер → ru
    const saved = localStorage.getItem('language');
    if (saved && locales[saved]) return saved;

    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && locales[browserLang]) return browserLang;

    return 'ru';
  });

  // Сохранять выбор
  useEffect(() => {
    localStorage.setItem('language', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  /**
   * Функция перевода
   * t('auth.login') → 'Войти'
   * t('dashboard.welcome', { name: 'Вася' }) → 'Добро пожаловать, Вася! 👋'
   * t('dashboard.members', { count: 5 }) → '5 участников'
   */
  const t = useCallback((key, vars) => {
    const currentData = locales[locale]?.data;
    let value = getNestedValue(currentData, key);

    // Fallback на русский, потом на английский
    if (value === null || value === undefined) {
      value = getNestedValue(locales.ru?.data, key);
    }
    if (value === null || value === undefined) {
      value = getNestedValue(locales.en?.data, key);
    }

    // Если не нашли — вернуть ключ
    if (value === null || value === undefined) {
      console.warn(`[i18n] Missing translation: "${key}" for locale "${locale}"`);
      return key;
    }

    // Если это объект — вернуть как есть (для вложенных структур)
    if (typeof value === 'object') return value;

    // Подставить переменные
    return vars ? interpolate(value, vars) : value;
  }, [locale]);

  /**
   * Получить список доступных языков
   */
  const getAvailableLocales = useCallback(() => {
    return Object.entries(locales).map(([code, { name, flag }]) => ({
      code,
      name,
      flag,
    }));
  }, []);

  const changeLocale = useCallback((newLocale) => {
    if (locales[newLocale]) {
      setLocale(newLocale);
    }
  }, []);

  return (
    <I18nContext.Provider value={{
      t,
      locale,
      setLocale: changeLocale,
      getAvailableLocales,
      locales: Object.keys(locales),
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

export default I18nProvider;