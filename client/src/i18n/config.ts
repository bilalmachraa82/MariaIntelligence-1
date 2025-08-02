import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importando apenas o recurso de português
import ptPT from './locales/pt-PT.json';

// Configuração simplificada apenas para português
const resources = {
  'pt-PT': ptPT,
  'pt': ptPT,
  'pt-BR': ptPT
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt-PT',
    fallbackLng: 'pt-PT',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React já escapa os valores
    },
    // Garantir que as chaves de dashboard sejam corretamente acessadas
    keySeparator: '.',
    parseMissingKeyHandler: (key) => {
      // Em ambiente de produção, registar erro para monitorização
      if (process.env.NODE_ENV === 'production') {
        console.error(`ERRO CRÍTICO: Chave de tradução em falta: ${key}`);
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

console.log('i18n inicializado apenas com português');

export default i18n;