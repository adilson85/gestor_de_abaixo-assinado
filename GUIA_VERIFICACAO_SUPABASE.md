# 🔍 Guia de Verificação do Supabase Online

## 🎯 **Objetivo**

Verificar se o Supabase online está configurado corretamente e se todos os dados do Kanban foram migrados com sucesso.

## 📋 **Scripts Disponíveis**

### **1️⃣ Verificação Básica (Recomendado)**
- **Arquivo:** `verificar-supabase-online.js`
- **Função:** Verificação rápida de conexão e dados
- **Tempo:** ~30 segundos

### **2️⃣ Análise Completa**
- **Arquivo:** `analisar-supabase-online.js`
- **Função:** Análise detalhada de toda a estrutura
- **Tempo:** ~2 minutos

## 🔧 **Configuração**

### **1️⃣ Editar Credenciais**

Abra o arquivo `verificar-supabase-online.js` e configure:

```javascript
const ONLINE_SUPABASE_URL = 'https://seu-projeto.supabase.co';
const ONLINE_SERVICE_KEY = 'sua_service_key_aqui';
```

### **2️⃣ Executar Verificação**

```bash
# Verificação básica
node verificar-supabase-online.js

# Análise completa
node analisar-supabase-online.js
```

## 📊 **O que Será Verificado**

### **✅ Conexão**
- Teste de conexão com Supabase online
- Verificação de credenciais
- Validação de acesso

### **✅ Estrutura das Tabelas**
- `kanban_boards` - Quadros do Kanban
- `kanban_columns` - Colunas dos quadros
- `kanban_tasks` - Tarefas
- `kanban_comments` - Comentários
- `kanban_task_assignees` - Responsáveis
- `kanban_labels` - Etiquetas
- `kanban_task_labels` - Relação tarefa-etiqueta
- `kanban_checklists` - Listas de verificação
- `kanban_checklist_items` - Itens das listas
- `kanban_attachments` - Anexos
- `kanban_activities` - Log de atividades

### **✅ Dados Migrados**
- Contagem de registros em cada tabela
- Verificação de integridade
- Validação de relacionamentos

### **✅ Políticas RLS**
- Verificação de políticas de segurança
- Validação de permissões
- Teste de acesso

### **✅ Índices**
- Verificação de índices de performance
- Validação de otimizações
- Teste de consultas

### **✅ Operações Básicas**
- Teste de SELECT
- Teste de INSERT
- Teste de UPDATE
- Teste de DELETE

## 🚨 **Possíveis Problemas**

### **❌ Erro de Conexão**
```
❌ Erro de conexão: { code: 'PGRST301', message: 'JWT expired' }
```
**Solução:** Verifique se as credenciais estão corretas

### **❌ Tabela Não Encontrada**
```
❌ kanban_boards: relation "kanban_boards" does not exist
```
**Solução:** Execute as migrations no Supabase online

### **❌ Erro de Permissão**
```
❌ Erro de conexão: { code: '42501', message: 'permission denied' }
```
**Solução:** Verifique se a service key tem permissões adequadas

### **❌ Dados Não Encontrados**
```
✅ Dados encontrados:
   - Boards: 0
   - Columns: 0
   - Tasks: 0
```
**Solução:** Execute a migração de dados

## 📝 **Interpretação dos Resultados**

### **✅ Sucesso Total**
```
✅ Conexão com Supabase online OK
✅ Dados encontrados:
   - Boards: 1
   - Columns: 7
   - Tasks: 2
   - Comments: 0
✅ SUPABASE ONLINE FUNCIONANDO!
```

### **⚠️ Parcialmente Funcionando**
```
✅ Conexão com Supabase online OK
✅ Dados encontrados:
   - Boards: 1
   - Columns: 7
   - Tasks: 0
   - Comments: 0
⚠️ Alguns dados podem estar faltando
```

### **❌ Problemas Encontrados**
```
❌ Erro de conexão: { code: 'PGRST301', message: 'JWT expired' }
❌ Verifique as credenciais do Supabase online
```

## 🔧 **Soluções Comuns**

### **1️⃣ Credenciais Incorretas**
```bash
# Verificar no Dashboard do Supabase
# Copiar URL e Service Key corretos
```

### **2️⃣ Tabelas Não Existem**
```bash
# Aplicar migrations
supabase db push

# Ou executar SQL manualmente no Dashboard
```

### **3️⃣ Dados Não Migrados**
```bash
# Executar migração de dados
node import-kanban-to-online.js
```

### **4️⃣ Políticas RLS**
```bash
# Verificar no Dashboard > Authentication > Policies
# Aplicar políticas necessárias
```

## 🎯 **Próximos Passos**

### **1️⃣ Se Tudo Está OK**
```bash
# Configurar ambiente
# Editar .env.local com credenciais online

# Testar aplicação
npm run dev

# Verificar funcionalidades
# - Login
# - Kanban
# - Tarefas
# - Comentários
```

### **2️⃣ Se Há Problemas**
```bash
# Corrigir problemas identificados
# Re-executar verificação
# Testar novamente
```

## 📞 **Suporte**

Se encontrar problemas:

1. **Verificar logs detalhados**
2. **Consultar Dashboard do Supabase**
3. **Verificar políticas RLS**
4. **Testar credenciais**

## 🎉 **Resultado Esperado**

Após a verificação bem-sucedida, você deve ver:

```
✅ Conexão com Supabase online OK
✅ Dados encontrados:
   - Boards: 1
   - Columns: 7
   - Tasks: 2
   - Comments: 0
✅ SUPABASE ONLINE FUNCIONANDO!
```

---

**🎯 Parabéns! Seu Supabase online está funcionando perfeitamente!**
