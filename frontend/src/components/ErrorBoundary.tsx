import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-0 p-4">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
      <p className="text-slate-400 mb-6">An unexpected error occurred. Please refresh the page or check the browser console for details.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
