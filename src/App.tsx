import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PetitionList } from './pages/PetitionList';
import { CreatePetition } from './pages/CreatePetition';
import { PetitionDetail } from './pages/PetitionDetail';
import { Tasks } from './pages/Tasks';
import { Settings } from './pages/Settings';
import { ErrorBoundary } from './utils/error-monitoring';

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Login route */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected application routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/petitions" element={<PetitionList />} />
                      <Route path="/petitions/new" element={<CreatePetition />} />
                      <Route path="/petitions/:id" element={<PetitionDetail />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/settings" element={<Settings />} />
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