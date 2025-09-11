
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, conn } from '../src/lib/db'; // Importar a instância centralizada
import { runSeed } from './seed-drizzle';

const runMigrate = async () => {
  console.log('🟠 Iniciando a migração do schema...');
  
  try {
    // 1. Executar a migração usando a instância de db partilhada
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('✅ Migração concluída com sucesso!');
    
    // 2. Executar o seed, passando a instância do db
    // A execução sequencial é garantida pelo await anterior.
    await runSeed(db);

  } catch (err) {
    console.error('❌ Erro durante a migração ou seed:', err);
    process.exit(1);
  } finally {
    // 3. Encerrar a conexão apenas no final de tudo
    // Isto é importante para que o script termine e não mantenha o processo pendurado.
    console.log('🔵 Finalizando processo de migração e seed.');
    await conn.end();
    process.exit(0);
  }
};

runMigrate();
