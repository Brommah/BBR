"use client"

import { useEffect, useState, useMemo } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Mail, AlertCircle, Clock, FileText, User, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useLeadStore, Lead } from "@/lib/store"
import { useRouter } from "next/navigation"
import { sendQuoteReminder } from "@/lib/email"
import { useAuthStore } from "@/lib/auth"

interface AttentionItem {
  id: string
  leadId: string
  clientName: string
  initials: string
  projectType: string
  city: string
  daysAgo: number
  type: 'quote_pending' | 'no_assignee' | 'quote_approval'
  clientEmail?: string
  quoteValue?: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getDaysAgo(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// Helper to generate attention items from leads
function generateAttentionItems(leads: Lead[]): AttentionItem[] {
  const attentionItems: AttentionItem[] = []

  leads.forEach((lead: Lead) => {
    const daysAgo = getDaysAgo(lead.createdAt)
    const initials = getInitials(lead.clientName)

    // Quotes pending approval (for admins)
    if (lead.quoteApproval === 'pending') {
      attentionItems.push({
        id: `approval-${lead.id}`,
        leadId: lead.id,
        clientName: lead.clientName,
        initials,
        projectType: lead.projectType,
        city: lead.city,
        daysAgo,
        type: 'quote_approval',
        quoteValue: lead.quoteValue
      })
    }

    // Quotes sent but no response > 3 days
    if (lead.status === 'Offerte Verzonden' && daysAgo > 3) {
      attentionItems.push({
        id: `quote-${lead.id}`,
        leadId: lead.id,
        clientName: lead.clientName,
        initials,
        projectType: lead.projectType,
        city: lead.city,
        daysAgo,
        type: 'quote_pending',
        clientEmail: lead.clientEmail,
        quoteValue: lead.quoteValue
      })
    }

    // New leads without assignee > 1 day
    if (lead.status === 'Nieuw' && !lead.assignee && daysAgo > 1) {
      attentionItems.push({
        id: `assign-${lead.id}`,
        leadId: lead.id,
        clientName: lead.clientName,
        initials,
        projectType: lead.projectType,
        city: lead.city,
        daysAgo,
        type: 'no_assignee'
      })
    }
  })

  // Sort by priority: quote approvals first, then by days ago
  attentionItems.sort((a, b) => {
    if (a.type === 'quote_approval' && b.type !== 'quote_approval') return -1
    if (b.type === 'quote_approval' && a.type !== 'quote_approval') return 1
    return b.daysAgo - a.daysAgo
  })

  return attentionItems.slice(0, 5) // Show max 5 items
}

export function NeedsAttentionList() {
  const { leads, isLoading, loadLeads } = useLeadStore()
  const { currentUser } = useAuthStore()
  const router = useRouter()
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  // Load leads on mount
  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  // Generate attention items from leads (computed, not state)
  const items = useMemo(() => generateAttentionItems(leads), [leads])

  const handleSendReminder = async (item: AttentionItem) => {
    if (!item.clientEmail || !currentUser) {
      toast.error("Geen e-mailadres beschikbaar")
      return
    }

    setSendingReminder(item.id)

    const result = await sendQuoteReminder({
      to: item.clientEmail,
      clientName: item.clientName,
      projectType: item.projectType,
      quoteValue: item.quoteValue || 0,
      daysSinceQuote: item.daysAgo,
      leadId: item.leadId,
      sentBy: currentUser.name
    })

    if (result.success) {
      toast.success(`Herinnering verzonden naar ${item.clientName}`, {
        description: "E-mail is succesvol verzonden."
      })
    } else {
      toast.error("Kon herinnering niet verzenden", {
        description: result.error
      })
    }

    setSendingReminder(null)
  }

  const handleViewLead = (leadId: string) => {
    router.push(`/leads/${leadId}`)
  }

  const getTypeBadge = (type: AttentionItem['type']) => {
    switch (type) {
      case 'quote_approval':
        return <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">Goedkeuring</Badge>
      case 'quote_pending':
        return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Wacht op reactie</Badge>
      case 'no_assignee':
        return <Badge className="bg-slate-100 text-slate-700 border-0 text-[10px]">Niet toegewezen</Badge>
    }
  }

  const getTypeIcon = (type: AttentionItem['type']) => {
    switch (type) {
      case 'quote_approval':
        return <CheckCircle className="w-4 h-4 text-purple-500" />
      case 'quote_pending':
        return <FileText className="w-4 h-4 text-amber-500" />
      case 'no_assignee':
        return <User className="w-4 h-4 text-slate-500" />
    }
  }

  if (isLoading) {
    return (
      <Card className="col-span-3 border-2 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-slate-900 dark:text-slate-100">Actie Vereist</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="col-span-3 border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-slate-900 dark:text-slate-100">Alles Onder Controle</CardTitle>
          </div>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Geen items die aandacht vereisen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            🎉 Alle leads zijn up-to-date!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-3 border-2 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-slate-900 dark:text-slate-100">Actie Vereist</CardTitle>
          <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
        </div>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Items die uw aandacht vereisen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewLead(item.leadId)}
            >
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-600">
                  <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm">
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5">
                  {getTypeIcon(item.type)}
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{item.clientName}</p>
                  {getTypeBadge(item.type)}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="truncate">{item.projectType}</span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span>{item.city}</span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {item.daysAgo}d
                  </span>
                  {item.quoteValue && (
                    <>
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <span className="font-medium">€{item.quoteValue.toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
              {item.type === 'quote_pending' && item.clientEmail && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSendReminder(item)
                  }}
                  disabled={sendingReminder === item.id}
                >
                  <Mail className="h-4 w-4" />
                  {sendingReminder === item.id ? "..." : "Herinnering"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
