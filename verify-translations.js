#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Ler o arquivo de traduções
const translationFile = path.join(process.cwd(), 'client/src/i18n/locales/pt-PT.json');
const translations = JSON.parse(fs.readFileSync(translationFile, 'utf8'));

// Chaves que devem existir baseadas no que viste no site
const requiredKeys = [
  'navigation.reports.financial',
  'navigation.categories.finances',
  'navigation.categories.tools',
  'navigation.categories.utilities',
  'navigation.payments.expenses',
  'navigation.maintenance.pending', 
  'navigation.maintenance.request',
  'navigation.documentScan',
  'navigation.assistant',
  'navigation.settings',
  'navigation.demoData',
  'settings.tabs.language',
  'dashboard.fullDashboard',
  'dashboard.welcomeName',
  'dashboard.fullDashboardDescription',
  'dashboard.backToOverview',
  'dashboard.dailyTasks',
  'dashboard.financialSummary',
  'dashboard.todaysSchedule'
];

console.log('🔍 Verificando traduções no arquivo pt-PT.json...\n');

let missingCount = 0;
let foundCount = 0;

// Função para verificar se uma chave existe no objeto aninhado
function checkKey(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  
  return current !== undefined && current !== null && current !== '';
}

// Verificar cada chave
requiredKeys.forEach(key => {
  const exists = checkKey(translations.translation, key);
  if (exists) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], translations.translation);
    console.log(`✅ ${key}: "${value}"`);
    foundCount++;
  } else {
    console.log(`❌ ${key}: NÃO ENCONTRADA`);
    missingCount++;
  }
});

console.log('\n📊 Resumo:');
console.log(`   Traduções encontradas: ${foundCount}`);
console.log(`   Traduções em falta: ${missingCount}`);

if (missingCount > 0) {
  console.log('\n⚠️  AINDA HÁ TRADUÇÕES EM FALTA!');
  console.log('   O site continuará a mostrar as chaves em inglês.');
} else {
  console.log('\n✅ Todas as traduções estão presentes!');
}

// Verificar estrutura geral
console.log('\n📋 Estrutura do arquivo:');
console.log('   translation:', Object.keys(translations.translation || {}).join(', '));