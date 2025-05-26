/**
 * Parser JSON robusto para corrigir respostas malformadas do Gemini
 */

export function fixMalformedJson(jsonStr: string): any {
  console.log('🔧 Tentando corrigir JSON malformado...');
  
  try {
    // Primeiro, tentar parse direto
    return JSON.parse(jsonStr);
  } catch (error) {
    console.log('❌ JSON malformado detectado, aplicando correções...');
    
    let fixed = jsonStr;
    
    // Remover markdown se presente
    fixed = fixed.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // Corrigir vírgulas em excesso antes de }
    fixed = fixed.replace(/,(\s*})/g, '$1');
    
    // Corrigir vírgulas em excesso antes de ]
    fixed = fixed.replace(/,(\s*])/g, '$1');
    
    // Adicionar vírgulas ausentes entre objetos
    fixed = fixed.replace(/}(\s*){/g, '},$1{');
    
    // Corrigir aspas não fechadas
    fixed = fixed.replace(/([{,]\s*"[^"]*)"([^"]*)"([^"]*:)/g, '$1$2$3');
    
    // Tentar corrigir arrays não fechados
    if (fixed.includes('"reservations":[') && !fixed.includes(']}')) {
      const lastBrace = fixed.lastIndexOf('}');
      if (lastBrace > -1) {
        fixed = fixed.substring(0, lastBrace + 1) + ']}';
      }
    }
    
    try {
      console.log('✅ JSON corrigido com sucesso');
      return JSON.parse(fixed);
    } catch (secondError) {
      console.log('❌ Ainda não foi possível corrigir, tentando extração manual...');
      
      // Extração manual como último recurso
      const reservationsMatch = fixed.match(/"reservations":\s*\[(.*)\]/);
      if (reservationsMatch) {
        try {
          const reservationsStr = '[' + reservationsMatch[1] + ']';
          const reservations = JSON.parse(reservationsStr);
          return { reservations };
        } catch (thirdError) {
          console.log('❌ Extração manual falhou, retornando estrutura vazia');
          return { reservations: [] };
        }
      }
      
      return { reservations: [] };
    }
  }
}