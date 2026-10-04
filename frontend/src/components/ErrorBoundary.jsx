import React from 'react';

// Fix (Bug #34 - Production-Readiness): Implemented React ErrorBoundary to catch JavaScript runtime errors anywhere
// in the child component tree and display a fallback UI instead of crashing the entire page into a blank white screen.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="state-message error">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
