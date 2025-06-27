/**
 * Script para diagnosticar problema de matching de propriedades nos arquivos controlo1.pdf e control2.pdf
 * Analisa especificamente porque propriedades não estão sendo encontradas
 */

async function testControlPropertyMatching() {
    console.log('🔍 DIAGNÓSTICO: Problema de Matching de Propriedades em Arquivos de Controle');
    console.log('================================================================================');
    
    let properties = [];
    
    // 1. Verificar propriedades disponíveis na BD
    console.log('\n1️⃣ PROPRIEDADES DISPONÍVEIS NA BASE DE DADOS:');
    try {
        const response = await fetch('http://localhost:5000/api/properties');
        properties = await response.json();
        
        console.log(`📊 Total de propriedades: ${properties.length}`);
        
        // Filtrar propriedades que podem corresponder aos nomes nos PDFs
        const relevantProperties = properties.filter(p => {
            const name = p.name.toLowerCase();
            return name.includes('joão') || name.includes('batista') || 
                   name.includes('peniche') || name.includes('almada') || 
                   name.includes('barcos') || name.includes('casa') ||
                   name.includes('noronha');
        });
        
        console.log('\n🎯 PROPRIEDADES POSSIVELMENTE RELEVANTES:');
        relevantProperties.forEach(p => {
            console.log(`  - ID: ${p.id} | Nome: "${p.name}" | Aliases: [${p.aliases.join(', ')}]`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar propriedades:', error.message);
        return;
    }
    
    // 2. Extrair texto dos PDFs e identificar nomes de propriedades
    console.log('\n2️⃣ NOMES EXTRAÍDOS DOS PDFS DE CONTROLE:');
    
    const pdfNames = {
        'control1.pdf': [
            'São João Batista T3',
            'Peniche 2 K', 
            'Almada Noronha 37',
            'Casa dos Barcos T1'
        ],
        'control2.pdf': [
            'Peniche 2 K',
            'Peniche J (363)',
            'Peniche RC D',
            'São João Batista T3',
            'Casa dos Barcos T1',
            'Almada Noronha 37',
            'Peniche RC A'
        ]
    };
    
    console.log('\n📋 NOMES ENCONTRADOS NOS PDFs:');
    Object.entries(pdfNames).forEach(([file, names]) => {
        console.log(`\n${file}:`);
        names.forEach(name => {
            console.log(`  - "${name}"`);
        });
    });
    
    // 3. Simular o matching atual do sistema
    console.log('\n3️⃣ SIMULAÇÃO DE MATCHING FUZZY:');
    
    // Função simplificada de fuzzy matching (baseada na implementação real)
    function calculateFuzzyScore(name1, name2) {
        if (!name1 || !name2) return 0;
        
        const clean1 = name1.toLowerCase().trim();
        const clean2 = name2.toLowerCase().trim();
        
        // Exact match
        if (clean1 === clean2) return 100;
        
        // Contains match
        if (clean1.includes(clean2) || clean2.includes(clean1)) return 80;
        
        // Word match
        const words1 = clean1.split(/\s+/);
        const words2 = clean2.split(/\s+/);
        
        let matchingWords = 0;
        words1.forEach(word1 => {
            if (words2.some(word2 => word1.includes(word2) || word2.includes(word1))) {
                matchingWords++;
            }
        });
        
        return Math.round((matchingWords / Math.max(words1.length, words2.length)) * 60);
    }
    
    // Testar matching para todos os nomes extraídos
    const allExtractedNames = [...new Set([...pdfNames['control1.pdf'], ...pdfNames['control2.pdf']])];
    
    allExtractedNames.forEach(extractedName => {
        console.log(`\n🔍 Testando: "${extractedName}"`);
        
        const matches = properties.map(prop => ({
            id: prop.id,
            name: prop.name,
            score: Math.max(
                calculateFuzzyScore(extractedName, prop.name),
                ...prop.aliases.map(alias => calculateFuzzyScore(extractedName, alias))
            )
        })).filter(match => match.score > 0).sort((a, b) => b.score - a.score);
        
        if (matches.length > 0) {
            console.log('  ✅ Matches encontrados:');
            matches.slice(0, 3).forEach(match => {
                console.log(`    - "${match.name}" (Score: ${match.score}%)`);
            });
        } else {
            console.log('  ❌ Nenhum match encontrado');
            
            // Sugerir melhorias de aliases
            console.log('  💡 Sugestões de aliases para melhorar matching:');
            if (extractedName.includes('São João Batista')) {
                console.log('    - Para "João Batista": adicionar aliases ["São João Batista T3", "São João Batista"]');
            } else if (extractedName.includes('Peniche')) {
                console.log('    - Criar propriedade "Peniche" com aliases para variações específicas');
            } else if (extractedName.includes('Almada')) {
                console.log('    - Para "Almada rei": adicionar aliases ["Almada Noronha 37", "Almada Noronha"]');
            } else if (extractedName.includes('Casa dos Barcos')) {
                console.log('    - Para "Barcos": adicionar aliases ["Casa dos Barcos T1", "Casa dos Barcos"]');
            }
        }
    });
    
    // 4. Proposta de solução
    console.log('\n4️⃣ PROPOSTA DE SOLUÇÃO:');
    console.log('================================================================================');
    
    const aliasProposals = [
        {
            propertyName: 'João Batista',
            currentAliases: [],
            proposedAliases: ['São João Batista T3', 'São João Batista', 'Batista T3']
        },
        {
            propertyName: 'Almada rei', 
            currentAliases: [],
            proposedAliases: ['Almada Noronha 37', 'Almada Noronha', 'Noronha 37']
        },
        {
            propertyName: 'Barcos (Check-in)',
            currentAliases: [],
            proposedAliases: ['Casa dos Barcos T1', 'Casa dos Barcos', 'Barcos T1']
        }
    ];
    
    console.log('\n📝 COMANDOS SQL PARA CORRIGIR ALIASES:');
    aliasProposals.forEach(proposal => {
        const aliasArray = `[${proposal.proposedAliases.map(a => `"${a}"`).join(', ')}]`;
        console.log(`\nUPDATE properties SET aliases = '${aliasArray}' WHERE name = '${proposal.propertyName}';`);
    });
    
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('1. Adicionar aliases específicos para as variações encontradas nos PDFs');
    console.log('2. Criar propriedade "Peniche" se não existir, com aliases para todas as variações');
    console.log('3. Testar novamente o upload após aplicar os aliases');
    console.log('4. Considerar threshold de 60% para matching (ao invés de 70%)');
    
    console.log('\n✅ Diagnóstico completo!');
}

// Executar o teste
testControlPropertyMatching().catch(console.error);