"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Scan,
    Check,
    Loader2,
    Sparkles,
    ArrowRight,
    FileText
} from "lucide-react"
import { toast } from "sonner"
import { 
    getExtractedDimensions, 
    type ExtractedDimension 
} from "@/lib/document-intelligence"

interface DimensionExtractorPanelProps {
    leadId: string
    onDimensionsConfirmed?: (dimensions: ExtractedDimension[]) => void
}

export function DimensionExtractorPanel({ 
    leadId, 
    onDimensionsConfirmed 
}: DimensionExtractorPanelProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [dimensions, setDimensions] = useState<ExtractedDimension[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        const fetchDimensions = async () => {
            setIsLoading(true)
            const result = await getExtractedDimensions(leadId)
            
            if (result.success && result.data) {
                setDimensions(result.data)
                const highConfidence = result.data
                    .filter(d => d.confidence >= 0.85)
                    .map(d => d.id)
                setSelectedIds(new Set(highConfidence))
            }
            
            setIsLoading(false)
        }

        fetchDimensions()
    }, [leadId])

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const handleConfirm = async () => {
        setIsProcessing(true)
        await new Promise(resolve => setTimeout(resolve, 800))
        const confirmed = dimensions.filter(d => selectedIds.has(d.id))
        if (onDimensionsConfirmed) {
            onDimensionsConfirmed(confirmed)
        }
        toast.success(`${confirmed.length} afmetingen toegevoegd aan specificaties`)
        setIsProcessing(false)
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
        if (confidence >= 0.8) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
        return 'text-red-600 bg-red-50 dark:bg-red-950/30'
    }

    const highConfidenceCount = dimensions.filter(d => d.confidence >= 0.85).length

    if (isLoading) {
        return (
            <Card className="border-cyan-200/50 dark:border-cyan-800/30">
                <CardContent className="py-12 text-center">
                    <div className="inline-flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                        <span className="text-muted-foreground">Dimensies extraheren...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-cyan-200/50 dark:border-cyan-800/30 h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Scan className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                Dimensie Extractie
                                <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 text-[10px]">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI
                                </Badge>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {dimensions.length} afmetingen • {highConfidenceCount} hoge zekerheid
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0 flex-1 flex flex-col">
                {dimensions.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center py-8">
                        <div>
                            <Scan className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">Geen dimensies gevonden</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 flex-1 overflow-auto max-h-64">
                            {dimensions.map((dim) => (
                                <div 
                                    key={dim.id}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer
                                        ${selectedIds.has(dim.id) 
                                            ? 'border-cyan-300 bg-cyan-50/50 dark:bg-cyan-950/20' 
                                            : 'border-border/50 hover:bg-muted/50'
                                        }`}
                                    onClick={() => toggleSelection(dim.id)}
                                >
                                    <Checkbox 
                                        checked={selectedIds.has(dim.id)}
                                        className="border-cyan-400 data-[state=checked]:bg-cyan-600"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{dim.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {dim.waarde} {dim.eenheid}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className={`text-[10px] shrink-0 ${getConfidenceColor(dim.confidence)}`}>
                                        {Math.round(dim.confidence * 100)}%
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        <div className="pt-3 mt-3 border-t">
                            <Button 
                                onClick={handleConfirm}
                                disabled={selectedIds.size === 0 || isProcessing}
                                className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700"
                                size="sm"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                {selectedIds.size} toevoegen aan specificaties
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
