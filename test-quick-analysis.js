/**
 * Teste rápido dos arquivos file (13) e file (14)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function quickTest() {
  console.log('🔍 Teste rápido dos arquivos...\n');
  
  // Extrair texto dos PDFs
  const pdf13 = fs.readFileSync('file (13).pdf');
  const pdf14 = fs.readFileSync('file (14).pdf');
  
  const text13 = (await pdf(pdf13)).text;
  const text14 = (await pdf(pdf14)).text;
  
  console.log('📄 File (13) - Primeiros 500 chars:');
  console.log(text13.substring(0, 500));
  console.log('\n📄 File (14) - Primeiros 500 chars:');
  console.log(text14.substring(0, 500));
  
  // Verificar se contém valores monetários
  const hasEuro13 = /\d+[.,]\d{2}\s*€|€\s*\d+|total.*\d+/i.test(text13);
  const hasEuro14 = /\d+[.,]\d{2}\s*€|€\s*\d+|total.*\d+/i.test(text14);
  
  console.log(`\n💰 File (13) tem valores monetários: ${hasEuro13}`);
  console.log(`💰 File (14) tem valores monetários: ${hasEuro14}`);
  
  // Teste rápido com Gemini apenas no arquivo que tem valores
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  if (hasEuro13) {
    console.log('\n🤖 Testando extração no file (13)...');
    const prompt = `Extraia dados de reserva deste documento, especialmente valores monetários. Retorne JSON simples com guestName, totalAmount, checkInDate, checkOutDate:\n\n${text13.substring(0, 2000)}`;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log('📝 Resposta Gemini file (13):', response.text().substring(0, 500));
    } catch (error) {
      console.log('❌ Erro no Gemini:', error.message);
    }
  }
  
  if (hasEuro14) {
    console.log('\n🤖 Testando extração no file (14)...');
    const prompt = `Extraia dados de reserva deste documento, especialmente valores monetários. Retorne JSON simples com guestName, totalAmount, checkInDate, checkOutDate:\n\n${text14.substring(0, 2000)}`;
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log('📝 Resposta Gemini file (14):', response.text().substring(0, 500));
    } catch (error) {
      console.log('❌ Erro no Gemini:', error.message);
    }
  }
}

quickTest().catch(console.error);