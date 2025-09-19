import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function configurarSistemaCompleto() {
  console.log('🚀 Configurando sistema completo...\n');

  try {
    // 1. Criar usuário de teste
    console.log('1. 👤 Criando usuário de teste...');
    
    const testEmail = 'admin@teste.com';
    const testPassword = '123456789';
    
    // Tentar fazer login primeiro
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    let userId;
    
    if (loginError && loginError.message.includes('Invalid login credentials')) {
      // Usuário não existe, criar
      console.log('   - Usuário não existe, criando...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });

      if (signUpError) {
        console.error('❌ Erro ao criar usuário:', signUpError.message);
        console.log('💡 Tente criar manualmente no painel do Supabase');
        return;
      }

      userId = signUpData.user?.id;
      console.log('✅ Usuário criado:', testEmail);
    } else if (loginData.user) {
      userId = loginData.user.id;
      console.log('✅ Usuário já existe:', testEmail);
    } else {
      console.error('❌ Erro no login:', loginError?.message);
      console.log('💡 Tente criar manualmente no painel do Supabase');
      return;
    }

    // 2. Tornar usuário admin (usando SQL direto)
    console.log('\n2. 👑 Configurando como admin...');
    
    // Como não conseguimos inserir via RLS, vamos mostrar o SQL para executar manualmente
    console.log('💡 Execute este SQL no painel do Supabase:');
    console.log(`   INSERT INTO admin_users (user_id, email) VALUES ('${userId}', '${testEmail}');`);

    // 3. Criar board Kanban
    console.log('\n3. 📋 Criando board Kanban...');
    console.log('💡 Execute este SQL no painel do Supabase:');
    console.log('   INSERT INTO kanban_boards (name, is_global) VALUES (\'Board Global\', true);');

    // 4. Criar colunas (após criar o board)
    console.log('\n4. 📝 Criando colunas Kanban...');
    console.log('💡 Após criar o board, execute (substitua BOARD_ID pelo ID do board):');
    console.log('   INSERT INTO kanban_columns (board_id, name, position, color) VALUES');
    console.log('   (\'BOARD_ID\', \'Coleta de assinaturas\', 1, \'#3B82F6\'),');
    console.log('   (\'BOARD_ID\', \'Em análise\', 2, \'#F59E0B\'),');
    console.log('   (\'BOARD_ID\', \'Concluído\', 3, \'#10B981\');');

    // 5. Criar abaixo-assinados de exemplo
    console.log('\n5. 📄 Criando abaixo-assinados de exemplo...');
    console.log('💡 Execute este SQL no painel do Supabase:');
    console.log('   INSERT INTO petitions (slug, name, description, location, table_name) VALUES');
    console.log('   (\'melhoria-transporte\', \'Melhoria do Transporte Público\', \'Petição para melhorar a qualidade do transporte público\', \'São Paulo\', \'melhoria_transporte\'),');
    console.log('   (\'construcao-praca\', \'Construção de Praça\', \'Solicitação para construção de praça no bairro\', \'Rio de Janeiro\', \'construcao_praca\'),');
    console.log('   (\'seguranca-publica\', \'Segurança Pública\', \'Petição para aumentar segurança na região\', \'Belo Horizonte\', \'seguranca_publica\');');

    console.log('\n📋 RESUMO DOS PASSOS:');
    console.log('1. Acesse https://supabase.com/dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute os comandos SQL acima na ordem');
    console.log('4. Teste o sistema em http://localhost:5176');

    console.log('\n🔑 CREDENCIAIS DE TESTE:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: ${testPassword}`);

    console.log('\n✅ Após executar os SQLs, o botão "Adicionar" funcionará!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

configurarSistemaCompleto();



