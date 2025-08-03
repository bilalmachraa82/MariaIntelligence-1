#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Ler o arquivo de traduções atual
const translationFile = path.join(process.cwd(), 'client/src/i18n/locales/pt-PT.json');
const translations = JSON.parse(fs.readFileSync(translationFile, 'utf8'));

// Todas as traduções em falta identificadas
const missingTranslations = {
  navigation: {
    ...translations.translation.navigation,
    reports: {
      financial: "Relatórios Financeiros"
    },
    categories: {
      finances: "Finanças",
      tools: "Ferramentas", 
      utilities: "Utilitários"
    },
    payments: {
      expenses: "Despesas",
      expected: "Pagamentos Esperados",
      income: "Rendimentos Consolidados"
    },
    maintenance: {
      pending: "Manutenção Pendente",
      request: "Solicitar Manutenção"
    },
    documentScan: "Scanner de Documentos",
    assistant: "Assistente Maria",
    settings: "Configurações",
    demoData: "Dados de Demonstração"
  },
  settings: {
    ...translations.translation.settings,
    tabs: {
      ...translations.translation.settings.tabs,
      language: "Idioma"
    }
  },
  dashboard: {
    fullDashboard: "Painel Completo",
    welcomeName: "Bem-vindo",
    fullDashboardDescription: "Visão geral completa do seu negócio",
    backToOverview: "Voltar à Visão Geral",
    dailyTasks: "Tarefas Diárias",
    financialSummary: "Resumo Financeiro",
    todaysSchedule: "Agenda de Hoje",
    ...translations.translation.dashboard
  }
};

// Mesclar com as traduções existentes preservando as existentes
const updatedTranslations = {
  translation: {
    ...translations.translation,
    navigation: {
      ...translations.translation.navigation,
      ...missingTranslations.navigation,
      // Garantir que as subcategorias são mescladas corretamente
      reports: {
        ...translations.translation.navigation?.reports,
        ...missingTranslations.navigation.reports
      },
      categories: {
        ...translations.translation.navigation?.categories,
        ...missingTranslations.navigation.categories
      },
      payments: {
        ...translations.translation.navigation?.payments,
        ...missingTranslations.navigation.payments
      },
      maintenance: {
        ...translations.translation.navigation?.maintenance,
        ...missingTranslations.navigation.maintenance
      }
    },
    settings: missingTranslations.settings,
    dashboard: missingTranslations.dashboard
  }
};

// Salvar o arquivo atualizado
fs.writeFileSync(translationFile, JSON.stringify(updatedTranslations, null, 2));

console.log('✅ Todas as traduções foram adicionadas com sucesso!');
console.log('\n📝 Chaves traduzidas:');
console.log('   ✓ navigation.reports.financial');
console.log('   ✓ navigation.categories.finances');
console.log('   ✓ navigation.categories.tools');
console.log('   ✓ navigation.categories.utilities');
console.log('   ✓ navigation.payments.expenses');
console.log('   ✓ navigation.maintenance.pending');
console.log('   ✓ navigation.maintenance.request');
console.log('   ✓ navigation.documentScan');
console.log('   ✓ navigation.assistant');
console.log('   ✓ navigation.settings');
console.log('   ✓ navigation.demoData');
console.log('   ✓ settings.tabs.language');
console.log('   ✓ dashboard.fullDashboard');
console.log('   ✓ dashboard.welcomeName');
console.log('   ✓ dashboard.fullDashboardDescription');
console.log('   ✓ dashboard.backToOverview');
console.log('   ✓ dashboard.dailyTasks');
console.log('   ✓ dashboard.financialSummary');
console.log('   ✓ dashboard.todaysSchedule');

console.log('\n🚀 Próximo passo: Fazer commit e push das alterações');