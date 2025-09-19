#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ENV_LOCAL = '.env.local';
const ENV_ONLINE = '.env.local.online';
const ENV_BACKUP = '.env.local.backup';

function trocarParaLocal() {
  console.log('🏠 Trocando para Supabase LOCAL...');
  
  // Se existe .env.local, renomeia para .env.local.online
  if (fs.existsSync(ENV_LOCAL)) {
    fs.renameSync(ENV_LOCAL, ENV_ONLINE);
    console.log('✅ Configuração online salva em .env.local.online');
  }
  
  console.log('✅ Projeto configurado para usar Supabase LOCAL');
  console.log('📍 URL: http://127.0.0.1:54331');
  console.log('🔄 Reinicie o servidor: npm run dev');
}

function trocarParaOnline() {
  console.log('🌐 Trocando para Supabase ONLINE...');
  
  // Se existe .env.local.online, renomeia para .env.local
  if (fs.existsSync(ENV_ONLINE)) {
    fs.renameSync(ENV_ONLINE, ENV_LOCAL);
    console.log('✅ Configuração online ativada');
  } else if (fs.existsSync(ENV_BACKUP)) {
    fs.copyFileSync(ENV_BACKUP, ENV_LOCAL);
    console.log('✅ Configuração online restaurada do backup');
  } else {
    console.log('❌ Arquivo de configuração online não encontrado!');
    console.log('📝 Crie o arquivo .env.local com as configurações do Supabase online');
    return;
  }
  
  console.log('✅ Projeto configurado para usar Supabase ONLINE');
  console.log('📍 URL: https://gbjrdnlqtrmcqtqzqoxz.supabase.co');
  console.log('🔄 Reinicie o servidor: npm run dev');
}

function mostrarStatus() {
  console.log('📊 STATUS ATUAL:');
  
  if (fs.existsSync(ENV_LOCAL)) {
    console.log('🌐 Usando: SUPABASE ONLINE');
    console.log('📍 Arquivo: .env.local existe');
  } else {
    console.log('🏠 Usando: SUPABASE LOCAL');
    console.log('📍 Usando configurações padrão do código');
  }
  
  if (fs.existsSync(ENV_ONLINE)) {
    console.log('💾 Backup online disponível: .env.local.online');
  }
  
  if (fs.existsSync(ENV_BACKUP)) {
    console.log('💾 Backup disponível: .env.local.backup');
  }
}

function mostrarAjuda() {
  console.log(`
🔄 SCRIPT PARA TROCAR CONFIGURAÇÃO DO SUPABASE

Uso: node trocar-supabase.js [comando]

Comandos:
  local     Trocar para Supabase LOCAL (desenvolvimento)
  online    Trocar para Supabase ONLINE (produção)
  status    Mostrar configuração atual
  help      Mostrar esta ajuda

Exemplos:
  node trocar-supabase.js local
  node trocar-supabase.js online
  node trocar-supabase.js status
`);
}

// Processar argumentos da linha de comando
const comando = process.argv[2];

switch (comando) {
  case 'local':
    trocarParaLocal();
    break;
  case 'online':
    trocarParaOnline();
    break;
  case 'status':
    mostrarStatus();
    break;
  case 'help':
  case '--help':
  case '-h':
    mostrarAjuda();
    break;
  default:
    console.log('❓ Comando não reconhecido. Use "help" para ver os comandos disponíveis.');
    mostrarStatus();
}
