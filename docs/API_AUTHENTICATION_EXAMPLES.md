# API Authentication Examples

## Overview

This document provides examples of how to use API key authentication in various scenarios within the Master IA Oficial platform.

## Authenticating with API Keys

The platform supports two authentication methods for API endpoints:

1. **Cookie-based Session** (for web UI): Uses JWT tokens stored in cookies
2. **API Key** (for external tools): Uses Bearer tokens in the Authorization header

## Helper Functions

### validateApiKey

Located in `src/lib/auth.ts`, this function validates API keys from the Authorization header:

```typescript
import { validateApiKey } from '@/lib/auth';

const authResult = await validateApiKey(request);
// Returns: { isValid: boolean, userId?: string, companyId?: string, error?: string }
```

### Existing Session Functions

From `src/app/actions.ts`:
- `getUserSession()`: Get current user from cookie-based session
- `getCompanyIdFromSession()`: Get company ID from session
- `getUserIdFromSession()`: Get user ID from session

## Example 1: Dual Authentication Support

Support both cookie-based session AND API key authentication:

```typescript
// src/app/api/v1/my-endpoint/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { getCompanyIdFromSession } from '@/app/actions';

export async function GET(request: NextRequest) {
    let companyId: string;
    let userId: string | undefined;

    // Try API key authentication first
    const authResult = await validateApiKey(request);
    
    if (authResult.isValid) {
        // Authenticated via API key
        companyId = authResult.companyId!;
        userId = authResult.userId;
    } else {
        // Fall back to cookie-based session
        try {
            companyId = await getCompanyIdFromSession();
        } catch (error) {
            return NextResponse.json(
                { error: 'Unauthorized' }, 
                { status: 401 }
            );
        }
    }

    // Your endpoint logic here
    // ...
    
    return NextResponse.json({ success: true });
}
```

## Example 2: API Key Only

Require API key authentication (no cookie fallback):

```typescript
// src/app/api/v1/external/my-endpoint/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    // Validate API key
    const authResult = await validateApiKey(request);

    if (!authResult.isValid) {
        return NextResponse.json(
            { error: authResult.error || 'Invalid API key' }, 
            { status: 401 }
        );
    }

    const { companyId, userId } = authResult;

    // Fetch data scoped to the company
    const companyContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.companyId, companyId));

    return NextResponse.json({
        contacts: companyContacts,
        isPersonalToken: !!userId,
    });
}
```

## Example 3: Personal Token Required

Require a personal token (reject company tokens):

```typescript
// src/app/api/v1/user/my-data/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const authResult = await validateApiKey(request);

    if (!authResult.isValid) {
        return NextResponse.json(
            { error: 'Unauthorized' }, 
            { status: 401 }
        );
    }

    // Require personal token (must have userId)
    if (!authResult.userId) {
        return NextResponse.json(
            { error: 'This endpoint requires a personal token' }, 
            { status: 403 }
        );
    }

    const { userId, companyId } = authResult;

    // Fetch user-specific data
    // ...

    return NextResponse.json({
        userId,
        companyId,
        // ... user data
    });
}
```

## Example 4: POST Request with API Key

Handle POST requests with API key authentication:

```typescript
// src/app/api/v1/contacts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { getCompanyIdFromSession } from '@/app/actions';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { z } from 'zod';

const contactSchema = z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
    // Dual authentication
    let companyId: string;
    
    const authResult = await validateApiKey(request);
    if (authResult.isValid) {
        companyId = authResult.companyId!;
    } else {
        try {
            companyId = await getCompanyIdFromSession();
        } catch (error) {
            return NextResponse.json(
                { error: 'Unauthorized' }, 
                { status: 401 }
            );
        }
    }

    // Parse request body
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid data', details: parsed.error.flatten() }, 
            { status: 400 }
        );
    }

    // Create contact
    const [newContact] = await db.insert(contacts).values({
        companyId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
    }).returning();

    return NextResponse.json(newContact, { status: 201 });
}
```

## Testing with cURL

### Test authentication:
```bash
curl -H "Authorization: Bearer zap_sk_your_token_here" \
     http://localhost:9002/api/v1/auth/verify-token
```

### GET request:
```bash
curl -H "Authorization: Bearer zap_sk_your_token_here" \
     http://localhost:9002/api/v1/contacts
```

### POST request:
```bash
curl -X POST \
     -H "Authorization: Bearer zap_sk_your_token_here" \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","phone":"+1234567890"}' \
     http://localhost:9002/api/v1/contacts
```

## Best Practices

1. **Always validate the token**: Never skip authentication checks
2. **Scope data to company**: Always filter queries by `companyId`
3. **Handle both auth methods**: Support both cookies and API keys for flexibility
4. **Clear error messages**: Return helpful error messages for debugging
5. **Log suspicious activity**: Monitor for invalid token attempts
6. **Rate limiting**: Consider implementing rate limits for API key requests

## Security Considerations

1. **Never log tokens**: Don't include tokens in logs or error messages
2. **HTTPS only**: Always use HTTPS in production
3. **Token storage**: Store tokens securely in environment variables or secrets managers
4. **Revocation**: Provide easy way to revoke compromised tokens
5. **Minimal permissions**: Use personal tokens with limited scope when possible
