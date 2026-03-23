import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ru from './locales/ru';
import en from './locales/en';

// Реестр языков: флаги удалены, добавлены короткие имена
const locales = {
  ru: { name: 'Русский', shortName: 'RU', data: ru },
  en: { name: 'English', shortName: 'EN', data: en },
};

const I18nContext = createContext(null);

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function interpolate(str, vars) {
  if (!str || !vars || typeof str !== 'string') return str;
  return Object.entries(vars).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }, str);
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem('language');
    if (saved && locales[saved]) return saved;
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && locales[browserLang]) return browserLang;
    return 'ru';
  });

  useEffect(() => {
    localStorage.setItem('language', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key, vars) => {
    const currentData = locales[locale]?.data;
    let value = getNestedValue(currentData, key);

    if (value === null || value === undefined) {
      value = getNestedValue(locales.ru?.data, key);
    }
    if (value === null || value === undefined) {
      value = getNestedValue(locales.en?.data, key);
    }

    if (value === null || value === undefined) {
      console.warn(`[i18n] Missing translation: "${key}" for locale "${locale}"`);
      return key;
    }

    if (typeof value === 'object') return value;
    return vars ? interpolate(value, vars) : value;
  }, [locale]);

  // Обновленный метод получения списка языков
  const getAvailableLocales = useCallback(() => {
    return Object.entries(locales).map(([code, { name, shortName }]) => ({
      code,
      name,
      shortName: shortName || code.toUpperCase(),
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