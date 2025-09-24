# 🔧 Variáveis de Ambiente

Este documento lista todas as variáveis de ambiente necessárias para o projeto.

## 📋 Variáveis Obrigatórias

### Supabase
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 📋 Variáveis Opcionais

### Google Maps API (para autocomplete de endereços)
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 🚀 Configuração no Netlify

1. Acesse o painel do Netlify
2. Vá para "Site settings" > "Environment variables"
3. Adicione as variáveis necessárias:

**Obrigatórias:**
- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

**Opcionais:**
- `VITE_GOOGLE_MAPS_API_KEY`: Chave da API do Google Maps (para autocomplete)

## 🔒 Segurança

- **NUNCA** commite arquivos `.env.local` ou `.env`
- Use variáveis de ambiente do Netlify para produção
- Mantenha as chaves de API seguras

## 📝 Como Usar Localmente

1. Crie um arquivo `.env.local` na raiz do projeto
2. Copie as variáveis do arquivo `.env.example`
3. Preencha com seus valores reais
4. O arquivo `.env.local` está no `.gitignore` e não será commitado
