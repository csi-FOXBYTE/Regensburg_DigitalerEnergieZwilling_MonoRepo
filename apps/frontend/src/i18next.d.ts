// src/@types/i18next.d.ts
import 'i18next';
import common from './i18n/locales/de/common.json';
import energyCalculation from './i18n/locales/de/energyCalculation.json';
import landingPage from './i18n/locales/de/landingPage.json';
import map from './i18n/locales/de/map.json';
import methodology from './i18n/locales/de/methodology.json';
import municipality from './i18n/locales/de/municipality.json';
import progressBar from './i18n/locales/de/progressBar.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      energyCalculation: typeof energyCalculation;
      progressBar: typeof progressBar;
      landingPage: typeof landingPage;
      map: typeof map;
      methodology: typeof methodology;
      municipality: typeof municipality;
    };
  }
}
