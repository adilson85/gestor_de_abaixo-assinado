-- Criar tabelas para o sistema Kanban

-- Tabela de boards (quadros) - um global para todos os abaixo-assinados
CREATE TABLE kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL DEFAULT 'Tarefas Globais',
  is_global BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de colunas do Kanban
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tarefas
CREATE TABLE kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  petition_id UUID REFERENCES petitions(id) ON DELETE SET NULL, -- Associa tarefa a um abaixo-assinado específico
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  position INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de responsáveis (relação N:N entre tarefas e usuários)
CREATE TABLE kanban_task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Tabela de etiquetas
CREATE TABLE kanban_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Cor em hex
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relação entre tarefas e etiquetas (N:N)
CREATE TABLE kanban_task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES kanban_labels(id) ON DELETE CASCADE,
  UNIQUE(task_id, label_id)
);

-- Tabela de checklists
CREATE TABLE kanban_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens do checklist
CREATE TABLE kanban_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES kanban_checklists(id) ON DELETE CASCADE,
  text VARCHAR(500) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de anexos
CREATE TABLE kanban_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('link', 'file')),
  url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de comentários
CREATE TABLE kanban_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de log de atividades
CREATE TABLE kanban_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES kanban_tasks(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_kanban_boards_petition_id ON kanban_boards(petition_id);
CREATE INDEX idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX idx_kanban_columns_position ON kanban_columns(board_id, position);
CREATE INDEX idx_kanban_tasks_board_id ON kanban_tasks(board_id);
CREATE INDEX idx_kanban_tasks_column_id ON kanban_tasks(column_id);
CREATE INDEX idx_kanban_tasks_position ON kanban_tasks(column_id, position);
CREATE INDEX idx_kanban_tasks_due_date ON kanban_tasks(due_date);
CREATE INDEX idx_kanban_tasks_archived ON kanban_tasks(is_archived);
CREATE INDEX idx_kanban_tasks_search ON kanban_tasks USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_kanban_task_assignees_task_id ON kanban_task_assignees(task_id);
CREATE INDEX idx_kanban_task_assignees_user_id ON kanban_task_assignees(user_id);
CREATE INDEX idx_kanban_task_labels_task_id ON kanban_task_labels(task_id);
CREATE INDEX idx_kanban_task_labels_label_id ON kanban_task_labels(label_id);
CREATE INDEX idx_kanban_checklists_task_id ON kanban_checklists(task_id);
CREATE INDEX idx_kanban_checklist_items_checklist_id ON kanban_checklist_items(checklist_id);
CREATE INDEX idx_kanban_attachments_task_id ON kanban_attachments(task_id);
CREATE INDEX idx_kanban_comments_task_id ON kanban_comments(task_id);
CREATE INDEX idx_kanban_activities_task_id ON kanban_activities(task_id);

-- RLS (Row Level Security)
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_activities ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas admin podem acessar o board global
CREATE POLICY "kanban_boards_access" ON kanban_boards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "kanban_columns_access" ON kanban_columns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_boards kb
      WHERE kb.id = kanban_columns.board_id
      AND EXISTS (
        SELECT 1 FROM admin_users au
        WHERE au.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "kanban_tasks_access" ON kanban_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_boards kb
      WHERE kb.id = kanban_tasks.board_id
      AND EXISTS (
        SELECT 1 FROM admin_users au
        WHERE au.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "kanban_task_assignees_access" ON kanban_task_assignees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_tasks kt
      JOIN kanban_boards kb ON kb.id = kt.board_id
      JOIN petitions p ON p.id = kb.petition_id
      WHERE kt.id = kanban_task_assignees.task_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM admin_users au
          WHERE au.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "kanban_labels_access" ON kanban_labels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_boards kb
      JOIN petitions p ON p.id = kb.petition_id
      WHERE kb.id = kanban_labels.board_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM admin_users au
          WHERE au.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "kanban_task_labels_access" ON kanban_task_labels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_tasks kt
      JOIN kanban_boards kb ON kb.id = kt.board_id
      JOIN petitions p ON p.id = kb.petition_id
      WHERE kt.id = kanban_task_labels.task_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM admin_users au
          WHERE au.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "kanban_checklists_access" ON kanban_checklists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_tasks kt
      JOIN kanban_boards kb ON kb.id = kt.board_id
      JOIN petitions p ON p.id = kb.petition_id
      WHERE kt.id = kanban_checklists.task_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM admin_users au
          WHERE au.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "kanban_checklist_items_access" ON kanban_checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_checklists kc
      JOIN kanban_tasks kt ON kt.id = kc.task_id
      JOIN kanban_boards kb ON kb.id = kt.board_id
      JOIN petitions p ON p.id = kb.petition_id
      WHERE kc.id = kanban_checklist_items.checklist_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM admin_users au
          WHERE au.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "kanban_attachments_access" ON kanban_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_tasks kt
      JOIN kanban_boards kb ON kb.id = kt.board_id
      JOIN petitions p ON p.id = kb.petition_id
      WHERE kt.id = kanban_attachments.task_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM admin_users au
          WHERE au.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "kanban_comments_access" ON kanban_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_tasks kt
      JOIN kanban_boards kb ON kb.id = kt.board_id
      JOIN petitions p ON p.id = kb.petition_id
      WHERE kt.id = kanban_comments.task_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM admin_users au
          WHERE au.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "kanban_activities_access" ON kanban_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kanban_tasks kt
      JOIN kanban_boards kb ON kb.id = kt.board_id
      JOIN petitions p ON p.id = kb.petition_id
      WHERE kt.id = kanban_activities.task_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM admin_users au
          WHERE au.user_id = auth.uid()
        )
      )
    )
  );

-- Função para criar board global padrão (executar manualmente)
CREATE OR REPLACE FUNCTION create_global_kanban_board()
RETURNS UUID AS $$
DECLARE
  board_id UUID;
  column_names TEXT[] := ARRAY[
    'Coleta de assinaturas',
    'Gravação de vídeo', 
    'Disparo de mensagem',
    'Apresentar ao poder público',
    'Aguardar retorno',
    'Dar retorno à população',
    'Atividades extras'
  ];
  column_name TEXT;
  column_position INTEGER := 0;
BEGIN
  -- Verificar se já existe um board global
  SELECT id INTO board_id FROM kanban_boards WHERE is_global = TRUE LIMIT 1;
  
  IF board_id IS NULL THEN
    -- Criar o board global
    INSERT INTO kanban_boards (name, is_global)
    VALUES ('Tarefas Globais', TRUE)
    RETURNING id INTO board_id;
    
    -- Criar colunas padrão
    FOREACH column_name IN ARRAY column_names
    LOOP
      INSERT INTO kanban_columns (board_id, name, position)
      VALUES (board_id, column_name, column_position);
      
      column_position := column_position + 1;
    END LOOP;
  END IF;
  
  RETURN board_id;
END;
$$ LANGUAGE plpgsql;

-- Executar a função para criar o board global
SELECT create_global_kanban_board();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_kanban_boards_updated_at
  BEFORE UPDATE ON kanban_boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_columns_updated_at
  BEFORE UPDATE ON kanban_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_tasks_updated_at
  BEFORE UPDATE ON kanban_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_comments_updated_at
  BEFORE UPDATE ON kanban_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
