import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Dashboard error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: "Arial, sans-serif", textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <p style={{ color: "#64748b" }}>{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: "12px 24px", background: "#1d4ed8", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
