# Guia Rápido: Integração com Windsurf

Este guia mostra como configurar personal tokens para usar o Windsurf (assistente de IA) com a API do Master IA Oficial.

## O que é um Personal Token?

Um Personal Token (ou Chave de API) é uma credencial que permite que ferramentas externas como o Windsurf acessem sua conta sem precisar de senha. É mais seguro e pode ser revogado a qualquer momento.

## Passo a Passo

### 1. Gerar seu Personal Token

1. Faça login no painel do Master IA Oficial
2. Navegue até **Gestão da Empresa** (menu lateral)
3. Clique na aba **API**
4. Clique no botão **Gerar Nova Chave**
5. Digite um nome descritivo: `Windsurf`
6. Clique em **Gerar Chave**
7. **IMPORTANTE**: Copie a chave gerada - ela será mostrada apenas uma vez!

Sua chave terá este formato:
```
zap_sk_48caracteres_hexadecimais_aqui
```

### 2. Configurar no Windsurf

#### Método 1: Via Configurações do Windsurf

1. Abra o Windsurf
2. Acesse **Settings** ou **Preferências**
3. Procure por **API Configuration** ou **External APIs**
4. Configure os seguintes campos:
   - **API URL Base**: `https://sua-api.com/api/v1`
   - **Authentication Type**: `Bearer Token` ou `Custom Header`
   - **Token/Header Value**: Cole sua chave aqui

#### Método 2: Via Arquivo de Configuração

Se o Windsurf usar arquivo de configuração (`.windsurfrc`, `.windsurf.json`, etc):

```json
{
  "apiConfig": {
    "baseUrl": "https://sua-api.com/api/v1",
    "headers": {
      "Authorization": "Bearer zap_sk_sua_chave_aqui",
      "Content-Type": "application/json"
    }
  }
}
```

#### Método 3: Via Variáveis de Ambiente

Alguns assistentes IA usam variáveis de ambiente:

```bash
# Linux/Mac (.bashrc, .zshrc)
export MASTERIA_API_KEY="zap_sk_sua_chave_aqui"
export MASTERIA_API_URL="https://sua-api.com/api/v1"

# Windows (PowerShell)
$env:MASTERIA_API_KEY="zap_sk_sua_chave_aqui"
$env:MASTERIA_API_URL="https://sua-api.com/api/v1"
```

### 3. Testar a Conexão

Você pode testar se tudo está funcionando usando curl:

```bash
# Substitua sua_chave_aqui pela chave real
curl -X GET "https://sua-api.com/api/v1/contacts" \
  -H "Authorization: Bearer zap_sk_sua_chave_aqui" \
  -H "Content-Type: application/json"
```

Se tudo estiver correto, você verá uma lista de contatos em formato JSON.

### 4. Usar no Windsurf

Agora você pode fazer perguntas ao Windsurf como:

- "Liste meus contatos"
- "Crie uma campanha de WhatsApp para enviar uma mensagem de boas-vindas"
- "Mostre o status das minhas campanhas ativas"
- "Adicione um novo contato chamado João Silva"

O Windsurf usará automaticamente sua chave para se comunicar com a API.

## Recursos Disponíveis via API

Com seu personal token, você pode acessar:

- ✅ **Contatos**: Listar, criar, atualizar e deletar
- ✅ **Campanhas**: Criar e gerenciar campanhas de WhatsApp e SMS
- ✅ **Conversas**: Acessar histórico de conversas
- ✅ **Listas**: Gerenciar listas de contatos
- ✅ **Tags**: Organizar contatos com tags
- ✅ **Templates**: Acessar modelos de mensagem
- ✅ **Relatórios**: Acessar estatísticas e relatórios

Veja a [documentação completa da API](../api.md) para todos os endpoints disponíveis.

## Segurança

### ✅ Boas Práticas

- Use um nome descritivo para cada chave (ex: "Windsurf", "VSCode", "Scripts")
- Nunca compartilhe suas chaves com outras pessoas
- Não commit suas chaves em repositórios Git
- Revogue chaves que não estão mais em uso
- Crie chaves diferentes para diferentes ferramentas

### ❌ Nunca Faça

- Não poste suas chaves em fóruns ou redes sociais
- Não inclua chaves em capturas de tela
- Não armazene chaves em arquivos de texto desprotegidos
- Não use a mesma chave em múltiplos computadores se puder evitar

### Se sua chave for comprometida:

1. Acesse **Gestão da Empresa** > **API**
2. Encontre a chave comprometida
3. Clique em **⋮** (menu de ações)
4. Clique em **Revogar Chave**
5. Gere uma nova chave imediatamente

## Solução de Problemas

### "Unauthorized" ou "401 Error"

**Problema**: A chave não está sendo aceita

**Soluções**:
- Verifique se copiou a chave completa (começa com `zap_sk_`)
- Confirme que está usando o formato: `Authorization: Bearer sua_chave`
- Verifique se a chave não foi revogada
- Tente gerar uma nova chave

### "Forbidden" ou "403 Error"

**Problema**: Chave válida mas sem permissão

**Soluções**:
- Verifique se sua conta tem permissão para acessar o recurso
- Alguns endpoints podem estar restritos a roles específicos (admin, superadmin)

### Windsurf não se conecta

**Problema**: Windsurf não consegue se comunicar com a API

**Soluções**:
- Verifique se a URL da API está correta
- Teste a conexão manualmente com curl (veja seção "Testar a Conexão")
- Verifique logs do Windsurf para mensagens de erro específicas
- Confirme que não há firewall bloqueando a conexão

## Exemplos de Código

### Python

```python
import requests

API_KEY = "zap_sk_sua_chave_aqui"
API_URL = "https://sua-api.com/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Listar contatos
response = requests.get(f"{API_URL}/contacts", headers=headers)
contacts = response.json()
print(f"Total de contatos: {len(contacts)}")
```

### JavaScript/Node.js

```javascript
const API_KEY = "zap_sk_sua_chave_aqui";
const API_URL = "https://sua-api.com/api/v1";

const headers = {
  "Authorization": `Bearer ${API_KEY}`,
  "Content-Type": "application/json"
};

// Listar contatos
fetch(`${API_URL}/contacts`, { headers })
  .then(res => res.json())
  .then(contacts => {
    console.log(`Total de contatos: ${contacts.length}`);
  });
```

## Próximos Passos

- 📖 Leia a [documentação completa de Personal Tokens](./PERSONAL_TOKENS.md)
- 🔌 Explore a [documentação da API](../api.md)
- 🤖 Configure outras ferramentas além do Windsurf
- 🔐 Considere criar chaves separadas para diferentes ambientes (dev/prod)

## Suporte

Precisa de ajuda?
- 📧 Entre em contato com o suporte
- 📚 Consulte a documentação completa
- 🐛 Reporte problemas via GitHub Issues
