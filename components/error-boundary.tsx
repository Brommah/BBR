"use client"

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import * as Sentry from '@sentry/nextjs'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in child component tree
 * Logs errors and displays fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    
    this.setState({ errorInfo })
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Send error to Sentry in production
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
      tags: {
        errorBoundary: true,
      },
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Er is iets misgegaan</CardTitle>
              <CardDescription>
                We hebben een onverwachte fout gedetecteerd. Probeer de pagina te vernieuwen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error details (only in development or when showDetails is true) */}
              {(process.env.NODE_ENV === 'development' || this.props.showDetails) && this.state.error && (
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs overflow-auto max-h-32">
                  <p className="text-red-600 dark:text-red-400 font-semibold mb-1">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack?.slice(0, 500)}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={this.handleReset}
                >
                  <RefreshCcw className="w-4 h-4" />
                  Probeer opnieuw
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={this.handleReload}
                >
                  <RefreshCcw className="w-4 h-4" />
                  Pagina herladen
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1 gap-2"
                  onClick={this.handleGoHome}
                >
                  <Home className="w-4 h-4" />
                  Naar home
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Bug className="w-3 h-3" />
                  Development mode: Foutdetails zichtbaar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Page-level error boundary wrapper
 * Use this to wrap individual pages/routes
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[PageError]', error.message, errorInfo.componentStack)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Component-level error boundary wrapper
 * Use this to wrap individual components that might fail
 */
export function ComponentErrorBoundary({ 
  children,
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ErrorBoundary
      fallback={fallback || (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            Dit onderdeel kon niet worden geladen.
          </p>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Loading spinner component for async operations
 */
export function LoadingSpinner({ 
  message = "Laden...",
  size = "default"
}: { 
  message?: string
  size?: "small" | "default" | "large"
}) {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-8 h-8",
    large: "w-12 h-12"
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-primary border-t-transparent`} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  )
}

/**
 * Full-page loading state
 */
export function PageLoader({ message = "Laden..." }: { message?: string }) {
  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
      <LoadingSpinner size="large" message={message} />
    </div>
  )
}

/**
 * Empty state component
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
