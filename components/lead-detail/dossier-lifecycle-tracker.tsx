"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { 
  FileText, 
  Calculator, 
  Send, 
  CheckCircle2, 
  Archive,
  Check,
  PenTool,
  Ruler,
  HardHat,
  ClipboardCheck,
  Clock,
  Loader
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

/**
 * Lifecycle phases for a dossier
 * Standard flow: Nieuw → Calculatie → Offerte Verzonden → Opdracht → Archief
 * 
 * Complex projects (after Opdracht accepted) may have sub-phases:
 * Voorlopig Ontwerp → Definitief Ontwerp → Uitvoeringsgereed Ontwerp → Ter Controle
 */

// Main pipeline statuses
type LeadStatus = 'Nieuw' | 'Calculatie' | 'Offerte Verzonden' | 'Opdracht' | 'Archief'

// Execution sub-phases (for standard projects after Opdracht)
type ExecutionPhase = 'wachtrij' | 'in_behandeling' | 'ter_controle' | 'afgerond'

// Design sub-phases (for complex projects after Opdracht)
type DesignPhase = 'voorlopig_ontwerp' | 'definitief_ontwerp' | 'uitvoeringsgereed_ontwerp' | 'ter_controle' | 'afgerond'

interface LifecyclePhase {
  id: string
  label: string
  shortLabel?: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const MAIN_PHASES: LifecyclePhase[] = [
  { 
    id: 'Nieuw', 
    label: 'Quotatie', 
    shortLabel: 'Quot.',
    icon: FileText, 
    description: 'Aanvraag ontvangen' 
  },
  { 
    id: 'Calculatie', 
    label: 'Calculatie', 
    shortLabel: 'Calc.',
    icon: Calculator, 
    description: 'Berekening in behandeling' 
  },
  { 
    id: 'Offerte Verzonden', 
    label: 'Offerte', 
    shortLabel: 'Offerte',
    icon: Send, 
    description: 'Offerte verzonden naar klant' 
  },
  { 
    id: 'Opdracht', 
    label: 'Opdracht', 
    shortLabel: 'Opdracht',
    icon: CheckCircle2, 
    description: 'Opdracht ontvangen' 
  },
]

// Execution phases (standard projects after Opdracht)
const EXECUTION_PHASES: LifecyclePhase[] = [
  { 
    id: 'wachtrij', 
    label: 'Wachtrij', 
    shortLabel: 'Wacht',
    icon: Clock, 
    description: 'In de wachtrij voor behandeling' 
  },
  { 
    id: 'in_behandeling', 
    label: 'In Behandeling', 
    shortLabel: 'Bezig',
    icon: Loader, 
    description: 'Actief in behandeling' 
  },
  { 
    id: 'ter_controle', 
    label: 'Ter Controle', 
    shortLabel: 'TC',
    icon: ClipboardCheck, 
    description: 'Eindcontrole' 
  },
]

const DESIGN_PHASES: LifecyclePhase[] = [
  { 
    id: 'voorlopig_ontwerp', 
    label: 'Voorlopig Ontwerp', 
    shortLabel: 'VO',
    icon: PenTool, 
    description: 'Eerste ontwerp in ontwikkeling' 
  },
  { 
    id: 'definitief_ontwerp', 
    label: 'Definitief Ontwerp', 
    shortLabel: 'DO',
    icon: Ruler, 
    description: 'Definitief ontwerp in voorbereiding' 
  },
  { 
    id: 'uitvoeringsgereed_ontwerp', 
    label: 'Uitvoeringsgereed', 
    shortLabel: 'UO',
    icon: HardHat, 
    description: 'Klaar voor uitvoering' 
  },
  { 
    id: 'ter_controle', 
    label: 'Ter Controle', 
    shortLabel: 'TC',
    icon: ClipboardCheck, 
    description: 'Eindcontrole' 
  },
]

interface DossierLifecycleTrackerProps {
  /** Current pipeline status */
  status: LeadStatus
  /** For standard projects: current execution phase (only shown when status is 'Opdracht') */
  executionPhase?: ExecutionPhase
  /** For complex projects: current design phase (only shown when status is 'Opdracht') */
  designPhase?: DesignPhase
  /** Whether this is a complex project with design phases */
  isComplexProject?: boolean
  /** Compact variant for smaller spaces */
  compact?: boolean
  /** Additional className */
  className?: string
  /** Callback when execution phase is clicked (for changing phase) */
  onExecutionPhaseChange?: (phase: ExecutionPhase) => void
  /** Callback when design phase is clicked (for changing phase) */
  onDesignPhaseChange?: (phase: DesignPhase) => void
}

/**
 * Visual lifecycle tracker showing the progress of a dossier through its phases.
 * Inspired by Flexport's shipment tracking UI.
 * 
 * - Completed phases: Bold, dark text with filled checkmark
 * - Current phase: Highlighted with accent color, pulsing indicator
 * - Future phases: Gray, muted appearance
 */
export function DossierLifecycleTracker({ 
  status, 
  executionPhase,
  designPhase,
  isComplexProject = false,
  compact = false,
  className,
  onExecutionPhaseChange,
  onDesignPhaseChange
}: DossierLifecycleTrackerProps) {
  const currentPhaseIndex = MAIN_PHASES.findIndex(p => p.id === status)
  const isArchived = status === 'Archief'
  const isInOpdracht = status === 'Opdracht'
  
  // Determine execution phase index (for standard projects in Opdracht)
  const currentExecutionIndex = executionPhase 
    ? EXECUTION_PHASES.findIndex(p => p.id === executionPhase)
    : -1
    
  // Determine design phase index (for complex projects in Opdracht)
  const currentDesignIndex = designPhase 
    ? DESIGN_PHASES.findIndex(p => p.id === designPhase)
    : -1

  return (
    <TooltipProvider>
      <div className={cn("w-full", className)}>
        {/* Main Pipeline Phases */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
          
          {/* Progress Line Filled */}
          <motion.div 
            className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ 
              width: isArchived 
                ? 'calc(100% - 32px)' 
                : `calc(${(currentPhaseIndex / (MAIN_PHASES.length - 1)) * 100}% - ${currentPhaseIndex === 0 ? 0 : 8}px)` 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Phase Nodes */}
          <div className="relative flex justify-between">
            {MAIN_PHASES.map((phase, index) => {
              const isCompleted = isArchived || index < currentPhaseIndex
              const isCurrent = !isArchived && index === currentPhaseIndex
              const isPending = !isArchived && index > currentPhaseIndex
              
              const PhaseIcon = phase.icon
              
              return (
                <Tooltip key={phase.id}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      {/* Node Circle */}
                      <motion.div
                        className={cn(
                          "relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                          // Completed: Solid emerald with checkmark
                          isCompleted && "bg-emerald-500 text-white shadow-md shadow-emerald-500/30",
                          // Current: White with emerald border, pulsing
                          isCurrent && "bg-white dark:bg-slate-900 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20",
                          // Pending: Gray/muted
                          isPending && "bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500"
                        )}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                        ) : (
                          <PhaseIcon className={cn(
                            "w-4 h-4",
                            isCurrent && "text-emerald-600 dark:text-emerald-400"
                          )} />
                        )}
                        
                        {/* Current Phase Pulse Ring */}
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-emerald-500"
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity, 
                              ease: "easeOut" 
                            }}
                          />
                        )}
                      </motion.div>
                      
