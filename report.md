# Auditoria – Gestor de Abaixo-Assinado

## Inventário do Estado Atual
- **Stack principal**: React 18 + TypeScript com Vite, Tailwind e Supabase (`package.json`)
- **Scripts npm**: `dev`, `build`, `lint`, `preview`, suíte Jest e scripts utilitários `setup`/`check`
- **Estrutura**: `src/` organizado por componentes, páginas, hooks, utils; `supabase/migrations` com 8 arquivos SQL; assets PWA em `public/`; scripts auxiliares na raiz
- **Configuração**: `vite.config.ts`, `tailwind.config.js`, `eslint.config.js`, `jest.config.js`, `netlify.toml` e `tsconfig.*` alinhados a um app SPA
- **Ambiente**: `.env.local` (placeholders) e scripts `setup-supabase.js` / `verificar-configuracao.js` para geração/checagem de credenciais
- **Banco de dados**: dependência total das migrações SQL; não há dump ou snapshot do schema atual, nem seeds de dados

## Principais Achados (ver `issues.csv`)
- `ISS-001` – Ordem dos arquivos SQL impede rodar `supabase migration up` em ambiente limpo (`20250120000000` roda antes de criar `petitions`)
- `ISS-002` – Migração de administradores falha ao inserir UUID hardcoded que não existe em `auth.users`
- `ISS-003` – Função `add_message_sent_column` quebra quando não há tabelas `signatures_%` (array nulo no `FOREACH`)
- `ISS-004` – RLS e `GRANT ALL` deixam qualquer usuário autenticado ver/editar assinaturas e recursos, ignorando `admin_users`
- `ISS-005` – Gráfico de relatórios ordena datas com `new Date()` sobre strings pt-BR, resultando em meses fora de ordem
- `ISS-006`/`ISS-007` – Fluxo de proteção/autenticação dispara `setState`/`signOut` durante o render, gerando efeitos colaterais
- `ISS-010` – Tela “Configurações” exporta/importa apenas `localStorage`, não os dados reais do Supabase (risco de falsa sensação de backup)
- `ISS-012` – Contagem de assinaturas faz chamadas sequenciais (N+1) no dashboard e na listagem, degradando tempo de carregamento

## Observações Complementares
- Scripts CLI (`setup-supabase.js`, `verificar-configuracao.js`) exibem caracteres corrompidos (encoding ANSI ? UTF-8)
- `create-icons.js` está em CommonJS, mas o projeto usa `type: "module"`
- Monitoramento de erros (`src/utils/error-monitoring.tsx`) atualmente só faz `console.log`; envio ao Supabase está comentado
- Bucket `petition-images` precisa ser criado manualmente via painel (funções JS usam apenas a anon key)

## Hipóteses / Pontos para Verificação
- Definir claramente quem deve acessar dados de assinaturas/recursos e refletir isso em políticas RLS
- Validar se o fluxo legado de `localStorage` ainda é necessário ou se deve ser removido
- Confirmar processo desejado para provisionar usuários administradores sem alterar migrações

## Próximos Passos Sugeridos
1. Reordenar/combinar migrações e remover o `INSERT` hardcoded para viabilizar setup automatizado
2. Revisar políticas RLS e RPCs para restringir leitura/escrita a administradores
3. Ajustar componentes (gráficos, rotas protegidas, backups) antes de expor o sistema
4. Gerar snapshot do schema atual (ex.: `supabase db dump`) e documentar o estado real do banco
