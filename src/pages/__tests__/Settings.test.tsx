import React from 'react';
import { render, screen } from '@testing-library/react';
import { Settings } from '../Settings';
import { useAuth } from '../../contexts/AuthContext';
import { buildPermissionMap } from '../../utils/access';
import { getAdminAuditLog } from '../../utils/app-users';
import { getColumnDeadlines, getGlobalKanbanBoard, getKanbanColumns } from '../../utils/kanban-storage';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../components/KanbanColumnManager', () => ({
  KanbanColumnManager: () => <div>Estrutura do Kanban</div>,
}));

jest.mock('../../utils/app-users', () => ({
  getAdminAuditLog: jest.fn(),
}));

jest.mock('../../utils/kanban-storage', () => ({
  getGlobalKanbanBoard: jest.fn(),
  getKanbanColumns: jest.fn(),
  getColumnDeadlines: jest.fn(),
  saveColumnDeadline: jest.fn(),
}));

jest.mock('../../utils/system-management', () => ({
  exportPanelBackup: jest.fn(),
  importPanelBackup: jest.fn(),
  wipePanelData: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedGetAdminAuditLog = getAdminAuditLog as jest.MockedFunction<typeof getAdminAuditLog>;
const mockedGetGlobalKanbanBoard = getGlobalKanbanBoard as jest.MockedFunction<typeof getGlobalKanbanBoard>;
const mockedGetKanbanColumns = getKanbanColumns as jest.MockedFunction<typeof getKanbanColumns>;
const mockedGetColumnDeadlines = getColumnDeadlines as jest.MockedFunction<typeof getColumnDeadlines>;

const createAuthState = (canImplementation: ReturnType<typeof useAuth>['can']): ReturnType<typeof useAuth> => ({
  user: null,
  session: null,
  appUser: null,
  role: 'admin',
  permissions: buildPermissionMap(),
  isAdmin: true,
  canAccessPanel: true,
  loading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  hasRole: jest.fn(() => true),
  can: canImplementation,
  canAny: jest.fn(() => false),
});

describe('Settings page', () => {
  beforeEach(() => {
    mockedGetGlobalKanbanBoard.mockResolvedValue({
      id: 'board-1',
      petitionId: '',
      name: 'Tarefas Globais',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedGetKanbanColumns.mockResolvedValue([]);
    mockedGetColumnDeadlines.mockResolvedValue([]);
    mockedGetAdminAuditLog.mockResolvedValue([]);
  });

  it('hides the column manager when the user lacks kanban.manage_columns', async () => {
    mockedUseAuth.mockReturnValue(
      createAuthState(jest.fn((permission: string) => permission === 'kanban.manage_deadlines'))
    );

    render(<Settings />);

    expect(await screen.findByText('Automacao do Kanban')).toBeInTheDocument();
    expect(screen.queryByText('Estrutura do Kanban')).not.toBeInTheDocument();
  });
});
