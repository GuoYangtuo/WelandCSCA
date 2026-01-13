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

// 深度 Partial 类型，允许其他语言文件缺少部分字段
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// zh 和 en 需要完整翻译，其他语言可以缺少部分字段
export type PartialTranslations = DeepPartial<Translations>;

export const translations: Record<Language, Translations | PartialTranslations> = {
  zh,
  en,
  es: es as PartialTranslations,
  ru: ru as PartialTranslations,
  fr: fr as PartialTranslations,
  ar: ar as PartialTranslations,
  ja: ja as PartialTranslations,
  vi: vi as PartialTranslations,
  th: th as PartialTranslations,
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

