/**
 * Script para testar diretamente os arquivos file(13) e file(14)
 * com debugging detalhado do processamento Gemini
 */
import fs from 'fs';
import path from 'path';

async function extractTextFromPDF(filePath) {
  try {
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse.default(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Erro na extração do PDF:', error);
    return null;
  }
}

async function testGeminiDirectly(text) {
  const prompt = `Analise este documento de reserva e extraia as informações no formato JSON.

TEXTO DO DOCUMENTO:
${text.substring(0, 3000)}

Retorne apenas um JSON válido com esta estrutura:
{
  "propertyName": "nome da propriedade",
  "guestName": "nome do hóspede", 
  "guestEmail": "email@exemplo.com",
  "guestPhone": "+351999999999",
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-20",
  "numGuests": 2,
  "totalAmount": 150.00,
  "platform": "booking.com",
  "reference": "BK123456"
}

Regras importantes:
- Use formato de data YYYY-MM-DD
- Valores numéricos devem ser números, não strings
- Se não encontrar uma informação, omita o campo
- Propriedades Aroeira: especifique o número (Aroeira I, Aroeira II, etc.)`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 1024
        }
      })
    });

    const result = await response.json();
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers da resposta:', response.headers);
    console.log('🔍 Resposta completa do Gemini:');
    console.log(JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.log('❌ Erro HTTP:', result);
      return null;
    }

    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      console.log('❌ Nenhum texto gerado');
      console.log('📄 Candidatos:', result.candidates?.length || 0);
      return null;
    }

    console.log('✅ Texto gerado:', generatedText);
    return generatedText;

  } catch (error) {
    console.error('❌ Erro na chamada Gemini:', error);
    return null;
  }
}

async function testFiles() {
  console.log('🧪 Testando arquivos file(13) e file(14) diretamente\n');

  // Teste file(13).pdf
  console.log('📄 Testando file(13).pdf...');
  const text13 = await extractTextFromPDF('file (13).pdf');
  if (text13) {
    console.log(`✅ Texto extraído de file(13): ${text13.length} caracteres`);
    console.log('📝 Primeiros 500 caracteres:');
    console.log(text13.substring(0, 500));
    console.log('\n🤖 Testando Gemini...');
    const geminiResult13 = await testGeminiDirectly(text13);
    console.log('🎯 Resultado Gemini file(13):', geminiResult13);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Teste file(14).pdf
  console.log('📄 Testando file(14).pdf...');
  const text14 = await extractTextFromPDF('file (14).pdf');
  if (text14) {
    console.log(`✅ Texto extraído de file(14): ${text14.length} caracteres`);
    console.log('📝 Primeiros 500 caracteres:');
    console.log(text14.substring(0, 500));
    console.log('\n🤖 Testando Gemini...');
    const geminiResult14 = await testGeminiDirectly(text14);
    console.log('🎯 Resultado Gemini file(14):', geminiResult14);
  }
}

// Executar teste
testFiles().catch(console.error);