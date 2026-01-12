"use client"

import { useDroppable } from "@dnd-kit/core"
import { LeadStatus } from "@/lib/store"
import { cn } from "@/lib/utils"
import { 
  Inbox, 
  Calculator, 
  Send, 
  CheckCircle2, 
  Archive,
  ClipboardList
} from "lucide-react"

interface KanbanColumnProps {
  status: LeadStatus
  title: string
  count: number
  children: React.ReactNode
}

// Status-specific styling with icons and distinct colors
const statusStyles: Record<LeadStatus, { 
  bg: string
  border: string
  badge: string
  headerBg: string
  icon: typeof Inbox
  description: string
}> = {
  "Nieuw": { 
    bg: "bg-blue-50/70 dark:bg-blue-950/30", 
    border: "border-blue-300 dark:border-blue-700",
    badge: "bg-blue-600 text-white",
    headerBg: "bg-blue-100/80 dark:bg-blue-900/50",
    icon: Inbox,
    description: "Nieuwe aanvragen"
  },
  "Triage": { 
    bg: "bg-amber-50/70 dark:bg-amber-950/30", 
    border: "border-amber-300 dark:border-amber-700",
    badge: "bg-amber-600 text-white",
    headerBg: "bg-amber-100/80 dark:bg-amber-900/50",
    icon: ClipboardList,
    description: "Te beoordelen"
  },
  "Calculatie": { 
    bg: "bg-purple-50/70 dark:bg-purple-950/30", 
    border: "border-purple-300 dark:border-purple-700",
    badge: "bg-purple-600 text-white",
    headerBg: "bg-purple-100/80 dark:bg-purple-900/50",
    icon: Calculator,
    description: "In berekening"
  },
  "Offerte Verzonden": { 
    bg: "bg-cyan-50/70 dark:bg-cyan-950/30", 
    border: "border-cyan-300 dark:border-cyan-700",
    badge: "bg-cyan-600 text-white",
    headerBg: "bg-cyan-100/80 dark:bg-cyan-900/50",
    icon: Send,
    description: "Wacht op reactie"
  },
  "Opdracht": { 
    bg: "bg-emerald-50/70 dark:bg-emerald-950/30", 
    border: "border-emerald-300 dark:border-emerald-700",
    badge: "bg-emerald-600 text-white",
    headerBg: "bg-emerald-100/80 dark:bg-emerald-900/50",
    icon: CheckCircle2,
    description: "Gewonnen projecten"
  },
  "Archief": { 
    bg: "bg-slate-100/70 dark:bg-slate-900/50", 
    border: "border-slate-300 dark:border-slate-600",
    badge: "bg-slate-500 text-white",
    headerBg: "bg-slate-200/80 dark:bg-slate-800/50",
    icon: Archive,
    description: "Afgeronde projecten"
  }
}

export function KanbanColumn({ status, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const styles = statusStyles[status] || statusStyles["Nieuw"]
  const Icon = styles.icon

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "flex-shrink-0 w-80 flex flex-col h-full rounded-xl border transition-all duration-200",
        styles.bg,
        styles.border,
        "bg-gradient-to-b from-transparent to-background/50", // Subtle gradient
        isOver && "ring-4 ring-accent/50 ring-offset-2 ring-offset-background border-accent scale-[1.02]"
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "p-3 flex flex-col gap-1 sticky top-0 z-10 rounded-t-[10px] border-b",
        styles.headerBg,
        styles.border
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              styles.badge.replace("text-white", "bg-opacity-20"),
              "bg-current/10"
            )}>
              <Icon className={cn("w-4 h-4", styles.badge.split(" ")[0].replace("bg-", "text-"))} />
            </div>
            <h3 className="font-bold text-sm text-foreground">{title}</h3>
          </div>
          <span className={cn(
            "text-xs px-2.5 py-1 rounded-full font-bold shadow-sm min-w-[28px] text-center",
            styles.badge
          )}>
            {count}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground pl-9">{styles.description}</p>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 scrollbar-thin">
        {children}
      </div>

      {/* Empty State */}
      {count === 0 && (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="text-muted-foreground">
            <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Geen leads</p>
          </div>
        </div>
      )}
    </div>
  )
}
