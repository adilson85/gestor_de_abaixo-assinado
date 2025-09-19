# MIGRAÇÃO AUTOMÁTICA COM SUPABASE CLI
# ====================================

Write-Host "🚀 MIGRAÇÃO AUTOMÁTICA COM SUPABASE CLI" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Verificar se o Supabase CLI está instalado
Write-Host "📋 Verificando Supabase CLI..." -ForegroundColor Blue
$cliCheck = Get-Command supabase -ErrorAction SilentlyContinue
if ($cliCheck) {
    Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Supabase CLI não encontrado" -ForegroundColor Red
    Write-Host "💡 Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Verificar se está logado
Write-Host "📋 Verificando login..." -ForegroundColor Blue
$loginCheck = supabase projects list 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Já logado no Supabase" -ForegroundColor Green
} else {
    Write-Host "🔐 Faça login no Supabase CLI:" -ForegroundColor Yellow
    Write-Host "   supabase login" -ForegroundColor Cyan
    Write-Host "   (Siga as instruções no navegador)" -ForegroundColor Yellow
    exit 1
}

# Aplicar migrations
Write-Host ""
Write-Host "📋 Aplicando migrations..." -ForegroundColor Blue
supabase db push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations aplicadas com sucesso" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao aplicar migrations" -ForegroundColor Red
    exit 1
}

# Exportar dados locais
Write-Host ""
Write-Host "📋 Exportando dados locais..." -ForegroundColor Blue
node export-local-kanban-data.js
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dados exportados com sucesso" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao exportar dados" -ForegroundColor Red
    exit 1
}

# Importar dados
Write-Host ""
Write-Host "📋 Importando dados..." -ForegroundColor Blue
node import-kanban-to-online.js
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dados importados com sucesso" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao importar dados" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Atualize o arquivo .env.local com as credenciais online" -ForegroundColor Cyan
Write-Host "2. Teste a aplicação: npm run dev" -ForegroundColor Cyan
Write-Host "3. Verifique todas as funcionalidades do Kanban" -ForegroundColor Cyan
