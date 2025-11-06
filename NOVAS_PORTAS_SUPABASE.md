# 🔧 NOVAS PORTAS SUPABASE - GESTOR DE ABAIXO-ASSINADO

## ⚠️ **MUDANÇA DE CONFIGURAÇÃO**

As portas do Supabase local foram alteradas para evitar conflito com o projeto **Veritus** que já usa a porta 54331.

---

## 📊 **NOVAS PORTAS CONFIGURADAS**

| Serviço | Porta Anterior | **Nova Porta** | URL de Acesso |
|---------|----------------|----------------|---------------|
| **API** | 54331 | **54341** | http://127.0.0.1:54341 |
| **Database** | 54332 | **54342** | postgresql://postgres:postgres@127.0.0.1:54342/postgres |
| **Studio** | 54333 | **54343** | http://127.0.0.1:54343 |
| **Inbucket** | 54334 | **54344** | http://127.0.0.1:54344 |
| **Analytics** | 54337 | **54347** | http://127.0.0.1:54347 |
| **Shadow DB** | 54330 | **54340** | - |
| **Pooler** | 54329 | **54339** | - |

---

## 🔄 **ARQUIVOS ATUALIZADOS**

### ✅ **Configuração do Supabase**
- `supabase/config.toml` - Todas as portas alteradas

### ✅ **Cliente Supabase**
- `src/lib/supabase.ts` - URL padrão alterada para 54341

### ✅ **Scripts de Teste**
- `test_duplicate_phone.js` - Porta atualizada

### ✅ **Documentação**
- `CONFIGURACOES_SUPABASE_PRIVADO.md` - Credenciais atualizadas

---

## 🚀 **COMO USAR**

### 1. **Iniciar Supabase Local**
```bash
npx supabase start
```

### 2. **Acessar Serviços**
- **API**: http://127.0.0.1:54341
- **Studio**: http://127.0.0.1:54343
- **Email Testing**: http://127.0.0.1:54344

### 3. **Conectar ao Banco**
```bash
psql postgresql://postgres:postgres@127.0.0.1:54342/postgres
```

---

## 🔍 **VERIFICAÇÃO**

Para verificar se as novas portas estão funcionando:

```bash
# Verificar status
npx supabase status

# Testar API
curl http://127.0.0.1:54341/rest/v1/

# Testar Studio
# Abrir http://127.0.0.1:54343 no navegador
```

---

## ⚠️ **IMPORTANTE**

1. **Parar Supabase anterior** se estiver rodando na porta 54331
2. **Reiniciar** o Supabase local com as novas configurações
3. **Verificar** se não há conflitos com outros projetos
4. **Atualizar** qualquer script ou configuração que use as portas antigas

---

## 🎯 **BENEFÍCIOS**

- ✅ **Sem conflitos** com projeto Veritus
- ✅ **Múltiplos projetos** Supabase rodando simultaneamente
- ✅ **Desenvolvimento isolado** por projeto
- ✅ **Configuração limpa** e organizada

---

> 🔧 **Configuração atualizada com sucesso!** Agora você pode rodar o Supabase local sem conflitos com o projeto Veritus.


