"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Save, Euro, Loader2, FileText } from "lucide-react"
import { 
    getCostRates, 
    createCostRate, 
    updateCostRate as updateCostRateAction
} from "@/lib/db-actions"
import { PROJECT_TYPES } from "@/lib/config"

interface CostItem {
    id: string
    name: string
    basePrice: number
    category: string
    isPercentage: boolean
    projectType: string | null
    workSpecification: string | null
}

/**
 * Cost Determination Panel - Manage base rates per project type with work specifications
 */
export function CostDeterminationPanel() {
    const [costItems, setCostItems] = useState<CostItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [pendingPriceChanges, setPendingPriceChanges] = useState<Map<string, number>>(new Map())
    const [pendingSpecChanges, setPendingSpecChanges] = useState<Map<string, string>>(new Map())

    // Load cost rates from database
    const loadCostRates = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getCostRates()
            if (result.success && result.data) {
                const rates = result.data as CostItem[]
                setCostItems(rates)
            } else {
                toast.error("Kon tarieven niet laden", {
                    description: result.error || "Probeer opnieuw"
                })
            }
        } catch (error) {
            console.error('Failed to load cost rates:', error)
            toast.error("Fout bij laden tarieven")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadCostRates()
    }, [loadCostRates])

    // Initialize missing project types
    useEffect(() => {
        if (!isLoading && costItems.length > 0) {
            const existingProjectTypes = costItems
                .filter(item => item.projectType)
                .map(item => item.projectType)
            
            const missingTypes = PROJECT_TYPES.filter(pt => !existingProjectTypes.includes(pt))
            
            if (missingTypes.length > 0) {
                // Create missing project type rates
                Promise.all(
                    missingTypes.map(projectType =>
                        createCostRate({
                            name: projectType,
                            basePrice: 0,
                            category: 'base',
                            isPercentage: false,
                            projectType: projectType,
                            workSpecification: ''
                        })
                    )
                ).then(() => {
                    loadCostRates()
                })
            }
        }
    }, [isLoading, costItems, loadCostRates])

    // Get rates mapped by project type
    const projectTypeRates = PROJECT_TYPES.map(pt => {
        const rate = costItems.find(item => item.projectType === pt)
        return {
            projectType: pt,
            rate: rate || null
        }
    })

    const handlePriceChange = (id: string, newPrice: string) => {
        const price = parseFloat(newPrice) || 0
        setPendingPriceChanges(prev => new Map(prev).set(id, price))
        setCostItems(costItems.map(item => 
            item.id === id ? { ...item, basePrice: price } : item
        ))
    }

    const handleSpecChange = (id: string, newSpec: string) => {
        setPendingSpecChanges(prev => new Map(prev).set(id, newSpec))
        setCostItems(costItems.map(item => 
            item.id === id ? { ...item, workSpecification: newSpec } : item
        ))
    }

    const handleSave = async () => {
        const totalChanges = pendingPriceChanges.size + pendingSpecChanges.size
        if (totalChanges === 0) {
            toast.info("Geen wijzigingen om op te slaan")
            return
        }

        setIsSaving(true)
        let successCount = 0
        let errorCount = 0

        // Collect all unique IDs that have changes
        const changedIds = new Set([
            ...pendingPriceChanges.keys(),
            ...pendingSpecChanges.keys()
        ])

        // Save all pending changes
        for (const id of changedIds) {
            try {
                const updateData: { basePrice?: number; workSpecification?: string } = {}
                
                if (pendingPriceChanges.has(id)) {
                    updateData.basePrice = pendingPriceChanges.get(id)
                }
                if (pendingSpecChanges.has(id)) {
                    updateData.workSpecification = pendingSpecChanges.get(id)
                }
                
                const result = await updateCostRateAction(id, updateData)
                if (result.success) {
                    successCount++
                } else {
                    errorCount++
                }
            } catch {
                errorCount++
            }
        }

        setIsSaving(false)
        setPendingPriceChanges(new Map())
        setPendingSpecChanges(new Map())

        if (errorCount === 0) {
            toast.success("Tarieven opgeslagen", {
                description: `${successCount} items bijgewerkt`
            })
        } else {
            toast.error("Sommige tarieven niet opgeslagen", {
                description: `${successCount} succesvol, ${errorCount} mislukt`
            })
        }
    }

    if (isLoading) {
        return (
            <Card className="border-2 border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </CardContent>
            </Card>
        )
    }

    const hasPendingChanges = pendingPriceChanges.size > 0 || pendingSpecChanges.size > 0

    return (
        <Card className="border-2 border-slate-200 dark:border-slate-700">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Tarieven
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            Beheer basis tarieven per projecttype voor offertes.
                        </CardDescription>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        disabled={isSaving || !hasPendingChanges}
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {hasPendingChanges ? `Opslaan (${pendingPriceChanges.size + pendingSpecChanges.size})` : "Opslaan"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Base Rates per Project Type */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Euro className="w-4 h-4" />
                        Basis Tarieven per Projecttype
                    </h4>
                    
                    <div className="grid gap-3">
                        {projectTypeRates.map(({ projectType, rate }) => (
                            <div 
                                key={projectType} 
                                className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                                <div className="w-48 shrink-0">
                                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                        {projectType}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">€</span>
                                    <Input
                                        type="number"
                                        value={rate?.basePrice || 0}
                                        onChange={(e) => rate && handlePriceChange(rate.id, e.target.value)}
                                        className="w-28 h-9 text-right font-mono bg-white dark:bg-slate-900"
                                        disabled={!rate}
                                    />
                                    <span className="text-xs text-slate-400">excl. BTW</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Work Specifications per Project Type */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Specificatie werkzaamheden onder basistarieven
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        Beschrijf per projecttype welke werkzaamheden inbegrepen zijn bij het basistarief. 
                        Deze tekst wordt automatisch op de offerte geplaatst onder &ldquo;Overzicht van de werkzaamheden&rdquo;.
                    </p>
                    
                    <div className="space-y-4">
                        {projectTypeRates.map(({ projectType, rate }) => (
                            <div 
                                key={projectType} 
                                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                                    {projectType}
                                </label>
                                <Textarea
                                    placeholder={`Beschrijf de werkzaamheden die inbegrepen zijn bij ${projectType}...`}
                                    value={rate?.workSpecification || ''}
                                    onChange={(e) => rate && handleSpecChange(rate.id, e.target.value)}
                                    className="min-h-[100px] text-sm bg-white dark:bg-slate-900"
                                    disabled={!rate}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
