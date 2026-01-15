"use client"

import { useDraggable } from "@dnd-kit/core"
import { Lead } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, User, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { getProjectTypeColor, getAssigneeColor } from "./pipeline-legend"
import { useAllUsers } from "@/lib/auth"

interface LeadCardProps {
  lead: Lead
}

type AgeStatus = "fresh" | "day" | "stale" | "critical"

function getAgeStatus(hours: number): AgeStatus {
  if (hours > 72) return "critical"
  if (hours > 48) return "stale"
  if (hours > 24) return "day"
  return "fresh"
}

const AGE_CONFIG: Record<AgeStatus, { 
  border: string
  indicator: string
  label: string
  tooltip: string
  icon?: typeof AlertCircle
}> = {
  fresh: {
    border: "border-border",
    indicator: "bg-emerald-500",
    label: "Nieuw",
    tooltip: "Lead is < 24 uur oud"
  },
  day: {
    border: "border-amber-400 dark:border-amber-500",
    indicator: "bg-amber-500",
    label: "24-48u",
    tooltip: "Lead wacht 24-48 uur - plan actie"
  },
  stale: {
    border: "border-orange-400 dark:border-orange-500",
    indicator: "bg-orange-500",
    label: "48-72u",
    tooltip: "Lead wacht 48-72 uur - neem contact op"
  },
  critical: {
    border: "border-red-500 dark:border-red-500",
    indicator: "bg-red-500",
    label: "> 72u",
    tooltip: "Lead wacht > 72 uur - urgente actie vereist!",
    icon: AlertCircle
  }
}

// Status-based styling - colors match the state, not age-based urgency
const STATUS_CONFIG: Record<string, {
  border: string
  indicator: string
  showAge: boolean
  ageUrgency: boolean // Whether age triggers urgency colors
}> = {
  "Nieuw": {
    border: "border-blue-400 dark:border-blue-500",
    indicator: "bg-blue-500",
    showAge: true,
    ageUrgency: true // New leads need quick attention
  },
  "Calculatie": {
    border: "border-amber-400 dark:border-amber-500",
    indicator: "bg-amber-500",
    showAge: true,
    ageUrgency: true // In progress - track how long engineer is working
  },
  "Offerte Verzonden": {
    border: "border-purple-400 dark:border-purple-500",
    indicator: "bg-purple-500",
    showAge: true,
    ageUrgency: false // Waiting on client - can't rush them
  },
  "Opdracht": {
    border: "border-emerald-500 dark:border-emerald-400",
    indicator: "bg-emerald-500",
    showAge: true,
    ageUrgency: false // Won - success state
  },
  "Archief": {
    border: "border-slate-300 dark:border-slate-600",
    indicator: "bg-slate-400",
    showAge: true,
    ageUrgency: false // Completed - no urgency
  }
}

export function LeadCard({ lead }: LeadCardProps) {
  const router = useRouter()
  const { users } = useAllUsers()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })
  
  const [hoursSince, setHoursSince] = useState(0)
  
  // Find assignee's avatar from users list
  const assigneeUser = users.find(u => u.name === lead.assignee)
  const assigneeAvatar = assigneeUser?.avatar

  useEffect(() => {
    const hours = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60)
    const t = setTimeout(() => setHoursSince(hours), 0)
    return () => clearTimeout(t)
  }, [lead.createdAt])

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const ageStatus = getAgeStatus(hoursSince)
  const ageConfig = AGE_CONFIG[ageStatus]
  const projectColors = getProjectTypeColor(lead.projectType)
  const assigneeColors = getAssigneeColor(lead.assignee)
  
  // Use status-based styling for borders/indicators (age urgency only for Nieuw/Calculatie)
  const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG["Nieuw"]
  const showAgeIndicator = statusConfig.showAge
  const showAgeUrgency = statusConfig.ageUrgency
  const borderClass = statusConfig.border
  const indicatorClass = statusConfig.indicator

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if we're dragging
    if (isDragging) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    router.push(`/leads/${lead.id}`)
  }

  const formatHours = (hours: number) => {
    if (hours < 1) return "< 1u"
    if (hours < 24) return `${Math.floor(hours)}u`
    return `${Math.floor(hours / 24)}d`
  }

  return (
    <TooltipProvider>
      <div 
        ref={setNodeRef} 
        style={style} 
        {...listeners} 
        {...attributes} 
        className="mb-3"
        role="listitem"
        aria-label={`Lead: ${lead.clientName}, ${lead.projectType} in ${lead.city}, €${(lead.quoteValue ?? lead.value).toLocaleString('nl-NL')}`}
        aria-grabbed={isDragging}
      >
        <Card 
          onClick={handleCardClick}
          className={cn(
            "cursor-pointer card-hover-effect transition-all relative overflow-hidden group bg-card",
            "border",
            borderClass,
            isDragging ? "opacity-50 ring-2 ring-ring z-50 rotate-1 shadow-xl" : ""
          )}
          role="button"
          tabIndex={0}
          aria-label={`Open details voor ${lead.clientName}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!isDragging) {
                router.push(`/leads/${lead.id}`)
              }
            }
          }}
        >
          {/* Status indicator line - Left side */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5 transition-colors",
            indicatorClass
          )} />

          <CardHeader className="p-3 pb-0 pl-4 space-y-2">
            <div className="flex justify-between items-start gap-2">
              {/* Project Type Badge with color coding */}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] uppercase tracking-wider font-semibold border",
                  projectColors.bg,
                  projectColors.text,
                  projectColors.border
                )}
              >
                {lead.projectType}
              </Badge>
            </div>
            <CardTitle className="text-sm font-semibold leading-tight flex items-center justify-between text-foreground">
              <span className="truncate">{lead.clientName}</span>
              {lead.addressValid && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-1" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adres geverifieerd</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-3 pt-2 pl-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{lead.city}</span>
            </div>
             
            <div className="flex justify-between items-center border-t border-border pt-2 mt-2">
              <span className="text-currency text-sm">
                € {(lead.quoteValue ?? lead.value).toLocaleString('nl-NL')}
              </span>
              <div className="flex items-center gap-2">
                {/* Age indicator - urgency styling only for Nieuw/Calculatie */}
                {showAgeIndicator && (
                  showAgeUrgency ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors",
                          ageStatus === "critical" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                          ageStatus === "stale" && "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
                          ageStatus === "day" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                          ageStatus === "fresh" && "text-muted-foreground"
                        )}>
                          {ageStatus === "critical" ? (
                            <AlertCircle className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <Clock className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>{formatHours(hoursSince)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{ageConfig.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    // For Offerte Verzonden/Opdracht/Archief: neutral time indicator
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground" aria-label={`Leeftijd: ${formatHours(hoursSince)}`}>
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>{formatHours(hoursSince)}</span>
                    </div>
                  )
                )}

                {/* Assignee avatar with profile picture */}
                {lead.assignee ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="w-6 h-6">
                        {assigneeAvatar && (
                          <AvatarImage src={assigneeAvatar} alt={lead.assignee} />
                        )}
                        <AvatarFallback className={cn(
                          "text-[10px] font-bold",
                          assigneeColors.bg,
                          assigneeColors.text
                        )}>
                          {lead.assignee[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toegewezen aan {lead.assignee}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
                          <User className="w-3 h-3 text-slate-500" aria-hidden="true" />
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Niet toegewezen</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
