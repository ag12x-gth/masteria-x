# Personal Access Tokens (PAT) - Guia de Uso

## Visão Geral

Os Personal Access Tokens (Tokens de Acesso Pessoal) permitem que você autentique aplicações externas, como o Windsurf IDE, para aceder à API do Master IA Oficial. Estes tokens fornecem um método seguro de autenticação sem a necessidade de partilhar as suas credenciais de login.

## Tipos de Tokens

Existem dois tipos de tokens disponíveis:

### 1. Token Pessoal
- Associado ao seu utilizador específico
- Acesso limitado aos recursos associados ao seu utilizador
- Recomendado para ferramentas de desenvolvimento pessoal (ex: Windsurf, VS Code)

### 2. Token de Empresa
- Associado à empresa
- Acesso a todos os recursos da empresa
- Recomendado para integrações de sistemas e automações

## Como Criar um Token Pessoal

1. Aceda à página de **Gestão da Empresa** através do menu lateral
2. Clique na aba **API**
3. Clique no botão **Gerar Nova Chave**
4. Preencha o nome do token (ex: "Windsurf IDE")
5. **Marque a opção "Token pessoal"** para criar um token associado ao seu utilizador
6. Clique em **Gerar Chave**
7. **IMPORTANTE**: Copie o token imediatamente - ele será exibido apenas uma vez!

## Configurar o Windsurf IDE

### Passo 1: Criar o Token
Siga as instruções acima para criar um token pessoal no Master IA Oficial.

### Passo 2: Configurar o Windsurf
1. Abra o Windsurf IDE
2. Aceda às configurações (Settings)
3. Procure pela secção de autenticação da API
4. Cole o token gerado no campo apropriado

### Passo 3: Usar a API

Com o token configurado, você pode fazer requisições à API usando o header de autorização:

```bash
Authorization: Bearer zap_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Exemplos de Uso

### cURL
```bash
curl -H "Authorization: Bearer zap_sk_your_token_here" \
     https://master.sendzap-ia.com/api/v1/contacts
```

### JavaScript/TypeScript
```javascript
const response = await fetch('https://master.sendzap-ia.com/api/v1/contacts', {
  headers: {
    'Authorization': 'Bearer zap_sk_your_token_here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### Python
```python
import requests

headers = {
    'Authorization': 'Bearer zap_sk_your_token_here',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://master.sendzap-ia.com/api/v1/contacts',
    headers=headers
)

data = response.json()
```

## Segurança

### Boas Práticas

1. **Nunca partilhe o seu token**: Trate-o como uma senha
2. **Use tokens pessoais para desenvolvimento**: Limite o acesso aos seus recursos
3. **Revogue tokens não utilizados**: Elimine tokens que já não são necessários
4. **Armazene de forma segura**: Use variáveis de ambiente, não código-fonte
5. **Rotação regular**: Considere renovar tokens periodicamente

### Formato do Token

Os tokens seguem o formato: `zap_sk_` seguido de 48 caracteres hexadecimais.

Exemplo: `zap_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4`

### Revogar um Token

Se um token for comprometido ou já não for necessário:

1. Aceda à página de **Gestão da Empresa**
2. Clique na aba **API**
3. Encontre o token na lista
4. Clique no menu de ações (⋮)
5. Selecione **Revogar Chave**
6. Confirme a revogação

**Nota**: A revogação é imediata e não pode ser desfeita.

## Endpoints Disponíveis

Com um token pessoal, você terá acesso aos seguintes endpoints (não exaustivo):

- `GET /api/v1/contacts` - Listar contactos
- `POST /api/v1/contacts` - Criar contacto
- `GET /api/v1/campaigns` - Listar campanhas
- `POST /api/v1/campaigns/whatsapp` - Criar campanha WhatsApp
- `GET /api/v1/conversations` - Listar conversas
- E muitos outros...

## Resolução de Problemas

### Token Inválido
- Verifique se copiou o token completo
- Certifique-se de que o token não foi revogado
- Confirme que está usando o formato correto: `Bearer <token>`

### Acesso Negado
- Tokens pessoais têm acesso limitado aos recursos do utilizador
- Verifique se o recurso pertence ao seu utilizador ou empresa
- Considere usar um token de empresa se necessário

### Token Expirado
Atualmente, os tokens não expiram automaticamente. Se precisar renovar:
1. Revogue o token antigo
2. Crie um novo token
3. Atualize a configuração no Windsurf

## Para Desenvolvedores

### Implementar Autenticação com API Key

Se você está desenvolvendo um novo endpoint que deve aceitar autenticação via API key, use a função helper `validateApiKey`:

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/auth';

export async function GET(request: NextRequest) {
    // Validate the API key from Authorization header
    const authResult = await validateApiKey(request);

    if (!authResult.isValid) {
        return NextResponse.json(
            { error: authResult.error || 'Unauthorized' }, 
            { status: 401 }
        );
    }

    // Access companyId and userId from the auth result
    const { companyId, userId } = authResult;

    // Your endpoint logic here
    // userId will be defined for personal tokens, null for company tokens
    
    return NextResponse.json({ success: true });
}
```

### Verificar um Token

Use o endpoint de verificação para testar se um token é válido:

```bash
curl -H "Authorization: Bearer zap_sk_your_token_here" \
     https://master.sendzap-ia.com/api/v1/auth/verify-token
```

Resposta de sucesso:
```json
{
  "valid": true,
  "companyId": "abc-123",
  "userId": "user-456",
  "type": "personal"
}
```

## Suporte

Se encontrar problemas ao usar tokens pessoais:
1. Verifique este guia de resolução de problemas
2. Consulte a documentação da API
3. Contacte o suporte técnico

## Notas de Versão

### Versão 2.4.1
- Adicionado suporte para tokens pessoais
- Distinguir visualmente tokens pessoais vs. empresa
- Autenticação via header Authorization
- Endpoint de verificação de token (/api/v1/auth/verify-token)
- Helper function validateApiKey para facilitar implementação em novos endpoints
