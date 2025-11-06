// Script para criar usuário administrador no Supabase local
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54341';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  console.log('👤 Criando usuário administrador...\n');

  const email = 'admin@teste.com';
  const password = 'admin123';

  try {
    // 1. Criar usuário no Supabase Auth
    console.log(`📧 Criando usuário: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message);
      
      // Se o usuário já existe, tentar fazer login
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Usuário já existe. Tentando fazer login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (loginError) {
          console.error('❌ Erro ao fazer login:', loginError.message);
          return;
        }

        console.log('✅ Login realizado com sucesso!');
        console.log(`   User ID: ${loginData.user.id}`);
        
        // Verificar se já é admin
        await checkAndCreateAdmin(loginData.user.id, email);
        return;
      }
      return;
    }

    if (!authData.user) {
      console.error('❌ Usuário não foi criado');
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // 2. Adicionar usuário à tabela de administradores
    await checkAndCreateAdmin(authData.user.id, email);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function checkAndCreateAdmin(userId, email) {
  try {
    console.log('\n🔍 Verificando se usuário já é administrador...');
    
    // Verificar se já existe na tabela admin_users
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar admin:', checkError.message);
      return;
    }

    if (existingAdmin) {
      console.log('✅ Usuário já é administrador!');
      console.log(`   Admin ID: ${existingAdmin.id}`);
      return;
    }

    // Criar entrada na tabela admin_users
    console.log('👑 Adicionando usuário como administrador...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        email: email
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Erro ao criar admin:', adminError.message);
      return;
    }

    console.log('✅ Usuário adicionado como administrador!');
    console.log(`   Admin ID: ${adminData.id}`);

  } catch (error) {
    console.error('❌ Erro ao verificar/criar admin:', error);
  }
}

async function testLogin() {
  console.log('\n🧪 Testando login do usuário criado...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@teste.com',
      password: 'admin123',
    });

    if (error) {
      console.error('❌ Erro no teste de login:', error.message);
      return;
    }

    console.log('✅ Login de teste realizado com sucesso!');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Session: ${data.session ? 'Ativa' : 'Inativa'}`);

  } catch (error) {
    console.error('❌ Erro no teste de login:', error);
  }
}

// Executar o script
async function main() {
  await createAdminUser();
  await testLogin();
  
  console.log('\n🎉 Processo concluído!');
  console.log('\n📋 Credenciais do administrador:');
  console.log('   Email: admin@teste.com');
  console.log('   Senha: admin123');
  console.log('\n🌐 Acesse: http://localhost:5173');
}

main();


