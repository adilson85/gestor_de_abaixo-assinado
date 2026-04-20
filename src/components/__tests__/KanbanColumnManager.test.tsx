import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanColumnManager } from '../KanbanColumnManager';
import {
  createKanbanColumn,
  deleteKanbanColumn,
  getGlobalKanbanBoard,
  getKanbanColumns,
  getKanbanColumnTaskCounts,
  reorderKanbanColumns,
  updateKanbanColumn,
} from '../../utils/kanban-storage';

jest.mock('../../utils/kanban-storage', () => ({
  createKanbanColumn: jest.fn(),
  deleteKanbanColumn: jest.fn(),
  getGlobalKanbanBoard: jest.fn(),
  getKanbanColumns: jest.fn(),
  getKanbanColumnTaskCounts: jest.fn(),
  reorderKanbanColumns: jest.fn(),
  updateKanbanColumn: jest.fn(),
}));

const mockedCreateKanbanColumn = createKanbanColumn as jest.MockedFunction<typeof createKanbanColumn>;
const mockedDeleteKanbanColumn = deleteKanbanColumn as jest.MockedFunction<typeof deleteKanbanColumn>;
const mockedGetGlobalKanbanBoard = getGlobalKanbanBoard as jest.MockedFunction<typeof getGlobalKanbanBoard>;
const mockedGetKanbanColumns = getKanbanColumns as jest.MockedFunction<typeof getKanbanColumns>;
const mockedGetKanbanColumnTaskCounts = getKanbanColumnTaskCounts as jest.MockedFunction<
  typeof getKanbanColumnTaskCounts
>;
const mockedReorderKanbanColumns = reorderKanbanColumns as jest.MockedFunction<typeof reorderKanbanColumns>;
const mockedUpdateKanbanColumn = updateKanbanColumn as jest.MockedFunction<typeof updateKanbanColumn>;

const baseColumns = [
  {
    id: 'column-1',
    boardId: 'board-1',
    name: 'Coleta de assinaturas',
    position: 0,
    isActive: true,
    createdAt: new Date('2026-04-20T10:00:00.000Z'),
    updatedAt: new Date('2026-04-20T10:00:00.000Z'),
  },
  {
    id: 'column-2',
    boardId: 'board-1',
    name: 'Validação',
    position: 1,
    isActive: true,
    createdAt: new Date('2026-04-20T10:00:00.000Z'),
    updatedAt: new Date('2026-04-20T10:00:00.000Z'),
  },
];

describe('KanbanColumnManager', () => {
  beforeEach(() => {
    mockedGetGlobalKanbanBoard.mockResolvedValue({
      id: 'board-1',
      petitionId: '',
      name: 'Tarefas Globais',
      createdAt: new Date('2026-04-20T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    });
    mockedGetKanbanColumns.mockResolvedValue(baseColumns);
    mockedGetKanbanColumnTaskCounts.mockResolvedValue({
      'column-1': 2,
      'column-2': 0,
    });
    mockedCreateKanbanColumn.mockResolvedValue({
      id: 'column-3',
      boardId: 'board-1',
      name: 'Mobilização',
      position: 2,
      isActive: true,
      createdAt: new Date('2026-04-20T10:00:00.000Z'),
      updatedAt: new Date('2026-04-20T10:00:00.000Z'),
    });
    mockedUpdateKanbanColumn.mockResolvedValue(true);
    mockedReorderKanbanColumns.mockResolvedValue(true);
    mockedDeleteKanbanColumn.mockResolvedValue({ success: true });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a new column and refreshes the parent state', async () => {
    const user = userEvent.setup();
    const onStructureChanged = jest.fn().mockResolvedValue(undefined);

    render(<KanbanColumnManager onStructureChanged={onStructureChanged} />);

    await screen.findByText('Coleta de assinaturas');

    await user.type(screen.getByPlaceholderText('Ex.: Validação jurídica'), 'Mobilização');
    await user.click(screen.getByRole('button', { name: 'Adicionar coluna' }));

    await waitFor(() => {
      expect(mockedCreateKanbanColumn).toHaveBeenCalledWith('board-1', 'Mobilização');
    });
    expect(onStructureChanged).toHaveBeenCalled();
    expect(screen.getByText('Coluna criada com sucesso.')).toBeInTheDocument();
  });

  it('renames an existing column', async () => {
    const user = userEvent.setup();
    const onStructureChanged = jest.fn().mockResolvedValue(undefined);

    render(<KanbanColumnManager onStructureChanged={onStructureChanged} />);

    await screen.findByText('Coleta de assinaturas');

    await user.click(screen.getAllByRole('button', { name: 'Renomear' })[0]);

    const editInput = screen.getByDisplayValue('Coleta de assinaturas');
    await user.clear(editInput);
    await user.type(editInput, 'Triagem inicial');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(mockedUpdateKanbanColumn).toHaveBeenCalledWith('column-1', { name: 'Triagem inicial' });
    });
    expect(onStructureChanged).toHaveBeenCalled();
  });

  it('reorders columns using the move buttons', async () => {
    const user = userEvent.setup();

    render(<KanbanColumnManager />);

    await screen.findByText('Coleta de assinaturas');

    await user.click(screen.getAllByRole('button', { name: 'Descer' })[0]);

    await waitFor(() => {
      expect(mockedReorderKanbanColumns).toHaveBeenCalledWith('board-1', ['column-2', 'column-1']);
    });
    expect(screen.getByText('Ordem das colunas atualizada com sucesso.')).toBeInTheDocument();
  });

  it('blocks deletion in the UI when the column still has cards', async () => {
    render(<KanbanColumnManager />);

    await screen.findByText('Coleta de assinaturas');

    expect(screen.getAllByRole('button', { name: 'Excluir' })[0]).toBeDisabled();
    expect(screen.getByText('Esvazie esta etapa antes de excluir a coluna.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Excluir' })[1]).toBeEnabled();
  });
});
