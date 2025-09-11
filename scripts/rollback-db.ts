
import { conn, db } from '../src/lib/db';
import { sql } from 'drizzle-orm';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const runRollback = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Rollback não permitido em produção.');
    process.exit(1);
  }

  console.log('🟠 Iniciando rollback da base de dados...');

  try {
    // 1. Apagar o schema public para limpar completamente a base de dados
    console.log('   - Apagando o schema "public" para um reset completo...');
    await db.execute(sql.raw(`DROP SCHEMA IF EXISTS "public" CASCADE;`));
    console.log('   - Recriando o schema "public"...');
    await db.execute(sql.raw(`CREATE SCHEMA "public";`));

    console.log('✅ Schema da base de dados recriado com sucesso.');
    
    // 2. Recriar tabela de controle de migrações
    console.log('   - Recriando a tabela de migrações...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      );
    `);

    // 3. Ler arquivos de migration
    console.log('   - Buscando ficheiros de migração...');
    const migrationFolder = path.join(process.cwd(), 'drizzle');
    const allFiles = await readdir(migrationFolder);
    const migrationFiles = allFiles.filter(f => f.endsWith('.sql')).sort();

    if (migrationFiles.length === 0) {
      console.log('🟡 Nenhuma migração encontrada.');
      return;
    }

    // 4. Ignora a última (rollback)
    const lastMigration = migrationFiles.pop();
    console.log(`   - Rollback: ignorando última migração -> ${lastMigration}`);

    if (migrationFiles.length === 0) {
      console.log('🟡 Nenhuma migração anterior para aplicar. Rollback concluído.');
      return;
    }

    // 5. Reaplica as anteriores
    console.log(`   - Aplicando ${migrationFiles.length} migrações anteriores...`);

    for (const file of migrationFiles) {
      console.log(`     - Aplicando: ${file}`);
      const content = await readFile(path.join(migrationFolder, file), 'utf-8');
      await db.execute(sql.raw(content));
      
      const hashSegment = file.split('_')[1];
      if (!hashSegment) {
        console.warn(`Aviso: O ficheiro de migração ${file} não segue o padrão esperado e será ignorado.`);
        continue;
      }
      const hash = hashSegment.replace('.sql', '');

      await db.execute(sql`
        INSERT INTO "__drizzle_migrations" ("hash", "created_at")
        VALUES (${hash}, ${Date.now()});
      `);
    }

    console.log('✅ Rollback concluído com sucesso!');
    console.log('🚨 A base de dados foi revertida para o estado anterior à última migração.');

  } catch (err) {
    console.error('❌ Erro durante o rollback:', err);
    process.exit(1);
  } finally {
    await conn.end();
    process.exit(0);
  }
};

runRollback();
