-- Create kanban_column_deadlines table
-- Esta tabela armazena os prazos configuráveis para cada coluna do Kanban
CREATE TABLE IF NOT EXISTS public.kanban_column_deadlines (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    column_id uuid NOT NULL,
    duration_value integer NOT NULL DEFAULT 30,
    duration_unit text NOT NULL DEFAULT 'days' CHECK (duration_unit IN ('days', 'months', 'years')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_column_deadlines_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_column_deadlines_column_id_fkey FOREIGN KEY (column_id) REFERENCES kanban_columns (id) ON DELETE CASCADE,
    CONSTRAINT kanban_column_deadlines_column_id_key UNIQUE (column_id)
) TABLESPACE pg_default;

-- Create index
CREATE INDEX IF NOT EXISTS idx_kanban_column_deadlines_column_id ON public.kanban_column_deadlines USING btree (column_id);

-- Enable RLS
ALTER TABLE public.kanban_column_deadlines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_column_deadlines FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_column_deadlines FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_column_deadlines FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_column_deadlines FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_kanban_column_deadlines_updated_at 
    BEFORE UPDATE ON public.kanban_column_deadlines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default deadlines for existing columns (if any)
-- Isso será feito via aplicação, mas podemos ter valores padrão aqui se necessário

