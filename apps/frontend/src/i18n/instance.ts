import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { defaultLocale, defaultNamespace, locales, namespaces } from './config';
import { resources } from './resources';

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    initAsync: false,
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    defaultNS: defaultNamespace,
    ns: namespaces,
    resources,
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18next;
