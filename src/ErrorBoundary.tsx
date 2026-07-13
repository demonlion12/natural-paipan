import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { recordClientError } from './operations';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    recordClientError(error, info.componentStack ?? undefined);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error">
          <strong>页面暂时没有完成加载</strong>
          <p>错误记录已保存在本机。刷新页面通常可以恢复，出生资料不会自动上传。</p>
          <button onClick={() => window.location.reload()} type="button">重新加载</button>
        </main>
      );
    }
    return this.props.children;
  }
}
