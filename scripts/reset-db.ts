import { execSync } from 'child_process';
import 'dotenv/config';

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Reset não permitido em produção.');
  process.exit(1);
}

console.log('🧨 Resetando banco de dados...');
try {
  execSync('npm run db:rollback', { stdio: 'inherit' });
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('✅ Reset concluído com sucesso!');
} catch (err) {
  console.error('❌ Erro durante o reset:', err);
  process.exit(1);
}
