import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importando os recursos de idioma
import ptPT from './locales/pt-PT.json';
import enGB from './locales/en-GB.json';

const resources = {
  'pt-PT': ptPT,
  'en-GB': enGB,
  // Adicionar aliases para variantes de idioma
  'pt': ptPT,
  'pt-BR': ptPT,
  'en': enGB,
  'en-US': enGB
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