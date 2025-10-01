# Testing Guide: Personal Access Tokens

This guide provides step-by-step instructions for testing the Personal Access Tokens (PAT) feature.

## Prerequisites

1. The application must be running (`npm run dev`)
2. You must have a user account with access to the Settings page
3. PostgreSQL database must be running
4. Database migrations must be applied

## Test Plan

### 1. Database Migration Test

**Objective**: Verify the database schema was updated correctly.

**Steps**:
```bash
# Apply the migration
npm run db:migrate

# Verify the migration in PostgreSQL
psql -d your_database -c "\d api_keys"
```

**Expected Result**:
- `api_keys` table should have a new column `user_id` (nullable, foreign key to users)

### 2. UI Test - Create Personal Token

**Objective**: Verify users can create personal tokens via the UI.

**Steps**:
1. Login to the application
2. Navigate to Settings → API tab
3. Click "Gerar Nova Chave"
4. Enter a name: "Test Personal Token"
5. Check the "Token pessoal" checkbox
6. Click "Gerar Chave"

**Expected Result**:
- Modal shows the generated token starting with `zap_sk_`
- Token is displayed with copy and visibility toggle buttons
- Success message appears
- Token appears in the list with a "Pessoal" badge and user icon

### 3. UI Test - Create Company Token

**Objective**: Verify company tokens still work.

**Steps**:
1. Navigate to Settings → API tab
2. Click "Gerar Nova Chave"
3. Enter a name: "Test Company Token"
4. Leave "Token pessoal" unchecked
5. Click "Gerar Chave"

**Expected Result**:
- Token is generated successfully
- Token appears in the list with an "Empresa" badge and building icon

### 4. API Test - Verify Token Endpoint

**Objective**: Test the token verification endpoint.

**Steps**:
```bash
# Replace YOUR_TOKEN with the token from step 2
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:9002/api/v1/auth/verify-token
```

**Expected Result for Personal Token**:
```json
{
  "valid": true,
  "companyId": "some-uuid",
  "userId": "user-uuid",
  "type": "personal"
}
```

**Expected Result for Company Token**:
```json
{
  "valid": true,
  "companyId": "some-uuid",
  "type": "company"
}
```

### 5. API Test - Invalid Token

**Objective**: Verify invalid tokens are rejected.

**Steps**:
```bash
curl -H "Authorization: Bearer zap_sk_invalid_token_123" \
     http://localhost:9002/api/v1/auth/verify-token
```

**Expected Result**:
```json
{
  "valid": false,
  "error": "Invalid or revoked token"
}
```

### 6. API Test - Missing Authorization Header

**Objective**: Verify requests without auth header are rejected.

**Steps**:
```bash
curl http://localhost:9002/api/v1/auth/verify-token
```

**Expected Result**:
```json
{
  "valid": false,
  "error": "Missing Authorization header"
}
```

### 7. API Test - List API Keys

**Objective**: Verify the API returns token types correctly.

**Steps**:
```bash
# Use browser dev tools or authenticated session cookie
# Or make a request while logged in
curl -b cookies.txt http://localhost:9002/api/v1/api-keys
```

**Expected Result**:
```json
[
  {
    "id": "uuid-1",
    "name": "Test Personal Token",
    "key": "zap_sk_...",
    "userId": "user-uuid",
    "isPersonal": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid-2",
    "name": "Test Company Token",
    "key": "zap_sk_...",
    "userId": null,
    "isPersonal": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 8. UI Test - Token Visibility

**Objective**: Verify token visibility toggle works.

**Steps**:
1. In the token generation modal (after creating a token)
2. Click the eye icon to toggle visibility
3. Verify token switches between masked (•••) and visible text

**Expected Result**:
- Eye icon toggles between open and closed
- Token text is masked/unmasked accordingly

### 9. UI Test - Copy Token

**Objective**: Verify token can be copied to clipboard.

**Steps**:
1. In the token generation modal
2. Click the copy icon
3. Paste in a text editor

**Expected Result**:
- Success toast message appears
- Check icon appears briefly
- Token is in clipboard

### 10. UI Test - Revoke Token

**Objective**: Verify tokens can be revoked.

**Steps**:
1. In the API keys list
2. Click the menu icon (⋮) for a token
3. Click "Revogar Chave"
4. Confirm the action

**Expected Result**:
- Token is removed from the list
- Success message appears
- Token is no longer valid for API requests

### 11. Integration Test - Use Token with API

**Objective**: Verify token works for actual API requests.

**Steps**:
```bash
# Test with contacts endpoint (or any other endpoint)
curl -H "Authorization: Bearer YOUR_PERSONAL_TOKEN" \
     http://localhost:9002/api/v1/contacts
```

**Expected Result**:
- Request is authenticated successfully
- Returns company contacts (or appropriate data)
- No 401 Unauthorized error

### 12. Security Test - Expired/Revoked Token

**Objective**: Verify revoked tokens can't be used.

**Steps**:
1. Create a token and copy it
2. Revoke the token via UI
3. Try to use the revoked token:
```bash
curl -H "Authorization: Bearer REVOKED_TOKEN" \
     http://localhost:9002/api/v1/auth/verify-token
```

**Expected Result**:
```json
{
  "valid": false,
  "error": "Invalid or revoked token"
}
```

### 13. TypeScript Compilation Test

**Objective**: Verify all code compiles without errors.

**Steps**:
```bash
npm run typecheck
```

**Expected Result**:
- No TypeScript errors
- Exit code 0

### 14. Documentation Test

**Objective**: Verify documentation is accurate and complete.

**Steps**:
1. Read `docs/PERSONAL_ACCESS_TOKENS.md`
2. Follow the instructions to create and use a token
3. Verify all examples work as documented

**Expected Result**:
- All instructions are clear and accurate
- All code examples work as shown
- No broken links or missing information

## Test Checklist

- [ ] Database migration applied successfully
- [ ] Personal tokens can be created via UI
- [ ] Company tokens can be created via UI
- [ ] Token type (personal/company) is displayed correctly
- [ ] Token verification endpoint works
- [ ] Invalid tokens are rejected
- [ ] Missing auth headers are rejected
- [ ] API keys list shows token types
- [ ] Token visibility toggle works
- [ ] Copy token to clipboard works
- [ ] Token revocation works
- [ ] Revoked tokens can't be used
- [ ] Tokens work for API authentication
- [ ] TypeScript compiles without errors
- [ ] Documentation is accurate

## Troubleshooting

### Issue: Migration Fails
**Solution**: Check if the database is running and DATABASE_URL is correct in .env

### Issue: Token Not Generated
**Solution**: Check browser console for errors. Verify user is authenticated.

### Issue: 401 Unauthorized with Valid Token
**Solution**: 
- Verify token format: must start with `zap_sk_`
- Check Authorization header format: `Bearer <token>`
- Ensure token hasn't been revoked

### Issue: UI Shows Wrong Token Type
**Solution**: Clear browser cache and refresh the page

## Notes

- Tokens are stored in plain text in the database (consider encryption for production)
- Personal tokens inherit the user's company context
- Company tokens have broader access than personal tokens
- Token format: `zap_sk_` + 48 hexadecimal characters
