const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const fs = require('fs');

async function testNow() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
  });
  
  const pdfBuffer = fs.readFileSync('./file (13).pdf');
  const pdfData = await pdf(pdfBuffer);
  
  console.log(`📄 Extracted ${pdfData.text.length} characters from PDF`);
  
  const result = await model.generateContent(`
# EXTRACTOR DE RESERVAS v4.2

Extrai TODAS as reservas deste documento como array JSON:

${pdfData.text}

Formato: [{"nome":"","data_entrada":"YYYY-MM-DD","data_saida":"YYYY-MM-DD","hospedes":0}]
`);
  
  const text = result.response.text();
  console.log(`📝 Response: ${text.substring(0, 500)}...`);
  
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const reservations = JSON.parse(match[0]);
      console.log(`🎉 SUCCESS! Found ${reservations.length} reservations!`);
      reservations.forEach((r, i) => console.log(`${i+1}. ${r.nome} (${r.data_entrada})`));
    }
  } catch (e) {
    console.log(`❌ Parse error: ${e.message}`);
  }
}

testNow().catch(console.error);
