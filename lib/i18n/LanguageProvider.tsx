// lib/i18n/LanguageProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Locale, getTranslation } from "./index";

const STORAGE_KEY = "myturn_lang";
const DEFAULT_LOCALE: Locale = "tr";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (path) => path,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "tr") {
        setLocaleState(saved);
      }
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>): string => {
      let str = getTranslation(locale, path);
      if (vars) {
        Object.entries(vars).forEach(([key, val]) => {
          str = str.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
        });
      }
      return str;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
