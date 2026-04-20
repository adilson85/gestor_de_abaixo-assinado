# Gestor de Abaixo-Assinado

Sistema web para gestão e digitalização de abaixo-assinados físicos, desenvolvido com React, TypeScript, Supabase e Tailwind CSS.

## Visão geral

- Painel interno com autenticação via Supabase Auth
- Gestão de campanhas, assinaturas e recursos públicos
- Quadro Kanban operacional com restrição por escopo
- Área dedicada de `Usuários` para equipe, permissões e senhas temporárias
- Área de `Configurações` focada em sistema, auditoria, backup e ações globais
- Fluxo público de assinatura online preservado

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)
- Netlify Edge Functions
- Jest + Testing Library

## Instalação

1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd gestor_de_abaixo-assinado-main
```

2. Instale as dependências

```bash
npm install
```

3. Configure as variáveis de ambiente

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Aplique as migrations do Supabase em ordem de timestamp

- Para ambientes novos: aplique todas as migrations em `supabase/migrations/`
- Para ambientes já existentes: esta revisão depende destas migrations:
  - `20260420000000_create_app_users_and_secure_internal_access.sql`
  - `20260420000001_cleanup_legacy_rls_policies.sql`
  - `20260420000002_add_granular_permissions_and_system_access.sql`
  - `20260420000003_finalize_app_user_source_of_truth.sql`

5. Inicie o projeto

```bash
npm run dev
```

## Arquitetura de acesso interno

O painel usa `public.app_users` como fonte de verdade para identidade interna e autorização. O papel-base continua existindo, mas usuários não-admin agora recebem permissões explícitas por capacidade e escopo.

### Papéis

- `admin`: acesso total ao painel, gestão de usuários, import/export, auditoria e ações destrutivas
- `operator`: papel-base operacional; o acesso final depende da matriz de permissões atribuída

### Áreas do painel

- `Usuários`: equipe ativa, criação/invite, edição de nome, papel-base, permissões, escopo, senha temporária e ativação/desativação
- `Minha conta`: dados do usuário logado e troca da própria senha
- `Configurações`: prazos automáticos do Kanban, backup/exportação/importação, auditoria, ambiente e limpeza global

### Regras importantes

- Usuário autenticado sem perfil ativo em `app_users` não entra no painel
- O frontend não deve gravar diretamente em tabelas sensíveis de acesso
- `admin_users` passa a ser apenas histórico arquivado e não participa mais da autorização
- O fluxo público de assinatura anônima continua separado das permissões internas

## Matriz de permissões

As permissões são persistidas em `public.app_permissions` e `public.app_user_permissions`.

### Dashboard

- `dashboard.view`

### Campanhas

- `petitions.view`
- `petitions.create`
- `petitions.edit`
- `petitions.publish`
- `petitions.delete`
- `petition_resources.manage`

### Assinaturas

- `signatures.view`
- `signatures.create_manual`
- `signatures.edit`
- `signatures.delete`
- `signatures.export`
- `signatures.message_status`

### Kanban

- `kanban.view`
- `kanban.create`
- `kanban.edit`
- `kanban.move`
- `kanban.archive`
- `kanban.delete`
- `kanban.assign_users`
- `kanban.manage_labels`
- `kanban.comment`
- `kanban.attachment`
- `kanban.manage_columns`
- `kanban.manage_deadlines`

### Usuários

- `users.view`
- `users.create`
- `users.edit_profile`
- `users.edit_permissions`
- `users.reset_password`
- `users.deactivate`

### Sistema

- `settings.backup_export`
- `settings.backup_import`
- `settings.audit_view`
- `settings.wipe_data`

### Escopos suportados

- `all`: acesso total ao módulo ou ação
- `assigned`: somente itens atribuídos ao usuário
- `own`: somente itens criados pelo usuário
- `none`: sem acesso

## Gestão de usuários

A criação e atualização de usuários internos acontece pela tela `Usuários`, usando as Edge Functions em `netlify/edge-functions/admin-management/*`.

Essas funções:

- criam o usuário em `auth.users` quando ele ainda não existe
- vinculam ou atualizam o registro em `public.app_users`
- aplicam a matriz de permissões em `public.app_user_permissions`
- permitem gerar senha temporária
- permitem ativação e desativação seguras
- registram auditoria em `admin_audit_log`

Não use `INSERT` manual em `admin_users` como fluxo principal.

## Segurança

- RLS aplicado nas tabelas internas
- Helpers SQL de papel/permissão, incluindo `get_my_role`, `get_my_permissions`, `has_permission` e `can_access_kanban_task`
- Autorização validada no backend, nas Edge Functions e na UI
- Restrição real de escopo no Kanban para usuários com acesso somente a cards atribuídos ou próprios
- Auditoria de ações administrativas

## Scripts

- `npm run dev` - inicia o servidor de desenvolvimento
- `npm run build` - gera o build de produção
- `npm run preview` - abre o preview do build
- `npm run lint` - executa o linter
- `npm test -- --runInBand` - executa a suíte de testes usada nesta revisão

## Estrutura principal

```text
src/
  components/
  contexts/
  lib/
  pages/
  types/
  utils/
netlify/
  edge-functions/
supabase/
  migrations/
```

## Deploy

Antes de publicar:

1. aplique as migrations pendentes no Supabase
2. valide as Edge Functions com as variáveis de ambiente corretas
3. rode `npm test -- --runInBand`
4. rode `npm run build`

## Histórico legado

Se o projeto já tinha administradores antigos em `admin_users`, as migrations de `20260420000000` até `20260420000003` fazem o backfill final para `app_users` e retiram o legado da cadeia de autorização.
