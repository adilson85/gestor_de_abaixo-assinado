import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './components/AuthProvider';
import RouteGuard from './components/RouteGuard';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PetitionList } from './pages/PetitionList';
import { CreatePetition } from './pages/CreatePetition';
import { PetitionDetail } from './pages/PetitionDetail';
import { Settings } from './pages/Settings';
import { ErrorBoundary } from './utils/error-monitoring';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <RouteGuard>
              <Routes>
                {/* Login route - public */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected application routes */}
                <Route path="/*" element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/petitions" element={<PetitionList />} />
                      <Route path="/petitions/new" element={<CreatePetition />} />
                      <Route path="/petitions/:id" element={<PetitionDetail />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Layout>
                } />
              </Routes>
            </RouteGuard>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;