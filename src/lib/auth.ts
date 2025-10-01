// src/lib/auth.ts

import { db } from '@/lib/db';
import { apiKeys, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export interface AuthResult {
  isValid: boolean;
  userId?: string;
  companyId?: string;
  error?: string;
}

/**
 * Validates an API key from the Authorization header
 * Supports both personal tokens and company tokens
 * @param request - NextRequest object
 * @returns AuthResult with validation status and user/company info
 */
export async function validateApiKey(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return { isValid: false, error: 'Missing Authorization header' };
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  
  if (!token) {
    return { isValid: false, error: 'Invalid Authorization header format' };
  }

  // Validate token format (should start with zap_sk_)
  if (!token.startsWith('zap_sk_')) {
    return { isValid: false, error: 'Invalid token format' };
  }

  try {
    // Look up the API key in the database
    const [apiKey] = await db
      .select({
        id: apiKeys.id,
        companyId: apiKeys.companyId,
        userId: apiKeys.userId,
      })
      .from(apiKeys)
      .where(eq(apiKeys.key, token))
      .limit(1);

    if (!apiKey) {
      return { isValid: false, error: 'Invalid or revoked token' };
    }

    // If the token is a personal token, verify the user exists
    if (apiKey.userId) {
      const [user] = await db
        .select({ id: users.id, companyId: users.companyId })
        .from(users)
        .where(eq(users.id, apiKey.userId))
        .limit(1);

      if (!user) {
        return { isValid: false, error: 'User not found' };
      }

      return {
        isValid: true,
        userId: user.id,
        companyId: user.companyId || apiKey.companyId,
      };
    }

    // Company token - no specific user
    return {
      isValid: true,
      companyId: apiKey.companyId,
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { isValid: false, error: 'Internal server error' };
  }
}

/**
 * Extracts API key from Authorization header
 * @param request - NextRequest object
 * @returns API key string or null
 */
export function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  
  if (!token || !token.startsWith('zap_sk_')) {
    return null;
  }

  return token;
}
