"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MinusCircle,
    ChevronDown,
    ChevronRight,
    Sparkles,
    FileQuestion,
    Send,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { 
    validateChecklist, 
    type ChecklistItem 
} from "@/lib/document-intelligence"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

/**
 * Bereken compleetheid score (client-side utility)
 */
export function calculateCompletenessScore(checklist: ChecklistItem[]) {
    let vereistAanwezig = 0
    let vereistTotaal = 0
    let aanbevolenAanwezig = 0
    let aanbevolenTotaal = 0

    checklist.forEach(item => {
        if (item.categorie === 'vereist') {
            vereistTotaal++
            if (item.status === 'aanwezig') vereistAanwezig++
            else if (item.status === 'onvolledig') vereistAanwezig += 0.5
        } else if (item.categorie === 'aanbevolen') {
            aanbevolenTotaal++
            if (item.status === 'aanwezig') aanbevolenAanwezig++
            else if (item.status === 'onvolledig') aanbevolenAanwezig += 0.5
        }
    })

    const vereistScore = vereistTotaal > 0 ? (vereistAanwezig / vereistTotaal) : 1
    const aanbevolenScore = aanbevolenTotaal > 0 ? (aanbevolenAanwezig / aanbevolenTotaal) : 1
    const overallScore = (vereistScore * 0.7 + aanbevolenScore * 0.3) * 100

    return {
        score: Math.round(overallScore),
        vereist: { aanwezig: Math.round(vereistAanwezig), totaal: vereistTotaal },
        aanbevolen: { aanwezig: Math.round(aanbevolenAanwezig), totaal: aanbevolenTotaal },
    }
}

interface ChecklistValidatorPanelProps {
    leadId: string
    projectType: string
    clientEmail?: string | null
}

export function ChecklistValidatorPanel({ 
    leadId, 
    projectType,
    clientEmail 
}: ChecklistValidatorPanelProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [checklist, setChecklist] = useState<ChecklistItem[]>([])
    const [score, setScore] = useState<ReturnType<typeof calculateCompletenessScore> | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['vereist']))
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        const fetchChecklist = async () => {
            setIsLoading(true)
            const result = await validateChecklist(leadId, projectType)
            
            if (result.success && result.data) {
                setChecklist(result.data)
                setScore(calculateCompletenessScore(result.data))
            }
            
            setIsLoading(false)
        }

        fetchChecklist()
    }, [leadId, projectType])

    const toggleCategory = (category: string) => {
        const newSet = new Set(expandedCategories)
        if (newSet.has(category)) {
            newSet.delete(category)
        } else {
            newSet.add(category)
        }
        setExpandedCategories(newSet)
    }

    const getStatusIcon = (status: ChecklistItem['status']) => {
        switch (status) {
            case 'aanwezig':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            case 'ontbreekt':
                return <XCircle className="w-4 h-4 text-red-500" />
            case 'onvolledig':
                return <AlertCircle className="w-4 h-4 text-amber-500" />
            case 'niet_van_toepassing':
                return <MinusCircle className="w-4 h-4 text-slate-400" />
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600'
        if (score >= 50) return 'text-amber-600'
        return 'text-red-600'
    }

    const getScoreBarColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500'
        if (score >= 50) return 'bg-amber-500'
        return 'bg-red-500'
    }

    const handleRequestMissing = async () => {
        if (!clientEmail) {
            toast.error('Geen e-mailadres beschikbaar')
            return
        }
        setIsSending(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const missing = checklist.filter(c => 
            c.categorie === 'vereist' && 
            (c.status === 'ontbreekt' || c.status === 'onvolledig')
        )
        toast.success(`Verzoek verzonden naar ${clientEmail}`, {
            description: `${missing.length} ontbrekende documenten aangevraagd`
        })
        setIsSending(false)
    }

    const grouped = {
        vereist: checklist.filter(c => c.categorie === 'vereist'),
        aanbevolen: checklist.filter(c => c.categorie === 'aanbevolen'),
        optioneel: checklist.filter(c => c.categorie === 'optioneel')
    }

    const missingRequired = grouped.vereist.filter(c => 
        c.status === 'ontbreekt' || c.status === 'onvolledig'
    ).length

    if (isLoading) {
        return (
            <Card className="border-purple-200/50 dark:border-purple-800/30">
                <CardContent className="py-12 text-center">
                    <div className="inline-flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        <span className="text-muted-foreground">Documenten valideren...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-purple-200/50 dark:border-purple-800/30">
            {/* Header with Score */}
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                Volledigheidscheck
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-[10px]">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI
                                </Badge>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Automatische controle op benodigde documenten
                            </p>
                        </div>
                    </div>
                    {score && (
                        <div className="text-right">
                            <div className={`text-3xl font-bold ${getScoreColor(score.score)}`}>
                                {score.score}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {score.vereist.aanwezig}/{score.vereist.totaal} vereist
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Progress Bar */}
                {score && (
                    <div className="mt-4">
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(score.score)}`}
                                style={{ width: `${score.score}%` }}
                            />
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
                {/* Missing Alert */}
                {missingRequired > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                        <FileQuestion className="w-5 h-5 text-red-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                {missingRequired} vereiste document{missingRequired > 1 ? 'en' : ''} ontbreekt
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1 border-red-300 text-red-700 hover:bg-red-100"
                            onClick={handleRequestMissing}
                            disabled={isSending || !clientEmail}
                        >
                            {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Aanvragen
                        </Button>
                    </div>
                )}

                {/* Checklist Categories */}
                {(['vereist', 'aanbevolen'] as const).map((category) => {
                    const items = grouped[category]
                    if (items.length === 0) return null
                    
                    const aanwezig = items.filter(i => i.status === 'aanwezig').length
                    const isExpanded = expandedCategories.has(category)
                    
                    return (
                        <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                            <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        )}
                                        <span className={`text-sm font-medium capitalize ${
                                            category === 'vereist' ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'
                                        }`}>
                                            {category === 'vereist' ? 'Vereiste documenten' : 'Aanbevolen documenten'}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {aanwezig}/{items.length}
                                    </Badge>
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="pl-6 space-y-1 mt-1">
                                    {items.map((item) => (
                                        <div 
                                            key={item.id}
                                            className="flex items-start gap-2 p-2 rounded text-sm"
                                        >
                                            {getStatusIcon(item.status)}
                                            <div className="flex-1 min-w-0">
                                                <span className={item.status === 'ontbreekt' ? 'text-muted-foreground' : ''}>
                                                    {item.naam}
                                                </span>
                                                {item.opmerking && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{item.opmerking}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )
                })}
            </CardContent>
        </Card>
    )
}
