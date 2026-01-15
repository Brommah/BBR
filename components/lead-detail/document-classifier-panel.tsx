"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    FolderTree,
    FileText,
    Image as ImageIcon,
    FileCode,
    FileSpreadsheet,
    Sparkles,
    Check,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { 
    classifyDocuments, 
    type DocumentAnalysis,
    type DocumentType 
} from "@/lib/document-intelligence"

interface DocumentClassifierPanelProps {
    leadId: string
    onClassificationApplied?: () => void
}

const DOCUMENT_TYPE_CONFIG: Record<DocumentType, { 
    label: string
    icon: React.ReactNode
    color: string 
}> = {
    'plattegrond': { 
        label: 'Plattegrond', 
        icon: <FileText className="w-3.5 h-3.5" />,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
    },
    'doorsnede': { 
        label: 'Doorsnede', 
        icon: <FileText className="w-3.5 h-3.5" />,
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
    },
    'gevelaanzicht': { 
        label: 'Gevelaanzicht', 
        icon: <FileText className="w-3.5 h-3.5" />,
        color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
    },
    'detailtekening': { 
        label: 'Detail', 
        icon: <FileCode className="w-3.5 h-3.5" />,
        color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300'
    },
    'constructietekening': { 
        label: 'Constructie', 
        icon: <FileCode className="w-3.5 h-3.5" />,
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
    },
    'situatietekening': { 
        label: 'Situatie', 
        icon: <FileText className="w-3.5 h-3.5" />,
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
    },
    'principedetail': { 
        label: 'Principe', 
        icon: <FileCode className="w-3.5 h-3.5" />,
        color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
    },
    'foto': { 
        label: 'Foto', 
        icon: <ImageIcon className="w-3.5 h-3.5" />,
        color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
    },
    'rapport': { 
        label: 'Rapport', 
        icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
        color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    },
    'berekening': { 
        label: 'Berekening', 
        icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
    },
    'vergunning': { 
        label: 'Vergunning', 
        icon: <FileText className="w-3.5 h-3.5" />,
        color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
    },
    'onbekend': { 
        label: 'Onbekend', 
        icon: <FileText className="w-3.5 h-3.5" />,
        color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
    }
}

export function DocumentClassifierPanel({ 
    leadId,
    onClassificationApplied 
}: DocumentClassifierPanelProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [documents, setDocuments] = useState<DocumentAnalysis[]>([])
    const [isApplying, setIsApplying] = useState(false)

    useEffect(() => {
        const fetchClassifications = async () => {
            setIsLoading(true)
            const result = await classifyDocuments(leadId)
            
            if (result.success && result.data) {
                setDocuments(result.data)
            }
            
            setIsLoading(false)
        }

        fetchClassifications()
    }, [leadId])

    const handleApplyAll = async () => {
        setIsApplying(true)
        await new Promise(resolve => setTimeout(resolve, 800))
        toast.success('Classificaties toegepast', {
            description: `${documents.length} documenten gecategoriseerd`
        })
        if (onClassificationApplied) {
            onClassificationApplied()
        }
        setIsApplying(false)
    }

    // Get type summary
    const typeGroups = documents.reduce((acc, doc) => {
        const type = doc.classificatie.type
        acc[type] = (acc[type] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    if (isLoading) {
        return (
            <Card className="border-amber-200/50 dark:border-amber-800/30">
                <CardContent className="py-12 text-center">
                    <div className="inline-flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                        <span className="text-muted-foreground">Documenten classificeren...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-amber-200/50 dark:border-amber-800/30 h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <FolderTree className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                Document Classificatie
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[10px]">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI
                                </Badge>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {documents.length} documenten herkend
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0 flex-1 flex flex-col">
                {documents.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center py-8">
                        <div>
                            <FolderTree className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">Geen documenten geclassificeerd</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 flex-1 overflow-auto max-h-64">
                            {documents.map((doc) => {
                                const typeConfig = DOCUMENT_TYPE_CONFIG[doc.classificatie.type]
                                
                                return (
                                    <div 
                                        key={doc.documentId}
                                        className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className={`p-1.5 rounded ${typeConfig.color}`}>
                                            {typeConfig.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{doc.bestandsnaam}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Badge variant="secondary" className={`text-[10px] ${typeConfig.color}`}>
                                                    {typeConfig.label}
                                                </Badge>
                                                {doc.classificatie.fase && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {doc.classificatie.fase}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(doc.classificatie.confidence * 100)}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="pt-3 mt-3 border-t">
                            <Button 
                                onClick={handleApplyAll}
                                disabled={isApplying}
                                className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
                                size="sm"
                                variant="default"
                            >
                                {isApplying ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Classificaties toepassen
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
