#!/bin/bash

echo "🚀 MIGRAÇÃO AUTOMÁTICA COM SUPABASE CLI"
echo "======================================"

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado"
    echo "💡 Instale com: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI encontrado"

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    echo "🔐 Faça login no Supabase CLI:"
    echo "   supabase login"
    echo "   (Siga as instruções no navegador)"
    exit 1
fi

echo "✅ Já logado no Supabase"

# Aplicar migrations
echo ""
echo "📋 Aplicando migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migrations aplicadas com sucesso"
else
    echo "❌ Erro ao aplicar migrations"
    exit 1
fi

# Exportar dados locais
echo ""
echo "📋 Exportando dados locais..."
node export-local-kanban-data.js

if [ $? -eq 0 ]; then
    echo "✅ Dados exportados com sucesso"
else
    echo "❌ Erro ao exportar dados"
    exit 1
fi

# Importar dados
echo ""
echo "📋 Importando dados..."
node import-kanban-to-online.js

if [ $? -eq 0 ]; then
    echo "✅ Dados importados com sucesso"
else
    echo "❌ Erro ao importar dados"
    exit 1
fi

echo ""
echo "🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=================================="
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Atualize o arquivo .env.local com as credenciais online"
echo "2. Teste a aplicação: npm run dev"
echo "3. Verifique todas as funcionalidades do Kanban"
