import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { useAuthStore } from './stores/authStore';
import { ProjectDashboard } from './features/projects/ProjectDashboard';
import { KanbanBoard } from './features/tasks/KanbanBoard';
import { AIAssistant } from './features/ai/AIAssistant';
import { DashboardAnalytics } from './features/analytics/DashboardAnalytics';
import { TeamMembersPage } from './features/teams/TeamMembersPage';
import ErrorBoundary from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-surface-0 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen bg-surface-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading session...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <Layout>{children}</Layout>;
};

function App() {
  const { fetchUser, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  }, [token, fetchUser]);

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><DashboardAnalytics /></ProtectedRoute>} />
          <Route path="/projects/:projectId/board" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamMembersPage /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
