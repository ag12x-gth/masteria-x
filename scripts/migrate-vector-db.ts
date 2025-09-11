
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { vectorDb, vectorConn } from '../src/lib/db/vector-db';
import postgres from 'postgres'

const runVectorMigrate = async () => {
  console.log('🟠 Iniciando aplicação das migrations para o banco vetorial...');

  try {
    console.log('🟠 Enabling vector extension...')
    const vectorDbClient = postgres(process.env.VECTOR_DB_URL!, { max: 1 })
    await vectorDbClient`CREATE EXTENSION IF NOT EXISTS vector;`
    console.log('🟢 Vector extension enabled successfully!')
    await migrate(vectorDb, { migrationsFolder: 'drizzle/vector' });
    console.log('✅ Migrations vetoriais aplicadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao aplicar migrations vetoriais:', err);
    process.exit(1);
  } finally {
    console.log('🔵 Finalizando conexão com o banco vetorial.');
    await vectorConn.end();
    process.exit(0);
  }
};

runVectorMigrate();
