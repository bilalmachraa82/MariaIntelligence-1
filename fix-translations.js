#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Ler o arquivo de traduções atual
const translationFile = path.join(process.cwd(), 'client/src/i18n/locales/pt-PT.json');
const translations = JSON.parse(fs.readFileSync(translationFile, 'utf8'));

// Adicionar traduções em falta
const missingTranslations = {
  "navigation": {
    "home": "Início",
    "bookings": "Reservas", 
    "properties": "Propriedades",
    "owners": "Proprietários",
    "reports": "Relatórios",
    "cleaning": {
      "teams": "Equipas de Limpeza",
      "schedules": "Calendário de Limpeza"
    },
    "payments": {
      "expected": "Pagamentos Esperados",
      "income": "Rendimentos Consolidados"
    },
    "quotations": "Orçamentos",
    "categories": {
      "main": "Principal",
      "financial": "Financeiro",
      "operations": "Operações"
    }
  },
  "settings": {
    "title": "Definições",
    "general": {
      "title": "Geral",
      "description": "Configurações gerais do sistema",
      "timezone": "Fuso Horário"
    },
    "tabs": {
      "general": "Geral",
      "notifications": "Notificações", 
      "account": "Conta",
      "integrations": "Integrações"
    },
    ...translations.translation.settings // Manter as traduções existentes
  }
};

// Mesclar com as traduções existentes
const updatedTranslations = {
  translation: {
    ...translations.translation,
    ...missingTranslations
  }
};

// Salvar o arquivo atualizado
fs.writeFileSync(translationFile, JSON.stringify(updatedTranslations, null, 2));

console.log('✅ Traduções atualizadas com sucesso!');
console.log('📝 Adicionadas traduções para:');
console.log('   - navigation.*');
console.log('   - settings.title');
console.log('   - settings.general.*');
console.log('   - settings.tabs.*');