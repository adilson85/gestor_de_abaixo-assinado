# 🚀 Migração do Kanban para Supabase Online

Este guia explica como migrar todas as melhorias do Kanban do Supabase local para o Supabase online.

## 📋 Pré-requisitos

1. **Projeto Supabase online criado**
2. **Credenciais do Supabase online** (URL e chaves)
3. **Dados do Kanban funcionando localmente**

## 🔧 Etapas da Migração

### 1️⃣ **Preparação**

```bash
# 1. Exportar dados locais
node export-local-kanban-data.js

# 2. Verificar arquivo de exportação gerado
# Exemplo: kanban-export-2025-01-19.json
```

### 2️⃣ **Configurar Supabase Online**

1. **Acesse o Dashboard do Supabase**
2. **Vá para SQL Editor**
3. **Execute o SQL de criação das tabelas:**

```sql
-- Criar tabela kanban_boards
CREATE TABLE IF NOT EXISTS public.kanban_boards (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_boards_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Criar tabela kanban_columns
CREATE TABLE IF NOT EXISTS public.kanban_columns (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    board_id uuid NOT NULL,
    name text NOT NULL,
    position integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_columns_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_columns_board_id_fkey FOREIGN KEY (board_id) REFERENCES kanban_boards (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Criar tabela kanban_tasks
CREATE TABLE IF NOT EXISTS public.kanban_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    board_id uuid NOT NULL,
    column_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'medium',
    due_date timestamp with time zone,
    position integer NOT NULL DEFAULT 0,
    is_archived boolean DEFAULT false,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_tasks_board_id_fkey FOREIGN KEY (board_id) REFERENCES kanban_boards (id) ON DELETE CASCADE,
    CONSTRAINT kanban_tasks_column_id_fkey FOREIGN KEY (column_id) REFERENCES kanban_columns (id) ON DELETE CASCADE,
    CONSTRAINT kanban_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Criar tabela kanban_comments
CREATE TABLE IF NOT EXISTS public.kanban_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_comments_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE,
    CONSTRAINT kanban_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Habilitar RLS
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_comments ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_boards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_boards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_boards FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_boards FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_columns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_columns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_columns FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_columns FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_tasks FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for own comments" ON public.kanban_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Enable delete for own comments" ON public.kanban_comments FOR DELETE USING (auth.uid() = author_id);
```

### 3️⃣ **Importar Dados**

```bash
# 1. Editar o arquivo import-kanban-to-online.js
# 2. Substituir as credenciais do Supabase online
# 3. Atualizar o nome do arquivo de exportação
# 4. Executar a importação

node import-kanban-to-online.js
```

### 4️⃣ **Atualizar Configurações**

1. **Criar arquivo `.env.local` com as credenciais online:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

2. **Atualizar `src/lib/supabase.ts`:**

```typescript
// Remover fallbacks locais
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 5️⃣ **Testar Migração**

1. **Reiniciar o servidor de desenvolvimento**
2. **Fazer login na aplicação**
3. **Testar todas as funcionalidades do Kanban:**
   - ✅ Criar/editar tarefas
   - ✅ Arrastar e soltar
   - ✅ Comentários e menções
   - ✅ Prioridades
   - ✅ Etiquetas
   - ✅ Checklist
   - ✅ Anexos
   - ✅ Arquivamento

## 🎯 Funcionalidades Migradas

### **✅ Modal Completo de Tarefa**
- Descrição editável
- Comentários com menções (@)
- Data de vencimento
- Responsáveis (assignees)
- Etiquetas (labels)
- Checklist
- Anexos por link
- Prioridade (sempre visível)

### **✅ Sistema de Arquivamento**
- Modal dedicado para tarefas arquivadas
- Busca e filtros
- Restaurar/Excluir tarefas
- Agrupamento por data

### **✅ Melhorias de UI/UX**
- Cores distintas para cada coluna
- Sombras elegantes nos cards
- Efeitos de hover
- Design responsivo

### **✅ Funcionalidades Avançadas**
- Drag & Drop suave
- Salvamento automático
- Validações
- Tratamento de erros

## 🚨 Troubleshooting

### **Problema: Dados não aparecem**
- Verificar se as políticas RLS estão corretas
- Verificar se o usuário está autenticado
- Verificar logs do console

### **Problema: Erro de conexão**
- Verificar credenciais do Supabase
- Verificar se o projeto está ativo
- Verificar firewall/proxy

### **Problema: Funcionalidades não funcionam**
- Verificar se todas as tabelas foram criadas
- Verificar se os dados foram importados
- Verificar se as políticas RLS permitem acesso

## 📞 Suporte

Se encontrar problemas durante a migração:

1. **Verificar logs do console**
2. **Verificar dados no Supabase Dashboard**
3. **Testar conexão com scripts de debug**
4. **Verificar configurações de ambiente**

## 🎉 Conclusão

Após a migração, você terá todas as funcionalidades do Kanban funcionando no Supabase online, incluindo:

- ✅ Sistema completo de tarefas
- ✅ Interface moderna e responsiva
- ✅ Funcionalidades avançadas
- ✅ Performance otimizada
- ✅ Segurança com RLS

**Parabéns! Seu Kanban está pronto para produção! 🚀**

