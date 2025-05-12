import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Listando todos os arquivos de upload para testes
const testFiles = fs.readdirSync(uploadsDir)
  .filter(file => file.endsWith('.pdf'))
  .map(file => path.join(uploadsDir, file));

test.describe('Upload Functionality Tests', () => {
  testFiles.forEach(filePath => {
    test(`should successfully upload valid PDF: ${path.basename(filePath)}`, async ({ page }) => {
      // Navegar para a página de upload
      await page.goto('/dashboard/upload');
      
      // Selecionar o arquivo e fazer upload
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);
      
      // Verificar redirecionamento para página de processamento
      await expect(page).toHaveURL('/dashboard/processing');
      
      // Verificar que o arquivo foi carregado corretamente
      const fileName = path.basename(filePath);
      const fileElement = page.locator(`text=${fileName}`);
      await expect(fileElement).toBeVisible();
    });
  });

  test('should handle invalid file types', async ({ page }) => {
    // Navegar para a página de upload
    await page.goto('/dashboard/upload');
    
    // Tentar fazer upload de um arquivo inválido
    const invalidFile = path.join(uploadsDir, 'test.txt');
    fs.writeFileSync(invalidFile, 'Conteúdo de teste inválido');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);
    
    // Verificar mensagem de erro
    const errorText = page.locator('.error-message');
    await expect(errorText).toBeVisible();
    await expect(errorText).toHaveText('Tipo de arquivo não suportado. Por favor, envie um arquivo PDF.');
    
    // Limpar arquivo de teste inválido
    fs.unlinkSync(invalidFile);
  });

  test('should handle empty file upload', async ({ page }) => {
    // Navegar para a página de upload
    await page.goto('/dashboard/upload');
    
    // Criar e tentar fazer upload de um arquivo PDF vazio
    const emptyFile = path.join(uploadsDir, 'empty.pdf');
    fs.writeFileSync(emptyFile, '');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(emptyFile);
    
    // Verificar mensagem de erro
    const errorText = page.locator('.error-message');
    await expect(errorText).toBeVisible();
    await expect(errorText).toHaveText('Arquivo vazio ou corrompido.');
    
    // Limpar arquivo de teste
    fs.unlinkSync(emptyFile);
  });
});
