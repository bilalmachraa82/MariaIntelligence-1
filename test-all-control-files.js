/**
 * Script para testar sistematicamente todos os ficheiros de controlo
 * e identificar problemas na extração de dados
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testControlFile(filename) {
  console.log(`\n🔍 Testando: ${filename}`);
  
  try {
    if (!fs.existsSync(filename)) {
      console.log(`❌ Ficheiro não encontrado: ${filename}`);
      return;
    }

    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(filename));

    const response = await fetch('http://localhost:5000/api/ocr?provider=gemini', {
      method: 'POST',
      body: formData,
      timeout: 60000
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${result.count} reservas extraídas`);
      
      // Verificar problemas específicos
      const issues = [];
      
      result.reservations.forEach((res, i) => {
        if (res.propertyName === 'N/A' || !res.propertyName) {
          issues.push(`Reserva ${i+1}: Propriedade não identificada`);
        }
        if (!res.totalPrice || res.totalPrice === 'N/A') {
          issues.push(`Reserva ${i+1}: Valor não encontrado`);
        }
        if (!res.adults || res.adults === 0) {
          issues.push(`Reserva ${i+1}: Número de adultos não encontrado`);
        }
      });
      
      if (issues.length > 0) {
        console.log(`⚠️ Problemas encontrados:`);
        issues.slice(0, 3).forEach(issue => console.log(`   ${issue}`));
        if (issues.length > 3) console.log(`   ... e mais ${issues.length - 3} problemas`);
      } else {
        console.log(`🎉 Extração perfeita!`);
      }
      
      // Mostrar amostra dos dados
      const sample = result.reservations[0];
      console.log(`📋 Amostra:`);
      console.log(`   Nome: ${sample.guestName}`);
      console.log(`   Propriedade: ${sample.propertyName || 'N/A'}`);
      console.log(`   Datas: ${sample.checkInDate} → ${sample.checkOutDate}`);
      console.log(`   Hóspedes: ${sample.adults} adultos, ${sample.children} crianças`);
      console.log(`   Valor: ${sample.totalPrice || 'N/A'}`);
      
    } else {
      console.log(`❌ Erro: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ Erro de processamento: ${error.message}`);
  }
}

async function testAllFiles() {
  console.log('🚀 TESTE SISTEMÁTICO DE TODOS OS FICHEIROS DE CONTROLO');
  console.log('=' .repeat(60));
  
  const controlFiles = [
    'Controlo_Aroeira I (6).pdf',
    'Controlo_Aroeira II (6).pdf',
    'Controlo_5 de Outubro (9).pdf',
    'Controlo_Feira da Ladra (Graça 1) (9).pdf',
    'Controlo_Sete Rios (9).pdf',
    'file (13).pdf',
    'file (14).pdf'
  ];
  
  for (const file of controlFiles) {
    await testControlFile(file);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa entre requests
  }
  
  console.log('\n🏁 Teste concluído!');
}

testAllFiles().catch(console.error);