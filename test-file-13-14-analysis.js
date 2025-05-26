/**
 * Script para testar e analisar os arquivos file (13) e file (14)
 * para implementar a lógica de consolidação check-in/check-out
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GOOGLE_API_KEY não configurada');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function extractTextFromPDF(filePath) {
  try {
    const pdfBuffer = fs.readFileSync(filePath);
    const data = await pdf(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    return '';
  }
}

async function classifyDocumentImproved(text) {
  const lowerText = text.toLowerCase();
  
  // Check-out tem prioridade se contém valores monetários
  if (lowerText.includes('check-out') || 
      lowerText.includes('saída') ||
      lowerText.includes('total amount') ||
      lowerText.includes('total price') ||
      lowerText.includes('€') ||
      lowerText.includes('eur') ||
      lowerText.includes('total:') ||
      /\d+[.,]\d{2}\s*€/.test(text) ||
      /total.*\d+[.,]\d+/i.test(text)) {
    return 'check-out';
  }
  
  if (lowerText.includes('check-in') || lowerText.includes('entrada')) {
    return 'check-in';
  }
  
  return 'unknown';
}

async function extractWithGemini(text, documentType) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.1,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  });

  let prompt;
  
  if (documentType === 'check-out') {
    prompt = `
Você é um especialista em extração de dados de documentos de check-out de hospedagem.
Analise este documento de CHECK-OUT e extraia TODOS os dados da reserva, especialmente os VALORES MONETÁRIOS.

INSTRUÇÕES ESPECÍFICAS PARA CHECK-OUT:
- Procure por valores totais, preços finais, montantes pagos
- Identifique valores em €, EUR, ou outros símbolos monetários
- Extraia valores mesmo se estiverem em formatos como "123,45 €" ou "Total: 304.39"
- Se houver múltiplos valores, use o valor total final
- Datas no formato YYYY-MM-DD
- Use null APENAS se realmente não encontrar

FORMATO JSON OBRIGATÓRIO:
\`\`\`json
{
  "reservations": [
    {
      "guestName": "Nome completo do hóspede",
      "propertyName": "Nome da propriedade/apartamento",
      "checkInDate": "YYYY-MM-DD",
      "checkOutDate": "YYYY-MM-DD",
      "totalAmount": 123.45,
      "guestCount": 2,
      "email": "email@exemplo.com",
      "phone": "+351912345678",
      "notes": "Observações do check-out"
    }
  ]
}
\`\`\`

DOCUMENTO DE CHECK-OUT:
${text}`;
  } else {
    prompt = `
Você é um especialista em extração de dados de documentos de check-in de hospedagem.
Analise este documento e extraia os dados da reserva.

REGRAS:
- Retorne APENAS JSON válido
- Datas no formato YYYY-MM-DD
- Valores como números (se disponíveis)
- Use null se não encontrar

FORMATO:
\`\`\`json
{
  "reservations": [
    {
      "guestName": "Nome do hóspede",
      "propertyName": "Nome da propriedade",
      "checkInDate": "YYYY-MM-DD",
      "checkOutDate": "YYYY-MM-DD",
      "totalAmount": 0.00,
      "guestCount": 1,
      "email": null,
      "phone": null,
      "notes": null
    }
  ]
}
\`\`\`

DOCUMENTO:
${text}`;
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const extractedText = response.text();

    // Extrair JSON da resposta
    const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     extractedText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return jsonData.reservations || [];
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao extrair com Gemini:', error);
    return [];
  }
}

async function consolidateReservations(checkInData, checkOutData) {
  console.log('\n🔄 CONSOLIDANDO DADOS DE CHECK-IN E CHECK-OUT...\n');
  
  const consolidated = [];
  
  // Para cada reserva de check-in, procurar correspondente no check-out
  for (const checkin of checkInData) {
    console.log(`📥 Check-in: ${checkin.guestName}`);
    
    // Procurar check-out correspondente pelo nome
    const checkout = checkOutData.find(co => 
      co.guestName.toLowerCase().includes(checkin.guestName.toLowerCase()) ||
      checkin.guestName.toLowerCase().includes(co.guestName.toLowerCase())
    );
    
    if (checkout) {
      console.log(`📤 Check-out encontrado: ${checkout.guestName}`);
      console.log(`💰 Valor: ${checkout.totalAmount || 'Não encontrado'}`);
      
      // Consolidar dados
      const consolidatedReservation = {
        guestName: checkin.guestName,
        propertyName: checkin.propertyName || checkout.propertyName,
        checkInDate: checkin.checkInDate,
        checkOutDate: checkin.checkOutDate || checkout.checkOutDate,
        totalAmount: checkout.totalAmount || checkin.totalAmount || null,
        guestCount: checkin.guestCount || checkout.guestCount,
        email: checkin.email || checkout.email,
        phone: checkin.phone || checkout.phone,
        notes: `Check-in: ${checkin.notes || 'N/A'} | Check-out: ${checkout.notes || 'N/A'}`,
        source: 'consolidated'
      };
      
      consolidated.push(consolidatedReservation);
    } else {
      console.log(`❌ Nenhum check-out encontrado para: ${checkin.guestName}`);
      consolidated.push({...checkin, source: 'check-in-only'});
    }
  }
  
  // Adicionar check-outs órfãos (sem check-in correspondente)
  for (const checkout of checkOutData) {
    const hasCheckin = checkInData.find(ci => 
      ci.guestName.toLowerCase().includes(checkout.guestName.toLowerCase()) ||
      checkout.guestName.toLowerCase().includes(ci.guestName.toLowerCase())
    );
    
    if (!hasCheckin) {
      console.log(`📤 Check-out órfão: ${checkout.guestName}`);
      consolidated.push({...checkout, source: 'check-out-only'});
    }
  }
  
  return consolidated;
}

async function analyzeFiles() {
  console.log('🔍 ANALISANDO ARQUIVOS FILE (13) E FILE (14)...\n');
  
  // Processar file (13)
  console.log('📄 Processando file (13).pdf...');
  const text13 = await extractTextFromPDF('file (13).pdf');
  const type13 = await classifyDocumentImproved(text13);
  console.log(`📋 Tipo identificado: ${type13}`);
  console.log(`📝 Texto extraído (${text13.length} chars):`, text13.substring(0, 300) + '...\n');
  
  const data13 = await extractWithGemini(text13, type13);
  console.log(`✅ Reservas extraídas do file (13): ${data13.length}`);
  data13.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.guestName} - ${r.totalAmount || 'Sem valor'}`);
  });
  
  // Processar file (14)  
  console.log('\n📄 Processando file (14).pdf...');
  const text14 = await extractTextFromPDF('file (14).pdf');
  const type14 = await classifyDocumentImproved(text14);
  console.log(`📋 Tipo identificado: ${type14}`);
  console.log(`📝 Texto extraído (${text14.length} chars):`, text14.substring(0, 300) + '...\n');
  
  const data14 = await extractWithGemini(text14, type14);
  console.log(`✅ Reservas extraídas do file (14): ${data14.length}`);
  data14.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.guestName} - ${r.totalAmount || 'Sem valor'}`);
  });
  
  // Determinar qual é check-in e qual é check-out
  let checkInData, checkOutData;
  
  if (type13 === 'check-in' && type14 === 'check-out') {
    checkInData = data13;
    checkOutData = data14;
    console.log('\n📊 CONFIGURAÇÃO: file (13) = CHECK-IN, file (14) = CHECK-OUT');
  } else if (type13 === 'check-out' && type14 === 'check-in') {
    checkInData = data14;
    checkOutData = data13;
    console.log('\n📊 CONFIGURAÇÃO: file (13) = CHECK-OUT, file (14) = CHECK-IN');
  } else {
    console.log('\n⚠️  ATENÇÃO: Não foi possível determinar tipos claramente');
    console.log(`file (13): ${type13}, file (14): ${type14}`);
    checkInData = data13;
    checkOutData = data14;
  }
  
  // Consolidar dados
  const consolidated = await consolidateReservations(checkInData, checkOutData);
  
  console.log('\n🎯 RESULTADO FINAL CONSOLIDADO:');
  console.log('═'.repeat(50));
  consolidated.forEach((r, i) => {
    console.log(`${i+1}. ${r.guestName}`);
    console.log(`   🏠 Propriedade: ${r.propertyName}`);
    console.log(`   📅 Check-in: ${r.checkInDate} | Check-out: ${r.checkOutDate}`);
    console.log(`   💰 Valor: ${r.totalAmount || 'N/A'}`);
    console.log(`   👥 Hóspedes: ${r.guestCount}`);
    console.log(`   📧 Email: ${r.email || 'N/A'}`);
    console.log(`   📱 Telefone: ${r.phone || 'N/A'}`);
    console.log(`   🔄 Fonte: ${r.source}`);
    console.log('   ' + '─'.repeat(40));
  });
  
  return consolidated;
}

// Executar análise
analyzeFiles()
  .then(result => {
    console.log(`\n✅ Análise concluída! ${result.length} reservas consolidadas.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro na análise:', error);
    process.exit(1);
  });