                      {/* Label */}
                      <motion.span 
                        className={cn(
                          "mt-2 text-[10px] font-medium text-center leading-tight",
                          isCompleted && "text-foreground font-semibold",
                          isCurrent && "text-emerald-600 dark:text-emerald-400 font-bold",
                          isPending && "text-muted-foreground/60"
                        )}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        {compact ? phase.shortLabel : phase.label}
                      </motion.span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium">{phase.label}</p>
                    <p className="text-muted-foreground">{phase.description}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Execution Sub-Phases (shown for standard projects when in Opdracht) */}
        {!isComplexProject && isInOpdracht && (
          <motion.div 
            className="mt-6 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Uitvoeringsfase
              </span>
            </div>
            
            <div className="relative">
              {/* Execution Progress Line Background */}
              <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-200 dark:bg-slate-700" />
              
              {/* Execution Progress Line Filled */}
              {currentExecutionIndex >= 0 && (
                <motion.div 
                  className="absolute top-3 left-3 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `calc(${(currentExecutionIndex / (EXECUTION_PHASES.length - 1)) * 100}% - ${currentExecutionIndex === 0 ? 0 : 6}px)` 
                  }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                />
              )}

              {/* Execution Phase Nodes */}
              <div className="relative flex justify-between">
                {EXECUTION_PHASES.map((phase, index) => {
                  const isCompleted = currentExecutionIndex > index
                  const isCurrent = currentExecutionIndex === index
                  const isPending = currentExecutionIndex < index
                  
                  const PhaseIcon = phase.icon
                  
                  return (
                    <Tooltip key={phase.id}>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                          {/* Node Circle - Smaller for sub-phases */}
                          <motion.div
                            className={cn(
                              "relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                              isCompleted && "bg-blue-500 text-white shadow-sm shadow-blue-500/30",
                              isCurrent && "bg-white dark:bg-slate-900 border-2 border-blue-500 text-blue-600",
                              isPending && "bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-400"
                            )}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.08 }}
                          >
                            {isCompleted ? (
                              <Check className="w-3 h-3" strokeWidth={2.5} />
                            ) : (
                              <PhaseIcon className="w-3 h-3" />
                            )}
                            
                            {/* Current Phase Pulse */}
                            {isCurrent && (
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-blue-500"
                                initial={{ scale: 1, opacity: 0.4 }}
                                animate={{ scale: 1.4, opacity: 0 }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity, 
                                  ease: "easeOut" 
                                }}
                              />
                            )}
                          </motion.div>
                          
                          {/* Label */}
                          <motion.span 
                            className={cn(
                              "mt-1.5 text-[9px] font-medium text-center leading-tight",
                              isCompleted && "text-foreground font-semibold",
                              isCurrent && "text-blue-600 dark:text-blue-400 font-bold",
                              isPending && "text-muted-foreground/50"
                            )}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.08 }}
                          >
                            {phase.shortLabel}
                          </motion.span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p className="font-medium">{phase.label}</p>
                        <p className="text-muted-foreground">{phase.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Design Sub-Phases (shown for complex projects when in Opdracht) */}
        {isComplexProject && isInOpdracht && (
          <motion.div 
            className="mt-6 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Ontwerpfase
              </span>
            </div>
            
            <div className="relative">
              {/* Design Progress Line Background */}
              <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-200 dark:bg-slate-700" />
              
              {/* Design Progress Line Filled */}
              {currentDesignIndex >= 0 && (
                <motion.div 
                  className="absolute top-3 left-3 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `calc(${(currentDesignIndex / (DESIGN_PHASES.length - 1)) * 100}% - ${currentDesignIndex === 0 ? 0 : 6}px)` 
                  }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                />
              )}

              {/* Design Phase Nodes */}
              <div className="relative flex justify-between">
                {DESIGN_PHASES.map((phase, index) => {
                  const isCompleted = currentDesignIndex > index
                  const isCurrent = currentDesignIndex === index
                  const isPending = currentDesignIndex < index
                  
                  const PhaseIcon = phase.icon
                  
                  return (
                    <Tooltip key={phase.id}>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                          {/* Node Circle - Smaller for sub-phases */}
                          <motion.div
                            className={cn(
                              "relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                              isCompleted && "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
                              isCurrent && "bg-white dark:bg-slate-900 border-2 border-amber-500 text-amber-600",
                              isPending && "bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-400"
                            )}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.08 }}
                          >
                            {isCompleted ? (
                              <Check className="w-3 h-3" strokeWidth={2.5} />
                            ) : (
                              <PhaseIcon className="w-3 h-3" />
                            )}
                            
                            {/* Current Phase Pulse */}
                            {isCurrent && (
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-amber-500"
                                initial={{ scale: 1, opacity: 0.4 }}
                                animate={{ scale: 1.4, opacity: 0 }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity, 
                                  ease: "easeOut" 
                                }}
                              />
                            )}
                          </motion.div>
                          
                          {/* Label */}
                          <motion.span 
                            className={cn(
                              "mt-1.5 text-[9px] font-medium text-center leading-tight",
                              isCompleted && "text-foreground font-semibold",
                              isCurrent && "text-amber-600 dark:text-amber-400 font-bold",
                              isPending && "text-muted-foreground/50"
                            )}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.08 }}
                          >
                            {phase.shortLabel}
                          </motion.span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p className="font-medium">{phase.label}</p>
                        <p className="text-muted-foreground">{phase.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Archived State */}
        {isArchived && (
          <motion.div 
            className="mt-4 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Archive className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Dit dossier is gearchiveerd
            </span>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Compact horizontal variant for use in cards or tight spaces
 */
export function DossierLifecycleTrackerCompact({ 
  status,
  className 
}: { 
  status: LeadStatus
  className?: string 
}) {
  const currentPhaseIndex = MAIN_PHASES.findIndex(p => p.id === status)
  const isArchived = status === 'Archief'
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {MAIN_PHASES.map((phase, index) => {
        const isCompleted = isArchived || index < currentPhaseIndex
        const isCurrent = !isArchived && index === currentPhaseIndex
        const isPending = !isArchived && index > currentPhaseIndex
        
        return (
          <div key={phase.id} className="flex items-center">
            {/* Connector Line */}
            {index > 0 && (
              <div 
                className={cn(
                  "w-4 h-0.5 -mx-0.5",
                  isCompleted || isCurrent ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                )}
              />
            )}
            
            {/* Dot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all cursor-pointer",
                    isCompleted && "bg-emerald-500",
                    isCurrent && "bg-emerald-500 ring-2 ring-emerald-500/30",
                    isPending && "bg-slate-300 dark:bg-slate-600"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{phase.label}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      })}
    </div>
  )
}
