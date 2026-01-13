"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { useWalkthroughStore, shouldAutoStartWalkthrough } from "@/lib/walkthrough"
import { useAuthStore } from "@/lib/auth"
import { 
  Sparkles, 
  Play, 
  X, 
  Kanban, 
  FileText, 
  Trophy,
  ArrowRight
} from "lucide-react"

/**
 * Welcome Dialog
 * Shows a beautiful welcome screen for new users
 * Offers to start the walkthrough or skip
 */
export function WelcomeDialog() {
  const [showWelcome, setShowWelcome] = useState(false)
  const hasCheckedRef = useRef(false)
  
  const { isAuthenticated, currentUser, isLoading: authLoading } = useAuthStore()
  const { 
    startWalkthrough, 
    skipWalkthrough,
    hasCompleted, 
    hasSkipped,
    isActive 
  } = useWalkthroughStore()

  // Check if we should show welcome dialog - using setTimeout to avoid sync setState
  useEffect(() => {
    // Prevent multiple checks
    if (hasCheckedRef.current) return
    
    // Wait for auth to load
    if (authLoading) return
    
    // Skip if not authenticated
    if (!isAuthenticated || !currentUser) return
    
    // Skip if already completed, skipped, or active
    if (hasCompleted || hasSkipped || isActive) return
    
    // Check if should auto-start
    if (shouldAutoStartWalkthrough()) {
      hasCheckedRef.current = true
      // Use setTimeout to show dialog after UI settles
      const timer = setTimeout(() => {
        setShowWelcome(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated, currentUser, hasCompleted, hasSkipped, isActive])

  const handleStartTour = useCallback(() => {
    setShowWelcome(false)
    startWalkthrough()
  }, [startWalkthrough])

  const handleSkip = useCallback(() => {
    setShowWelcome(false)
    skipWalkthrough()
  }, [skipWalkthrough])

  // Only render on client when showWelcome is true
  if (typeof window === 'undefined' || !showWelcome) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/90 backdrop-blur-xl"
        onClick={handleSkip}
      />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-4 animate-slide-up">
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Decorative header with gradient */}
          <div className="relative h-40 bg-gradient-to-br from-primary via-primary/80 to-accent overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Main content */}
          <div className="p-8 -mt-6 relative">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
              <h1 className="text-3xl font-bold text-center text-foreground mb-2">
                Welkom, {currentUser?.name?.split(' ')[0] || 'collega'}! 👋
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Dit is je nieuwe werkplek voor constructieberekeningen. Wil je een korte rondleiding?
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                    <Kanban className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Pipeline</h3>
                  <p className="text-xs text-muted-foreground">Visueel leadbeheer</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Offertes</h3>
                  <p className="text-xs text-muted-foreground">Goedkeuringsflow</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">Incentives</h3>
                  <p className="text-xs text-muted-foreground">XP & bonussen</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleStartTour}
                  size="lg"
                  className="flex-1 gap-2 h-12 text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
                >
                  <Play className="w-5 h-5" />
                  Start rondleiding
                  <span className="text-xs opacity-70">(~3 min)</span>
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2 h-12 text-base"
                >
                  Direct aan de slag
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Je kunt de rondleiding altijd later starten via het <strong>?</strong>-icoon in de sidebar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
