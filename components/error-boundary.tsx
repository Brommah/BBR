"use client"

import { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: { componentStack: string }
}

/**
 * Error boundary component to catch and handle React errors gracefully
 * Provides Dutch error messages and recovery options
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    
    this.setState({ errorInfo })
    
    // In production, you would send this to an error tracking service like Sentry
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <Card className="max-w-lg w-full shadow-xl border-destructive/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">
                Er is iets misgegaan
              </CardTitle>
              <CardDescription className="text-base mt-2">
                We hebben een onverwachte fout gedetecteerd. Dit kan gebeuren door een netwerkprobleem of een bug in de applicatie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-mono text-destructive break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReload}
                  className="flex-1 gap-2"
                  variant="default"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Pagina vernieuwen
                </Button>
                <Button 
                  onClick={this.handleReset}
                  className="flex-1 gap-2"
                  variant="outline"
                >
                  Opnieuw proberen
                </Button>
              </div>
              
              <div className="pt-2 border-t">
                <Button 
                  asChild
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground"
                >
                  <Link href="/">
                    <Home className="w-4 h-4" />
                    Terug naar home
                  </Link>
                </Button>
              </div>
              
              <p className="text-xs text-center text-muted-foreground pt-2">
                Als dit probleem blijft optreden, neem contact op met support.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
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
