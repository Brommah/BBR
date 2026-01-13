"use client"

import { cn } from "@/lib/utils"

/**
 * Base skeleton animation component
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className
      )}
      role="status"
      aria-label="Laden..."
      {...props}
    />
  )
}

/**
 * Skeleton for a single lead card in the pipeline
 */
export function LeadCardSkeleton() {
  return (
    <div 
      className="p-4 bg-card rounded-lg border border-border space-y-3"
      role="status"
      aria-label="Lead kaart laden..."
    >
      {/* Header with badges */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
      </div>
      
      {/* Title */}
      <Skeleton className="h-5 w-3/4" />
      
      {/* Location */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Skeleton for pipeline column
 */
export function PipelineColumnSkeleton({ cardCount = 3 }: { cardCount?: number }) {
  return (
    <div 
      className="flex flex-col gap-3 min-w-[280px] p-4 bg-muted/30 rounded-lg"
      role="status"
      aria-label="Pipeline kolom laden..."
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      
      {/* Cards */}
      {Array.from({ length: cardCount }).map((_, i) => (
        <LeadCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Full pipeline skeleton
 */
export function PipelineSkeleton() {
  return (
    <div 
      className="flex gap-4 overflow-x-auto pb-4"
      role="status"
      aria-label="Pipeline laden..."
      aria-busy="true"
    >
      <PipelineColumnSkeleton cardCount={2} />
      <PipelineColumnSkeleton cardCount={4} />
      <PipelineColumnSkeleton cardCount={3} />
      <PipelineColumnSkeleton cardCount={1} />
      <PipelineColumnSkeleton cardCount={2} />
      <span className="sr-only">Pipeline wordt geladen, even geduld...</span>
    </div>
  )
}

/**
 * Skeleton for dashboard KPI card
 */
export function KpiCardSkeleton() {
  return (
    <div 
      className="p-4 bg-card rounded-lg border border-border space-y-3"
      role="status"
      aria-label="KPI kaart laden..."
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

/**
 * Dashboard skeleton with KPI cards and content
 */
export function DashboardSkeleton() {
  return (
    <div 
      className="space-y-6"
      role="status"
      aria-label="Dashboard laden..."
      aria-busy="true"
    >
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Focus card */}
      <div className="p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      
      {/* Grid layout */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
          
          {/* Queue card */}
          <div className="p-4 bg-card rounded-lg border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Right sidebar */}
        <div className="col-span-4 space-y-4">
          <div className="p-4 bg-card rounded-lg border border-border space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          
          <div className="p-4 bg-card rounded-lg border border-border space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <span className="sr-only">Dashboard wordt geladen, even geduld...</span>
    </div>
  )
}

/**
 * Lead detail skeleton
 */
export function LeadDetailSkeleton() {
  return (
    <div 
      className="space-y-6"
      role="status"
      aria-label="Lead details laden..."
      aria-busy="true"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>
      
      {/* Content grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Main content cards */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-4 bg-card rounded-lg border border-border space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="p-4 bg-card rounded-lg border border-border space-y-3">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <span className="sr-only">Lead details worden geladen, even geduld...</span>
    </div>
  )
}

/**
 * Table skeleton for data tables
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div 
      className="border border-border rounded-lg overflow-hidden"
      role="status"
      aria-label="Tabel laden..."
      aria-busy="true"
    >
      {/* Header */}
      <div className="bg-muted/30 p-3 border-b border-border flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 border-b border-border last:border-0 flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
      
      <span className="sr-only">Tabel wordt geladen, even geduld...</span>
    </div>
  )
}

/**
 * Form skeleton
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div 
      className="space-y-4"
      role="status"
      aria-label="Formulier laden..."
      aria-busy="true"
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
      
      <span className="sr-only">Formulier wordt geladen, even geduld...</span>
    </div>
  )
}

/**
 * Sidebar navigation skeleton
 */
export function SidebarSkeleton() {
  return (
    <div 
      className="w-64 h-screen bg-card border-r border-border p-4 space-y-4"
      role="status"
      aria-label="Navigatie laden..."
    >
      {/* Logo */}
      <Skeleton className="h-10 w-full" />
      
      {/* Nav items */}
      <div className="space-y-1 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Generic content area skeleton
 */
export function ContentSkeleton() {
  return (
    <div 
      className="space-y-4 p-6"
      role="status"
      aria-label="Inhoud laden..."
      aria-busy="true"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-2xl" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-64 w-full" />
      <span className="sr-only">Inhoud wordt geladen, even geduld...</span>
    </div>
  )
}
