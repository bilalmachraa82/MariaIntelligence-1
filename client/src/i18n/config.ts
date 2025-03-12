import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importando os recursos de idioma
import ptPT from './locales/pt-PT.json';
import enUS from './locales/en-US.json';
import frFR from './locales/fr-FR.json';
import esES from './locales/es-ES.json';

const resources = {
  'pt-PT': {
    translation: ptPT
  },
  'en-US': {
    translation: enUS
  },
  'fr-FR': {
    translation: frFR
  },
  'es-ES': {
    translation: esES
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-PT',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React já escapa os valores
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    }
  });

export default i18n;