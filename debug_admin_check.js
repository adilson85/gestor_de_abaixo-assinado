// Script para debugar a verificação de administradores
// Execute no console do navegador (F12)

console.log('🔍 DEBUG - Verificação de Administradores');
console.log('=====================================');

// IDs dos administradores (do código atual)
const adminUserIds = [
  '624c6a0e-87d9-4005-9f08-9953e8860ad4', // matheus.mira@cvj.sc.gov.br
  '24151887-fefb-44fe-a2e3-1eef585a9468', // adilson.martins.jlle@gmail.com
  'a1b02a97-c26e-4457-a4d2-046380c1c05a', // admin@teste.com (Supabase Local - ID atual)
  'eea6867e-e65f-4986-8aa1-9ea60e42c5f6', // andrevitorgoedert4@hotmail.com
  '5e65d48c-051d-4a24-9d00-51d9f0b985e8'  // mkargel@gmail.com
];

console.log('📋 IDs de Administradores no Código:');
adminUserIds.forEach((id, index) => {
  const emails = [
    'matheus.mira@cvj.sc.gov.br',
    'adilson.martins.jlle@gmail.com', 
    'admin@teste.com',
    'andrevitorgoedert4@hotmail.com',
    'mkargel@gmail.com'
  ];
  console.log(`${index + 1}. ${id} (${emails[index]})`);
});

// Função para testar se um ID é admin
function testAdminAccess(userId) {
  const isAdmin = adminUserIds.includes(userId);
  console.log(`\n🧪 Teste para ID: ${userId}`);
  console.log(`   Resultado: ${isAdmin ? '✅ É ADMIN' : '❌ NÃO É ADMIN'}`);
  return isAdmin;
}

// Testar os IDs dos novos usuários
console.log('\n🎯 TESTANDO NOVOS ADMINISTRADORES:');
testAdminAccess('eea6867e-e65f-4986-8aa1-9ea60e42c5f6'); // André Vitor
testAdminAccess('5e65d48c-051d-4a24-9d00-51d9f0b985e8'); // Márcio Kargel

console.log('\n📝 INSTRUÇÕES:');
console.log('1. Faça login com um dos novos usuários');
console.log('2. Abra o Console (F12)');
console.log('3. Execute este script');
console.log('4. Verifique se o ID do usuário logado está na lista');
console.log('5. Se não estiver, o código não foi atualizado');

// Função para verificar usuário atual (se estiver logado)
if (typeof window !== 'undefined' && window.supabase) {
  console.log('\n🔍 VERIFICANDO USUÁRIO ATUAL...');
  window.supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      console.log(`👤 Usuário logado: ${user.email}`);
      console.log(`🆔 ID do usuário: ${user.id}`);
      const isAdmin = testAdminAccess(user.id);
      if (isAdmin) {
        console.log('✅ Usuário tem acesso administrativo!');
      } else {
        console.log('❌ Usuário NÃO tem acesso administrativo!');
        console.log('💡 Verifique se o código foi atualizado e deployado');
      }
    } else {
      console.log('❌ Nenhum usuário logado');
    }
  });
}
