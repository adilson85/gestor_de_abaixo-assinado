# 🔄 Guia de Reset e Migração Completa do Kanban

## ⚠️ **ATENÇÃO: OPERAÇÃO IRREVERSÍVEL**

Este processo irá **excluir todas as tabelas do Kanban** no Supabase online e recriar a estrutura completa do local.

## 🎯 **Por que Reset Completo?**

✅ **Estrutura 100% correta** - Baseada no que está funcionando localmente  
✅ **Políticas RLS corretas** - Todas as permissões configuradas  
✅ **Índices otimizados** - Performance garantida  
✅ **Triggers funcionais** - Todas as funcionalidades preservadas  
✅ **Menor risco** - Estrutura testada e aprovada  

## 📋 **Pré-requisitos**

1. **Supabase local funcionando** ✅
2. **Dados do Kanban funcionando** ✅
3. **Credenciais do Supabase online** ⚠️
4. **Backup dos dados importantes** (se houver)

## 🚀 **Processo de Migração**

### **1️⃣ Preparação**

```bash
# 1. Verificar se o Supabase local está funcionando
npm run dev

# 2. Testar funcionalidades do Kanban local
# - Criar/editar tarefas
# - Comentários
# - Prioridades
# - Etiquetas
# - Checklist
# - Anexos
```

### **2️⃣ Configurar Credenciais**

Edite o arquivo `reset-and-migrate-kanban.js`:

```javascript
// ⚠️ SUBSTITUA PELAS SUAS CREDENCIAIS REAIS
const ONLINE_SUPABASE_URL = 'https://seu-projeto.supabase.co';
const ONLINE_SERVICE_KEY = 'sua_service_key_aqui';
```

### **3️⃣ Executar Reset e Migração**

```bash
# Executar o script de reset e migração
node reset-and-migrate-kanban.js
```

### **4️⃣ Verificar Migração**

O script irá:

1. **Exportar todos os dados locais**
2. **Excluir tabelas do Kanban online**
3. **Recriar estrutura completa**
4. **Importar todos os dados**
5. **Verificar integridade**

## 📊 **Tabelas que Serão Migradas**

### **Tabelas Principais:**
- ✅ `kanban_boards` - Quadros do Kanban
- ✅ `kanban_columns` - Colunas dos quadros
- ✅ `kanban_tasks` - Tarefas
- ✅ `kanban_comments` - Comentários

### **Tabelas Relacionadas:**
- ✅ `kanban_task_assignees` - Responsáveis
- ✅ `kanban_labels` - Etiquetas
- ✅ `kanban_task_labels` - Relação tarefa-etiqueta
- ✅ `kanban_checklists` - Listas de verificação
- ✅ `kanban_checklist_items` - Itens das listas
- ✅ `kanban_attachments` - Anexos
- ✅ `kanban_activities` - Log de atividades

## 🔧 **Configuração Pós-Migração**

### **1️⃣ Atualizar Variáveis de Ambiente**

Crie/atualize o arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### **2️⃣ Atualizar Configuração do Supabase**

Edite `src/lib/supabase.ts`:

```typescript
// Remover fallbacks locais
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### **3️⃣ Testar Aplicação**

```bash
# Reiniciar servidor
npm run dev

# Testar funcionalidades:
# 1. Login
# 2. Acessar página de Tarefas
# 3. Criar/editar tarefas
# 4. Comentários e menções
# 5. Prioridades e etiquetas
# 6. Checklist e anexos
# 7. Arquivamento
# 8. Drag & Drop
```

## 🎯 **Funcionalidades Migradas**

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

## 🚨 **Troubleshooting**

### **Problema: Erro de conexão**
```bash
# Verificar credenciais
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

### **Problema: Dados não aparecem**
- Verificar se as políticas RLS estão corretas
- Verificar se o usuário está autenticado
- Verificar logs do console

### **Problema: Funcionalidades não funcionam**
- Verificar se todas as tabelas foram criadas
- Verificar se os dados foram importados
- Verificar se as políticas RLS permitem acesso

## 📞 **Suporte**

Se encontrar problemas:

1. **Verificar logs do console**
2. **Verificar dados no Supabase Dashboard**
3. **Testar conexão com scripts de debug**
4. **Verificar configurações de ambiente**

## 🎉 **Resultado Final**

Após a migração, você terá:

- ✅ **Sistema Kanban completo** funcionando online
- ✅ **Todas as funcionalidades** preservadas
- ✅ **Estrutura otimizada** e segura
- ✅ **Performance garantida**
- ✅ **Pronto para produção**

## 🚀 **Próximos Passos**

1. **Testar todas as funcionalidades**
2. **Configurar domínio personalizado** (opcional)
3. **Configurar backup automático** (recomendado)
4. **Documentar processo** para futuras migrações

---

**🎯 Parabéns! Seu Kanban está migrado e funcionando perfeitamente online!**
