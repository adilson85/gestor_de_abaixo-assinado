CREATE OR REPLACE FUNCTION public.prevent_kanban_column_delete_with_tasks()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    linked_task_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO linked_task_count
    FROM public.kanban_tasks
    WHERE column_id = OLD.id;

    IF linked_task_count > 0 THEN
        RAISE EXCEPTION 'Nao e possivel excluir a coluna porque ela ainda possui % card(s) vinculados.', linked_task_count
            USING ERRCODE = 'P0001';
    END IF;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_kanban_column_delete_with_tasks ON public.kanban_columns;
CREATE TRIGGER trigger_prevent_kanban_column_delete_with_tasks
    BEFORE DELETE ON public.kanban_columns
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_kanban_column_delete_with_tasks();

CREATE OR REPLACE FUNCTION public.get_kanban_column_task_counts(target_board_id uuid)
RETURNS TABLE(column_id uuid, task_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT (public.has_permission('kanban.manage_columns') OR public.has_permission('kanban.view')) THEN
        RAISE EXCEPTION 'Voce nao tem permissao para consultar a estrutura do Kanban.'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        columns.id AS column_id,
        COUNT(tasks.id)::bigint AS task_count
    FROM public.kanban_columns AS columns
    LEFT JOIN public.kanban_tasks AS tasks
        ON tasks.column_id = columns.id
    WHERE columns.board_id = target_board_id
    GROUP BY columns.id, columns.position
    ORDER BY columns.position;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_kanban_columns(target_board_id uuid, ordered_column_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    expected_count integer;
    provided_count integer;
    distinct_count integer;
BEGIN
    IF NOT public.has_permission('kanban.manage_columns') THEN
        RAISE EXCEPTION 'Voce nao tem permissao para reordenar colunas do Kanban.'
            USING ERRCODE = '42501';
    END IF;

    provided_count := COALESCE(array_length(ordered_column_ids, 1), 0);

    IF provided_count = 0 THEN
        RAISE EXCEPTION 'Envie a ordem completa das colunas do quadro.'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT COUNT(*)
    INTO expected_count
    FROM public.kanban_columns
    WHERE board_id = target_board_id;

    SELECT COUNT(DISTINCT column_id)
    INTO distinct_count
    FROM unnest(ordered_column_ids) AS column_id;

    IF expected_count <> provided_count OR provided_count <> distinct_count THEN
        RAISE EXCEPTION 'A nova ordem das colunas esta incompleta ou invalida.'
            USING ERRCODE = 'P0001';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(ordered_column_ids) AS ordered_id
        LEFT JOIN public.kanban_columns AS columns
            ON columns.id = ordered_id
           AND columns.board_id = target_board_id
        WHERE columns.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Uma ou mais colunas nao pertencem ao quadro informado.'
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.kanban_columns AS columns
    SET position = ordered.new_position - 1
    FROM (
        SELECT ordered_id AS column_id, ordinality AS new_position
        FROM unnest(ordered_column_ids) WITH ORDINALITY AS ordered(ordered_id, ordinality)
    ) AS ordered
    WHERE columns.id = ordered.column_id
      AND columns.board_id = target_board_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_empty_kanban_column(target_column_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_board_id uuid;
    deleted_position integer;
BEGIN
    IF NOT public.has_permission('kanban.manage_columns') THEN
        RAISE EXCEPTION 'Voce nao tem permissao para excluir colunas do Kanban.'
            USING ERRCODE = '42501';
    END IF;

    SELECT board_id, position
    INTO target_board_id, deleted_position
    FROM public.kanban_columns
    WHERE id = target_column_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coluna do Kanban nao encontrada.'
            USING ERRCODE = 'P0001';
    END IF;

    DELETE FROM public.kanban_columns
    WHERE id = target_column_id;

    UPDATE public.kanban_columns
    SET position = position - 1
    WHERE board_id = target_board_id
      AND position > deleted_position;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_kanban_column_task_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_kanban_columns(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_empty_kanban_column(uuid) TO authenticated;
