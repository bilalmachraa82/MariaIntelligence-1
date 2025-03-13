// Execute database migration
import { exec } from 'child_process';

console.log('Running database migration...');

exec('npx drizzle-kit push', (error, stdout, stderr) => {
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