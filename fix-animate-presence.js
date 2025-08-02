#!/usr/bin/env node

/**
 * Script para corrigir imports do AnimatePresence
 * Substitui imports diretos do framer-motion pelo fallback
 */

import fs from 'fs';
import path from 'path';

const files = [
  'client/src/components/reports/owner-report-modern.tsx',
  'client/src/components/reports/trends-report.tsx',
  'client/src/pages/assistant/index.tsx'
];

console.log('🔧 Corrigindo imports do AnimatePresence...\n');

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Verificar se já importa do fallback
    if (content.includes('from "@/lib/motion-fallback"')) {
      console.log(`✅ ${file} - já usa fallback`);
      return;
    }
    
    // Verificar se importa do framer-motion
    if (content.includes('from "framer-motion"')) {
      // Extrair os imports do framer-motion
      const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*["']framer-motion["']/);
      
      if (importMatch) {
        const imports = importMatch[1].split(',').map(i => i.trim());
        
        // Separar motion e AnimatePresence de outros imports
        const motionImports = imports.filter(i => i === 'motion' || i === 'AnimatePresence');
        const otherImports = imports.filter(i => i !== 'motion' && i !== 'AnimatePresence');
        
        if (motionImports.length > 0) {
          // Remover o import original do framer-motion se não houver outros imports
          if (otherImports.length === 0) {
            content = content.replace(/import\s*{[^}]+}\s*from\s*["']framer-motion["'];?\n?/, '');
          } else {
            // Manter apenas os outros imports
            content = content.replace(
              /import\s*{[^}]+}\s*from\s*["']framer-motion["']/,
              `import { ${otherImports.join(', ')} } from "framer-motion"`
            );
          }
          
          // Adicionar import do fallback
          const importStatement = `import { ${motionImports.join(', ')} } from "@/lib/motion-fallback";\n`;
          
          // Encontrar onde adicionar o import (após outros imports)
          const lastImportIndex = content.lastIndexOf('import ');
          if (lastImportIndex !== -1) {
            const lineEnd = content.indexOf('\n', lastImportIndex);
            content = content.slice(0, lineEnd + 1) + importStatement + content.slice(lineEnd + 1);
          } else {
            content = importStatement + content;
          }
          
          // Salvar o arquivo
          fs.writeFileSync(filePath, content);
          console.log(`✅ ${file} - corrigido`);
          console.log(`   Mudou de: framer-motion`);
          console.log(`   Para: @/lib/motion-fallback\n`);
        }
      }
    } else {
      console.log(`⚠️  ${file} - não usa framer-motion`);
    }
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${file}:`, error.message);
  }
});

console.log('\n✅ Correção concluída!');
console.log('\n📝 Próximos passos:');
console.log('1. Faça commit das mudanças');
console.log('2. Push para o GitHub');
console.log('3. O Vercel fará o deploy automaticamente');