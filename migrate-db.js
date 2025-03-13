// Execute database migration
import { exec } from 'child_process';

console.log('Running database migration...');

// Adicionando a flag --non-interactive para evitar prompts de interação
exec('npx drizzle-kit push --non-interactive', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`Migration completed:\n${stdout}`);
});