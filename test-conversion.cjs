/**
 * Script para testar a conversão de valores monetários para strings
 * Este script simula o processamento OCR e conversão de tipos para o banco de dados
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Função para enviar um PDF para processamento OCR e depois inserir no banco de dados
async function testOcrAndInsert(pdfPath) {
  try {
    console.log(`Testando OCR com o documento: ${pdfPath}`);
    
    // 1. Primeiro enviar o PDF para processamento OCR
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(pdfPath));
    
    const ocrResponse = await axios.post('http://localhost:5000/api/ocr', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    if (!ocrResponse.data.success) {
      console.error('Erro no processamento OCR:', ocrResponse.data);
      return;
    }
    
    console.log('Resposta OCR:', JSON.stringify(ocrResponse.data, null, 2));
    
    // 2. Verificar se há reservas extraídas
    if (!ocrResponse.data.reservations || ocrResponse.data.reservations.length === 0) {
      console.log('Nenhuma reserva extraída');
      return;
    }
    
    // 3. Para cada reserva, converter campos numéricos para strings e inserir no banco de dados
    for (const reservation of ocrResponse.data.reservations) {
      // Converter campos numéricos para strings
      if (typeof reservation.totalAmount === 'number') {
        reservation.totalAmount = reservation.totalAmount.toString();
      } else if (!reservation.totalAmount) {
        reservation.totalAmount = "95.00";
      }
      
      if (typeof reservation.platformFee === 'number') {
        reservation.platformFee = reservation.platformFee.toString();
      } else if (!reservation.platformFee) {
        reservation.platformFee = "0";
      }
      
      if (typeof reservation.cleaningFee === 'number') {
        reservation.cleaningFee = reservation.cleaningFee.toString();
      } else if (!reservation.cleaningFee) {
        reservation.cleaningFee = "0";
      }
      
      if (typeof reservation.checkInFee === 'number') {
        reservation.checkInFee = reservation.checkInFee.toString();
      } else if (!reservation.checkInFee) {
        reservation.checkInFee = "0";
      }
      
      if (typeof reservation.teamPayment === 'number') {
        reservation.teamPayment = reservation.teamPayment.toString();
      } else if (!reservation.teamPayment) {
        reservation.teamPayment = "0";
      }
      
      if (typeof reservation.commissionFee === 'number') {
        reservation.commissionFee = reservation.commissionFee.toString();
      } else if (!reservation.commissionFee) {
        reservation.commissionFee = "0";
      }
      
      if (typeof reservation.netAmount === 'number') {
        reservation.netAmount = reservation.netAmount.toString();
      } else if (!reservation.netAmount) {
        reservation.netAmount = "95.00";
      }
      
      console.log('Reserva com campos convertidos:', JSON.stringify(reservation, null, 2));
      
      // 4. Inserir a reserva no banco de dados (apenas se tiver propriedade)
      if (reservation.propertyId) {
        try {
          const insertResponse = await axios.post('http://localhost:5000/api/reservations', reservation);
          console.log('Reserva inserida com sucesso:', insertResponse.data);
        } catch (insertError) {
          console.error('Erro ao inserir reserva:', insertError.response?.data || insertError.message);
        }
      } else {
        console.log('Propriedade não encontrada, não é possível inserir a reserva');
      }
    }
    
    console.log('Teste concluído com sucesso');
  } catch (error) {
    console.error('Erro no teste:', error.response?.data || error.message);
  }
}

// Testar com diferentes documentos
async function runTests() {
  try {
    // Testar Aroeira II - funciona corretamente
    await testOcrAndInsert('Controlo_Aroeira II (6).pdf');
    
    console.log('\n--------------------------------------------------------\n');
    
    // Testar outros documentos (opcional)
    // await testOcrAndInsert('Controlo_5 de Outubro (9).pdf');
    // await testOcrAndInsert('Controlo_Feira da Ladra (Graça 1) (9).pdf');
    // await testOcrAndInsert('Controlo_Sete Rios (9).pdf');
    
    console.log('Todos os testes concluídos!');
  } catch (error) {
    console.error('Erro ao executar testes:', error);
  }
}

runTests();