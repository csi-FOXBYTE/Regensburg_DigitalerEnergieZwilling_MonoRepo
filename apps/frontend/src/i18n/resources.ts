import deCommon from './locales/de/common.json';
import deEnergyCalculation from './locales/de/energyCalculation.json';
import deLandingPage from './locales/de/landingPage.json';
import deMap from './locales/de/map.json';
import deMethodology from './locales/de/methodology.json';
import deMunicipality from './locales/de/municipality.json';
import deProgressBar from './locales/de/progressBar.json';
import enCommon from './locales/en/common.json';
import enEnergyCalculation from './locales/en/energyCalculation.json';
import enLandingPage from './locales/en/landingPage.json';
import enMap from './locales/en/map.json';
import enMethodology from './locales/en/methodology.json';
import enMunicipality from './locales/en/municipality.json';
import enProgressBar from './locales/en/progressBar.json';

export const resources = {
  de: {
    common: deCommon,
    energyCalculation: deEnergyCalculation,
    landingPage: deLandingPage,
    map: deMap,
    methodology: deMethodology,
    municipality: deMunicipality,
    progressBar: deProgressBar,
  },
  en: {
    common: enCommon,
    energyCalculation: enEnergyCalculation,
    landingPage: enLandingPage,
    map: enMap,
    methodology: enMethodology,
    municipality: enMunicipality,
    progressBar: enProgressBar,
  },
} as const;
