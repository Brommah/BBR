"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/**
 * Default query client options optimized for the backoffice app
 */
const queryClientOptions = {
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Exponential backoff for retries
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
}

/**
 * React Query Provider component
 * 
 * Provides the QueryClient to all child components for data fetching
 * and caching capabilities.
 * 
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // Create a new QueryClient instance for each session
  // This prevents data from being shared between different users/sessions
  const [queryClient] = useState(() => new QueryClient(queryClientOptions))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

/**
 * Query keys for type-safe query invalidation
 * 
 * Usage:
 * - queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
 * - queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(id) })
 */
export const queryKeys = {
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.leads.lists(), filters] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leads.details(), id] as const,
  },
  users: {
    all: ['users'] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
  },
  activities: {
    all: ['activities'] as const,
    byLead: (leadId: string) => [...queryKeys.activities.all, 'lead', leadId] as const,
  },
  quotes: {
    all: ['quotes'] as const,
    pending: () => [...queryKeys.quotes.all, 'pending'] as const,
  },
  documents: {
    all: ['documents'] as const,
    byLead: (leadId: string) => [...queryKeys.documents.all, 'lead', leadId] as const,
  },
} as const
