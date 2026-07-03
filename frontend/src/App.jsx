import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { ToastProvider, useToast } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Navbar from './components/Navbar/Navbar';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Connections from './pages/Connections/Connections';
import SchemaExplorer from './pages/SchemaExplorer/SchemaExplorer';
import QueryWorkspace from './pages/QueryWorkspace/QueryWorkspace';
import History from './pages/History/History';
import SavedQueries from './pages/SavedQueries/SavedQueries';
import NotFound from './pages/NotFound/NotFound';
import { setToastCallback } from './api/axiosInstance';
import './App.css';

function ToastInitializer({ children }) {
  const { addToast } = useToast();
  useEffect(() => {
    setToastCallback(addToast);
  }, [addToast]);
  return children;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const location = useLocation();
  const hideNav = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';

  return (
    <ConnectionProvider>
      {!hideNav && <Navbar />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schema"
            element={
              <ProtectedRoute>
                <SchemaExplorer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <QueryWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedQueries />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </ConnectionProvider>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <ToastInitializer>
              <AppRoutes />
            </ToastInitializer>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
