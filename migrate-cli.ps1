# MIGRACAO AUTOMATICA COM SUPABASE CLI
# ====================================

Write-Host "MIGRACAO AUTOMATICA COM SUPABASE CLI" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Verificar se o Supabase CLI esta instalado
Write-Host "Verificando Supabase CLI..." -ForegroundColor Blue
$cliCheck = Get-Command supabase -ErrorAction SilentlyContinue
if ($cliCheck) {
    Write-Host "OK - Supabase CLI encontrado" -ForegroundColor Green
} else {
    Write-Host "ERRO - Supabase CLI nao encontrado" -ForegroundColor Red
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Verificar se esta logado
Write-Host "Verificando login..." -ForegroundColor Blue
$loginCheck = supabase projects list 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Ja logado no Supabase" -ForegroundColor Green
} else {
    Write-Host "ERRO - Faca login no Supabase CLI:" -ForegroundColor Yellow
    Write-Host "   supabase login" -ForegroundColor Cyan
    Write-Host "   (Siga as instrucoes no navegador)" -ForegroundColor Yellow
    exit 1
}

# Aplicar migrations
Write-Host ""
Write-Host "Aplicando migrations..." -ForegroundColor Blue
supabase db push
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Migrations aplicadas com sucesso" -ForegroundColor Green
} else {
    Write-Host "ERRO - Erro ao aplicar migrations" -ForegroundColor Red
    exit 1
}

# Exportar dados locais
Write-Host ""
Write-Host "Exportando dados locais..." -ForegroundColor Blue
node export-local-kanban-data.js
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Dados exportados com sucesso" -ForegroundColor Green
} else {
    Write-Host "ERRO - Erro ao exportar dados" -ForegroundColor Red
    exit 1
}

# Importar dados
Write-Host ""
Write-Host "Importando dados..." -ForegroundColor Blue
node import-kanban-to-online.js
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Dados importados com sucesso" -ForegroundColor Green
} else {
    Write-Host "ERRO - Erro ao importar dados" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "MIGRACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Atualize o arquivo .env.local com as credenciais online" -ForegroundColor Cyan
Write-Host "2. Teste a aplicacao: npm run dev" -ForegroundColor Cyan
Write-Host "3. Verifique todas as funcionalidades do Kanban" -ForegroundColor Cyan
