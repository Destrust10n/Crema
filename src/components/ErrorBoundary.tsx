import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside Aetheria ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0a0a0c] text-white select-none">
          <div className="relative max-w-md w-full p-8 rounded-3xl bg-[#141419]/80 border border-white/10 backdrop-blur-2xl shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-medium tracking-tight text-white/90 mb-2 font-sans">
              {this.props.fallbackTitle || 'Interface Refraction Paused'}
            </h2>
            
            <p className="text-sm text-white/50 mb-6 font-sans leading-relaxed">
              A temporary visual or layout exception occurred. Your conversations and credentials are preserved safely in your session.
            </p>

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 text-sm font-medium transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restore Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
