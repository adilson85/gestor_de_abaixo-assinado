-- ============================================================================
-- SCRIPT DE INICIALIZAÇÃO DO KANBAN BOARD
-- ============================================================================
-- Este script deve ser executado no Supabase Dashboard > SQL Editor
-- Ele cria o board global e as colunas padrão necessárias para o Kanban
-- ============================================================================

-- 1. Criar o Board Global
INSERT INTO public.kanban_boards (id, name, is_global, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Tarefas Globais',
  true,
  now(),
  now()
)
ON CONFLICT DO NOTHING
RETURNING id, name;

-- 2. Criar as Colunas Padrão
-- Primeiro, vamos armazenar o board_id em uma variável
DO $$
DECLARE
  v_board_id uuid;
BEGIN
  -- Buscar o ID do board global
  SELECT id INTO v_board_id
  FROM public.kanban_boards
  WHERE is_global = true
  LIMIT 1;

  -- Se o board não existir, criar
  IF v_board_id IS NULL THEN
    INSERT INTO public.kanban_boards (name, is_global, created_at, updated_at)
    VALUES ('Tarefas Globais', true, now(), now())
    RETURNING id INTO v_board_id;

    RAISE NOTICE 'Board criado com ID: %', v_board_id;
  ELSE
    RAISE NOTICE 'Board já existe com ID: %', v_board_id;
  END IF;

  -- Criar as 7 colunas padrão
  INSERT INTO public.kanban_columns (board_id, name, position, is_active, created_at, updated_at)
  VALUES
    (v_board_id, 'Coleta de assinaturas', 0, true, now(), now()),
    (v_board_id, 'Gravação de vídeo', 1, true, now(), now()),
    (v_board_id, 'Disparo de mensagem', 2, true, now(), now()),
    (v_board_id, 'Apresentar ao poder público', 3, true, now(), now()),
    (v_board_id, 'Aguardar retorno', 4, true, now(), now()),
    (v_board_id, 'Dar retorno à população', 5, true, now(), now()),
    (v_board_id, 'Atividades extras', 6, true, now(), now())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Colunas criadas com sucesso!';
END $$;

-- 3. Verificar o resultado
SELECT
  'Board criado:' as tipo,
  b.id,
  b.name,
  b.is_global,
  (SELECT count(*) FROM public.kanban_columns WHERE board_id = b.id) as total_colunas
FROM public.kanban_boards b
WHERE b.is_global = true;

-- 4. Listar as colunas criadas
SELECT
  'Colunas:' as tipo,
  c.name as nome_coluna,
  c.position as posicao,
  c.is_active as ativa
FROM public.kanban_columns c
JOIN public.kanban_boards b ON c.board_id = b.id
WHERE b.is_global = true
ORDER BY c.position;
