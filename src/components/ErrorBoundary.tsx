import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { reportClientError } from "../lib/error-reporter";

export type ErrorBoundaryProps = {
  children: ReactNode;
  scope: "app" | "figure";
  label?: string;
  resetKey?: string;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError({
      source: "react-boundary",
      error,
      boundary: this.props.label ?? this.props.scope,
      componentStack: info.componentStack ?? undefined,
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    const { children, scope, label } = this.props;

    if (error === null) {
      return children;
    }

    if (scope === "figure") {
      return (
        <div className="figure-card figure-error-card" role="alert">
          <strong>{label ?? "Interactive figure"}</strong>
          <p>This figure failed to render. The rest of the article is still readable.</p>
          <p><code>{error.message}</code></p>
          <button type="button" className="btn btn-sm" onClick={this.handleReset}>
            Retry figure
          </button>
        </div>
      );
    }

    return (
      <div className="app-error-shell" role="alert">
        <div className="app-error-card">
          <h1>Something went wrong</h1>
          <p>This page could not display. Try again or reload the page.</p>
          <p><code>{error.message}</code></p>
          <button type="button" className="btn btn-sm" onClick={this.handleReset}>
            Try again
          </button>
          <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <a className="btn btn-sm btn-ghost" href="/research">Back to All Research</a>
        </div>
      </div>
    );
  }
}
