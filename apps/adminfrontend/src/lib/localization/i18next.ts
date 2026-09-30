import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { en } from "../../locales/en";

//Add Supported Locales here (For example "de")
export const supportedLngs = ["en"] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
    },
    supportedLngs: [...supportedLngs],
    fallbackLng: "en", // Set fallback language here
    defaultNS: "translation",

    returnNull: false,
    interpolation: { escapeValue: false },

    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },

    load: "languageOnly",

    debug: import.meta.env.DEV,
  });

export default i18n;
