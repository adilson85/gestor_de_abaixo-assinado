# 🔧 Instruções para Corrigir o Kanban

## Problema Real Identificado

O Kanban **TEM DADOS** no banco (board e 7 colunas já existem), MAS as **políticas RLS estão bloqueando o acesso**!

### Por que isso acontece?
- No Dashboard você vê as 7 colunas ✅
- Mas o portal ADM não consegue ver nada ❌
- E o script mostra "0 registros" ❌

**Causa:** As tabelas Kanban têm RLS habilitado MAS faltam políticas que permitam usuários autenticados lerem os dados.

## Solução

Execute o SQL `fix-kanban-rls-policies.sql` no Supabase Dashboard para adicionar as políticas RLS corretas.

## Passo a Passo

### 1. Acesse o Supabase Dashboard
```
https://supabase.com/dashboard/project/rncowiwstzumxruaojvq/sql
```

### 2. Crie uma Nova Query
- Clique em **"New query"**

### 3. Cole o Conteúdo do Arquivo
- Abra o arquivo: `fix-kanban-rls-policies.sql`
- Copie TODO o conteúdo
- Cole no editor SQL

### 4. Execute o Script
- Clique em **"Run"** ou pressione `Ctrl+Enter`
- Aguarde a execução

### 5. Verifique o Resultado
Você deve ver uma tabela mostrando todas as políticas criadas:
```
✅ Políticas criadas com sucesso!
```

Com 4 políticas para cada tabela Kanban:
- Enable read access for authenticated users
- Enable insert for authenticated users
- Enable update for authenticated users
- Enable delete for authenticated users

## O Que o Script Faz

Adiciona políticas RLS para **todas as 12 tabelas Kanban**:

1. **kanban_boards** - Permite autenticados acessarem boards
2. **kanban_columns** - Permite autenticados acessarem colunas
3. **kanban_tasks** - Permite autenticados acessarem tarefas
4. **kanban_labels** - Labels para categorizar tarefas
5. **kanban_task_labels** - Relacionamento tarefas ↔ labels
6. **kanban_task_assignees** - Atribuição de responsáveis
7. **kanban_checklists** - Checklists dentro das tarefas
8. **kanban_checklist_items** - Itens dos checklists
9. **kanban_attachments** - Anexos nas tarefas
10. **kanban_comments** - Comentários nas tarefas
11. **kanban_activities** - Histórico de atividades
12. **kanban_column_deadlines** - Prazos das colunas

Cada tabela recebe 4 políticas (SELECT, INSERT, UPDATE, DELETE) que permitem acesso para usuários autenticados.

## Após a Execução

1. Recarregue o portal administrativo
2. Acesse a página de **Tasks**
3. O Kanban deve aparecer com as 7 colunas funcionando

## Verificar se Funcionou

Execute no terminal:
```bash
node check-all-tables.js
```

Após o fix, deve mostrar:
```
✅ Boards Kanban → 1 registro(s)
✅ Colunas Kanban → 7 registro(s)
```

---

## Status Atual do Banco

✅ **FUNCIONANDO:**
- 2 abaixo-assinados cadastrados
- 1.740 assinaturas registradas
- 6 recursos anexados
- Sistema de assinatura pública funcionando perfeitamente

✅ **DADOS EXISTEM (mas bloqueados por RLS):**
- 1 Kanban board criado
- 7 colunas criadas

❌ **PROBLEMA:**
- RLS bloqueando acesso às tabelas Kanban
- Portal ADM não consegue ver os dados

---

## Por que esse problema surgiu?

Quando você modificou as RLS para permitir assinatura pública nos `petitions` e `signatures`, as tabelas Kanban ficaram com RLS habilitado mas **sem políticas** que permitissem leitura.

É como ter uma sala com porta trancada: os dados estão lá dentro, mas ninguém tem a chave para entrar!

O script `fix-kanban-rls-policies.sql` adiciona as "chaves" (políticas) para usuários autenticados acessarem.

---

**Nota:** O script usa `DROP POLICY IF EXISTS` antes de criar, então é seguro executar múltiplas vezes.
