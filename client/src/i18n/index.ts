import { zh } from './locales/zh';
import { en } from './locales/en';
import { es } from './locales/es';
import { ru } from './locales/ru';
import { fr } from './locales/fr';
import { ar } from './locales/ar';

export type Language = 'zh' | 'en' | 'es' | 'ru' | 'fr' | 'ar';
export type Translations = typeof zh;

export const translations: Record<Language, Translations> = {
  zh,
  en,
  es,
  ru,
  fr,
  ar,
};

export const languageNames: Record<Language, string> = {
  zh: '中文',
  en: 'English',
  es: 'Español',
  ru: 'Русский',
  fr: 'Français',
  ar: 'العربية',
};

export { zh, en, es, ru, fr, ar };

