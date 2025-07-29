import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importando os recursos de idioma
import ptPT from './locales/pt-PT.json';
import enGB from './locales/en-GB.json';

// Certificando-se de que todos os namespaces são incluídos corretamente
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
    },
    // Garantir que as chaves de dashboard sejam corretamente acessadas
    keySeparator: '.',
    parseMissingKeyHandler: (key) => {
      // Em ambiente de produção, registar erro para monitorização
      if (process.env.NODE_ENV === 'production') {
        console.error(`ERRO CRÍTICO: Chave de tradução em falta: ${key}`);
        // Em produção, lançar erro para falhar o build se configurado
        if (process.env.FAIL_ON_MISSING_TRANSLATION === 'true') {
          throw new Error(`Chave de tradução em falta: ${key}`);
        }
      } else {
        // Em desenvolvimento, apenas avisar
        console.warn(`Chave de tradução em falta: ${key}`);
      }
      
      // Extrair valor padrão (texto após a última vírgula)
      const parts = key.split(',');
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
      return key;
    }
  });

// Adicionar alguns registros para debug
console.log('i18n inicializado com os seguintes recursos:', 
  Object.keys(resources).map(lang => {
    const resourceLang = lang as keyof typeof resources;
    return {
      lang,
      hasTranslation: !!resources[resourceLang],
      dashboardKeys: resources[resourceLang]?.translation?.dashboard ? 
        Object.keys(resources[resourceLang].translation.dashboard) : []
    };
  })
);

export default i18n;