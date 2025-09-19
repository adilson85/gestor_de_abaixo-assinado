import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase online
const ONLINE_SUPABASE_URL = 'https://rncowiwstzumxruaojvq.supabase.co';
const ONLINE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY293aXdzdHp1bXhydWFvanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjQ3NDMsImV4cCI6MjA3MzQwMDc0M30.rcU3UBq4MkAG22oW_tbwmasqAHTqxwrcoN1jiPTgDA8';

const onlineSupabase = createClient(ONLINE_SUPABASE_URL, ONLINE_ANON_KEY);

console.log('🔄 ATUALIZANDO IDs DOS ADMINISTRADORES');
console.log('=====================================');

async function atualizarAdminIds() {
  try {
    console.log('📋 ETAPA 1: Verificando administradores existentes...');
    
    // Verificar administradores existentes
    const { data: admins, error: adminsError } = await onlineSupabase
      .from('admin_users')
      .select('*');
      
    if (adminsError) {
      console.error('❌ Erro ao buscar administradores:', adminsError);
      return;
    }
    
    console.log('✅ Administradores encontrados:', admins.length);
    if (admins.length > 0) {
      admins.forEach(admin => {
        console.log(`   - ID: ${admin.user_id}`);
      });
    }
    
    console.log('\n📋 ETAPA 2: Atualizando ID do matheus.mira@cvj.sc.gov.br...');
    
    // Atualizar ID do matheus.mira@cvj.sc.gov.br
    const { data: updateMatheus, error: updateMatheusError } = await onlineSupabase
      .from('admin_users')
      .update({ user_id: '624c6a0e-87d9-4005-9f08-9953e8860ad4' })
      .eq('user_id', '4bde4d2e-9894-4063-8caf-eae2e34c5f4c')
      .select();
      
    if (updateMatheusError) {
      console.error('❌ Erro ao atualizar matheus.mira:', updateMatheusError);
    } else {
      console.log('✅ matheus.mira@cvj.sc.gov.br atualizado com sucesso!');
      console.log(`   - Novo ID: 624c6a0e-87d9-4005-9f08-9953e8860ad4`);
    }
    
    console.log('\n📋 ETAPA 3: Atualizando ID do adilson.martins.jlle@gmail.com...');
    
    // Atualizar ID do adilson.martins.jlle@gmail.com
    const { data: updateAdilson, error: updateAdilsonError } = await onlineSupabase
      .from('admin_users')
      .update({ user_id: '24151887-fefb-44fe-a2e3-1eef585a9468' })
      .eq('user_id', '4a9f97bb-7427-40fd-a721-5b51e5248872')
      .select();
      
    if (updateAdilsonError) {
      console.error('❌ Erro ao atualizar adilson.martins:', updateAdilsonError);
    } else {
      console.log('✅ adilson.martins.jlle@gmail.com atualizado com sucesso!');
      console.log(`   - Novo ID: 24151887-fefb-44fe-a2e3-1eef585a9468`);
    }
    
    console.log('\n📋 ETAPA 4: Verificando atualizações...');
    
    // Verificar administradores após atualização
    const { data: adminsAtualizados, error: adminsAtualizadosError } = await onlineSupabase
      .from('admin_users')
      .select('*');
      
    if (adminsAtualizadosError) {
      console.error('❌ Erro ao verificar administradores:', adminsAtualizadosError);
    } else {
      console.log('✅ Administradores após atualização:', adminsAtualizados.length);
      adminsAtualizados.forEach(admin => {
        console.log(`   - ID: ${admin.user_id}`);
      });
    }
    
    console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA!');
    console.log('========================');
    console.log('');
    console.log('✅ IDs DOS ADMINISTRADORES ATUALIZADOS:');
    console.log('   - matheus.mira@cvj.sc.gov.br: 624c6a0e-87d9-4005-9f08-9953e8860ad4');
    console.log('   - adilson.martins.jlle@gmail.com: 24151887-fefb-44fe-a2e3-1eef585a9468');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Teste a aplicação: npm run dev');
    console.log('2. Faça login com os novos IDs');
    console.log('3. Verifique todas as funcionalidades do Kanban');
    
  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  }
}

// Executar atualização
atualizarAdminIds().catch(console.error);
