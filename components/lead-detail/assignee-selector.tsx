"use client"

import { useState, useEffect, useTransition } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { useLeadStore } from "@/lib/store"
import { getUsers } from "@/lib/db-actions"
import { toast } from "sonner"

interface Engineer {
  id: string
  name: string
  email: string
  role: string
}

export function AssigneeSelector({ leadId, currentAssignee }: { leadId: string, currentAssignee?: string }) {
  const [open, setOpen] = useState(false)
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const { assignLead } = useLeadStore()

  // Fetch engineers from database
  useEffect(() => {
    async function loadEngineers() {
      setIsLoading(true)
      try {
        // Get engineers and admins (admins can also be assigned)
        const result = await getUsers()
        if (result.success && result.data) {
          // Filter to only engineers and admins
          const assignableUsers = (result.data as Engineer[]).filter(
            u => u.role === 'engineer' || u.role === 'admin'
          )
          setEngineers(assignableUsers)
        } else {
          console.error('[AssigneeSelector] Failed to load engineers:', result.error)
          toast.error("Kon engineers niet laden")
        }
      } catch (error) {
        console.error('[AssigneeSelector] Error loading engineers:', error)
        toast.error("Netwerkfout bij laden engineers")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadEngineers()
  }, [])

  const handleSelect = async (selectedValue: string) => {
    const newAssignee = selectedValue === currentAssignee ? "" : selectedValue
    
    startTransition(async () => {
      const success = await assignLead(leadId, newAssignee)
      if (success) {
        toast.success(newAssignee ? `Toegewezen aan ${newAssignee}` : "Toewijzing verwijderd")
      }
    })
    
    setOpen(false)
  }

  const currentEngineer = engineers.find(e => e.name === currentAssignee)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between text-xs h-8"
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
          ) : currentAssignee ? (
            <span className="truncate">
              {currentEngineer?.name || currentAssignee}
            </span>
          ) : (
            <span className="text-muted-foreground">Selecteer Engineer...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder="Zoek engineer..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Laden..." : "Geen engineers gevonden."}
            </CommandEmpty>
            <CommandGroup>
              {engineers.map((engineer) => (
                <CommandItem
                  key={engineer.id}
                  value={engineer.name}
                  onSelect={() => handleSelect(engineer.name)}
                  disabled={isPending}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentAssignee === engineer.name ? "opacity-100" : "opacity-0"
                    )}
                  />
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
  )
}
