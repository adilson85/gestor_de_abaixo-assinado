#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando configuração do Gestor de Abaixo-Assinado...\n');

let allGood = true;

// Verificar arquivo .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env.local encontrado');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('VITE_SUPABASE_URL') && envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    console.log('✅ Variáveis de ambiente configuradas');
  } else {
    console.log('❌ Variáveis de ambiente incompletas');
    allGood = false;
  }
} else {
  console.log('❌ Arquivo .env.local não encontrado');
  allGood = false;
}

// Verificar arquivos de migração
const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
if (fs.existsSync(migrationsDir)) {
  console.log('✅ Diretório de migrações encontrado');
  
  const migrations = [
    '20250915132944_twilight_sea.sql',
    '20250917051108_broken_resonance.sql',
    '20250917051357_broad_frost.sql',
    '20250120000000_add_image_url.sql',
    '20250120000001_create_logs_tables.sql'
  ];
  
  migrations.forEach(migration => {
    const migrationPath = path.join(migrationsDir, migration);
    if (fs.existsSync(migrationPath)) {
      console.log(`✅ Migração ${migration} encontrada`);
    } else {
      console.log(`❌ Migração ${migration} não encontrada`);
      allGood = false;
    }
  });
} else {
  console.log('❌ Diretório de migrações não encontrado');
  allGood = false;
}

// Verificar package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json encontrado');
  
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['react', 'react-dom', '@supabase/supabase-js', 'react-router-dom'];
  
  requiredDeps.forEach(dep => {
    if (packageContent.dependencies && packageContent.dependencies[dep]) {
      console.log(`✅ Dependência ${dep} encontrada`);
    } else {
      console.log(`❌ Dependência ${dep} não encontrada`);
      allGood = false;
    }
  });
} else {
  console.log('❌ package.json não encontrado');
  allGood = false;
}

// Verificar node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules encontrado');
} else {
  console.log('❌ node_modules não encontrado - execute: npm install');
  allGood = false;
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 Configuração completa! Tudo pronto para usar.');
  console.log('\n📋 Próximos passos:');
  console.log('1. Execute as migrações no painel do Supabase');
  console.log('2. Configure o bucket de storage "petition-images"');
  console.log('3. Crie um usuário administrador');
  console.log('4. Execute: npm run dev');
} else {
  console.log('⚠️  Configuração incompleta. Verifique os itens marcados com ❌');
  console.log('\n🔧 Para corrigir:');
  console.log('1. Execute: npm install');
  console.log('2. Execute: node setup-supabase.js');
  console.log('3. Siga as instruções em INSTRUCOES_SUPABASE.md');
}

console.log('\n🔗 Links úteis:');
console.log('- Painel Supabase: https://rncowiwstzumxruaojvq.supabase.co');
console.log('- SQL Editor: https://rncowiwstzumxruaojvq.supabase.co/project/default/sql');
console.log('- Storage: https://rncowiwstzumxruaojvq.supabase.co/project/default/storage');
console.log('- Auth: https://rncowiwstzumxruaojvq.supabase.co/project/default/auth');
