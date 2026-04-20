import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PetitionList } from './pages/PetitionList';
import { CreatePetition } from './pages/CreatePetition';
import { PetitionDetail } from './pages/PetitionDetail';
import { Tasks } from './pages/Tasks';
import { Users as UsersPage } from './pages/Users';
import { Settings } from './pages/Settings';
import { Account } from './pages/Account';
import { PublicPetitionRedirect } from './pages/PublicPetitionRedirect';
import { ErrorBoundary } from './utils/error-monitoring';
import { KANBAN_ROUTE_SCOPES, SETTINGS_ROUTE_PERMISSION_CODES } from './utils/access';

const HomeRedirect: React.FC = () => {
  const { can, canAny } = useAuth();

  if (can('dashboard.view', 'any')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (can('petitions.view', 'any')) {
    return <Navigate to="/petitions" replace />;
  }

  if (can('kanban.view', 'own') || can('kanban.view', 'assigned') || can('kanban.view', 'all')) {
    return <Navigate to="/tasks" replace />;
  }

  if (can('users.view', 'any')) {
    return <Navigate to="/users" replace />;
  }

  if (
    canAny(
      SETTINGS_ROUTE_PERMISSION_CODES.map((code) => ({
        code,
        scopes: ['any'],
      }))
    )
  ) {
    return <Navigate to="/settings" replace />;
  }

  return <Navigate to="/account" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/petition/:slug" element={<PublicPetitionRedirect />} />
              
              {/* Protected application routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomeRedirect />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute requiredPermission={{ code: 'dashboard.view', scopes: ['any'] }}>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/petitions"
                        element={
                          <ProtectedRoute requiredPermission={{ code: 'petitions.view', scopes: ['any'] }}>
                            <PetitionList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/petitions/new"
                        element={
                          <ProtectedRoute requiredPermission={{ code: 'petitions.create', scopes: ['any'] }}>
                            <CreatePetition />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/petitions/:id"
                        element={
                          <ProtectedRoute requiredPermission={{ code: 'petitions.view', scopes: ['any'] }}>
                            <PetitionDetail />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/tasks"
                        element={
                          <ProtectedRoute requiredPermission={{ code: 'kanban.view', scopes: KANBAN_ROUTE_SCOPES }}>
                            <Tasks />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <ProtectedRoute requiredPermission={{ code: 'users.view', scopes: ['any'] }}>
                            <UsersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/account" element={<Account />} />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute
                            requiredAnyPermissions={SETTINGS_ROUTE_PERMISSION_CODES.map((code) => ({
                              code,
                              scopes: ['any'],
                            }))}
                          >
                            <Settings />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
