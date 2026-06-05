import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { useAuthStore } from './stores/authStore';
import { ProjectDashboard } from './features/projects/ProjectDashboard';
import { KanbanBoard } from './features/tasks/KanbanBoard';
import { AIAssistant } from './features/ai/AIAssistant';
import { DashboardAnalytics } from './features/analytics/DashboardAnalytics';
import ErrorBoundary from './components/ErrorBoundary';

import { Sidebar } from './components/Sidebar';

// Layout Wrapper
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <div className="p-8">Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
};

function App() {
  const { fetchUser, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      // Use useAuthStore.setState directly to update loading if no token
      useAuthStore.setState({ isLoading: false });
    }
  }, [token, fetchUser]);

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <ProjectDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <DashboardAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:projectId/board" 
            element={
              <ProtectedRoute>
                <KanbanBoard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai" 
            element={
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
