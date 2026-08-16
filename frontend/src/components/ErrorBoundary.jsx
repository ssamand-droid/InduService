import { Component } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { Button } from '@components/ui'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 p-8">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <FiAlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
              خطای غیرمنتظره
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-2">
              متاسفانه مشکلی در بارگذاری صفحه رخ داده است.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-red-500 mb-6 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={this.handleRetry}>
                تلاش مجدد
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                بازگشت به خانه
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}