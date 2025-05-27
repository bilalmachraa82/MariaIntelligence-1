const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const fs = require('fs');

async function testExtractorV4Direct() {
  try {
    console.log('🚀 Testing EXTRACTOR DE RESERVAS v4.2 directly...');
    
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not found');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test file (13)
    console.log('\n📄 Processing file (13).pdf...');
    const pdfBuffer13 = fs.readFileSync('./file (13).pdf');
    const pdfData13 = await pdf(pdfBuffer13);
    
    const prompt13 = `# EXTRACTOR DE RESERVAS – v4.2 (schema_version: 1.4)

És um motor de OCR + parsing ultra-fiável para reservas turísticas.

FUNÇÃO: Receber QUALQUER documento e devolver um fluxo estruturado de registos JSON segundo o esquema abaixo.

ESQUEMA (ordem fixa):
{
  "data_entrada": "YYYY-MM-DD",
  "data_saida": "YYYY-MM-DD",
  "noites": 0,
  "nome": "",
  "hospedes": 0,
  "pais": "",
  "pais_inferido": false,
  "site": "",
  "telefone": "",
  "observacoes": "",
  "timezone_source": "",
  "id_reserva": "",
  "confidence": 0.0,
  "source_page": 0,
  "needs_review": false
}

DOCUMENTO:
${pdfData13.text}

INSTRUÇÕES:
- Extrai TODAS as reservas do documento
- Consolida fragmentos que pertencem à mesma reserva
- Calcula 'noites' a partir das datas
- Normaliza datas para YYYY-MM-DD
- Preenche 'pais_inferido=true' se inferires país do telefone
- Gera id_reserva único para cada reserva
- Define confidence baseado na qualidade dos dados
- Marca needs_review=true se faltarem dados críticos

Devolve apenas o array JSON com todas as reservas encontradas.
END_OF_JSON

[DIRECT_TEST_${Date.now()}]`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
        candidateCount: 1
      }
    });
    
    const result13 = await model.generateContent(prompt13);
    const text13 = result13.response.text();
    
    const jsonMatch13 = text13.match(/\[[\s\S]*\]/);
    if (jsonMatch13) {
      const reservations13 = JSON.parse(jsonMatch13[0]);
      console.log(`✅ File (13): ${reservations13.length} reservations extracted`);
      
      if (reservations13.length > 0) {
        console.log('📋 Sample reservation:', reservations13[0].nome);
      }
    } else {
      console.log('❌ File (13): No JSON found');
    }
    
    console.log('🏆 EXTRACTOR v4.2 test completed!');
    
  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
  }
}

testExtractorV4Direct();
