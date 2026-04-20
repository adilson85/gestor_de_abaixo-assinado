import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { AppRole } from '../../types';
import { buildPermissionMap } from '../../utils/access';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

type MockAuthState = ReturnType<typeof useAuth>;
type MockUser = NonNullable<MockAuthState['user']>;

const createAuthState = (overrides?: Partial<MockAuthState>): MockAuthState => ({
  user: null,
  session: null,
  appUser: null,
  role: null,
  permissions: buildPermissionMap(),
  isAdmin: false,
  canAccessPanel: false,
  loading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  hasRole: jest.fn(() => false),
  can: jest.fn(() => false),
  canAny: jest.fn(() => false),
  ...overrides,
});

const renderProtectedRoute = (allowedRoles: AppRole[], initialEntry = '/settings') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Tela de login</div>} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Conteúdo protegido</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated users to the login page', () => {
    mockedUseAuth.mockReturnValue(createAuthState());

    renderProtectedRoute(['admin']);

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('shows a missing-profile message for authenticated users without panel access', () => {
    const mockUser = { id: 'user-1', email: 'operator@example.com' } as unknown as MockUser;

    mockedUseAuth.mockReturnValue(
      createAuthState({
        user: mockUser,
      })
    );

    renderProtectedRoute(['admin']);

    expect(screen.getByText('Acesso indisponível')).toBeInTheDocument();
    expect(screen.getByText(/não possui um perfil interno ativo/i)).toBeInTheDocument();
  });

  it('blocks authenticated users whose role is not sufficient', () => {
    const mockUser = { id: 'user-2', email: 'operator@example.com' } as unknown as MockUser;

    mockedUseAuth.mockReturnValue(
      createAuthState({
        user: mockUser,
        appUser: {
          userId: 'user-2',
          email: 'operator@example.com',
          fullName: 'Operador Teste',
          role: 'operator',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        role: 'operator',
        canAccessPanel: true,
        hasRole: jest.fn(() => false),
      })
    );

    renderProtectedRoute(['admin']);

    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    expect(screen.getByText('Operador', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('Administrador', { selector: 'strong' })).toBeInTheDocument();
  });

  it('renders the protected content when the role is allowed', () => {
    const mockUser = { id: 'user-3', email: 'admin@example.com' } as unknown as MockUser;

    mockedUseAuth.mockReturnValue(
      createAuthState({
        user: mockUser,
        appUser: {
          userId: 'user-3',
          email: 'admin@example.com',
          fullName: 'Admin Teste',
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        role: 'admin',
        isAdmin: true,
        canAccessPanel: true,
        hasRole: jest.fn(() => true),
      })
    );

    renderProtectedRoute(['admin']);

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });
});
