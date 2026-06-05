import React from 'react';

const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong.</h1>
      <p className="text-gray-600">Please check the browser console (F12) for error details.</p>
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
