'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[DashboardErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-white text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-6">{this.state.error}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: '' });
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
