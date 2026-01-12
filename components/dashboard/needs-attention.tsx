"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, AlertCircle, Clock } from "lucide-react"
import { toast } from "sonner"

interface AttentionItem {
  id: string
  name: string
  initials: string
  project: string
  city: string
  daysAgo: number
}

const mockItems: AttentionItem[] = [
  { id: "1", name: "Oliver Martens", initials: "OM", project: "Dakopbouw", city: "Amsterdam", daysAgo: 4 },
  { id: "2", name: "Jackson Lee", initials: "JL", project: "Draagmuur", city: "Rotterdam", daysAgo: 5 },
  { id: "3", name: "Isabella Nguyen", initials: "IN", project: "Fundering Herstel", city: "Utrecht", daysAgo: 3 },
]

export function NeedsAttentionList() {
  const handleSendReminder = (name: string) => {
    toast.success(`Herinnering verzonden naar ${name}`, {
      description: "E-mail is succesvol verzonden."
    })
  }

  return (
    <Card className="col-span-3 border-2 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-slate-900 dark:text-slate-100">Actie Vereist</CardTitle>
        </div>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Offertes wachten op reactie (&gt; 3 dagen)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockItems.map((item) => (
            <div key={item.id} className="flex items-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-600">
                <AvatarImage src={`/avatars/${item.id}.png`} alt={item.name} />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm">
                  {item.initials}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>{item.project}</span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span>{item.city}</span>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {item.daysAgo}d geleden
                  </span>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
                onClick={() => handleSendReminder(item.name)}
              >
                <Mail className="h-4 w-4" />
                Herinnering
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
