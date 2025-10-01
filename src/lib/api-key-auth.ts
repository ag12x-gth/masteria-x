// src/lib/api-key-auth.ts
'use server';

import { db } from '@/lib/db';
import { apiKeys, users, companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import type { UserWithCompany } from '@/lib/types';

/**
 * Validates an API key and returns the associated user and company
 */
export async function validateApiKey(key: string): Promise<{ user: UserWithCompany | null, error?: string }> {
    try {
        // Find the API key in the database
        const [apiKey] = await db
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.key, key))
            .limit(1);

        if (!apiKey) {
            return { user: null, error: 'Chave de API inválida.' };
        }

        // Get the company and user associated with this API key
        const results = await db
            .select({
                user: users,
                company: companies
            })
            .from(companies)
            .leftJoin(users, eq(users.companyId, companies.id))
            .where(eq(companies.id, apiKey.companyId))
            .limit(1);

        if (results.length === 0 || !results[0]) {
            return { user: null, error: 'Empresa associada à chave de API não encontrada.' };
        }

        const { user, company } = results[0];

        if (!user) {
            return { user: null, error: 'Utilizador não encontrado para esta empresa.' };
        }

        const { password, ...userWithoutPassword } = user;

        return { user: { ...userWithoutPassword, company: company || null } };
    } catch (error) {
        console.error('Erro ao validar chave de API:', error);
        return { user: null, error: 'Erro ao validar chave de API.' };
    }
}

/**
 * Gets the API key from request headers
 */
export async function getApiKeyFromHeaders(): Promise<string | null> {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
        return null;
    }

    // Support both "Bearer <token>" and direct API key
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    return authHeader;
}

/**
 * Authenticates a request using API key from headers
 */
export async function authenticateApiKey(): Promise<{ user: UserWithCompany | null, error?: string }> {
    const apiKey = await getApiKeyFromHeaders();

    if (!apiKey) {
        return { user: null, error: 'Chave de API não fornecida.' };
    }

    return await validateApiKey(apiKey);
}

/**
 * Gets company ID from API key authentication
 */
export async function getCompanyIdFromApiKey(): Promise<string> {
    const result = await authenticateApiKey();
    
    if (result.error || !result.user?.companyId) {
        throw new Error('Não autorizado: Chave de API inválida ou empresa não encontrada.');
    }
    
    return result.user.companyId;
}
