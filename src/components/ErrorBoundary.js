import React from 'react';

// Error Boundary
// A React class component that catches JavaScript errors anywhere in its
// child component tree. Instead of the whole app crashing to a white screen,
// the user sees a friendly message with a way to recover.
// (Error boundaries must be class components — hooks cannot catch render errors.)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Called when any child component throws during render.
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Log the error details for debugging.
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '20px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '8px' }}>⚠️</div>
          <h2>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', background: '#4a6cf7', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
