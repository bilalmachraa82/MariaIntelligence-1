#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Ler o arquivo de traduções atual
const translationFile = path.join(process.cwd(), 'client/src/i18n/locales/pt-PT.json');
const translations = JSON.parse(fs.readFileSync(translationFile, 'utf8'));

// Adicionar as descrições em falta
translations.translation.navigation.documentScan = {
  _self: "Scanner de Documentos",
  description: "Digitalizar e processar documentos"
};

translations.translation.navigation.assistant = {
  _self: "Assistente Maria",
  description: "Assistente inteligente"
};

// Verificar se settings.tabs existe
if (!translations.translation.settings.tabs) {
  translations.translation.settings.tabs = {};
}

// Adicionar tabs em falta
translations.translation.settings.tabs.notifications = "Notificações";
translations.translation.settings.tabs.integrations = "Integrações";

// Salvar o arquivo atualizado
fs.writeFileSync(translationFile, JSON.stringify(translations, null, 2));

console.log('✅ Descrições e traduções adicionais corrigidas!');
console.log('\n📝 Adicionadas:');
console.log('   - navigation.documentScan.description');
console.log('   - navigation.assistant.description');
console.log('   - settings.tabs.notifications');
console.log('   - settings.tabs.integrations');