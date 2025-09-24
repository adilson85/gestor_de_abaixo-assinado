-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create petitions table
CREATE TABLE IF NOT EXISTS public.petitions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    location text,
    collection_date date,
    responsible text,
    table_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    image_url text,
    available_online boolean DEFAULT false,
    CONSTRAINT petitions_pkey PRIMARY KEY (id),
    CONSTRAINT petitions_slug_key UNIQUE (slug),
    CONSTRAINT petitions_table_name_key UNIQUE (table_name)
) TABLESPACE pg_default;

-- Create signatures table
CREATE TABLE IF NOT EXISTS public.signatures (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    petition_id uuid NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    street text,
    neighborhood text,
    city text,
    state text,
    zip_code text,
    mensagem_enviada boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT signatures_pkey PRIMARY KEY (id),
    CONSTRAINT signatures_petition_id_fkey FOREIGN KEY (petition_id) REFERENCES petitions (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for signatures
CREATE INDEX IF NOT EXISTS idx_signatures_petition_id ON public.signatures USING btree (petition_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_signatures_phone ON public.signatures USING btree (phone) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_signatures_created_at ON public.signatures USING btree (created_at) TABLESPACE pg_default;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_users_pkey PRIMARY KEY (id),
    CONSTRAINT admin_users_user_id_key UNIQUE (user_id),
    CONSTRAINT admin_users_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- Create kanban_boards table
CREATE TABLE IF NOT EXISTS public.kanban_boards (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(255) NOT NULL DEFAULT 'Tarefas Globais'::character varying,
    is_global boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_boards_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create kanban_columns table
CREATE TABLE IF NOT EXISTS public.kanban_columns (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    board_id uuid NOT NULL,
    name text NOT NULL,
    position integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_columns_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_columns_board_id_fkey FOREIGN KEY (board_id) REFERENCES kanban_boards (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create kanban_tasks table
CREATE TABLE IF NOT EXISTS public.kanban_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    board_id uuid NOT NULL,
    column_id uuid NOT NULL,
    petition_id uuid,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'medium',
    position integer NOT NULL DEFAULT 0,
    due_date timestamp with time zone,
    is_archived boolean DEFAULT false,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_tasks_board_id_fkey FOREIGN KEY (board_id) REFERENCES kanban_boards (id) ON DELETE CASCADE,
    CONSTRAINT kanban_tasks_column_id_fkey FOREIGN KEY (column_id) REFERENCES kanban_columns (id) ON DELETE CASCADE,
    CONSTRAINT kanban_tasks_petition_id_fkey FOREIGN KEY (petition_id) REFERENCES petitions (id) ON DELETE SET NULL,
    CONSTRAINT kanban_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create kanban_task_assignees table
CREATE TABLE IF NOT EXISTS public.kanban_task_assignees (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_task_assignees_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_task_assignees_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create kanban_checklists table
CREATE TABLE IF NOT EXISTS public.kanban_checklists (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    title text NOT NULL,
    position integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_checklists_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_checklists_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create kanban_checklist_items table
CREATE TABLE IF NOT EXISTS public.kanban_checklist_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    checklist_id uuid NOT NULL,
    title text NOT NULL,
    is_completed boolean DEFAULT false,
    position integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_checklist_items_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES kanban_checklists (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create kanban_attachments table
CREATE TABLE IF NOT EXISTS public.kanban_attachments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    file_type text,
    file_size integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_attachments_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create kanban_comments table
CREATE TABLE IF NOT EXISTS public.kanban_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_comments_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE,
    CONSTRAINT kanban_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create kanban_activities table
CREATE TABLE IF NOT EXISTS public.kanban_activities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kanban_activities_pkey PRIMARY KEY (id),
    CONSTRAINT kanban_activities_task_id_fkey FOREIGN KEY (task_id) REFERENCES kanban_tasks (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON public.kanban_columns USING btree (board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_column_id ON public.kanban_tasks USING btree (column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_board_id ON public.kanban_tasks USING btree (board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_position ON public.kanban_tasks USING btree (column_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_due_date ON public.kanban_tasks USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_archived ON public.kanban_tasks USING btree (is_archived);
CREATE INDEX IF NOT EXISTS idx_kanban_task_assignees_task_id ON public.kanban_task_assignees USING btree (task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_checklists_task_id ON public.kanban_checklists USING btree (task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_checklist_items_checklist_id ON public.kanban_checklist_items USING btree (checklist_id);
CREATE INDEX IF NOT EXISTS idx_kanban_attachments_task_id ON public.kanban_attachments USING btree (task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_comments_task_id ON public.kanban_comments USING btree (task_id);
CREATE INDEX IF NOT EXISTS idx_kanban_activities_task_id ON public.kanban_activities USING btree (task_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for petitions
CREATE POLICY "Enable read access for all users" ON public.petitions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.petitions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.petitions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.petitions FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for signatures
CREATE POLICY "Enable read access for all users" ON public.signatures FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.signatures FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.signatures FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.signatures FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for admin_users
CREATE POLICY "Enable read access for authenticated users" ON public.admin_users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.admin_users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.admin_users FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.admin_users FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for kanban_boards
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_boards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_boards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_boards FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_boards FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for kanban_columns
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_columns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_columns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_columns FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_columns FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for kanban_tasks
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_tasks FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for kanban_task_assignees
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_task_assignees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_task_assignees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_task_assignees FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_task_assignees FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for kanban_checklists
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_checklists FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_checklists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_checklists FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_checklists FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for kanban_checklist_items
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_checklist_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_checklist_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_checklist_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_checklist_items FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for kanban_attachments
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_attachments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_attachments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_attachments FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for kanban_comments
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for own comments" ON public.kanban_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Enable delete for own comments" ON public.kanban_comments FOR DELETE USING (auth.uid() = author_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_kanban_boards_updated_at 
    BEFORE UPDATE ON public.kanban_boards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_columns_updated_at 
    BEFORE UPDATE ON public.kanban_columns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_tasks_updated_at 
    BEFORE UPDATE ON public.kanban_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_comments_updated_at 
    BEFORE UPDATE ON public.kanban_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for kanban_activities
CREATE POLICY "Enable read access for authenticated users" ON public.kanban_activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.kanban_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.kanban_activities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.kanban_activities FOR DELETE USING (auth.role() = 'authenticated');

