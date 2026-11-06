import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { ErrorState } from '../components/ui'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * 路由级错误边界：渲染异常不允许白屏。
 * 捕获后给出明确错误与重试出口；错误详情打进 console 便于定位。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="页面出错了"
          desc={this.state.error.message}
          onRetry={() => {
            this.setState({ error: null })
            window.location.reload()
          }}
        />
      )
    }
    return this.props.children
  }
}
