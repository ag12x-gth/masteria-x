# Fluxo de Autenticação com Personal Tokens

## Visão Geral

Este documento explica como funciona a autenticação com Personal Tokens (Chaves de API) no Master IA Oficial.

## Arquitetura

```
┌─────────────────┐
│   Windsurf /    │
│   Cliente API   │
└────────┬────────┘
         │
         │ GET /api/v1/contacts
         │ Header: Authorization: Bearer zap_sk_...
         │
         ▼
┌─────────────────────────────────────────────┐
│         Next.js API Routes                  │
│  (src/app/api/v1/contacts/route.ts)        │
└────────┬────────────────────────────────────┘
         │
         │ Chama getCompanyIdFromSession()
         │
         ▼
┌─────────────────────────────────────────────┐
│       src/app/actions.ts                    │
│   getCompanyIdFromSession()                 │
└────────┬────────────────────────────────────┘
         │
         ├──────────────────┬─────────────────┐
         │                  │                 │
         ▼                  ▼                 ▼
    Tenta API Key    Tenta Session      Falha
    authenticateApiKey()  getUserSession()   ↓
         │                  │              Retorna
         │                  │               Erro
         ▼                  ▼
┌────────────────┐  ┌──────────────┐
│ API Key Auth   │  │ Session Auth │
│ (Bearer Token) │  │ (JWT Cookie) │
└────────┬───────┘  └──────┬───────┘
         │                  │
         │                  │
         └──────┬───────────┘
                │
                │ Retorna companyId
                │
                ▼
┌─────────────────────────────────────────────┐
│         Endpoint processa request           │
│     com acesso aos dados da empresa         │
└─────────────────────────────────────────────┘
```

## Fluxo Detalhado

### 1. Cliente Faz Requisição

```http
GET /api/v1/contacts HTTP/1.1
Host: sua-api.com
Authorization: Bearer zap_sk_48caracteres...
Content-Type: application/json
```

### 2. Extração do Token

O sistema verifica o header `Authorization`:
- Se começa com `Bearer `, extrai o token
- Caso contrário, usa o valor completo do header

**Código**: `src/lib/api-key-auth.ts` → `getApiKeyFromHeaders()`

### 3. Validação da Chave

```typescript
// Busca a chave no banco de dados
SELECT * FROM api_keys WHERE key = 'zap_sk_...'

// Se encontrada, busca a empresa e usuário associados
SELECT u.*, c.* 
FROM companies c
LEFT JOIN users u ON u.company_id = c.id
WHERE c.id = api_key.company_id
```

**Código**: `src/lib/api-key-auth.ts` → `validateApiKey()`

### 4. Retorno dos Dados

Se a chave for válida:
```typescript
{
  user: {
    id: "user_uuid",
    name: "Nome do Usuário",
    email: "user@example.com",
    role: "admin",
    companyId: "company_uuid",
    company: {
      id: "company_uuid",
      name: "Empresa XYZ",
      // ... outros dados
    }
  }
}
```

Se inválida:
```typescript
{
  user: null,
  error: "Chave de API inválida."
}
```

### 5. Autorização da Requisição

Com o `companyId` validado, o endpoint pode:
- Filtrar dados pela empresa
- Verificar permissões baseadas na role
- Executar operações no contexto correto

## Fallback para Session Auth

Se não houver API key no header, o sistema tenta autenticação por sessão:

```
GET /api/v1/contacts
Cookie: __session=eyJhbGc...
         ↓
Valida JWT Cookie
         ↓
Retorna companyId
```

Isso permite que:
- Usuários no browser (com login) funcionem normalmente
- APIs externas (com API key) também funcionem
- Ambos os métodos coexistam sem conflito

## Segurança

### Armazenamento das Chaves

```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  key TEXT NOT NULL UNIQUE,  -- Formato: zap_sk_48chars
  name TEXT NOT NULL,         -- Nome descritivo
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Observações**:
- Chaves são geradas com `randomBytes(24).toString('hex')`
- Prefixo `zap_sk_` facilita identificação
- Chaves são únicas por coluna `UNIQUE`
- Associadas a uma empresa, não a um usuário específico

### Limitações de Segurança

✅ **Implementado**:
- Validação de formato da chave
- Verificação de existência no banco
- Associação à empresa correta
- HTTPS obrigatório em produção

⚠️ **Não Implementado** (para futuras melhorias):
- Rate limiting por chave
- Expiração automática
- Rotação de chaves
- Auditoria de uso
- Escopos/permissões granulares

## Exemplos de Uso

### cURL

```bash
curl -X GET "https://api.example.com/api/v1/contacts" \
  -H "Authorization: Bearer zap_sk_abc123..."
```

### JavaScript

```javascript
fetch('https://api.example.com/api/v1/contacts', {
  headers: {
    'Authorization': 'Bearer zap_sk_abc123...',
    'Content-Type': 'application/json'
  }
})
```

### Python

```python
import requests

headers = {
    'Authorization': 'Bearer zap_sk_abc123...',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.example.com/api/v1/contacts',
    headers=headers
)
```

## Revogação de Chaves

Processo de revogação:

```
1. Usuário clica "Revogar" no painel
        ↓
2. DELETE /api/v1/api-keys/{keyId}
        ↓
3. DELETE FROM api_keys WHERE id = keyId AND company_id = user_company
        ↓
4. Chave removida imediatamente
        ↓
5. Próximas requisições com essa chave → 401 Unauthorized
```

**Código**: `src/app/api/v1/api-keys/[keyId]/route.ts`

## Debugging

### Como verificar se a autenticação está funcionando:

1. **Gere uma chave de teste** via painel
2. **Teste com curl**:
   ```bash
   curl -v -H "Authorization: Bearer sua_chave" \
     http://localhost:9002/api/v1/contacts
   ```
3. **Verifique os logs** do servidor
4. **Use o script de teste**:
   ```bash
   node scripts/test-api-key-auth.js
   ```

### Erros comuns:

| Erro | Causa | Solução |
|------|-------|---------|
| 401 Unauthorized | Chave inválida ou ausente | Verificar formato e validade |
| 403 Forbidden | Chave válida mas sem permissão | Verificar role/permissões |
| 500 Internal | Erro no servidor | Verificar logs e DB |

## Referências

- [PERSONAL_TOKENS.md](./PERSONAL_TOKENS.md) - Guia completo
- [WINDSURF_QUICKSTART.md](./WINDSURF_QUICKSTART.md) - Configuração rápida
- [api.md](../api.md) - Documentação da API
- Código fonte: `src/lib/api-key-auth.ts`
