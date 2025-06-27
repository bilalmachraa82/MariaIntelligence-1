/**
 * TESTE COMPLETO DE VALIDAÇÃO DAS 3 CORREÇÕES IMPLEMENTADAS
 * 
 * Este script testa se as 3 correções principais estão funcionando:
 * 1. Matching inteligente de propriedades (flexível)
 * 2. Extração melhorada de nomes (6 estratégias)
 * 3. Prompts otimizados (redução de tokens)
 */

import fs from 'fs';
import path from 'path';

async function testSystemValidation() {
  console.log('🚀 TESTE COMPLETO DE VALIDAÇÃO - CORREÇÕES PARA 100%');
  console.log('==================================================');
  
  // 1. Testar APIs básicas
  console.log('\n📋 1. TESTE DE APIS BÁSICAS:');
  
  try {
    const propertiesResponse = await fetch('http://localhost:5000/api/properties');
    const properties = await propertiesResponse.json();
    console.log(`✅ Propriedades carregadas: ${properties.length}`);
    
    const activitiesResponse = await fetch('http://localhost:5000/api/activities');
    const activitiesData = await activitiesResponse.json();
    console.log(`✅ Atividades carregadas: ${activitiesData.activities.length}`);
    
  } catch (error) {
    console.log(`❌ Erro ao testar APIs: ${error.message}`);
    return;
  }
  
  // 2. Testar processamento de PDF conhecido
  console.log('\n🔍 2. TESTE DE PROCESSAMENTO PDF:');
  
  const testFiles = [
    'Check-in Maria faz.pdf',
    'control1.pdf',
    'control2.pdf'
  ];
  
  for (const file of testFiles) {
    if (fs.existsSync(file)) {
      console.log(`\n📄 Testando arquivo: ${file}`);
      
      try {
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(file);
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });
        formData.append('pdf', blob, file);
        
        const response = await fetch('http://localhost:5000/api/pdf/upload-pdf', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Processamento bem-sucedido`);
          console.log(`   - Propriedade: ${result.data?.propertyName || 'N/A'}`);
          console.log(`   - Hóspede: ${result.data?.guestName || 'N/A'}`);
          console.log(`   - Check-in: ${result.data?.checkInDate || 'N/A'}`);
          console.log(`   - Matching: ${result.data?.propertyId ? 'Sucesso' : 'Falhou'}`);
        } else {
          console.log(`❌ Falha no processamento: ${result.message}`);
        }
        
      } catch (error) {
        console.log(`❌ Erro no teste: ${error.message}`);
      }
      
      // Aguardar entre testes
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 3. Verificar estado final
  console.log('\n📊 3. VERIFICAÇÃO FINAL:');
  
  try {
    const activitiesResponse = await fetch('http://localhost:5000/api/activities');
    const activitiesData = await activitiesResponse.json();
    const totalActivities = activitiesData.activities.length;
    
    const reservationsResponse = await fetch('http://localhost:5000/api/reservations');
    const reservations = await reservationsResponse.json();
    const totalReservations = reservations.length;
    
    console.log(`📝 Total de atividades: ${totalActivities}`);
    console.log(`📋 Total de reservas: ${totalReservations}`);
    
    // Contar sucessos vs falhas
    const successfulActivities = activitiesData.activities.filter(a => 
      a.entityId && a.entityId !== null
    ).length;
    
    const failedActivities = totalActivities - successfulActivities;
    const successRate = ((successfulActivities / totalActivities) * 100).toFixed(1);
    
    console.log(`✅ Atividades com propriedade identificada: ${successfulActivities}`);
    console.log(`❌ Atividades sem propriedade: ${failedActivities}`);
    console.log(`📊 Taxa de sucesso: ${successRate}%`);
    
    // Avaliar correções
    console.log('\n🎯 AVALIAÇÃO DAS CORREÇÕES:');
    
    if (successRate >= 95) {
      console.log('🌟 EXCELENTE: Sistema funcionando quase perfeitamente!');
    } else if (successRate >= 85) {
      console.log('✅ BOM: Melhorias significativas aplicadas');
    } else if (successRate >= 70) {
      console.log('⚠️ RAZOÁVEL: Algumas melhorias visíveis');
    } else {
      console.log('❌ INSUFICIENTE: Correções precisam de mais ajustes');
    }
    
    return {
      successRate: parseFloat(successRate),
      totalActivities,
      successfulActivities,
      failedActivities
    };
    
  } catch (error) {
    console.log(`❌ Erro na verificação final: ${error.message}`);
    return null;
  }
}

// Executar teste
testSystemValidation()
  .then(result => {
    console.log('\n✅ TESTE COMPLETO FINALIZADO!');
    if (result) {
      console.log(`🎯 Score Final: ${result.successRate}%`);
    }
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
  });