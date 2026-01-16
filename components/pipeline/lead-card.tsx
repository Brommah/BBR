"use client"

import { useDraggable } from "@dnd-kit/core"
import { motion } from "framer-motion"
import { Lead } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Clock, AlertCircle, CheckCircle2, Calculator, PenTool, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { getProjectTypeColor } from "./pipeline-legend"
import { useAllUsers, useAuthStore } from "@/lib/auth"

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
  tooltip: string
}> = {
  fresh: { tooltip: "Lead is < 24 uur oud" },
  day: { tooltip: "Lead wacht 24-48 uur - plan actie" },
  stale: { tooltip: "Lead wacht 48-72 uur - neem contact op" },
  critical: { tooltip: "Lead wacht > 72 uur - urgente actie vereist!" }
}

// Status-based styling with glow colors
const STATUS_CONFIG: Record<string, {
  indicator: string
  glow: string
  pillClass: string
  showAge: boolean
  ageUrgency: boolean
}> = {
  "Nieuw": {
    indicator: "bg-blue-500",
    glow: "shadow-[inset_4px_0_8px_-4px_rgba(59,130,246,0.4)]",
    pillClass: "pill-glass-blue",
    showAge: true,
    ageUrgency: true
  },
  "Calculatie": {
    indicator: "bg-amber-500",
    glow: "shadow-[inset_4px_0_8px_-4px_rgba(245,158,11,0.4)]",
    pillClass: "pill-glass-amber",
    showAge: true,
    ageUrgency: true
  },
  "Offerte Verzonden": {
    indicator: "bg-violet-500",
    glow: "shadow-[inset_4px_0_8px_-4px_rgba(139,92,246,0.4)]",
    pillClass: "pill-glass-violet",
    showAge: true,
    ageUrgency: false
  },
  "Opdracht": {
    indicator: "bg-emerald-500",
    glow: "shadow-[inset_4px_0_8px_-4px_rgba(16,185,129,0.4)]",
    pillClass: "pill-glass-emerald",
    showAge: true,
    ageUrgency: false
  },
  "Archief": {
    indicator: "bg-slate-400",
    glow: "shadow-[inset_4px_0_8px_-4px_rgba(148,163,184,0.3)]",
    pillClass: "pill-glass-slate",
    showAge: true,
    ageUrgency: false
  }
}

