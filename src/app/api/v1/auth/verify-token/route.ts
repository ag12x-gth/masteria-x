// src/app/api/v1/auth/verify-token/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/auth';

/**
 * Endpoint to verify if an API token is valid
 * This can be used by Windsurf or other tools to test their token
 * 
 * Usage:
 * curl -H "Authorization: Bearer zap_sk_your_token_here" \
 *      https://master.sendzap-ia.com/api/v1/auth/verify-token
 */
export async function GET(request: NextRequest) {
    const authResult = await validateApiKey(request);

    if (!authResult.isValid) {
        return NextResponse.json(
            { 
                valid: false, 
                error: authResult.error || 'Invalid token' 
            }, 
            { status: 401 }
        );
    }

    return NextResponse.json({
        valid: true,
        companyId: authResult.companyId,
        userId: authResult.userId,
        type: authResult.userId ? 'personal' : 'company',
    });
}
