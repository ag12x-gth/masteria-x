# Personal Tokens / Chaves de API

## Visão Geral

As Personal Tokens (Chaves de API) permitem que você integre ferramentas externas como Windsurf, VSCode, ou outros sistemas com a API do Master IA Oficial sem precisar fazer login com usuário e senha.

## Gerando uma Personal Token

1. Acesse a página de **Gestão da Empresa** (`/settings`)
2. Clique na aba **API**
3. Clique em **Gerar Nova Chave**
4. Dê um nome descritivo para sua chave (ex: "Windsurf", "VSCode Extension", "Integração CRM")
5. Copie a chave gerada - **ela será mostrada apenas uma vez!**
6. Guarde a chave em um local seguro

## Formato da Chave

As chaves de API seguem o formato:
```
zap_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Como Usar

### Autenticação via Header HTTP

Para usar sua personal token em requisições à API, inclua-a no header `Authorization`:

```bash
curl -X GET "https://sua-api.com/api/v1/contacts" \
  -H "Authorization: Bearer zap_sk_seu_token_aqui"
```

### Usando com Windsurf

Para configurar o Windsurf para acessar a API:

1. Abra as configurações do Windsurf
2. Procure por "API Settings" ou "External API"
3. Configure a URL base da API: `https://sua-api.com/api/v1`
4. Configure o header de autenticação:
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer zap_sk_seu_token_aqui`

### Usando com VSCode

Se estiver usando uma extensão que se conecta à API:

1. Abra as configurações da extensão
2. Procure por campos de autenticação/API Key
3. Cole sua personal token no campo apropriado
4. Configure a URL base da API se necessário

### Usando em JavaScript/TypeScript

```javascript
const API_BASE_URL = 'https://sua-api.com/api/v1';
const API_KEY = 'zap_sk_seu_token_aqui';

async function fetchContacts() {
  const response = await fetch(`${API_BASE_URL}/contacts`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data;
}
```

### Usando em Python

```python
import requests

API_BASE_URL = 'https://sua-api.com/api/v1'
API_KEY = 'zap_sk_seu_token_aqui'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

response = requests.get(f'{API_BASE_URL}/contacts', headers=headers)
data = response.json()
```

## Endpoints Disponíveis

Todos os endpoints que requerem autenticação podem ser acessados com personal tokens:

- `GET /api/v1/contacts` - Listar contatos
- `POST /api/v1/contacts` - Criar contato
- `GET /api/v1/campaigns` - Listar campanhas
- `POST /api/v1/campaigns/whatsapp` - Criar campanha WhatsApp
- `GET /api/v1/conversations` - Listar conversas
- E muitos outros...

Consulte a [documentação completa da API](../api.md) para ver todos os endpoints disponíveis.

## Segurança

### Boas Práticas

✅ **FAÇA:**
- Guarde suas chaves em um gerenciador de senhas seguro
- Use variáveis de ambiente para armazenar chaves em código
- Gere chaves diferentes para diferentes aplicações
- Revogue chaves que não estão mais em uso
- Use nomes descritivos para identificar cada chave

❌ **NÃO FAÇA:**
- Nunca compartilhe suas chaves publicamente
- Nunca commit chaves em repositórios Git
- Não inclua chaves em URLs ou logs
- Não use a mesma chave para múltiplas aplicações não relacionadas

### Variáveis de Ambiente

Para usar chaves de forma segura em projetos:

**`.env` (nunca commit este arquivo!):**
```env
MASTERIA_API_KEY=zap_sk_seu_token_aqui
MASTERIA_API_URL=https://sua-api.com/api/v1
```

**`.env.example` (commit este como modelo):**
```env
MASTERIA_API_KEY=your_api_key_here
MASTERIA_API_URL=https://sua-api.com/api/v1
```

**`.gitignore`:**
```
.env
.env.local
```

## Revogando Chaves

Se uma chave foi comprometida ou não é mais necessária:

1. Acesse **Gestão da Empresa** > **API**
2. Encontre a chave na lista
3. Clique no menu de ações (⋮)
4. Selecione **Revogar Chave**
5. Confirme a ação

⚠️ **Atenção**: Qualquer aplicação usando a chave revogada perderá acesso imediatamente.

## Limitações

- As chaves de API têm as mesmas permissões da empresa associada
- Não há limite de chaves por empresa
- Chaves não expiram automaticamente (devem ser revogadas manualmente)
- Cada chave é vinculada a uma empresa específica

## Solução de Problemas

### Erro 401 - Não Autorizado

**Causa**: Chave inválida ou não fornecida

**Solução**:
- Verifique se a chave está correta
- Confirme que o header está no formato: `Authorization: Bearer zap_sk_...`
- Verifique se a chave não foi revogada

### Erro 403 - Proibido

**Causa**: Chave válida, mas sem permissão para o recurso

**Solução**:
- Verifique as permissões da empresa associada à chave
- Alguns recursos podem estar restritos a certas roles

### Erro 500 - Erro Interno

**Causa**: Problema no servidor

**Solução**:
- Tente novamente em alguns momentos
- Verifique o status do serviço
- Entre em contato com o suporte se o problema persistir

## Suporte

Para questões ou problemas com personal tokens:
- Consulte a [documentação da API](../api.md)
- Verifique os logs de erro na sua aplicação
- Entre em contato com o suporte técnico
