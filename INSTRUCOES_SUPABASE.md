# 🚀 Instruções para Configuração do Supabase

## ✅ Configuração Concluída

O arquivo `.env.local` foi criado automaticamente com as credenciais fornecidas.

## 📋 Próximos Passos Obrigatórios

### 1. Executar Migrações no Supabase

Acesse o [SQL Editor do Supabase](https://rncowiwstzumxruaojvq.supabase.co/project/default/sql) e execute as migrações na seguinte ordem:

#### Migração 1: Tabelas Principais
```sql
-- Execute o conteúdo do arquivo: supabase/migrations/20250915132944_twilight_sea.sql
```

#### Migração 2: Tabela de Administradores
```sql
-- Execute o conteúdo do arquivo: supabase/migrations/20250917051108_broken_resonance.sql
```

#### Migração 3: Funções Auxiliares
```sql
-- Execute o conteúdo do arquivo: supabase/migrations/20250917051357_broad_frost.sql
```

#### Migração 4: Campo de Imagem
```sql
-- Execute o conteúdo do arquivo: supabase/migrations/20250120000000_add_image_url.sql
```

#### Migração 5: Tabelas de Logs
```sql
-- Execute o conteúdo do arquivo: supabase/migrations/20250120000001_create_logs_tables.sql
```

### 2. Configurar Storage

1. Acesse [Storage no Supabase](https://rncowiwstzumxruaojvq.supabase.co/project/default/storage)
2. Clique em "New bucket"
3. Configure:
   - **Nome**: `petition-images`
   - **Público**: ✅ Sim
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### 3. Criar Usuário Administrador

1. Acesse [Authentication no Supabase](https://rncowiwstzumxruaojvq.supabase.co/project/default/auth)
2. Clique em "Add user"
3. Crie um usuário com email e senha
4. Copie o UUID do usuário criado
5. No SQL Editor, execute:

```sql
INSERT INTO admin_users (user_id) 
VALUES ('UUID_DO_USUARIO_CRIADO');
```

### 4. Testar a Aplicação

```bash
npm run dev
```

Acesse: http://localhost:5173

## 🔧 Configurações Adicionais (Opcionais)

### Configurar Domínio Personalizado
- Acesse Settings > API
- Configure CORS origins se necessário

### Configurar Email Templates
- Acesse Authentication > Email Templates
- Personalize os templates de email

### Configurar Rate Limiting
- Acesse Settings > API
- Configure rate limits se necessário

## 🚨 Solução de Problemas

### Erro de Conexão
- Verifique se o arquivo `.env.local` existe
- Confirme se as credenciais estão corretas
- Verifique se o projeto Supabase está ativo

### Erro de Permissões
- Verifique se as políticas RLS estão configuradas
- Confirme se o usuário está na tabela `admin_users`

### Erro de Storage
- Verifique se o bucket `petition-images` foi criado
- Confirme se as políticas de storage estão configuradas

## 📊 Estrutura do Banco de Dados

Após executar as migrações, você terá:

- ✅ `petitions` - Tabela principal de abaixo-assinados
- ✅ `admin_users` - Controle de acesso administrativo
- ✅ `error_logs` - Logs de erros do sistema
- ✅ `audit_logs` - Logs de auditoria
- ✅ Funções auxiliares para criação dinâmica de tabelas

## 🎯 Funcionalidades Disponíveis

- ✅ Autenticação completa
- ✅ CRUD de abaixo-assinados
- ✅ Upload de imagens
- ✅ Digitalização de assinaturas
- ✅ Busca e filtros avançados
- ✅ Exportação CSV
- ✅ Relatórios visuais
- ✅ Monitoramento de erros
- ✅ Funcionalidades PWA

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no console do navegador
2. Consulte a documentação do Supabase
3. Verifique se todas as migrações foram executadas
4. Confirme se o usuário tem permissões administrativas

---

**🎉 Após completar estes passos, sua aplicação estará totalmente funcional!**
