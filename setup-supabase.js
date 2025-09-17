#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configurando Supabase para o Gestor de Abaixo-Assinado...\n');

// Lê variáveis de ambiente (nunca comitar credenciais)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não definidos no ambiente.');
  console.warn('    Defina as variáveis no seu shell ou crie um .env.local manualmente.');
}

// Conteúdo do arquivo .env.local
const envContent = `# Configurações do Supabase
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}
`;

// Caminho do arquivo .env.local
const envPath = path.join(__dirname, '.env.local');

try {
  // Verificar se o arquivo já existe
  if (fs.existsSync(envPath)) {
    console.log('⚠️  Arquivo .env.local já existe. Fazendo backup...');
    const backupPath = path.join(__dirname, '.env.local.backup');
    fs.copyFileSync(envPath, backupPath);
    console.log('✅ Backup criado em .env.local.backup');
  }

  // Criar o arquivo .env.local
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env.local criado com sucesso!');

  console.log('\n📋 Próximos passos:');
  console.log('1. Execute as migrações no painel do Supabase');
  console.log('2. Configure o bucket de storage "petition-images"');
  console.log('3. Crie um usuário administrador');
  console.log('4. Execute: npm run dev');
  
  console.log('\n🔗 Links úteis:');
  console.log(`- Painel Supabase: ${supabaseUrl || 'https://app.supabase.com/'}`);
  console.log('- SQL Editor: disponível no painel do seu projeto');
  console.log('- Storage: disponível no painel do seu projeto');
  console.log('- Auth: disponível no painel do seu projeto');

  console.log('\n📁 Arquivos de migração:');
  console.log('- supabase/migrations/20250915132944_twilight_sea.sql');
  console.log('- supabase/migrations/20250917051108_broken_resonance.sql');
  console.log('- supabase/migrations/20250917051357_broad_frost.sql');
  console.log('- supabase/migrations/20250120000000_add_image_url.sql');
  console.log('- supabase/migrations/20250120000001_create_logs_tables.sql');

} catch (error) {
  console.error('❌ Erro ao criar arquivo .env.local:', error.message);
  process.exit(1);
}

console.log('\n🎉 Configuração concluída!');
