# 🚀 Migração Automática com Supabase CLI

## 🎯 **Vantagens do Supabase CLI**

✅ **Mais seguro** - Usa ferramentas oficiais  
✅ **Mais rápido** - Aplicação direta de migrations  
✅ **Mais confiável** - Estrutura garantida  
✅ **Automático** - Menos intervenção manual  
✅ **Versionado** - Controle de versões  

## 📋 **Pré-requisitos**

### **1️⃣ Instalar Supabase CLI**
```bash
# Instalar globalmente
npm install -g supabase

# Verificar instalação
supabase --version
```

### **2️⃣ Fazer Login**
```bash
# Login no Supabase
supabase login

# Verificar projetos
supabase projects list
```

### **3️⃣ Configurar Projeto**
```bash
# Linkar com projeto remoto
supabase link --project-ref SEU_PROJECT_REF

# Ou configurar manualmente
supabase init
```

## 🚀 **Processo de Migração**

### **Opção 1: Script Automático (Recomendado)**

#### **Windows (PowerShell):**
```powershell
# Executar script PowerShell
.\migrate-simple-cli.ps1
```

#### **Linux/Mac (Bash):**
```bash
# Tornar executável
chmod +x migrate-simple-cli.sh

# Executar script
./migrate-simple-cli.sh
```

### **Opção 2: Comandos Manuais**

#### **1️⃣ Aplicar Migrations**
```bash
# Aplicar todas as migrations
supabase db push

# Verificar status
supabase db diff
```

#### **2️⃣ Exportar Dados Locais**
```bash
# Executar script de exportação
node export-local-kanban-data.js
```

#### **3️⃣ Importar Dados**
```bash
# Executar script de importação
node import-kanban-to-online.js
```

## 🔧 **Configuração Avançada**

### **1️⃣ Configurar Variáveis de Ambiente**
```bash
# Configurar projeto
supabase link --project-ref SEU_PROJECT_REF

# Verificar configuração
supabase status
```

### **2️⃣ Aplicar Migrations Específicas**
```bash
# Aplicar migration específica
supabase db push --file supabase/migrations/20250118000000_initial_schema.sql

# Verificar migrations aplicadas
supabase migration list
```

### **3️⃣ Resetar Banco de Dados**
```bash
# Resetar banco remoto (CUIDADO!)
supabase db reset --linked

# Aplicar migrations novamente
supabase db push
```

## 📊 **Verificação da Migração**

### **1️⃣ Verificar Estrutura**
```bash
# Verificar diferenças
supabase db diff

# Verificar schema
supabase db diff --schema public
```

### **2️⃣ Verificar Dados**
```bash
# Conectar ao banco
supabase db shell

# Verificar tabelas
\dt kanban_*

# Verificar dados
SELECT COUNT(*) FROM kanban_boards;
SELECT COUNT(*) FROM kanban_columns;
SELECT COUNT(*) FROM kanban_tasks;
```

### **3️⃣ Testar Aplicação**
```bash
# Iniciar aplicação
npm run dev

# Testar funcionalidades:
# - Login
# - Kanban
# - Tarefas
# - Comentários
# - Prioridades
```

## 🚨 **Troubleshooting**

### **Problema: CLI não encontrado**
```bash
# Reinstalar CLI
npm uninstall -g supabase
npm install -g supabase

# Verificar PATH
echo $PATH
```

### **Problema: Não consegue fazer login**
```bash
# Limpar cache
supabase logout
supabase login

# Verificar token
supabase projects list
```

### **Problema: Erro ao aplicar migrations**
```bash
# Verificar projeto linkado
supabase status

# Re-linkar projeto
supabase link --project-ref SEU_PROJECT_REF
```

### **Problema: Dados não aparecem**
```bash
# Verificar RLS policies
supabase db shell
SELECT * FROM pg_policies WHERE tablename LIKE 'kanban_%';

# Verificar dados
SELECT * FROM kanban_boards;
```

## 📝 **Comandos Úteis**

### **Gerenciamento de Projeto**
```bash
# Status do projeto
supabase status

# Informações do projeto
supabase projects list

# Linkar projeto
supabase link --project-ref SEU_PROJECT_REF
```

### **Gerenciamento de Database**
```bash
# Aplicar migrations
supabase db push

# Verificar diferenças
supabase db diff

# Resetar banco
supabase db reset

# Conectar ao banco
supabase db shell
```

### **Gerenciamento de Migrations**
```bash
# Listar migrations
supabase migration list

# Criar nova migration
supabase migration new nome_da_migration

# Aplicar migration específica
supabase db push --file caminho/para/migration.sql
```

## 🎯 **Fluxo Completo**

### **1️⃣ Preparação**
```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref SEU_PROJECT_REF
```

### **2️⃣ Migração**
```bash
# Aplicar migrations
supabase db push

# Exportar dados locais
node export-local-kanban-data.js

# Importar dados
node import-kanban-to-online.js
```

### **3️⃣ Verificação**
```bash
# Verificar estrutura
supabase db diff

# Testar aplicação
npm run dev
```

## 🎉 **Resultado Final**

Após a migração com CLI, você terá:

- ✅ **Estrutura completa** aplicada automaticamente
- ✅ **Dados migrados** com integridade
- ✅ **Políticas RLS** configuradas
- ✅ **Índices otimizados** aplicados
- ✅ **Versionamento** controlado

## 🚀 **Próximos Passos**

1. **Testar todas as funcionalidades**
2. **Configurar backup automático**
3. **Documentar processo**
4. **Configurar CI/CD** (opcional)

---

**🎯 Parabéns! Migração automatizada concluída com sucesso!**
