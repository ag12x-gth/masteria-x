
# Master IA Oficial - Painel de Controle para Mensagens em Massa no WhatsApp e SMS

Master IA Oficial é um painel de controle poderoso e intuitivo para gerenciar campanhas de mensagens em massa (WhatsApp e SMS), atendimentos ao cliente e automação com IA, usando a API da Meta e gateways de SMS. Ele é construído com Next.js, TypeScript, ShadCN UI, Tailwind CSS e Drizzle.

## Funcionalidades Principais

*   **Landing Page Profissional:** Uma página de marketing completa para apresentar o produto.
*   **Autenticação Segura:** Fluxo completo de registo, login, recuperação de senha e verificação de e-mail.
*   **Dashboard Interativo:** Visão geral das operações com KPIs, gráficos e filtros.
*   **Gerenciamento de Campanhas (Multicanal):** Crie, agende, duplique e monitore campanhas de WhatsApp e SMS.
*   **Gestão de Contatos (CRM):** Ferramenta robusta para gerir a sua base de clientes, com importação de CSV.
*   **Atendimentos (Caixa de Entrada e Kanban):** Gerencie conversas em tempo real.
*   **Página de Testes do Sistema:** Uma rota de diagnóstico para verificar em tempo real o status das conexões vitais.

## Tecnologias Utilizadas

A aplicação utiliza uma arquitetura moderna e robusta, baseada em TypeScript e Next.js.

- **Frontend:** React, ShadCN UI, Tailwind CSS.
- **Backend:** Next.js API Routes, Drizzle ORM, PostgreSQL, Redis.
- **Autenticação:** JWT (JSON Web Tokens).

## Começando

### Pré-requisitos

*   Node.js (v18 ou superior)
*   npm ou yarn
*   Docker (para a base de dados PostgreSQL)

### Instalação

1.  Clone o repositório.
2.  Instale as dependências com `npm install`.
3.  Crie um arquivo `.env` a partir do modelo `.env.example` e preencha as variáveis.
4.  **Configure o MCP HTTP Server** (opcional): Defina `MCP_HTTP_SERVER_URL` no `.env` se estiver usando um servidor MCP remoto.
5.  Execute `npm run dev:full` para iniciar o ambiente completo (Next.js + MCP Server).

Abra [http://localhost:9002](http://localhost:9002) no seu navegador.

### ⚡ Configuração do MCP (Model Context Protocol)

O sistema usa MCP HTTP para ferramentas de IA. Configure via variável de ambiente:

```bash
# .env
MCP_HTTP_SERVER_URL=http://localhost:3001  # Desenvolvimento local
# MCP_HTTP_SERVER_URL=https://mcp.seudominio.com  # Produção remota
```

**Scripts disponíveis:**
- `npm run dev:full` - Inicia Next.js + MCP Server local
- `npm run mcp:dev` - Apenas MCP Server (desenvolvimento)
- `npm run build:full` - Build completo (Next.js + MCP)
- `npm run start:full` - Produção completa (Next.js + MCP)

## Documentação

Para uma documentação técnica completa e detalhada, consulte:
- **/docs/mvp** - Documentação técnica do MVP
- **/docs/PERSONAL_TOKENS.md** - Guia de uso de Personal Tokens/Chaves de API para integração com Windsurf e outras ferramentas
- **/api.md** - Documentação completa da API

### 🔑 Personal Tokens (Chaves de API)

O sistema suporta autenticação via Personal Tokens para integração com ferramentas externas como Windsurf, VSCode, e outros sistemas:

1. Acesse **Gestão da Empresa** > **API** no painel
2. Gere uma nova chave com um nome descritivo
3. Use a chave no header `Authorization: Bearer sua_chave`

Consulte [docs/PERSONAL_TOKENS.md](./docs/PERSONAL_TOKENS.md) para instruções detalhadas.
