/**
 * Script para testar o processamento de arquivos "Controlo_Aroeira"
 * Identifica e processa todos os arquivos de controle encontrados
 */

const fs = require('fs');
const path = require('path');

// Diretório onde procurar os arquivos de controle
const DIRECTORY = './attached_assets';

// Importar o processador de arquivos de controle
const { processControlFile } = require('./server/services/control-file-processor');

/**
 * Verifica se um arquivo é possivelmente um arquivo de controle
 * @param {string} filename - Nome do arquivo
 * @returns {boolean} - Verdadeiro se o arquivo parece ser um arquivo de controle
 */
function isControlFile(filename) {
  // Verifica se o nome do arquivo contém "Controlo" ou "controlo"
  return filename.toLowerCase().includes('controlo') && 
         filename.toLowerCase().endsWith('.pdf');
}

/**
 * Processa todos os arquivos de controle encontrados
 */
async function processAllControlFiles() {
  console.log('Procurando arquivos de controle em:', DIRECTORY);
  
  try {
    // Listar arquivos no diretório
    const files = fs.readdirSync(DIRECTORY);
    
    // Filtrar apenas PDFs de controle
    const controlFiles = files.filter(file => isControlFile(file));
    
    console.log(`Encontrados ${controlFiles.length} arquivos de controle:`);
    controlFiles.forEach(file => console.log(`- ${file}`));
    
    // Processar cada arquivo
    console.log('\nIniciando processamento...');
    
    for (const file of controlFiles) {
      const filePath = path.join(DIRECTORY, file);
      console.log(`\nProcessando: ${file}`);
      
      try {
        const result = await processControlFile(filePath);
        
        if (result.success) {
          console.log(`✅ Arquivo ${file} processado com sucesso!`);
          console.log(`   Propriedade: ${result.propertyName}`);
          console.log(`   Reservas encontradas: ${result.reservations.length}`);
          
          // Mostrar algumas das reservas encontradas
          if (result.reservations.length > 0) {
            console.log('\n   Primeiras 3 reservas:');
            result.reservations.slice(0, 3).forEach((reservation, index) => {
              console.log(`   [${index + 1}] ${reservation.guestName}: ${reservation.checkInDate} a ${reservation.checkOutDate} (${reservation.numGuests} hóspedes)`);
            });
          }
        } else {
          console.log(`❌ Falha ao processar ${file}: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${file}:`, error);
      }
    }
    
    console.log('\nProcessamento concluído!');
    
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
  }
}

// Executar o script
processAllControlFiles();