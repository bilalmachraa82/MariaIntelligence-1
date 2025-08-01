// Script temporário para build
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando correção de build...');

// Verificar se node_modules existe
if (!fs.existsSync('node_modules')) {
  console.log('❌ node_modules não encontrado. Execute npm install primeiro.');
  process.exit(1);
}

// Criar script de build simplificado
const buildScript = `
#!/bin/bash
echo "📦 Building client..."
cd client && npx vite build --outDir ../dist/public
echo "📦 Building server..."
cd .. && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
echo "✅ Build completo!"
`;

fs.writeFileSync('build-temp.sh', buildScript, { mode: 0o755 });

try {
  execSync('bash build-temp.sh', { stdio: 'inherit' });
} finally {
  fs.unlinkSync('build-temp.sh');
}