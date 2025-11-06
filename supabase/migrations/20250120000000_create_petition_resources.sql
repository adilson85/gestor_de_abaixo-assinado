-- Create petition_resources table
CREATE TABLE IF NOT EXISTS public.petition_resources (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    petition_id uuid NOT NULL,
    type text NOT NULL CHECK (type IN ('youtube', 'drive', 'link')),
    title text,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT petition_resources_pkey PRIMARY KEY (id),
    CONSTRAINT petition_resources_petition_id_fkey FOREIGN KEY (petition_id) REFERENCES petitions (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_petition_resources_petition_id ON public.petition_resources USING btree (petition_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_petition_resources_type ON public.petition_resources USING btree (type) TABLESPACE pg_default;

-- Enable Row Level Security (RLS)
ALTER TABLE public.petition_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for petition_resources
CREATE POLICY "Enable read access for all users" ON public.petition_resources FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.petition_resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.petition_resources FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.petition_resources FOR DELETE USING (auth.role() = 'authenticated');

