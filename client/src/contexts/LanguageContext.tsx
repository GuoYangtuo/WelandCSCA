import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { translations, Language, Translations, zh } from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 深度合并函数：将部分翻译与默认翻译(zh)合并，缺失的字段回退到zh
function deepMerge<T extends object>(defaultObj: T, partialObj: Partial<T> | undefined): T {
  if (!partialObj) return defaultObj;
  
  const result = { ...defaultObj };
  
  for (const key in partialObj) {
    if (Object.prototype.hasOwnProperty.call(partialObj, key)) {
      const defaultValue = defaultObj[key as keyof T];
      const partialValue = partialObj[key as keyof T];
      
      if (
        partialValue !== undefined &&
        typeof defaultValue === 'object' &&
        defaultValue !== null &&
        typeof partialValue === 'object' &&
        partialValue !== null &&
        !Array.isArray(defaultValue)
      ) {
        // 递归合并嵌套对象
        (result as Record<string, unknown>)[key] = deepMerge(
          defaultValue as object,
          partialValue as Partial<object>
        );
      } else if (partialValue !== undefined) {
        // 使用部分翻译的值
        (result as Record<string, unknown>)[key] = partialValue;
      }
    }
  }
  
  return result;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage必须在LanguageProvider内使用');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'zh';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // 使用 useMemo 缓存合并后的翻译，缺失字段自动回退到 zh
  const t = useMemo(() => {
    const currentTranslations = translations[language];
    // zh 和 en 是完整的，其他语言可能缺少部分字段，需要与 zh 合并
    if (language === 'zh') {
      return currentTranslations as Translations;
    }
    return deepMerge(zh, currentTranslations as Partial<Translations>);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

