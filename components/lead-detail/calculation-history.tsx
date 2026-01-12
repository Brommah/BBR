"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { 
    History, 
    RotateCcw, 
    ChevronDown, 
    ChevronUp, 
    Euro, 
    Plus, 
    Minus,
    Clock,
    User,
    Eye
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

interface QuoteVersion {
    id: string
    version: number
    createdAt: string
    createdBy: string
    total: number
    items: {
        description: string
        amount: number
    }[]
    changes?: {
        type: "added" | "removed" | "modified"
        description: string
        oldValue?: number
        newValue?: number
    }[]
    status: "draft" | "sent" | "approved" | "rejected"
}

const mockVersions: QuoteVersion[] = [
    {
        id: "v3",
        version: 3,
        createdAt: "2026-01-12T14:30:00",
        createdBy: "Angelo",
        total: 985,
        items: [
            { description: "Standaard Dakkapel - Constructieberekening", amount: 585 },
            { description: "Extra constructietekening", amount: 250 },
            { description: "Bezoek op locatie", amount: 150 }
        ],
        changes: [
            { type: "added", description: "Bezoek op locatie", newValue: 150 }
        ],
        status: "draft"
    },
    {
        id: "v2",
        version: 2,
        createdAt: "2026-01-11T10:15:00",
        createdBy: "Angelo",
        total: 835,
        items: [
            { description: "Standaard Dakkapel - Constructieberekening", amount: 585 },
            { description: "Extra constructietekening", amount: 250 }
        ],
        changes: [
            { type: "added", description: "Extra constructietekening", newValue: 250 }
        ],
        status: "sent"
    },
    {
        id: "v1",
        version: 1,
        createdAt: "2026-01-10T09:00:00",
        createdBy: "Angelo",
        total: 585,
        items: [
            { description: "Standaard Dakkapel - Constructieberekening", amount: 585 }
        ],
        status: "rejected"
    }
]

interface CalculationHistoryProps {
    leadId: string
    onRollback?: (version: QuoteVersion) => void
}

export function CalculationHistory({ leadId, onRollback }: CalculationHistoryProps) {
    const [versions, setVersions] = useState<QuoteVersion[]>(mockVersions)
    const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
    const [selectedVersion, setSelectedVersion] = useState<QuoteVersion | null>(null)
    const [isCompareOpen, setIsCompareOpen] = useState(false)

    const toggleExpand = (id: string) => {
        setExpandedVersion(expandedVersion === id ? null : id)
    }

    const handleRollback = (version: QuoteVersion) => {
        toast.success(`Teruggedraaid naar versie ${version.version}`, {
            description: `Offerte hersteld naar €${version.total}`
        })
        if (onRollback) {
            onRollback(version)
        }
        setIsCompareOpen(false)
    }

    const getStatusBadge = (status: QuoteVersion["status"]) => {
        switch (status) {
            case "draft":
                return <Badge variant="outline" className="text-[10px]">Concept</Badge>
            case "sent":
                return <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">Verzonden</Badge>
            case "approved":
                return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Goedgekeurd</Badge>
            case "rejected":
                return <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Afgewezen</Badge>
        }
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

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <History className="w-4 h-4 text-purple-600" />
                        Offerte Geschiedenis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {versions.map((version, index) => (
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
                                            <span className="font-medium text-sm">€{version.total.toLocaleString()}</span>
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
                                    {/* Changes */}
                                    {version.changes && version.changes.length > 0 && (
                                        <div className="pt-3 space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground">Wijzigingen:</p>
                                            {version.changes.map((change, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    {getChangeIcon(change.type)}
                                                    <span>{change.description}</span>
                                                    {change.newValue && (
                                                        <span className="text-emerald-600 font-medium">+€{change.newValue}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground">Items:</p>
                                        {version.items.map((item, i) => (
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
                    ))}
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
                                    €{selectedVersion.total.toLocaleString()}
                                </span>
                            </div>
                            
                            <div className="space-y-1">
                                {selectedVersion.items.map((item, i) => (
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
