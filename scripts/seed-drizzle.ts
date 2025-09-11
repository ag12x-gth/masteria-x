

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../src/lib/db/schema';
import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';

const COMPANY_NAME = 'Empresa de Desenvolvimento Master';
const USER_EMAIL = 'paulo@exemplo.com';
const FIREBASE_UID = 'dev_firebase_uid_paulo';
const DEFAULT_PASSWORD = 'password';

export async function runSeed(db: PostgresJsDatabase<typeof schema>) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Seed bloqueado em produção.');
    return;
  }

  console.log('🟢  Iniciando seed Drizzle...');

  try {
    // Insere ou atualiza a empresa e garante que temos o ID dela de volta.
    const [company] = await db
      .insert(schema.companies)
      .values({
        name: COMPANY_NAME,
        webhookSlug: randomUUID(),
      })
      .onConflictDoUpdate({
        target: schema.companies.name,
        set: {
          name: COMPANY_NAME,
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`   - Empresa "${company.name}" (ID: ${company.id}) criada/verificada.`);

    // Cria o hash da senha padrão
    const passwordHash = await hash(DEFAULT_PASSWORD, 10);

    // Upsert o utilizador de desenvolvimento
    const [user] = await db
      .insert(schema.users)
      .values({
        name: 'Paulo Admin',
        email: USER_EMAIL,
        password: passwordHash, 
        firebaseUid: FIREBASE_UID,
        role: 'admin',
        companyId: company.id,
        emailVerified: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.users.email,
        set: { 
            password: passwordHash, // Se o utilizador já existe, atualiza apenas a senha
        },
      })
      .returning();

    console.log(`   - Utilizador "${user.name}" criado/verificado e associado à empresa.`);
    console.log('🔵 Seed Drizzle concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro no seed:', err);
    throw err;
  }
}
