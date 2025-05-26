/**
 * Script para testar e corrigir o parsing JSON do Gemini
 * Este script implementa uma função mais robusta para lidar com JSON mal formado
 */

function fixMalformedJson(jsonStr) {
  try {
    // Primeiro, tentar parsing normal
    return JSON.parse(jsonStr);
  } catch (error) {
    console.log('JSON malformado, tentando corrigir...');
    
    // Técnicas de correção
    let fixed = jsonStr;
    
    // 1. Remover vírgulas extras antes de } ou ]
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // 2. Adicionar vírgulas entre objetos quando necessário
    fixed = fixed.replace(/}(\s*){/g, '},$1{');
    
    // 3. Corrigir aspas não fechadas ou duplas
    fixed = fixed.replace(/""([^"]*)""/g, '"$1"');
    
    // 4. Remover quebras de linha problemáticas dentro de strings
    fixed = fixed.replace(/"([^"]*)\n([^"]*)"/, '"$1 $2"');
    
    // 5. Tentar extrair apenas o array de reservations se existir
    const reservationsMatch = fixed.match(/"reservations"\s*:\s*\[([\s\S]*?)\]/);
    if (reservationsMatch) {
      const reservationsArray = reservationsMatch[1];
      fixed = `{"reservations": [${reservationsArray}]}`;
    }
    
    try {
      return JSON.parse(fixed);
    } catch (secondError) {
      console.log('Não foi possível corrigir o JSON automaticamente');
      
      // Como último recurso, tentar extrair dados manualmente
      const reservations = [];
      const guestMatches = fixed.match(/"guestName"\s*:\s*"([^"]+)"/g);
      const propertyMatches = fixed.match(/"propertyName"\s*:\s*"([^"]+)"/g);
      const checkinMatches = fixed.match(/"checkInDate"\s*:\s*"([^"]+)"/g);
      const checkoutMatches = fixed.match(/"checkOutDate"\s*:\s*"([^"]+)"/g);
      
      if (guestMatches && propertyMatches) {
        for (let i = 0; i < Math.min(guestMatches.length, propertyMatches.length); i++) {
          reservations.push({
            guestName: guestMatches[i].match(/"([^"]+)"/)[1],
            propertyName: propertyMatches[i].match(/"([^"]+)"/)[1],
            checkInDate: checkinMatches?.[i]?.match(/"([^"]+)"/)?.[1] || null,
            checkOutDate: checkoutMatches?.[i]?.match(/"([^"]+)"/)?.[1] || null,
            totalAmount: 0,
            guestCount: 1
          });
        }
      }
      
      return { reservations };
    }
  }
}

// Testar a função
const malformedJson = `{
  "reservations": [
    {
      "guestName": "João Silva",
      "propertyName": "Aroeira I"
    },
    {
      "guestName": "Maria Santos",
      "propertyName": "Aroeira II"
    }
  ]
}`;

console.log('Teste:', fixMalformedJson(malformedJson));