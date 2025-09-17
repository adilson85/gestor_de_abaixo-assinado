# Configuração do Supabase

## Variáveis e Credenciais

- Não versionar credenciais neste repositório.
- Configure um arquivo `.env.local` na raiz (não é commitado).
- Use o exemplo em `.env.example` para preencher as variáveis necessárias.

## Passos para Configuração

### 1. Criar arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo (exemplo):

```env
VITE_SUPABASE_URL=https://<SEU_PROJETO>.supabase.co
VITE_SUPABASE_ANON_KEY=<SUA_CHAVE_ANON>
```

### 2. Executar Migrações

No painel do Supabase (URL do seu projeto), vá para o SQL Editor e execute as seguintes migrações na ordem:

1. **Tabelas principais** (`supabase/migrations/20250915132944_twilight_sea.sql`)
2. **Tabela de administradores** (`supabase/migrations/20250917051108_broken_resonance.sql`)
3. **Funções auxiliares** (`supabase/migrations/20250917051357_broad_frost.sql`)
4. **Campo de imagem** (`supabase/migrations/20250120000000_add_image_url.sql`)
5. **Tabelas de logs** (`supabase/migrations/20250120000001_create_logs_tables.sql`)

### 3. Configurar Storage

No painel do Supabase, vá para Storage e crie um bucket chamado `petition-images` com as seguintes configurações:

- **Nome**: petition-images
- **Público**: Sim
- **Tipos de arquivo permitidos**: image/jpeg, image/png, image/webp
- **Tamanho máximo**: 5MB

### 4. Criar Usuário Administrador

Após criar um usuário no sistema de autenticação do Supabase, execute o seguinte SQL para torná-lo administrador:

```sql
INSERT INTO admin_users (user_id) 
VALUES ('uuid-do-usuario-criado');
```

### 5. Testar a Aplicação

Execute os seguintes comandos:

```bash
npm install
npm run dev
```

A aplicação estará disponível em http://localhost:5173

## Estrutura do Banco de Dados

O sistema criará automaticamente:

- **Tabela `petitions`**: Para armazenar os abaixo-assinados
- **Tabelas dinâmicas**: Para cada abaixo-assinado (ex: `signatures_meu-abaixo-assinado_1234567890`)
- **Tabela `admin_users`**: Para controlar acesso administrativo
- **Tabelas de logs**: Para monitoramento de erros e auditoria

## Funcionalidades Disponíveis

- ✅ Autenticação de usuários
- ✅ CRUD de abaixo-assinados
- ✅ Upload de imagens
- ✅ Digitalização de assinaturas
- ✅ Busca e filtros
- ✅ Exportação CSV
- ✅ Relatórios visuais
- ✅ Monitoramento de erros
- ✅ Funcionalidades PWA

## Próximos Passos

1. Configure as variáveis de ambiente
2. Execute as migrações
3. Crie um usuário administrador
4. Teste todas as funcionalidades
5. Faça deploy em produção (Vercel, Netlify, etc.)
