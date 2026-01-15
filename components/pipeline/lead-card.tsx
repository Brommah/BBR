"use client"

import { useDraggable } from "@dnd-kit/core"
import { Lead } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Clock, AlertCircle, CheckCircle2, Calculator, PenTool } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { getProjectTypeColor } from "./pipeline-legend"
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
  // Track if a drag actually happened (mouse moved after mousedown)
  const hasDraggedRef = useRef(false)
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)
  
  // Find team members from users list
  const rekenaarUser = users.find(u => u.name === lead.assignedRekenaar)
  const tekenaarUser = users.find(u => u.name === lead.assignedTekenaar)
  
  // Helper to get user initials
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  useEffect(() => {
    const hours = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60)
    const t = setTimeout(() => setHoursSince(hours), 0)
    return () => clearTimeout(t)
  }, [lead.createdAt])

  // Reset drag tracking when drag state changes
  useEffect(() => {
    if (isDragging) {
      hasDraggedRef.current = true
    }
  }, [isDragging])

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const ageStatus = getAgeStatus(hoursSince)
  const ageConfig = AGE_CONFIG[ageStatus]
  const projectColors = getProjectTypeColor(lead.projectType)
  
  // Check if anyone is assigned
  const hasTeam = lead.assignedRekenaar || lead.assignedTekenaar
  
  // Use status-based styling for borders/indicators (age urgency only for Nieuw/Calculatie)
  const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG["Nieuw"]
  const showAgeIndicator = statusConfig.showAge
  const showAgeUrgency = statusConfig.ageUrgency
  const borderClass = statusConfig.border
  const indicatorClass = statusConfig.indicator

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY }
    hasDraggedRef.current = false
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    // Check if mouse moved significantly (indicating a drag)
    if (mouseDownPosRef.current) {
      const dx = Math.abs(e.clientX - mouseDownPosRef.current.x)
      const dy = Math.abs(e.clientY - mouseDownPosRef.current.y)
      if (dx > 5 || dy > 5) {
        hasDraggedRef.current = true
      }
    }
    
    // Only navigate if we didn't drag
    if (!hasDraggedRef.current && !isDragging) {
      router.push(`/leads/${lead.id}`)
    }
    
    mouseDownPosRef.current = null
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <Card 
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
              router.push(`/leads/${lead.id}`)
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

                {/* Team avatars - Rekenaar and Tekenaar */}
                <div className="flex items-center -space-x-1.5">
                  {/* Rekenaar */}
                  {lead.assignedRekenaar ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "relative",
                          lead.aanZet === 'rekenaar' && "ring-2 ring-blue-500 ring-offset-1 rounded-full"
                        )}>
                          <Avatar className="w-6 h-6 border-2 border-white dark:border-slate-800">
                            {rekenaarUser?.avatar && (
                              <AvatarImage src={rekenaarUser.avatar} alt={lead.assignedRekenaar} />
                            )}
                            <AvatarFallback className="text-[8px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              {getInitials(lead.assignedRekenaar)}
                            </AvatarFallback>
                          </Avatar>
                          <Calculator className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-blue-600 bg-white dark:bg-slate-800 rounded-full p-0.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{lead.assignedRekenaar}</p>
                        <p className="text-xs text-muted-foreground">Rekenaar {lead.aanZet === 'rekenaar' && '• Aan zet'}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="w-6 h-6 border-2 border-white dark:border-slate-800 opacity-40">
                          <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                            <Calculator className="w-3 h-3 text-slate-400" />
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-muted-foreground">Geen rekenaar toegewezen</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Tekenaar */}
                  {lead.assignedTekenaar ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "relative",
                          lead.aanZet === 'tekenaar' && "ring-2 ring-purple-500 ring-offset-1 rounded-full"
                        )}>
                          <Avatar className="w-6 h-6 border-2 border-white dark:border-slate-800">
                            {tekenaarUser?.avatar && (
                              <AvatarImage src={tekenaarUser.avatar} alt={lead.assignedTekenaar} />
                            )}
                            <AvatarFallback className="text-[8px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                              {getInitials(lead.assignedTekenaar)}
                            </AvatarFallback>
                          </Avatar>
                          <PenTool className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-purple-600 bg-white dark:bg-slate-800 rounded-full p-0.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{lead.assignedTekenaar}</p>
                        <p className="text-xs text-muted-foreground">Tekenaar {lead.aanZet === 'tekenaar' && '• Aan zet'}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="w-6 h-6 border-2 border-white dark:border-slate-800 opacity-40">
                          <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                            <PenTool className="w-3 h-3 text-slate-400" />
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-muted-foreground">Geen tekenaar toegewezen</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
