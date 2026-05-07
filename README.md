# PR PET - Sistema de Gestão para Petshops

SaaS completo (Next.js 14 + Supabase + Asaas) para gestão de petshops com multi-tenancy, RLS, agendamentos, PDV com cupom não-fiscal (58/80mm), estoque, fluxo de caixa e relatórios.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (Postgres + Auth + RLS)
- **Asaas** (assinatura R$ 80/mês)
- **Tailwind CSS + shadcn/ui**
- **Lucide React**
- **Zod** (validação)
- **react-to-print** (cupom térmico)

## 1. Configuração do Supabase

1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor** → **New query**
3. Cole e execute o conteúdo de `supabase/schema.sql`
4. Em **Project Settings → API**, copie:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (mantenha em segredo!)

## 2. Configuração do Asaas

1. Crie conta em https://www.asaas.com (use sandbox para testar: https://sandbox.asaas.com)
2. **Integrações → Gerar Chave de API** → copie para `ASAAS_API_KEY`
3. Configure o Webhook: **Integrações → Webhooks**
   - URL: `https://SEU_DOMINIO/api/asaas/webhook`
   - Eventos: marque todos sobre `PAYMENT_*`
   - Token: gere uma string aleatória e coloque em `ASAAS_WEBHOOK_TOKEN`

## 3. Configuração local

```bash
# 1. Copie o exemplo de env
cp .env.example .env

# 2. Edite .env com suas credenciais

# 3. Instale dependências
yarn install

# 4. Inicie em dev
yarn dev
```

Acesse http://localhost:3000

## 4. Deploy

Recomendado: **Vercel** (deploy de Next.js em 1 clique)

1. Push do projeto para GitHub
2. Importe na Vercel
3. Adicione as variáveis do `.env`
4. Atualize a URL do webhook no Asaas para o domínio em produção

## 5. Funcionalidades

- ✅ **Auth + Multi-tenant** (cada petshop isolado por RLS)
- ✅ **Hierarquia de usuários** (admin/operador). Operador não vê fechamento financeiro
- ✅ **Assinatura Asaas** R$ 80/mês (acesso bloqueado se não pago)
- ✅ **Webhook** atualiza status automaticamente
- ✅ **Dashboard com KPIs** (vendas hoje vs ontem, agendamentos, clientes)
- ✅ **Clientes & Pets** (1:N)
- ✅ **Agendamentos** com filtro por data
- ✅ **Serviços e Produtos** (com código de barras)
- ✅ **PDV / Checkout** com múltiplos métodos: Dinheiro, PIX, Cartão, A Prazo
- ✅ **Cupom não-fiscal** 58mm/80mm via `react-to-print`
- ✅ **Contas a Receber** (gestão de "A Prazo")
- ✅ **Fechamento de Caixa** diário por forma de pagamento
- ✅ **Relatórios avançados** com filtro por período
- ✅ **Convite de funcionários** via e-mail e senha

## 6. Hierarquia de Usuários

| Recurso | Admin | Operador |
|---------|:-----:|:--------:|
| Dashboard | ✅ | ✅ |
| Clientes/Pets | ✅ | ✅ |
| Agendamentos | ✅ | ✅ |
| Serviços/Produtos | ✅ | ✅ |
| PDV/Vendas | ✅ | ✅ |
| Contas a Receber | ✅ | ✅ |
| Fechamento de Caixa | ✅ | ❌ |
| Relatórios | ✅ | ❌ |
| Configurações | ✅ | ❌ |

## 7. Estrutura de pastas

```
app/
  (app)/                   # Rotas autenticadas (dashboard etc.)
    layout.js              # Verifica auth + assinatura ativa
    dashboard/, clientes/, agendamentos/, servicos/, produtos/, pdv/,
    contas-a-receber/, fechamento/, relatorios/, configuracoes/
  api/
    asaas/create-subscription/, asaas/webhook/, asaas/sync-status/
    invite/
  login/, signup/, checkout/  # Páginas públicas
lib/
  supabase/client.js, server.js
  asaas.js, validators.js, utils.js
components/
  sidebar.js, receipt.js, ui/ (shadcn)
supabase/
  schema.sql              # Schema + RLS
middleware.js             # Guard de rotas
```

## 8. Suporte a impressora térmica

O componente `components/receipt.js` usa CSS `@page { size: 58mm/80mm }` para que o navegador envie o tamanho correto à impressora térmica via `window.print()` (chamado por `react-to-print`).

Na janela de impressão, selecione sua impressora térmica (ex: ELGIN i9, BEMATECH MP-4200) e marque "Imprimir em todas as páginas" e remova margens.
