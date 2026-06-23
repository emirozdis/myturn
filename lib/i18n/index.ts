// lib/i18n/index.ts
// MyTurn — i18n barrel file

import { enTranslations } from "./en";
import { trTranslations } from "./tr";

export type Locale = "en" | "tr";

const translations = {
  en: enTranslations,
  tr: trTranslations,
} as const;

export type TranslationKey = keyof typeof translations.en;
export type Translations = typeof translations.en;

// Flat accessor helper — supports "section.key" dot notation
export function getTranslation(locale: Locale, path: string): string {
  const parts = path.split(".");
  let obj: any = translations[locale];
  for (const part of parts) {
    if (obj == null) break;
    obj = obj[part];
  }
  if (typeof obj === "string") return obj;
  // Fallback to English if key is missing in translation
  obj = translations.en;
  for (const part of parts) {
    if (obj == null) break;
    obj = obj[part];
  }
  return typeof obj === "string" ? obj : path;
}

export { translations };
