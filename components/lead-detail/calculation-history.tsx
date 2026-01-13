"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { 
    History, 
    RotateCcw, 
    ChevronDown, 
    ChevronUp, 
    Plus, 
    Minus,
    Clock,
    User,
    Eye,
    FileText
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { getQuoteVersions } from "@/lib/db-actions"
import { useParams } from "next/navigation"

interface QuoteLineItem {
    description: string
    amount: number
}

interface QuoteVersion {
    id: string
    version: number
    createdAt: string
    createdBy: string
    value: number
    lineItems: QuoteLineItem[]
    description?: string
    status: string
}

interface CalculationHistoryProps {
    leadId?: string
    onRollback?: (version: QuoteVersion) => void
}

export function CalculationHistory({ leadId: propLeadId, onRollback }: CalculationHistoryProps) {
    const params = useParams()
    const leadId = propLeadId || params?.id as string
    
    const [versions, setVersions] = useState<QuoteVersion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
    const [selectedVersion, setSelectedVersion] = useState<QuoteVersion | null>(null)
    const [isCompareOpen, setIsCompareOpen] = useState(false)

    // Load quote versions from database
    useEffect(() => {
        async function loadVersions() {
            if (!leadId) return
            setIsLoading(true)
            
            const result = await getQuoteVersions(leadId)
            if (result.success && result.data) {
                const data = result.data as Array<{
                    id: string
                    version: number
                    createdAt: Date
                    createdBy: string
                    value: number
                    lineItems: unknown
                    description: string | null
                    status: string
                }>
                setVersions(data.map(v => ({
                    ...v,
                    createdAt: v.createdAt.toString(),
                    lineItems: v.lineItems as QuoteLineItem[],
                    description: v.description || undefined
                })))
            }
            setIsLoading(false)
        }
        
        loadVersions()
    }, [leadId])

    const toggleExpand = (id: string) => {
        setExpandedVersion(expandedVersion === id ? null : id)
    }

    const handleRollback = (version: QuoteVersion) => {
        toast.success(`Teruggedraaid naar versie ${version.version}`, {
            description: `Offerte hersteld naar €${version.value}`
        })
        if (onRollback) {
            onRollback(version)
        }
        setIsCompareOpen(false)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "draft":
                return <Badge variant="outline" className="text-[10px]">Concept</Badge>
            case "submitted":
                return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Ingediend</Badge>
            case "sent":
                return <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">Verzonden</Badge>
            case "approved":
                return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Goedgekeurd</Badge>
            case "rejected":
                return <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Afgewezen</Badge>
            default:
                return <Badge variant="outline" className="text-[10px]">{status}</Badge>
        }
    }

    // Calculate changes between versions
    const getChanges = (currentVersion: QuoteVersion, previousVersion?: QuoteVersion) => {
        if (!previousVersion) return []
        
        const changes: { type: string; description: string; oldValue?: number; newValue?: number }[] = []
        
        // Check for added items
        currentVersion.lineItems.forEach(item => {
            const prevItem = previousVersion.lineItems.find(p => p.description === item.description)
            if (!prevItem) {
                changes.push({ type: "added", description: item.description, newValue: item.amount })
            } else if (prevItem.amount !== item.amount) {
                changes.push({ 
                    type: "modified", 
                    description: item.description, 
                    oldValue: prevItem.amount,
                    newValue: item.amount 
                })
            }
        })
        
        // Check for removed items
        previousVersion.lineItems.forEach(item => {
            const currItem = currentVersion.lineItems.find(c => c.description === item.description)
            if (!currItem) {
                changes.push({ type: "removed", description: item.description, oldValue: item.amount })
            }
        })
        
        return changes
    }

    const getChangeIcon = (type: string) => {
        switch (type) {
            case "added":
                return <Plus className="w-3 h-3 text-emerald-500" />
            case "removed":
                return <Minus className="w-3 h-3 text-red-500" />
            default:
                return <History className="w-3 h-3 text-amber-500" />
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-2">
                    {[1, 2].map(i => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </CardContent>
            </Card>
        )
    }

    if (versions.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <History className="w-4 h-4 text-purple-600" />
                        Offerte Geschiedenis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nog geen offertes gemaakt</p>
                        <p className="text-xs mt-1">Maak een offerte in het Quote panel</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <History className="w-4 h-4 text-purple-600" />
                        Offerte Geschiedenis
                        <span className="text-sm font-normal text-muted-foreground">
                            ({versions.length} versie{versions.length !== 1 ? 's' : ''})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {versions.map((version, index) => {
                        const previousVersion = versions[index + 1]
                        const changes = getChanges(version, previousVersion)
                        
                        return (
                            <div 
                                key={version.id}
                                className={`border rounded-lg overflow-hidden transition-all ${
                                    index === 0 ? 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20' : 'bg-white dark:bg-slate-900'
                                }`}
                            >
                                {/* Version Header */}
                                <button
                                    onClick={() => toggleExpand(version.id)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            index === 0 
                                                ? 'bg-purple-500 text-white' 
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}>
                                            v{version.version}
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">€{version.value.toLocaleString()}</span>
                                                {getStatusBadge(version.status)}
                                                {index === 0 && (
                                                    <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">Huidige</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(version.createdAt), "d MMM HH:mm", { locale: nl })}
                                                <span>•</span>
                                                <User className="w-3 h-3" />
                                                {version.createdBy}
                                            </div>
                                        </div>
                                    </div>
                                    {expandedVersion === version.id ? (
                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </button>

                                {/* Expanded Content */}
                                {expandedVersion === version.id && (
                                    <div className="px-3 pb-3 space-y-3 border-t">
                                        {/* Description */}
                                        {version.description && (
                                            <div className="pt-3">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Onderbouwing:</p>
                                                <p className="text-sm text-muted-foreground">{version.description}</p>
                                            </div>
                                        )}
                                        
                                        {/* Changes */}
                                        {changes.length > 0 && (
                                            <div className="pt-3 space-y-1">
                                                <p className="text-xs font-semibold text-muted-foreground">Wijzigingen t.o.v. vorige:</p>
                                                {changes.map((change, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm">
                                                        {getChangeIcon(change.type)}
                                                        <span>{change.description}</span>
                                                        {change.type === "added" && change.newValue && (
                                                            <span className="text-emerald-600 font-medium">+€{change.newValue}</span>
                                                        )}
                                                        {change.type === "removed" && change.oldValue && (
                                                            <span className="text-red-600 font-medium">-€{change.oldValue}</span>
                                                        )}
                                                        {change.type === "modified" && (
                                                            <span className="text-amber-600 font-medium">
                                                                €{change.oldValue} → €{change.newValue}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground">Items:</p>
                                            {version.lineItems.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm py-1">
                                                    <span className="text-muted-foreground">{item.description}</span>
                                                    <span className="font-mono">€{item.amount}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        {index > 0 && (
                                            <div className="flex gap-2 pt-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="gap-1 text-xs"
                                                    onClick={() => {
                                                        setSelectedVersion(version)
                                                        setIsCompareOpen(true)
                                                    }}
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Bekijken
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="gap-1 text-xs"
                                                    onClick={() => handleRollback(version)}
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    Terugdraaien
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Compare/Rollback Dialog */}
            <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5" />
                            Terugdraaien naar v{selectedVersion?.version}
                        </DialogTitle>
                        <DialogDescription>
                            Weet je zeker dat je wilt terugdraaien naar deze versie?
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedVersion && (
                        <div className="py-4 space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <span className="font-medium">Totaal</span>
                                <span className="text-xl font-bold text-emerald-600">
                                    €{selectedVersion.value.toLocaleString()}
                                </span>
                            </div>
                            
                            <div className="space-y-1">
                                {selectedVersion.lineItems.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{item.description}</span>
                                        <span className="font-mono">€{item.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCompareOpen(false)}>
                            Annuleren
                        </Button>
                        <Button onClick={() => selectedVersion && handleRollback(selectedVersion)} className="gap-2">
                            <RotateCcw className="w-4 h-4" />
                            Terugdraaien
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
