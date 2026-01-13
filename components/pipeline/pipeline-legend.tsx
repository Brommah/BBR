"use client"

import { useState } from "react"
import { 
  Info, 
  Clock, 
  User, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Home,
  Layers,
  Square,
  Building2,
  Wrench
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Project type colors - consistent across the app
export const PROJECT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Dakkapel": { bg: "bg-sky-100 dark:bg-sky-950", text: "text-sky-700 dark:text-sky-300", border: "border-sky-300 dark:border-sky-700" },
  "Uitbouw": { bg: "bg-violet-100 dark:bg-violet-950", text: "text-violet-700 dark:text-violet-300", border: "border-violet-300 dark:border-violet-700" },
  "Draagmuur": { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
  "Renovatie": { bg: "bg-rose-100 dark:bg-rose-950", text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700" },
  "Constructieadvies": { bg: "bg-teal-100 dark:bg-teal-950", text: "text-teal-700 dark:text-teal-300", border: "border-teal-300 dark:border-teal-700" },
  "Fundering": { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
}

// Assignee colors - consistent per person
export const ASSIGNEE_COLORS: Record<string, { bg: string; text: string }> = {
  "Angelo": { bg: "bg-blue-600", text: "text-white" },
  "Venka": { bg: "bg-purple-600", text: "text-white" },
  "Roina": { bg: "bg-rose-600", text: "text-white" },
  "default": { bg: "bg-slate-500", text: "text-white" },
}

export function getAssigneeColor(assignee: string | undefined) {
  if (!assignee) return ASSIGNEE_COLORS.default
  return ASSIGNEE_COLORS[assignee] || ASSIGNEE_COLORS.default
}

export function getProjectTypeColor(type: string) {
  return PROJECT_TYPE_COLORS[type] || { 
    bg: "bg-slate-100 dark:bg-slate-800", 
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700"
  }
}

const PROJECT_TYPE_ICONS: Record<string, typeof Home> = {
  "Dakkapel": Home,
  "Uitbouw": Square,
  "Draagmuur": Layers,
  "Renovatie": Wrench,
  "Constructieadvies": Building2,
  "Fundering": Layers,
}

export function getProjectTypeIcon(type: string) {
  return PROJECT_TYPE_ICONS[type] || Square
}

export function PipelineLegend() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm mb-4">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between px-4 py-2 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span>Legenda</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Age/Urgency Indicators */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Leeftijd Indicator
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-transparent border border-border rounded-sm" />
                  <span className="text-xs text-muted-foreground">Vers ({"<"} 24u)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-amber-500 rounded-sm" />
                  <span className="text-xs text-muted-foreground">24-48 uur</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-orange-500 rounded-sm" />
                  <span className="text-xs text-muted-foreground">48-72 uur</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-red-500 rounded-sm" />
                  <span className="text-xs text-foreground font-medium">{">"} 72 uur - Actie vereist!</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                  <div className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-semibold rounded">Urgent</div>
                  <span className="text-xs text-muted-foreground">Prioriteit door klant</span>
                </div>
              </div>
            </div>

            {/* Project Types */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Project Types
              </h4>
              <div className="space-y-2">
                {Object.entries(PROJECT_TYPE_COLORS).map(([type, colors]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={cn(
                        "px-2 py-0.5 text-[10px] font-medium uppercase rounded border",
                        colors.bg, colors.text, colors.border
                      )}>
                        {type}
                      </div>
                    </div>
                ))}
              </div>
            </div>

            {/* Status & Assignees */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Team & Status
              </h4>
              <div className="space-y-2">
                {Object.entries(ASSIGNEE_COLORS).filter(([k]) => k !== "default").map(([name, colors]) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                      colors.bg, colors.text
                    )}>
                      {name[0]}
                    </div>
                    <span className="text-xs text-muted-foreground">{name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-slate-200 dark:bg-slate-700">
                    <User className="w-3 h-3 text-slate-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">Niet toegewezen</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Adres geverifieerd</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
