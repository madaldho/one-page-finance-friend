import React from 'react';
import { Button } from './ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h1>
              <p className="text-gray-600 mb-6">
                Aplikasi mengalami masalah yang tidak terduga. Silakan muat ulang halaman.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-4 p-3 bg-gray-100 rounded text-left text-sm text-gray-700">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Muat Ulang Halaman
                </Button>
                <Button 
                  onClick={() => {
                    // Clear localStorage and sessionStorage
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Reset dan Kembali ke Beranda
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;