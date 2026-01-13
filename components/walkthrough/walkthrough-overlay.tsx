"use client"

import { useEffect, useMemo, useState, useCallback, useSyncExternalStore } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  useWalkthroughStore, 
  WALKTHROUGH_STEPS, 
  type WalkthroughStep 
} from "@/lib/walkthrough"
import { useAuthStore } from "@/lib/auth"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  Home,
  ListTodo,
  Kanban,
  Info,
  FileText,
  Calculator,
  Inbox,
  Trophy,
  Shield,
  Keyboard,
  PartyPopper,
  Lightbulb,
  SkipForward,
  Check,
  Play
} from "lucide-react"

// Map icon names to components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Menu,
  Home,
  ListTodo,
  Kanban,
  Info,
  FileText,
  Calculator,
  Inbox,
  Trophy,
  Shield,
  Keyboard,
  PartyPopper
}

/**
 * Get the icon component for a step
 */
function StepIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Sparkles
  return <Icon className={className} />
}

/**
 * Calculate tooltip position based on target element and preferred placement
 */
function calculateTooltipPosition(
  targetRect: DOMRect | null,
  tooltipWidth: number,
  tooltipHeight: number,
  placement: WalkthroughStep['position']
): { top: number; left: number; arrowPosition: 'top' | 'bottom' | 'left' | 'right' | null } {
  // Default to center if no target
  if (!targetRect || placement === 'center') {
    return {
      top: Math.max(16, (window.innerHeight - tooltipHeight) / 2),
      left: Math.max(16, (window.innerWidth - tooltipWidth) / 2),
      arrowPosition: null
    }
  }

  const padding = 16
  const arrowSize = 12
  let top = 0
  let left = 0
  let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top'

  switch (placement) {
    case 'bottom':
      top = targetRect.bottom + padding + arrowSize
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
      arrowPosition = 'top'
      break
    case 'top':
      top = targetRect.top - tooltipHeight - padding - arrowSize
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
      arrowPosition = 'bottom'
      break
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
      left = targetRect.right + padding + arrowSize
      arrowPosition = 'left'
      break
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2
      left = targetRect.left - tooltipWidth - padding - arrowSize
      arrowPosition = 'right'
      break
    default:
      top = targetRect.bottom + padding + arrowSize
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
      arrowPosition = 'top'
  }

  // Keep tooltip within viewport
  const viewportPadding = 16
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipWidth - viewportPadding))
  top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipHeight - viewportPadding))

  return { top, left, arrowPosition }
}

/**
 * Spotlight backdrop with optional cutout for target element
 */
function SpotlightBackdrop({ 
  targetRect, 
  onClick 
}: { 
  targetRect: DOMRect | null
  onClick: () => void 
}) {
  // Simple dark overlay when no target or target not found
  if (!targetRect) {
    return (
      <div 
        className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClick}
      />
    )
  }

  const padding = 8
  const borderRadius = 12

  return (
    <>
      {/* SVG mask with cutout */}
      <svg 
        className="fixed inset-0 w-full h-full z-[99] pointer-events-none animate-fade-in"
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
              x={targetRect.left - padding}
              y={targetRect.top - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx={borderRadius}
              ry={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Clickable backdrop */}
      <div 
        className="fixed inset-0 z-[98]"
        onClick={onClick}
      />

      {/* Highlight ring */}
      <div
        className="fixed z-[100] pointer-events-none rounded-xl ring-2 ring-primary animate-pulse"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
        }}
      />
    </>
  )
}

/**
 * Tooltip content card
 */
