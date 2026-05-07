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
            <h1 className="text-xl font-bold text-accent-deep">오류가 발생했습니다</h1>
            <p className="text-sm text-gray-500">페이지를 새로고침해 주세요.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-2xl text-sm font-semibold text-white bg-accent hover:bg-accent-deep shadow-button transition"
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
