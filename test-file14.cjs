const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const fs = require('fs');

async function testFile14() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
  });
  
  const pdfBuffer = fs.readFileSync('./file (14).pdf');
  const pdfData = await pdf(pdfBuffer);
  
  console.log(`📄 File (14): Extracted ${pdfData.text.length} characters`);
  
  const result = await model.generateContent(`
# EXTRACTOR DE RESERVAS v4.2

Extrai TODAS as reservas deste documento como array JSON:

${pdfData.text}

Formato: [{"nome":"","data_entrada":"YYYY-MM-DD","data_saida":"YYYY-MM-DD","hospedes":0}]
`);
  
  const text = result.response.text();
  
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const reservations = JSON.parse(match[0]);
      console.log(`🎉 File (14): Found ${reservations.length} reservations!`);
      
      // Show first few
      reservations.slice(0, 5).forEach((r, i) => 
        console.log(`${i+1}. ${r.nome} (${r.data_entrada} → ${r.data_saida})`)
      );
      
      if (reservations.length > 5) {
        console.log(`... and ${reservations.length - 5} more reservations!`);
      }
      
      return reservations.length;
    }
  } catch (e) {
    console.log(`❌ Parse error: ${e.message}`);
    return 0;
  }
}

testFile14().then(count => {
  console.log(`\n🏆 TOTAL FROM FILE (14): ${count} reservations`);
}).catch(console.error);
