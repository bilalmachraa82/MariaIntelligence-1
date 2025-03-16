console.log("Testando processamento de PDF...");

import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testPdfUpload() {
  try {
    // Caminho para o arquivo PDF de teste
    const pdfPath = path.join(dirname(__dirname), "Check-in Maria faz.pdf");
    
    console.log(`Lendo arquivo PDF: ${pdfPath}`);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(pdfPath)) {
      console.error(`Arquivo não encontrado: ${pdfPath}`);
      return;
    }
    
    const form = new FormData();
    form.append("pdf", fs.createReadStream(pdfPath));
    
    console.log("Enviando requisição para o endpoint /api/upload-pdf...");
    
    // Fazer requisição para o endpoint
    const response = await axios.post("http://localhost:3000/api/upload-pdf", form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    
    console.log("Resposta recebida:");
    console.log("Status:", response.status);
    console.log("Dados extraídos:", JSON.stringify(response.data.extractedData, null, 2));
    
    if (response.data.success) {
      console.log("✅ Teste passou! PDF processado com sucesso.");
    } else {
      console.log("❌ Teste falhou! Erro no processamento do PDF.");
    }
  } catch (error) {
    console.error("Erro durante o teste:", error.message);
    
    if (error.response) {
      console.error("Resposta de erro:", error.response.data);
      console.error("Status:", error.response.status);
    }
  }
}

testPdfUpload();
