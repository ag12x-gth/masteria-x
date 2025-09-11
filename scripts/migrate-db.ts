
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, conn } from '../src/lib/db';

const runMigrateOnly = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Rodando migrations em produção.');
  }

  console.log('🟠 Iniciando aplicação das migrations para o banco principal...');

  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('✅ Migrations principais aplicadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao aplicar migrations principais:', err);
    process.exit(1);
  } finally {
    console.log('🔵 Finalizando conexão com o banco principal.');
    await conn.end();
    process.exit(0);
  }
};

runMigrateOnly();
