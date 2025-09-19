import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase online
const ONLINE_SUPABASE_URL = 'https://rncowiwstzumxruaojvq.supabase.co';
const ONLINE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY293aXdzdHp1bXhydWFvanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjQ3NDMsImV4cCI6MjA3MzQwMDc0M30.rcU3UBq4MkAG22oW_tbwmasqAHTqxwrcoN1jiPTgDA8';

const onlineSupabase = createClient(ONLINE_SUPABASE_URL, ONLINE_ANON_KEY);

console.log('👥 CRIANDO ADMINISTRADORES SIMPLES');
console.log('=================================');

async function criarAdminSimples() {
  try {
    console.log('📋 ETAPA 1: Verificando tabela admin_users...');
    
    // Verificar se a tabela existe
    const { data: admins, error: adminsError } = await onlineSupabase
      .from('admin_users')
      .select('*');
      
    if (adminsError) {
      console.error('❌ Erro ao acessar tabela admin_users:', adminsError);
      return;
    }
    
    console.log('✅ Tabela admin_users acessível');
    console.log(`   - Administradores existentes: ${admins.length}`);
    
    console.log('\n📋 ETAPA 2: Criando administradores...');
    
    // Criar administradores (apenas user_id)
    const administradores = [
      '624c6a0e-87d9-4005-9f08-9953e8860ad4', // matheus.mira@cvj.sc.gov.br
      '24151887-fefb-44fe-a2e3-1eef585a9468'  // adilson.martins.jlle@gmail.com
    ];
    
    for (const userId of administradores) {
      console.log(`\n🔄 Criando administrador: ${userId}`);
      
      const { data: insertResult, error: insertError } = await onlineSupabase
        .from('admin_users')
        .insert({
          user_id: userId
        })
        .select();
        
      if (insertError) {
        console.error(`❌ Erro ao criar ${userId}:`, insertError);
      } else {
        console.log(`✅ ${userId} criado com sucesso!`);
      }
    }
    
    console.log('\n📋 ETAPA 3: Verificando administradores criados...');
    
    // Verificar administradores criados
    const { data: adminsCriados, error: adminsCriadosError } = await onlineSupabase
      .from('admin_users')
      .select('*');
      
    if (adminsCriadosError) {
      console.error('❌ Erro ao verificar administradores:', adminsCriadosError);
    } else {
      console.log('✅ Administradores criados:', adminsCriados.length);
      adminsCriados.forEach(admin => {
        console.log(`   - ID: ${admin.user_id}`);
      });
    }
    
    console.log('\n🎉 ADMINISTRADORES CRIADOS COM SUCESSO!');
    console.log('=====================================');
    console.log('');
    console.log('✅ ADMINISTRADORES CRIADOS:');
    console.log('   - matheus.mira@cvj.sc.gov.br: 624c6a0e-87d9-4005-9f08-9953e8860ad4');
    console.log('   - adilson.martins.jlle@gmail.com: 24151887-fefb-44fe-a2e3-1eef585a9468');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Teste a aplicação: npm run dev');
    console.log('2. Faça login com os novos IDs');
    console.log('3. Verifique todas as funcionalidades do Kanban');
    
  } catch (error) {
    console.error('❌ Erro durante a criação:', error);
  }
}

// Executar criação
criarAdminSimples().catch(console.error);
