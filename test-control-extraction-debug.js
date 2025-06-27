/**
 * Script para debugar extração específica de propriedades nos arquivos de controle
 * Testa especificamente a lógica de regex do fallback manual
 */

async function debugControlExtraction() {
    console.log('🔧 DEBUG: Extração de Propriedades em Arquivos de Controle');
    console.log('==========================================================');
    
    // Simular texto real do control1.pdf (primeira entrada)
    const sampleText = `
A203-     São João                                                    23-06
                                                         20-06-2025                                                                                                                                           Pend                 Pende
HMPXQ22FB Batista T3         -              Confirmada                -2025     3       0        0      -     Viviane Tavares Viviane Tavares
                                                            16:00                                                                                                                                             ente                 nte
M         (243)                                                       11:00                                   Dos Santos      Dos Santos      34643921846                -                 -           -              -                        -       -
                                                                                                                Magalhães       Magalhães

A169-56862993                                            23-06-2025                                                                                                      thlady.657413@gu                    Pende                 Pendent
              Peniche 2 K    Peniche        Confirmada                 2025     2       0        0      -     Taisiia Hladyshko   Taisiia Hladyshko   +45 52 22 74 04                     Dinamarca    -              -                    16:00   -
92-943                                                      16:00                                                                                                        est.booking.com                     nte                   e
                                                                      11:00
`;

    console.log('\n1️⃣ TEXTO DE EXEMPLO (primeira reserva):');
    console.log(sampleText.slice(0, 500) + '...');
    
    // Testar regex para propriedade
    console.log('\n2️⃣ TESTANDO REGEX PARA PROPRIEDADE:');
    
    const propertyRegexes = [
        /([A-Z]\d+-[A-Z0-9]+)\s+([A-Za-zÀ-ÿ\s\d\(\)]+?)\s+(?:-\s+)?(?:Confirmada|Pendente|Cancelada)/gi,
        /([A-Z]\d+-[A-Z0-9]+)\s*([A-Za-zÀ-ÿ\s\d\(\)]+?)\s*(?:-\s*)?(?:Confirmada|Pendente|Cancelada)/gi,
        /Referência\s+Alojamento[\s\S]*?([A-Z]\d+-[A-Z0-9]+)\s+([A-Za-zÀ-ÿ\s\d\(\)]+?)\s+/gi,
        /([A-Z]\d+-[A-Z0-9]+)\s+([A-Za-zÀ-ÿ\d\s\(\)]+?)\s+(?:-\s+)?(?:Confirmada|Pendente)/gi
    ];
    
    propertyRegexes.forEach((regex, index) => {
        console.log(`\n🔍 Testando regex ${index + 1}:`);
        console.log(`Pattern: ${regex.source}`);
        
        const matches = [...sampleText.matchAll(regex)];
        console.log(`Matches encontrados: ${matches.length}`);
        
        matches.forEach((match, i) => {
            console.log(`  Match ${i + 1}: Ref="${match[1]}" Propriedade="${match[2]?.trim()}"`);
        });
    });
    
    // Testar regex para hóspede
    console.log('\n3️⃣ TESTANDO REGEX PARA HÓSPEDE:');
    
    const guestRegexes = [
        /Cliente\s+Hóspede[\s\S]*?(\w+(?:\s+\w+)*)\s+(\w+(?:\s+\w+)*)\s+(?:\d+|\+\d+)/gi,
        /(\w+(?:\s+\w+)*)\s+(\w+(?:\s+\w+)*)\s+\d{10,15}/gi,
        /([A-Za-zÀ-ÿ\s]+?)\s+([A-Za-zÀ-ÿ\s]+?)\s+\d{8,15}/gi
    ];
    
    guestRegexes.forEach((regex, index) => {
        console.log(`\n🔍 Testando regex hóspede ${index + 1}:`);
        console.log(`Pattern: ${regex.source}`);
        
        const matches = [...sampleText.matchAll(regex)];
        console.log(`Matches encontrados: ${matches.length}`);
        
        matches.forEach((match, i) => {
            console.log(`  Match ${i + 1}: "${match[1]?.trim()}" "${match[2]?.trim()}"`);
        });
    });
    
    // Testar datas
    console.log('\n4️⃣ TESTANDO REGEX PARA DATAS:');
    
    const dateRegexes = [
        /(\d{2}-\d{2}-\d{4})/g,
        /Check in[\s\S]*?(\d{2}-\d{2}-\d{4})/gi,
        /(\d{2}-\d{2}-\d{4})[\s\S]*?(\d{2}-\d{2}-\d{4})/g
    ];
    
    dateRegexes.forEach((regex, index) => {
        console.log(`\n🔍 Testando regex datas ${index + 1}:`);
        
        const matches = [...sampleText.matchAll(regex)];
        console.log(`Matches encontrados: ${matches.length}`);
        
        matches.forEach((match, i) => {
            console.log(`  Match ${i + 1}: ${match[1]} ${match[2] || ''}`);
        });
    });
    
    // Simular a função de extração manual atual
    console.log('\n5️⃣ SIMULANDO EXTRAÇÃO MANUAL ATUAL:');
    
    function extractManualData(text) {
        // Padrões atuais do sistema
        const referenceMatch = text.match(/([A-Z]\d+-[A-Z0-9]+)/);
        const guestMatch = text.match(/([A-Za-zÀ-ÿ\s]+?)\s+\d{8,15}/);
        const dateMatches = [...text.matchAll(/(\d{2}-\d{2}-\d{4})/g)];
        
        return {
            reference: referenceMatch?.[1],
            guestName: guestMatch?.[1]?.trim(),
            dates: dateMatches.map(m => m[1]),
            checkInDate: dateMatches[0]?.[1],
            checkOutDate: dateMatches[1]?.[1]
        };
    }
    
    const result = extractManualData(sampleText);
    console.log('Resultado da extração manual atual:');
    console.log(JSON.stringify(result, null, 2));
    
    // Propor nova extração melhorada
    console.log('\n6️⃣ PROPOSTA DE EXTRAÇÃO MELHORADA:');
    
    function extractImprovedData(text) {
        // Melhorar para extrair propriedade também
        const lines = text.split('\n').filter(line => line.trim());
        
        // Buscar linha com referência + propriedade
        const propertyLine = lines.find(line => /[A-Z]\d+-[A-Z0-9]+/.test(line) && /Confirmada|Pendente/.test(line));
        
        let propertyName = null;
        let reference = null;
        
        if (propertyLine) {
            const propMatch = propertyLine.match(/([A-Z]\d+-[A-Z0-9]+)\s+([A-Za-zÀ-ÿ\d\s\(\)]+?)\s+(?:-\s+)?(?:Confirmada|Pendente)/i);
            if (propMatch) {
                reference = propMatch[1];
                propertyName = propMatch[2]?.trim();
            }
        }
        
        // Buscar hóspede (primeira ocorrência de nome + telefone)
        const guestMatch = text.match(/([A-Za-zÀ-ÿ\s]{3,30}?)\s+([A-Za-zÀ-ÿ\s]{3,30}?)\s+\d{8,15}/);
        const guestName = guestMatch ? `${guestMatch[1]?.trim()} ${guestMatch[2]?.trim()}` : null;
        
        // Buscar datas
        const dateMatches = [...text.matchAll(/(\d{2}-\d{2}-\d{4})/g)];
        
        return {
            reference,
            propertyName,
            guestName,
            checkInDate: dateMatches[0]?.[1],
            checkOutDate: dateMatches[1]?.[1],
            allDates: dateMatches.map(m => m[1])
        };
    }
    
    const improvedResult = extractImprovedData(sampleText);
    console.log('Resultado da extração melhorada:');
    console.log(JSON.stringify(improvedResult, null, 2));
    
    console.log('\n✅ Debug completo!');
    console.log('\n💡 CONCLUSÕES:');
    console.log('1. O sistema atual não está extraindo nomes de propriedades');
    console.log('2. Precisa melhorar regex para capturar "São João Batista T3", "Peniche 2 K", etc.');
    console.log('3. O fallback manual deve incluir extração de propriedade, não só hóspede e datas');
}

debugControlExtraction().catch(console.error);