const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const fs = require('fs');

async function testExtractorV4() {
  try {
    console.log('🚀 Testing EXTRACTOR DE RESERVAS v4.2 with Gemini 2.5 Flash...');
    
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not found');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test file (13)
    console.log('\n📄 Processing file (13).pdf...');
    const pdfBuffer13 = fs.readFileSync('./file (13).pdf');
    const pdfData13 = await pdf(pdfBuffer13);
    
    const prompt = `# EXTRACTOR DE RESERVAS – v4.2 (schema_version: 1.4)

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

[FRESH_${Date.now()}]`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1,
        candidateCount: 1
      }
    });
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log(`📝 Response length: ${text.length} characters`);
    console.log(`🔍 Response preview: ${text.substring(0, 300)}...`);
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const reservations = JSON.parse(jsonMatch[0]);
        console.log(`\n🎉 SUCCESS! File (13): ${reservations.length} reservations extracted`);
        
        if (reservations.length > 0) {
          console.log(`📋 First guest: ${reservations[0].nome}`);
          console.log(`📅 Check-in: ${reservations[0].data_entrada}`);
          console.log(`📅 Check-out: ${reservations[0].data_saida}`);
        }
        
        // Test file (14) if file (13) worked
        if (reservations.length > 0) {
          console.log('\n📄 Processing file (14).pdf...');
          const pdfBuffer14 = fs.readFileSync('./file (14).pdf');
          const pdfData14 = await pdf(pdfBuffer14);
          
          const prompt14 = prompt.replace(pdfData13.text, pdfData14.text).replace(/FRESH_\d+/, `FRESH_${Date.now()}`);
          
          const result14 = await model.generateContent(prompt14);
          const text14 = result14.response.text();
          
          const jsonMatch14 = text14.match(/\[[\s\S]*\]/);
          if (jsonMatch14) {
            const reservations14 = JSON.parse(jsonMatch14[0]);
            console.log(`🎉 File (14): ${reservations14.length} reservations extracted`);
            
            const total = reservations.length + reservations14.length;
            console.log(`\n🏆 TOTAL RESERVATIONS: ${total}`);
            
            if (total > 10) {
              console.log('✅ SUCCESS! Found working EXTRACTOR v4.2 implementation!');
            }
          }
        }
        
      } catch (parseError) {
        console.log(`❌ JSON parse error: ${parseError.message}`);
        console.log(`🔍 Raw JSON: ${jsonMatch[0].substring(0, 500)}...`);
      }
    } else {
      console.log('❌ No JSON array found in response');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExtractorV4();
