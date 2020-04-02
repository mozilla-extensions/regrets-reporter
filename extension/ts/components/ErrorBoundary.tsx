import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <header className="panel-section panel-section-header">
          <div className="icon-section-header">
            <img
              src="../icons/green-extensionsicon.svg"
              width="32"
              height="32"
            />
          </div>
          <div className="text-section-header">
            This extension encountered an error
          </div>
        </header>
      );
    }
    return this.props.children;
  }
}
