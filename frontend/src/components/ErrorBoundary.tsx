import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <p className="text-4xl">😵</p>
            <h1 className="text-xl font-bold">오류가 발생했습니다</h1>
            <p className="text-sm opacity-60">페이지를 새로고침해 주세요.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-accent"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