function TooltipCard({ 
  step, 
  stepNumber, 
  totalSteps,
  isFirstStep,
  isLastStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  onGoToStep,
  filteredSteps,
  position,
  arrowPosition
}: { 
  step: WalkthroughStep
  stepNumber: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onComplete: () => void
  onGoToStep: (index: number) => void
  filteredSteps: WalkthroughStep[]
  position: { top: number; left: number }
  arrowPosition: 'top' | 'bottom' | 'left' | 'right' | null
}) {
  return (
    <div 
      className="fixed z-[101] w-80 max-w-[calc(100vw-32px)] animate-fade-in"
      style={{ top: position.top, left: position.left }}
    >
      {/* Arrow indicator */}
      {arrowPosition && (
        <div 
          className={`absolute w-3 h-3 bg-card border rotate-45 ${
            arrowPosition === 'top' ? '-top-1.5 left-1/2 -translate-x-1/2 border-t border-l' :
            arrowPosition === 'bottom' ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r' :
            arrowPosition === 'left' ? '-left-1.5 top-1/2 -translate-y-1/2 border-l border-b' :
            '-right-1.5 top-1/2 -translate-y-1/2 border-r border-t'
          } border-border`}
        />
      )}

      <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="h-1 bg-gradient-to-r from-primary via-amber-500 to-primary" />

        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center shrink-0">
              <StepIcon name={step.icon} className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                  {stepNumber + 1}/{totalSteps}
                </Badge>
                {step.adminOnly && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Admin
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-foreground leading-tight">
                {step.title}
              </h3>
            </div>
            <button
              onClick={onSkip}
              className="p-1 rounded-md hover:bg-muted transition-colors -mt-1 -mr-1"
              title="Overslaan (Esc)"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {step.description}
          </p>

          {/* Tips */}
          {step.tips && step.tips.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-2.5 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                Tips
              </div>
              <ul className="space-y-1">
                {step.tips.slice(0, 3).map((tip, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                    <span className="line-clamp-2">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1 mb-3">
            {filteredSteps.map((s, index) => (
              <button
                key={s.id}
                onClick={() => onGoToStep(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === stepNumber 
                    ? 'bg-primary scale-125' 
                    : index < stepNumber 
                      ? 'bg-primary/50' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                title={s.title}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isFirstStep ? onSkip : onPrevious}
              className="h-8 px-2 text-xs gap-1"
            >
              {isFirstStep ? (
                <>
                  <SkipForward className="w-3 h-3" />
                  Overslaan
                </>
              ) : (
                <>
                  <ChevronLeft className="w-3 h-3" />
                  Vorige
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={isLastStep ? onComplete : onNext}
              className={`h-8 px-3 text-xs gap-1 ${
                isLastStep 
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600' 
                  : ''
              }`}
            >
              {isLastStep ? (
                <>
                  <Check className="w-3 h-3" />
                  Klaar!
                </>
              ) : (
                <>
                  Volgende
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="text-center mt-2 text-[10px] text-white/60">
        <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">←</kbd>
        <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px] mx-1">→</kbd>
        <span className="mx-1">navigeren</span>
        <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">Esc</kbd>
        <span className="ml-1">sluiten</span>
      </div>
    </div>
  )
}

/**
 * Main Walkthrough Overlay Component
 */
// Hook for hydration detection without setState in effect
function useOverlayHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export function WalkthroughOverlay() {
  const router = useRouter()
  const pathname = usePathname()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const mounted = useOverlayHydrated()
  
  const { 
    isActive, 
    currentStep, 
    nextStep, 
    previousStep, 
    goToStep,
    skipWalkthrough, 
    completeWalkthrough 
  } = useWalkthroughStore()
  
  const { isAdmin } = useAuthStore()
  
  // Get filtered steps based on user role
  const filteredSteps = useMemo(() => {
    return WALKTHROUGH_STEPS.filter(step => {
      if (step.adminOnly && !isAdmin()) return false
      return true
    })
  }, [isAdmin])
  
  const step = filteredSteps[currentStep]
  const totalSteps = filteredSteps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  // Find and track target element
  const updateTargetRect = useCallback(() => {
    if (!step?.highlightSelector) {
      setTargetRect(null)
      return
    }

    try {
      const element = document.querySelector(step.highlightSelector)
      if (element) {
        const rect = element.getBoundingClientRect()
        setTargetRect(rect)
        
        // Scroll element into view if needed
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        setTargetRect(null)
      }
    } catch {
      setTargetRect(null)
    }
  }, [step])

  // Calculate tooltip position
  const tooltipPosition = useMemo(() => {
    if (!mounted) return { top: 100, left: 100, arrowPosition: null as 'top' | 'bottom' | 'left' | 'right' | null }
    
    const tooltipWidth = 320
    const tooltipHeight = 380
    return calculateTooltipPosition(
      targetRect,
      tooltipWidth,
      tooltipHeight,
      step?.position
    )
  }, [targetRect, step, mounted])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipWalkthrough()
          break
        case 'ArrowRight':
        case 'Enter':
          if (!isLastStep) nextStep()
          else completeWalkthrough()
          break
        case 'ArrowLeft':
          if (!isFirstStep) previousStep()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isFirstStep, isLastStep, nextStep, previousStep, skipWalkthrough, completeWalkthrough])

  // Navigate to step's route and find target element
  useEffect(() => {
    if (!isActive || !step || !mounted) return
    
    // Don't auto-navigate from login page
    const isOnLoginPage = pathname === '/login' || pathname?.startsWith('/login')
    
    if (step.route && step.route !== '/leads' && pathname !== step.route && !isOnLoginPage) {
      router.push(step.route)
      const timer = setTimeout(updateTargetRect, 500)
      return () => clearTimeout(timer)
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- necessary for positioning calculation
      updateTargetRect()
    }
  }, [isActive, step, pathname, router, updateTargetRect, mounted])

  // Update on resize/scroll
  useEffect(() => {
    if (!isActive || !mounted) return

    const handleUpdate = () => updateTargetRect()
    
    window.addEventListener('resize', handleUpdate)
    window.addEventListener('scroll', handleUpdate, true)
    
    return () => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('scroll', handleUpdate, true)
    }
  }, [isActive, updateTargetRect, mounted])

  // Don't render on server or when not mounted/active
  if (!mounted || !isActive || !step) return null

  return createPortal(
    <>
      <SpotlightBackdrop 
        targetRect={targetRect} 
        onClick={skipWalkthrough} 
      />
      <TooltipCard
        step={step}
        stepNumber={currentStep}
        totalSteps={totalSteps}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipWalkthrough}
        onComplete={completeWalkthrough}
        onGoToStep={goToStep}
        filteredSteps={filteredSteps}
        position={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        arrowPosition={tooltipPosition.arrowPosition}
      />
    </>,
    document.body
  )
}

/**
 * Hook to detect client-side hydration
 */
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

/**
 * Walkthrough Trigger Button
 */
export function WalkthroughTrigger() {
  const hydrated = useHydrated()
  const { hasCompleted, hasSkipped, startWalkthrough, isActive } = useWalkthroughStore()

  if (!hydrated) return null
  if (isActive || (!hasCompleted && !hasSkipped)) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startWalkthrough}
      className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg bg-card hover:bg-muted"
      title="Rondleiding opnieuw starten"
    >
      <Play className="w-4 h-4" />
      <span className="hidden sm:inline">Rondleiding</span>
    </Button>
  )
}
