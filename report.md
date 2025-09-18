# Auditoria � Gestor de Abaixo-Assinado

## Invent�rio do Estado Atual
- **Stack principal**: React 18 + TypeScript com Vite, Tailwind e Supabase (`package.json`)
- **Scripts npm**: `dev`, `build`, `lint`, `preview`, su�te Jest e scripts utilit�rios `setup`/`check`
- **Estrutura**: `src/` organizado por componentes, p�ginas, hooks, utils; `supabase/migrations` com 8 arquivos SQL; assets PWA em `public/`; scripts auxiliares na raiz
- **Configura��o**: `vite.config.ts`, `tailwind.config.js`, `eslint.config.js`, `jest.config.js`, `netlify.toml` e `tsconfig.*` alinhados a um app SPA
- **Ambiente**: `.env.local` (placeholders) e scripts `setup-supabase.js` / `verificar-configuracao.js` para gera��o/checagem de credenciais
- **Banco de dados**: depend�ncia total das migra��es SQL; n�o h� dump ou snapshot do schema atual, nem seeds de dados

## Principais Achados (ver `issues.csv`)
- `ISS-001` � Ordem dos arquivos SQL impede rodar `supabase migration up` em ambiente limpo (`20250120000000` roda antes de criar `petitions`)
- `ISS-002` � Migra��o de administradores falha ao inserir UUID hardcoded que n�o existe em `auth.users`
- `ISS-003` � Fun��o `add_message_sent_column` quebra quando n�o h� tabelas `signatures_%` (array nulo no `FOREACH`)
- `ISS-004` � RLS e `GRANT ALL` deixam qualquer usu�rio autenticado ver/editar assinaturas e recursos, ignorando `admin_users`
- `ISS-005` � Gr�fico de relat�rios ordena datas com `new Date()` sobre strings pt-BR, resultando em meses fora de ordem
- `ISS-006`/`ISS-007` � Fluxo de prote��o/autentica��o dispara `setState`/`signOut` durante o render, gerando efeitos colaterais
- `ISS-010` � Tela �Configura��es� exporta/importa apenas `localStorage`, n�o os dados reais do Supabase (risco de falsa sensa��o de backup)
- `ISS-012` � Contagem de assinaturas faz chamadas sequenciais (N+1) no dashboard e na listagem, degradando tempo de carregamento

## Observa��es Complementares
- Scripts CLI (`setup-supabase.js`, `verificar-configuracao.js`) exibem caracteres corrompidos (encoding ANSI ? UTF-8)
- `create-icons.js` est� em CommonJS, mas o projeto usa `type: "module"`
- Monitoramento de erros (`src/utils/error-monitoring.tsx`) atualmente s� faz `console.log`; envio ao Supabase est� comentado
- Bucket `petition-images` precisa ser criado manualmente via painel (fun��es JS usam apenas a anon key)

## Hip�teses / Pontos para Verifica��o
- Definir claramente quem deve acessar dados de assinaturas/recursos e refletir isso em pol�ticas RLS
- Validar se o fluxo legado de `localStorage` ainda � necess�rio ou se deve ser removido
- Confirmar processo desejado para provisionar usu�rios administradores sem alterar migra��es

## Pr�ximos Passos Sugeridos
1. Reordenar/combinar migra��es e remover o `INSERT` hardcoded para viabilizar setup automatizado
2. Revisar pol�ticas RLS e RPCs para restringir leitura/escrita a administradores
3. Ajustar componentes (gr�ficos, rotas protegidas, backups) antes de expor o sistema
4. Gerar snapshot do schema atual (ex.: `supabase db dump`) e documentar o estado real do banco
