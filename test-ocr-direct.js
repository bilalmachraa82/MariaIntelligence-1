/**
 * Teste directo do sistema OCR com PDFs reais
 */
import fs from 'fs';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testOCRDirect() {
  try {
    console.log('🧪 Iniciando teste directo do OCR...');
    
    // Verificar se temos a chave API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não encontrada');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Testar com um PDF real
    const pdfPath = './attached_assets/Check-outs Maria faz.pdf';
    console.log('📄 Processando:', pdfPath);
    
    const buffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(buffer);
    const text = pdfData.text;
    
    console.log('📝 Texto extraído (primeiros 300 chars):');
    console.log(text.substring(0, 300) + '...');
    
    // Usar o prompt v4.2 melhorado
    const prompt = `# EXTRACTOR DE RESERVAS – v4.2 (schema_version: 1.4)

Persona: És um motor de OCR + parsing ultra-fiável para reservas turísticas.

FUNÇÃO: Receber QUALQUER documento e devolver um fluxo estruturado de registos JSON segundo o esquema abaixo.

PARÂMETROS:
- mode = "json"
- debug = false  
- confidence_threshold = 0.35

SENTINELA: Ao terminares o output escreve na última linha, isolada: END_OF_JSON

OUTPUT: Responde APENAS com array JSON válido UTF-8.

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

ETAPAS DE PROCESSAMENTO:
- Segmentar o texto em reservas individuais
- Extrair datas, nomes, hóspedes e outras informações
- Validar e estruturar os dados
- Marcar needs_review=true se dados críticos estiverem em falta

TEXTO DO DOCUMENTO:
${text}

EXTRAI TODAS AS RESERVAS ENCONTRADAS:`;

    console.log('🤖 Enviando para Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('📨 Resposta do Gemini:');
    console.log(response);
    
    // Tentar fazer parse do JSON
    try {
      const cleaned = response.split('END_OF_JSON')[0];
      const jsonStart = cleaned.indexOf('[');
      const jsonEnd = cleaned.lastIndexOf(']') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonString = cleaned.substring(jsonStart, jsonEnd);
        const reservations = JSON.parse(jsonString);
        
        console.log('✅ Reservas extraídas com sucesso:');
        console.log(JSON.stringify(reservations, null, 2));
        console.log(`📊 Total de reservas encontradas: ${reservations.length}`);
      } else {
        console.log('❌ Não foi possível encontrar JSON válido na resposta');
      }
    } catch (parseError) {
      console.log('❌ Erro ao fazer parse do JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testOCRDirect();