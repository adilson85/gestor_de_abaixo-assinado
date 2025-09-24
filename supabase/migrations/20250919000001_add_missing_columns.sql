-- Adicionar colunas faltantes para compatibilidade com Supabase online
-- Esta migração adiciona campos sem perder dados existentes

-- 1. Adicionar coluna is_global na tabela kanban_boards
ALTER TABLE public.kanban_boards 
ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT true;

-- 2. Adicionar colunas faltantes na tabela kanban_tasks
ALTER TABLE public.kanban_tasks 
ADD COLUMN IF NOT EXISTS board_id uuid;

ALTER TABLE public.kanban_tasks 
ADD COLUMN IF NOT EXISTS petition_id uuid;

ALTER TABLE public.kanban_tasks 
ADD COLUMN IF NOT EXISTS priority character varying DEFAULT 'medium';

ALTER TABLE public.kanban_tasks 
ADD COLUMN IF NOT EXISTS created_by uuid;

-- 3. Adicionar constraint de prioridade (remover se existir e recriar)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kanban_tasks_priority_check') THEN
        ALTER TABLE public.kanban_tasks DROP CONSTRAINT kanban_tasks_priority_check;
    END IF;
    
    ALTER TABLE public.kanban_tasks 
    ADD CONSTRAINT kanban_tasks_priority_check 
    CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying]::text[]));
END $$;

-- 4. Atualizar tarefas existentes com valores padrão
UPDATE public.kanban_tasks 
SET board_id = (SELECT id FROM public.kanban_boards LIMIT 1)
WHERE board_id IS NULL;

UPDATE public.kanban_tasks 
SET priority = 'medium'
WHERE priority IS NULL;

UPDATE public.kanban_tasks 
SET created_by = (SELECT id FROM auth.users LIMIT 1)
WHERE created_by IS NULL;

-- 5. Adicionar foreign keys após popular os dados
ALTER TABLE public.kanban_tasks 
ADD CONSTRAINT IF NOT EXISTS kanban_tasks_board_id_fkey 
FOREIGN KEY (board_id) REFERENCES public.kanban_boards(id) ON DELETE CASCADE;

ALTER TABLE public.kanban_tasks 
ADD CONSTRAINT IF NOT EXISTS kanban_tasks_petition_id_fkey 
FOREIGN KEY (petition_id) REFERENCES public.petitions(id) ON DELETE SET NULL;

-- 6. Criar tabelas extras que existem no online
CREATE TABLE IF NOT EXISTS public.kanban_labels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL,
  name character varying NOT NULL,
  color character varying NOT NULL DEFAULT '#3B82F6',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kanban_labels_pkey PRIMARY KEY (id),
  CONSTRAINT kanban_labels_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.kanban_boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.kanban_task_labels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  label_id uuid NOT NULL,
  CONSTRAINT kanban_task_labels_pkey PRIMARY KEY (id),
  CONSTRAINT kanban_task_labels_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.kanban_tasks(id) ON DELETE CASCADE,
  CONSTRAINT kanban_task_labels_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.kanban_labels(id) ON DELETE CASCADE
);

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_board_id ON public.kanban_tasks USING btree (board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_position ON public.kanban_tasks USING btree (column_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_due_date ON public.kanban_tasks USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_archived ON public.kanban_tasks USING btree (is_archived);

-- 8. Enable RLS nas novas tabelas
ALTER TABLE public.kanban_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_task_labels ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS para as novas tabelas
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_labels 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.kanban_labels 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.kanban_labels 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.kanban_labels 
FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.kanban_task_labels 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.kanban_task_labels 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.kanban_task_labels 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.kanban_task_labels 
FOR DELETE USING (auth.role() = 'authenticated');
