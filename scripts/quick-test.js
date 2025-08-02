#!/usr/bin/env node

const fetch = require('node-fetch');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n🧪 Maria Faz - Teste Rápido do Sistema\n'));

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

console.log(chalk.gray(`URL Base: ${BASE_URL}\n`));

const tests = [
  {
    name: 'Frontend React',
    url: '/',
    check: (res, text) => res.ok && text.includes('<!DOCTYPE html>')
  },
  {
    name: 'API Health Check',
    url: '/api/health',
    check: (res, data) => res.ok && data.status === 'ok'
  },
  {
    name: 'API Properties',
    url: '/api/properties',
    check: (res, data) => res.ok && Array.isArray(data)
  },
  {
    name: 'API Owners',
    url: '/api/owners',
    check: (res, data) => res.ok && Array.isArray(data)
  },
  {
    name: 'API Reservations',
    url: '/api/reservations',
    check: (res, data) => res.ok && Array.isArray(data)
  },
  {
    name: 'Security Headers',
    url: '/',
    check: (res) => res.headers.get('x-content-type-options') === 'nosniff'
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(BASE_URL + test.url);
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (test.check(response, data)) {
        console.log(chalk.green(`✅ ${test.name}`));
        passed++;
      } else {
        console.log(chalk.red(`❌ ${test.name}`));
        failed++;
      }
    } catch (error) {
      console.log(chalk.red(`❌ ${test.name} - ${error.message}`));
      failed++;
    }
  }

  console.log(chalk.blue(`\n📊 Resultados:`));
  console.log(chalk.green(`   ✅ Passou: ${passed}`));
  console.log(chalk.red(`   ❌ Falhou: ${failed}`));
  console.log(chalk.gray(`   📋 Total: ${tests.length}`));

  if (failed === 0) {
    console.log(chalk.green.bold('\n🎉 Todos os testes passaram! Sistema operacional.\n'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️  Alguns testes falharam. Verifique a configuração.\n'));
  }
}

runTests().catch(console.error);