import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function captureScreenshots() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // URLs para comparar
    const productionUrl = 'https://mariafaz-7d4d-gkntf-bilalmachraa82s-projects.vercel.app/';
    const localUrl = 'http://localhost:5174'; // Ajuste conforme sua porta local
    
    console.log('📸 Capturando screenshots...');
    
    // Screenshot do ambiente de produção
    console.log('Acessando produção:', productionUrl);
    const pageProd = await browser.newPage();
    await pageProd.goto(productionUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await pageProd.screenshot({ 
      path: 'screenshot-producao.png', 
      fullPage: true,
      width: 1920,
      height: 1080
    });
    
    // Analisar elementos da página de produção
    const prodInfo = await pageProd.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasH1: !!document.querySelector('h1'),
        h1Text: document.querySelector('h1')?.textContent || 'Sem H1',
        hasLoginForm: !!document.querySelector('form'),
        bodyText: document.body.textContent.substring(0, 200),
        images: Array.from(document.querySelectorAll('img')).length,
        links: Array.from(document.querySelectorAll('a')).length,
        hasError: document.body.textContent.toLowerCase().includes('error') || 
                  document.body.textContent.toLowerCase().includes('404') ||
                  document.body.textContent.toLowerCase().includes('not found')
      };
    });
    
    console.log('✅ Screenshot produção capturado');
    
    // Tentar acessar localhost
    try {
      console.log('Acessando localhost:', localUrl);
      const pageLocal = await browser.newPage();
      await pageLocal.goto(localUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      await pageLocal.screenshot({ 
        path: 'screenshot-local.png', 
        fullPage: true,
        width: 1920,
        height: 1080
      });
      
      const localInfo = await pageLocal.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          hasH1: !!document.querySelector('h1'),
          h1Text: document.querySelector('h1')?.textContent || 'Sem H1',
          hasLoginForm: !!document.querySelector('form'),
          bodyText: document.body.textContent.substring(0, 200),
          images: Array.from(document.querySelectorAll('img')).length,
          links: Array.from(document.querySelectorAll('a')).length,
          hasError: document.body.textContent.toLowerCase().includes('error') || 
                    document.body.textContent.toLowerCase().includes('404') ||
                    document.body.textContent.toLowerCase().includes('not found')
        };
      });
      
      console.log('✅ Screenshot localhost capturado');
      
      // Comparar os ambientes
      console.log('\n📊 COMPARAÇÃO DOS AMBIENTES:');
      console.log('=====================================');
      console.log('🌐 PRODUÇÃO:', prodInfo);
      console.log('🏠 LOCALHOST:', localInfo);
      console.log('=====================================');
      
      // Análise das diferenças
      const differences = [];
      if (prodInfo.title !== localInfo.title) {
        differences.push(`Título diferente: Produção="${prodInfo.title}" vs Local="${localInfo.title}"`);
      }
      if (prodInfo.hasH1 !== localInfo.hasH1) {
        differences.push(`H1 presente: Produção=${prodInfo.hasH1} vs Local=${localInfo.hasH1}`);
      }
      if (prodInfo.h1Text !== localInfo.h1Text) {
        differences.push(`Texto H1 diferente: Produção="${prodInfo.h1Text}" vs Local="${localInfo.h1Text}"`);
      }
      if (prodInfo.hasLoginForm !== localInfo.hasLoginForm) {
        differences.push(`Formulário presente: Produção=${prodInfo.hasLoginForm} vs Local=${localInfo.hasLoginForm}`);
      }
      if (prodInfo.images !== localInfo.images) {
        differences.push(`Número de imagens: Produção=${prodInfo.images} vs Local=${localInfo.images}`);
      }
      if (prodInfo.links !== localInfo.links) {
        differences.push(`Número de links: Produção=${prodInfo.links} vs Local=${localInfo.links}`);
      }
      if (prodInfo.hasError && !localInfo.hasError) {
        differences.push('⚠️  Produção tem mensagem de erro!');
      }
      if (!prodInfo.hasError && localInfo.hasError) {
        differences.push('⚠️  Localhost tem mensagem de erro!');
      }
      
      console.log('\n🔍 DIFERENÇAS ENCONTRADAS:');
      if (differences.length === 0) {
        console.log('✅ Nenhuma diferença significativa encontrada');
      } else {
        differences.forEach(diff => console.log('❌ ' + diff));
      }
      
    } catch (localError) {
      console.log('❌ Não foi possível acessar localhost:', localError.message);
      console.log('💡 Verifique se o servidor local está rodando na porta 3000');
    }
    
    console.log('\n📸 Screenshots salvos como:');
    console.log('- screenshot-producao.png');
    console.log('- screenshot-local.png (se localhost estiver disponível)');
    
  } catch (error) {
    console.error('❌ Erro ao capturar screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Verificar se puppeteer está instalado
try {
  await import('puppeteer');
  await captureScreenshots();
} catch (error) {
  console.log('📦 Puppeteer não encontrado. Instalando...');
  execSync('npm install puppeteer', { stdio: 'inherit' });
  console.log('✅ Puppeteer instalado. Executando captura...');
  await captureScreenshots();
}