export function LeadCard({ lead }: LeadCardProps) {
  const router = useRouter()
  const { users } = useAllUsers()
  const { currentUser } = useAuthStore()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })
  
  const [hoursSince, setHoursSince] = useState(0)
  const hasDraggedRef = useRef(false)
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)
  
  // Find team members
  const projectleiderUser = users.find(u => u.name === lead.assignedProjectleider)
  const rekenaarUser = users.find(u => u.name === lead.assignedRekenaar)
  const tekenaarUser = users.find(u => u.name === lead.assignedTekenaar)
  
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  useEffect(() => {
    const hours = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60)
    setHoursSince(hours)
  }, [lead.createdAt])

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
  const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG["Nieuw"]
  const showAgeIndicator = statusConfig.showAge
  const showAgeUrgency = statusConfig.ageUrgency

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY }
    hasDraggedRef.current = false
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseDownPosRef.current) {
      const dx = Math.abs(e.clientX - mouseDownPosRef.current.x)
      const dy = Math.abs(e.clientY - mouseDownPosRef.current.y)
      if (dx > 5 || dy > 5) {
        hasDraggedRef.current = true
      }
    }
    
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

  // Format last activity
  const formatLastActivity = () => {
    const date = new Date(lead.updatedAt || lead.createdAt)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)
    
    if (hours < 1) return "zojuist"
    if (hours < 24) return `${Math.floor(hours)}u geleden`
    if (hours < 48) return "gisteren"
    return `${Math.floor(hours / 24)}d geleden`
  }

  return (
    <TooltipProvider>
      <motion.div 
        ref={setNodeRef} 
        style={style} 
        {...listeners} 
        {...attributes} 
        className="mb-3"
        role="listitem"
        aria-label={`Lead: ${lead.clientName}, ${lead.projectType} in ${lead.city}`}
        aria-grabbed={isDragging}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Card 
          className={cn(
            "cursor-pointer transition-all relative overflow-hidden group",
            "card-tactile rounded-xl border-0",
            statusConfig.glow,
            isDragging && "opacity-50 ring-2 ring-ring z-50 rotate-1 shadow-xl"
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
          {/* Status indicator - Glowing left edge */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1 transition-colors",
            statusConfig.indicator
          )} />

          <CardHeader className="p-3 pb-0 pl-4 space-y-2">
            <div className="flex justify-between items-start gap-2">
              {/* Project Type - Glass pill */}
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full",
                statusConfig.pillClass
              )}>
                {lead.projectType}
              </span>
              {/* Last activity micro-text */}
              <span className="text-micro">{formatLastActivity()}</span>
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
             
            <div className="flex justify-between items-center border-t border-border/50 pt-2 mt-2">
              {/* Value hidden for engineers */}
              {currentUser?.role !== 'engineer' ? (
                <span className="text-currency text-sm">
                  € {(lead.quoteValue ?? lead.value).toLocaleString('nl-NL')}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
              <div className="flex items-center gap-2">
                {/* Age indicator */}
                {showAgeIndicator && (
                  showAgeUrgency ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors",
                          ageStatus === "critical" && "pill-glass-rose",
                          ageStatus === "stale" && "bg-orange-500/10 text-orange-600 border border-orange-500/20",
                          ageStatus === "day" && "pill-glass-amber",
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
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>{formatHours(hoursSince)}</span>
                    </div>
                  )
                )}

                {/* Team avatars */}
                <div className="flex items-center -space-x-1.5">
                  {/* Projectleider */}
                  {lead.assignedProjectleider ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Avatar className="w-6 h-6 border-2 border-card">
                            {projectleiderUser?.avatar && (
                              <AvatarImage src={projectleiderUser.avatar} alt={lead.assignedProjectleider} />
                            )}
                            <AvatarFallback className="text-[8px] font-bold bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 dark:from-amber-900 dark:to-amber-800 dark:text-amber-300">
                              {getInitials(lead.assignedProjectleider)}
                            </AvatarFallback>
                          </Avatar>
                          <Briefcase className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-amber-600 bg-card rounded-full p-0.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{lead.assignedProjectleider}</p>
                        <p className="text-xs text-muted-foreground">Projectleider</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="w-6 h-6 border-2 border-card opacity-30">
                          <AvatarFallback className="bg-muted">
                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-muted-foreground">Geen projectleider</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Rekenaar */}
                  {lead.assignedRekenaar ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Avatar className="w-6 h-6 border-2 border-card">
                            {rekenaarUser?.avatar && (
                              <AvatarImage src={rekenaarUser.avatar} alt={lead.assignedRekenaar} />
                            )}
                            <AvatarFallback className="text-[8px] font-bold bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900 dark:to-blue-800 dark:text-blue-300">
                              {getInitials(lead.assignedRekenaar)}
                            </AvatarFallback>
                          </Avatar>
                          <Calculator className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-blue-600 bg-card rounded-full p-0.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{lead.assignedRekenaar}</p>
                        <p className="text-xs text-muted-foreground">Rekenaar</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="w-6 h-6 border-2 border-card opacity-30">
                          <AvatarFallback className="bg-muted">
                            <Calculator className="w-3 h-3 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-muted-foreground">Geen rekenaar</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Tekenaar */}
                  {lead.assignedTekenaar ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Avatar className="w-6 h-6 border-2 border-card">
                            {tekenaarUser?.avatar && (
                              <AvatarImage src={tekenaarUser.avatar} alt={lead.assignedTekenaar} />
                            )}
                            <AvatarFallback className="text-[8px] font-bold bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 dark:from-violet-900 dark:to-violet-800 dark:text-violet-300">
                              {getInitials(lead.assignedTekenaar)}
                            </AvatarFallback>
                          </Avatar>
                          <PenTool className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-violet-600 bg-card rounded-full p-0.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{lead.assignedTekenaar}</p>
                        <p className="text-xs text-muted-foreground">Tekenaar</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="w-6 h-6 border-2 border-card opacity-30">
                          <AvatarFallback className="bg-muted">
                            <PenTool className="w-3 h-3 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-muted-foreground">Geen tekenaar</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
