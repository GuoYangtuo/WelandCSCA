import { zh } from './locales/zh';
import { en } from './locales/en';
import { es } from './locales/es';
import { ru } from './locales/ru';
import { fr } from './locales/fr';
import { ar } from './locales/ar';
import { ja } from './locales/ja';
import { vi } from './locales/vi';
import { th } from './locales/th';

export type Language = 'zh' | 'en' | 'es' | 'ru' | 'fr' | 'ar' | 'ja' | 'vi' | 'th';
export type Translations = typeof zh;

export const translations: Record<Language, Translations> = {
  zh,
  en,
  es,
  ru,
  fr,
  ar,
  ja,
  vi,
  th,
};

export const languageNames: Record<Language, string> = {
  zh: '中文',
  en: 'English',
  es: 'Español',
  ru: 'Русский',
  fr: 'Français',
  ar: 'العربية',
  ja: '日本語',
  vi: 'Tiếng Việt',
  th: 'ไทย',
};

export { zh, en, es, ru, fr, ar, ja, vi, th };

