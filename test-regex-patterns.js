/**
 * Teste rápido dos novos padrões regex para extração de propriedades
 */

const sampleText = `
A203-     São João                                                    23-06
                                                         20-06-2025                                                                                                                                           Pend                 Pende
HMPXQ22FB Batista T3         -              Confirmada                -2025     3       0        0      -     Viviane Tavares Viviane Tavares
                                                            16:00                                                                                                                                             ente                 nte

A169-56862993                                            23-06-2025                                                                                                      thlady.657413@gu                    Pende                 Pendent
              Peniche 2 K    Peniche        Confirmada                 2025     2       0        0      -     Taisiia Hladyshko   Taisiia Hladyshko   +45 52 22 74 04                     Dinamarca    -              -                    16:00   -
92-943                                                      16:00                                                                                                        est.booking.com                     nte                   e

A203-          Almada                                                 27-06-
                                                         24-06-2025                                           Amadeo Marin        Amadeo Marin                           marinpaz2@gma                        Pende                Penden
HMMKTCTSX      Noronha 37    -              Confirmada                 2025     4       0        0      -                                             34653815348                      Espanha         -            -                     18:30 -
`;

console.log('🔍 TESTE DOS NOVOS PADRÕES REGEX');
console.log('================================');

// Padrões atualizados que foram incluídos no código
const propertyPatterns = [
  // Padrões para nomes quebrados em linhas (como "São João\nBatista T3")
  /São\s+João[\s\n]*Batista\s+T\d/i,
  /Almada[\s\n]*Noronha\s+\d+/i,
  /Casa[\s\n]*dos[\s\n]*Barcos\s+T\d/i,
  // Padrões diretos
  /Peniche\s+\d+\s+K/i,
  /Peniche\s+[A-Z]+\s*\([^\)]*\)/i,
  /Peniche\s+RC\s+[A-Z]/i,
  // Padrões existentes
  /Almada\s+[^\n]+/i,
  /Aroeira\s+[IVX]+/i,
  /Nazaré?\s+T\d/i,
  /EXCITING\s+LISBON\s+[^\n]+/i
];

console.log('\n📝 TEXTO DE TESTE:');
console.log(sampleText.slice(0, 300) + '...');

console.log('\n🎯 TESTANDO PADRÕES:');
propertyPatterns.forEach((pattern, index) => {
  const match = sampleText.match(pattern);
  console.log(`${index + 1}. ${pattern.source}`);
  console.log(`   Match: ${match ? `"${match[0].trim()}"` : 'Nenhum'}`);
});

console.log('\n🔍 BUSCA MANUAL POR PROPRIEDADES CONHECIDAS:');
const manualSearch = [
  'São João Batista T3',
  'Peniche 2 K', 
  'Almada Noronha 37'
];

manualSearch.forEach(search => {
  const found = sampleText.includes(search);
  console.log(`${search}: ${found ? '✅ Encontrado' : '❌ Não encontrado'}`);
});

console.log('\n💡 CONCLUSÃO:');
console.log('Se os padrões não estão funcionando, pode ser porque:');
console.log('1. O texto real do PDF está com formatação diferente');
console.log('2. Os nomes estão quebrados em múltiplas linhas');
console.log('3. Há caracteres especiais ou espaços extras');