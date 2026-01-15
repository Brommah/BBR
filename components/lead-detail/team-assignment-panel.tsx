"use client"

import { useState, useEffect, useTransition } from "react"
import { Check, ChevronsUpDown, Loader2, User, Calculator, Pencil, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLeadStore, AanZet } from "@/lib/store"
import { getUsers, getUsersByEngineerType } from "@/lib/db-actions"
import { useAuthStore, ENGINEER_TYPE_DISPLAY_NAMES } from "@/lib/auth"
import { toast } from "sonner"

interface Engineer {
  id: string
  name: string
  email: string
  role: string
  engineerType?: 'rekenaar' | 'tekenaar'
  avatar?: string
}

interface TeamAssignmentPanelProps {
  leadId: string
  assignedRekenaar?: string
  assignedTekenaar?: string
  aanZet?: AanZet
}

/**
 * Panel for Projectleider to assign Rekenaar and Tekenaar to a project
 * and to set who is "aan zet" (currently working)
 */
export function TeamAssignmentPanel({ 
  leadId, 
  assignedRekenaar, 
  assignedTekenaar,
  aanZet 
}: TeamAssignmentPanelProps) {
  const [rekenaars, setRekenaars] = useState<Engineer[]>([])
  const [tekenaars, setTekenaars] = useState<Engineer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [rekenaarOpen, setRekenaarOpen] = useState(false)
  const [tekenaarOpen, setTekenaarOpen] = useState(false)
  
  const { updateTeamAssignments, updateAanZet } = useLeadStore()
  const { isAdmin } = useAuthStore()
  
  // Only Projectleider can assign
  const canAssign = isAdmin()

  // Fetch engineers from database
  useEffect(() => {
    async function loadEngineers() {
      setIsLoading(true)
      try {
        // Get all users and filter by engineer type
        const result = await getUsers()
        if (result.success && result.data) {
          const users = result.data as Engineer[]
          setRekenaars(users.filter(u => u.engineerType === 'rekenaar'))
          setTekenaars(users.filter(u => u.engineerType === 'tekenaar'))
        } else {
          console.error('[TeamAssignment] Failed to load engineers:', result.error)
          toast.error("Kon teamleden niet laden")
        }
      } catch (error) {
        console.error('[TeamAssignment] Error loading engineers:', error)
        toast.error("Netwerkfout bij laden teamleden")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadEngineers()
  }, [])

  const handleRekenaarSelect = async (selectedName: string) => {
    const newRekenaar = selectedName === assignedRekenaar ? null : selectedName
    
    startTransition(async () => {
      const success = await updateTeamAssignments(leadId, { assignedRekenaar: newRekenaar })
      if (success) {
        toast.success(newRekenaar ? `Rekenaar toegewezen: ${newRekenaar}` : "Rekenaar verwijderd")
      }
    })
    
    setRekenaarOpen(false)
  }

  const handleTekenaarSelect = async (selectedName: string) => {
    const newTekenaar = selectedName === assignedTekenaar ? null : selectedName
    
    startTransition(async () => {
      const success = await updateTeamAssignments(leadId, { assignedTekenaar: newTekenaar })
      if (success) {
        toast.success(newTekenaar ? `Tekenaar toegewezen: ${newTekenaar}` : "Tekenaar verwijderd")
      }
    })
    
    setTekenaarOpen(false)
  }

  const handleAanZetChange = async (value: string) => {
    const newAanZet = value === 'none' ? null : value as AanZet
    
    startTransition(async () => {
      const success = await updateAanZet(leadId, newAanZet)
      if (success) {
        const label = newAanZet 
          ? ENGINEER_TYPE_DISPLAY_NAMES[newAanZet as 'rekenaar' | 'tekenaar'] || 'Projectleider'
          : 'Niemand'
        toast.success(`Aan zet: ${label}`)
      }
    })
  }

  const currentRekenaar = rekenaars.find(e => e.name === assignedRekenaar)
  const currentTekenaar = tekenaars.find(e => e.name === assignedTekenaar)

  if (!canAssign) {
    // Read-only view for non-admins
    return (
      <div className="space-y-3">
        <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          Projectteam
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <Calculator className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Rekenaar:</span>
            <span className="text-sm text-muted-foreground">
              {assignedRekenaar || 'Niet toegewezen'}
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <Pencil className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">Tekenaar:</span>
            <span className="text-sm text-muted-foreground">
              {assignedTekenaar || 'Niet toegewezen'}
            </span>
          </div>
          {aanZet && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <ArrowRight className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Aan zet: {ENGINEER_TYPE_DISPLAY_NAMES[aanZet as 'rekenaar' | 'tekenaar'] || 'Projectleider'}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        Projectteam Toewijzen
      </h4>
      
      {/* Rekenaar Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-blue-500" />
          Rekenaar
        </label>
        <Popover open={rekenaarOpen} onOpenChange={setRekenaarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={rekenaarOpen}
              className="w-full justify-between text-sm h-9"
              disabled={isLoading || isPending}
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Laden...
                </span>
              ) : isPending ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Toewijzen...
                </span>
              ) : currentRekenaar ? (
                <span className="flex items-center gap-2 truncate">
                  <Avatar className="h-5 w-5">
                    {currentRekenaar.avatar && (
                      <AvatarImage src={currentRekenaar.avatar} alt={currentRekenaar.name} />
                    )}
                    <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {currentRekenaar.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {currentRekenaar.name}
                </span>
              ) : assignedRekenaar ? (
                <span className="truncate">{assignedRekenaar}</span>
              ) : (
                <span className="text-muted-foreground">Selecteer Rekenaar...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0">
            <Command>
              <CommandInput placeholder="Zoek rekenaar..." />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? "Laden..." : "Geen rekenaars gevonden."}
                </CommandEmpty>
                <CommandGroup>
                  {rekenaars.map((engineer) => (
                    <CommandItem
                      key={engineer.id}
                      value={engineer.name}
                      onSelect={() => handleRekenaarSelect(engineer.name)}
                      disabled={isPending}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          assignedRekenaar === engineer.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Avatar className="h-6 w-6 mr-2">
                        {engineer.avatar && (
                          <AvatarImage src={engineer.avatar} alt={engineer.name} />
                        )}
                        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {engineer.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{engineer.name}</span>
                        <span className="text-xs text-muted-foreground">{engineer.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Tekenaar Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Pencil className="w-3.5 h-3.5 text-purple-500" />
          Tekenaar
        </label>
        <Popover open={tekenaarOpen} onOpenChange={setTekenaarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={tekenaarOpen}
              className="w-full justify-between text-sm h-9"
              disabled={isLoading || isPending}
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Laden...
                </span>
              ) : isPending ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Toewijzen...
                </span>
              ) : currentTekenaar ? (
                <span className="flex items-center gap-2 truncate">
                  <Avatar className="h-5 w-5">
                    {currentTekenaar.avatar && (
                      <AvatarImage src={currentTekenaar.avatar} alt={currentTekenaar.name} />
                    )}
                    <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      {currentTekenaar.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {currentTekenaar.name}
                </span>
              ) : assignedTekenaar ? (
                <span className="truncate">{assignedTekenaar}</span>
              ) : (
                <span className="text-muted-foreground">Selecteer Tekenaar...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0">
            <Command>
              <CommandInput placeholder="Zoek tekenaar..." />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? "Laden..." : "Geen tekenaars gevonden."}
                </CommandEmpty>
                <CommandGroup>
                  {tekenaars.map((engineer) => (
                    <CommandItem
                      key={engineer.id}
                      value={engineer.name}
                      onSelect={() => handleTekenaarSelect(engineer.name)}
                      disabled={isPending}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          assignedTekenaar === engineer.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Avatar className="h-6 w-6 mr-2">
                        {engineer.avatar && (
                          <AvatarImage src={engineer.avatar} alt={engineer.name} />
                        )}
                        <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          {engineer.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{engineer.name}</span>
                        <span className="text-xs text-muted-foreground">{engineer.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Aan Zet Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
          Aan Zet
        </label>
        <Select
          value={aanZet || 'none'}
          onValueChange={handleAanZetChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Wie is aan zet?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground">Niemand aan zet</span>
            </SelectItem>
            {assignedRekenaar && (
              <SelectItem value="rekenaar">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Rekenaar ({assignedRekenaar})
                </div>
              </SelectItem>
            )}
            {assignedTekenaar && (
              <SelectItem value="tekenaar">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Tekenaar ({assignedTekenaar})
                </div>
              </SelectItem>
            )}
            <SelectItem value="projectleider">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Projectleider
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">
          De persoon &quot;aan zet&quot; ziet dit project in zijn werkvoorraad
        </p>
      </div>
    </div>
  )
}
