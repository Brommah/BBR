"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Save, Euro, Percent, Plus, Trash2 } from "lucide-react"

interface CostItem {
    id: string
    name: string
    basePrice: number
}

interface SurchargeItem {
    id: string
    name: string
    type: "percentage" | "fixed"
    value: number
}

const initialCostItems: CostItem[] = [
    { id: "1", name: "Standaard Dakkapel Berekening", basePrice: 585 },
    { id: "2", name: "Maatwerk Uitbouw Berekening", basePrice: 850 },
    { id: "3", name: "Constructief Complex Berekening", basePrice: 1250 },
    { id: "4", name: "Draagmuur Berekening", basePrice: 450 },
    { id: "5", name: "Fundering Berekening", basePrice: 750 },
]

const initialSurcharges: SurchargeItem[] = [
    { id: "1", name: "Spoedlevering", type: "percentage", value: 20 },
    { id: "2", name: "Extra constructietekening", type: "fixed", value: 250 },
    { id: "3", name: "Bezoek op locatie", type: "fixed", value: 150 },
]

export function CostDeterminationPanel() {
    const [costItems, setCostItems] = useState<CostItem[]>(initialCostItems)
    const [surcharges, setSurcharges] = useState<SurchargeItem[]>(initialSurcharges)
    const [newItemName, setNewItemName] = useState("")
    const [newItemPrice, setNewItemPrice] = useState("")

    const handlePriceChange = (id: string, newPrice: string) => {
        const price = parseFloat(newPrice) || 0
        setCostItems(costItems.map(item => 
            item.id === id ? { ...item, basePrice: price } : item
        ))
    }

    const handleSurchargeChange = (id: string, newValue: string) => {
        const value = parseFloat(newValue) || 0
        setSurcharges(surcharges.map(item => 
            item.id === id ? { ...item, value } : item
        ))
    }

    const handleAddItem = () => {
        if (!newItemName.trim() || !newItemPrice) return
        const newItem: CostItem = {
            id: Date.now().toString(),
            name: newItemName,
            basePrice: parseFloat(newItemPrice) || 0
        }
        setCostItems([...costItems, newItem])
        setNewItemName("")
        setNewItemPrice("")
        toast.success("Nieuw tarief toegevoegd")
    }

    const handleDeleteItem = (id: string) => {
        setCostItems(costItems.filter(item => item.id !== id))
        toast.info("Tarief verwijderd")
    }

    const handleSave = () => {
        // In production, this would save to a database
        toast.success("Tarieven opgeslagen", {
            description: "Alle prijzen zijn bijgewerkt."
        })
    }

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
                    <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Save className="w-4 h-4" />
                        Opslaan
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
                    <div className="space-y-2">
                        {costItems.map((item) => (
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
                            <Button size="sm" onClick={handleAddItem} className="gap-1 h-9">
                                <Plus className="w-4 h-4" />
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
                    <div className="space-y-2">
                        {surcharges.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="flex-1">
                                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                        {item.name}
                                    </span>
                                    <span className="ml-2 text-xs text-slate-500">
                                        ({item.type === "percentage" ? "%" : "vast bedrag"})
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">
                                        {item.type === "percentage" ? "+" : "€"}
                                    </span>
                                    <Input
                                        type="number"
                                        value={item.value}
                                        onChange={(e) => handleSurchargeChange(item.id, e.target.value)}
                                        className="w-20 h-8 text-right font-mono bg-white dark:bg-slate-900"
                                    />
                                    <span className="text-sm text-slate-500 w-4">
                                        {item.type === "percentage" ? "%" : ""}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
