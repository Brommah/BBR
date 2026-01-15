"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Save, Euro, Percent, Plus, Trash2, Loader2 } from "lucide-react"
import { 
    getCostRates, 
    createCostRate, 
    updateCostRate as updateCostRateAction, 
    deleteCostRate as deleteCostRateAction 
} from "@/lib/db-actions"

interface CostItem {
    id: string
    name: string
    basePrice: number
    category: string
    isPercentage: boolean
}

export function CostDeterminationPanel() {
    const [costItems, setCostItems] = useState<CostItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map())
    const [newItemName, setNewItemName] = useState("")
    const [newItemPrice, setNewItemPrice] = useState("")

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

    // Separate base rates and surcharges
    const baseRates = costItems.filter(item => item.category === 'base' || !item.category)
    const surcharges = costItems.filter(item => item.category === 'surcharge')

    const handlePriceChange = (id: string, newPrice: string) => {
        const price = parseFloat(newPrice) || 0
        // Track pending changes
        setPendingChanges(prev => new Map(prev).set(id, price))
        // Update local state for immediate feedback
        setCostItems(costItems.map(item => 
            item.id === id ? { ...item, basePrice: price } : item
        ))
    }

    const handleAddItem = async () => {
        if (!newItemName.trim() || !newItemPrice) return
        
        setIsSaving(true)
        try {
            const result = await createCostRate({
                name: newItemName.trim(),
                basePrice: parseFloat(newItemPrice) || 0,
                category: 'base',
                isPercentage: false
            })
            
            if (result.success && result.data) {
                const newRate = result.data as CostItem
                setCostItems([...costItems, newRate])
                setNewItemName("")
                setNewItemPrice("")
                toast.success("Nieuw tarief toegevoegd")
            } else {
                toast.error("Kon tarief niet toevoegen", {
                    description: result.error
                })
            }
        } catch (error) {
            console.error('Failed to create cost rate:', error)
            toast.error("Fout bij aanmaken tarief")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteItem = async (id: string) => {
        // Optimistic update
        const previousItems = costItems
        setCostItems(costItems.filter(item => item.id !== id))
        
        try {
            const result = await deleteCostRateAction(id)
            if (!result.success) {
                // Rollback
                setCostItems(previousItems)
                toast.error("Kon tarief niet verwijderen", {
                    description: result.error
                })
            } else {
                toast.info("Tarief verwijderd")
            }
        } catch (error) {
            // Rollback
            setCostItems(previousItems)
            console.error('Failed to delete cost rate:', error)
            toast.error("Fout bij verwijderen tarief")
        }
    }

    const handleSave = async () => {
        if (pendingChanges.size === 0) {
            toast.info("Geen wijzigingen om op te slaan")
            return
        }

        setIsSaving(true)
        let successCount = 0
        let errorCount = 0

        // Save all pending changes
        for (const [id, price] of pendingChanges.entries()) {
            try {
                const result = await updateCostRateAction(id, price)
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
        setPendingChanges(new Map())

        if (errorCount === 0) {
            toast.success("Tarieven opgeslagen", {
                description: `${successCount} prijzen bijgewerkt`
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
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </CardContent>
            </Card>
        )
    }

    const hasPendingChanges = pendingChanges.size > 0

    return (
        <Card className="border-2 border-slate-200 dark:border-slate-700">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Tarieven & Toeslagen
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            Beheer basis tarieven en toeslagen voor offertes.
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
                        {hasPendingChanges ? `Opslaan (${pendingChanges.size})` : "Opslaan"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Base Rates */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Euro className="w-4 h-4" />
                        Basis Tarieven
                    </h4>
                    {baseRates.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            Geen tarieven geconfigureerd. Voeg hieronder een nieuw tarief toe.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {baseRates.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex-1">
                                        <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500">€</span>
                                        <Input
                                            type="number"
                                            value={item.basePrice}
                                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                            className="w-24 h-8 text-right font-mono bg-white dark:bg-slate-900"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteItem(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new item */}
                    <div className="flex items-center gap-3 p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                        <Input
                            placeholder="Naam nieuw tarief..."
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="flex-1 h-9"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">€</span>
                            <Input
                                type="number"
                                placeholder="0"
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value)}
                                className="w-24 h-9 text-right font-mono"
                            />
                            <Button 
                                size="sm" 
                                onClick={handleAddItem} 
                                className="gap-1 h-9"
                                disabled={isSaving || !newItemName.trim() || !newItemPrice}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                Toevoegen
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Surcharges */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Toeslagen
                    </h4>
                    {surcharges.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            Geen toeslagen geconfigureerd. Voeg toeslagen toe via de database.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {surcharges.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="flex-1">
                                        <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                            {item.name}
                                        </span>
                                        <span className="ml-2 text-xs text-slate-500">
                                            ({item.isPercentage ? "%" : "vast bedrag"})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500">
                                            {item.isPercentage ? "+" : "€"}
                                        </span>
                                        <Input
                                            type="number"
                                            value={item.basePrice}
                                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                            className="w-20 h-8 text-right font-mono bg-white dark:bg-slate-900"
                                        />
                                        <span className="text-sm text-slate-500 w-4">
                                            {item.isPercentage ? "%" : ""}
                                        </span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteItem(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
