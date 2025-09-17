#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configurando Supabase para o Gestor de Abaixo-Assinado...\n');

// Credenciais fornecidas
const supabaseUrl = 'https://rncowiwstzumxruaojvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY293aXdzdHp1bXhydWFvanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjQ3NDMsImV4cCI6MjA3MzQwMDc0M30.rcU3UBq4MkAG22oW_tbwmasqAHTqxwrcoN1jiPTgDA8';

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
  console.log(`- Painel Supabase: ${supabaseUrl}`);
  console.log('- SQL Editor: https://rncowiwstzumxruaojvq.supabase.co/project/default/sql');
  console.log('- Storage: https://rncowiwstzumxruaojvq.supabase.co/project/default/storage');
  console.log('- Auth: https://rncowiwstzumxruaojvq.supabase.co/project/default/auth');

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
