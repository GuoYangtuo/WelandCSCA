import { zh } from './locales/zh';
import { en } from './locales/en';
import { es } from './locales/es';

export type Language = 'zh' | 'en' | 'es';
export type Translations = typeof zh;

export const translations: Record<Language, Translations> = {
  zh,
  en,
  es,
};

export const languageNames: Record<Language, string> = {
  zh: '中文',
  en: 'English',
  es: 'Español',
};

export { zh, en, es };

