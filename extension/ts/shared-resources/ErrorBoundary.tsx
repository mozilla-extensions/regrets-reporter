import * as React from "react";
import { DisplayError } from "./DisplayError";
import { Sentry } from "./ErrorReporting";

interface ErrorBoundaryState {
  hasError: boolean;
  eventId: null | string;
}

export class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
    Sentry.withScope(scope => {
      scope.setExtras(errorInfo);
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  render() {
    if (this.state.hasError) {
      // Render a fallback UI in case of error
      return <DisplayError eventId={this.state.eventId} />;
    }
    return this.props.children;
  }
}
