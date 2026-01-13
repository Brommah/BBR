"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { 
    CheckSquare, 
    AlertCircle, 
    Clock, 
    Sparkles,
    ChevronDown,
    ChevronUp,
    RotateCcw
} from "lucide-react"
import { toast } from "sonner"

interface ChecklistItem {
    id: string
    label: string
    checked: boolean
    required: boolean
    category: "verification" | "calculation" | "documentation" | "client"
}

interface SmartChecklistProps {
    projectType: string
    leadId?: string
}

const checklistTemplates: Record<string, ChecklistItem[]> = {
    "Dakkapel": [
        { id: "1", label: "BAG-gegevens gecontroleerd", checked: false, required: true, category: "verification" },
        { id: "2", label: "Satellietfoto bekeken", checked: false, required: true, category: "verification" },
        { id: "3", label: "Bouwjaar genoteerd", checked: false, required: true, category: "verification" },
        { id: "4", label: "Bestaande dakconstructie geanalyseerd", checked: false, required: true, category: "calculation" },
        { id: "5", label: "Afmetingen geverifieerd met klant", checked: false, required: true, category: "client" },
        { id: "6", label: "Constructieberekening afgerond", checked: false, required: true, category: "calculation" },
        { id: "7", label: "Staalprofiel geselecteerd", checked: false, required: false, category: "calculation" },
        { id: "8", label: "Tekening opgesteld", checked: false, required: false, category: "documentation" },
        { id: "9", label: "Offerte verzonden", checked: false, required: true, category: "client" },
        { id: "10", label: "Follow-up gepland", checked: false, required: false, category: "client" },
    ],
    "Uitbouw": [
        { id: "1", label: "BAG-gegevens gecontroleerd", checked: false, required: true, category: "verification" },
        { id: "2", label: "Grondonderzoek beschikbaar", checked: false, required: true, category: "verification" },
        { id: "3", label: "Funderingstype bepaald", checked: false, required: true, category: "calculation" },
        { id: "4", label: "Bestaande fundering geanalyseerd", checked: false, required: true, category: "verification" },
        { id: "5", label: "Staalconstructie berekend", checked: false, required: true, category: "calculation" },
        { id: "6", label: "Aansluiting op bestaand gecontroleerd", checked: false, required: true, category: "calculation" },
        { id: "7", label: "Overleg met architect (indien nodig)", checked: false, required: false, category: "client" },
        { id: "8", label: "Tekeningen compleet", checked: false, required: false, category: "documentation" },
        { id: "9", label: "Offerte verzonden", checked: false, required: true, category: "client" },
    ],
    "Draagmuur": [
        { id: "1", label: "Bouwjaar gecontroleerd", checked: false, required: true, category: "verification" },
        { id: "2", label: "Type woning bepaald", checked: false, required: true, category: "verification" },
        { id: "3", label: "Belasting bovenbouw geanalyseerd", checked: false, required: true, category: "calculation" },
        { id: "4", label: "Oplegging bepaald", checked: false, required: true, category: "calculation" },
        { id: "5", label: "Profiel geselecteerd", checked: false, required: true, category: "calculation" },
        { id: "6", label: "Constructietekening gemaakt", checked: false, required: false, category: "documentation" },
        { id: "7", label: "Offerte verzonden", checked: false, required: true, category: "client" },
    ],
    "default": [
        { id: "1", label: "Projectgegevens verzameld", checked: false, required: true, category: "verification" },
        { id: "2", label: "Analyse uitgevoerd", checked: false, required: true, category: "calculation" },
        { id: "3", label: "Berekening afgerond", checked: false, required: true, category: "calculation" },
        { id: "4", label: "Documentatie compleet", checked: false, required: false, category: "documentation" },
        { id: "5", label: "Offerte verzonden", checked: false, required: true, category: "client" },
    ]
}

const categoryLabels: Record<string, { label: string, color: string }> = {
    verification: { label: "Verificatie", color: "bg-blue-100 text-blue-700" },
    calculation: { label: "Berekening", color: "bg-purple-100 text-purple-700" },
    documentation: { label: "Documentatie", color: "bg-amber-100 text-amber-700" },
    client: { label: "Klant", color: "bg-emerald-100 text-emerald-700" }
}

// Helper to get initial items for a project type
function getInitialItems(projectType: string): ChecklistItem[] {
    const template = checklistTemplates[projectType] || checklistTemplates["default"]
    return template.map((item, index) => ({
        ...item,
        checked: index < 3 // First 3 items checked by default for demo
    }))
}

export function SmartChecklist({ projectType }: SmartChecklistProps) {
    const [items, setItems] = useState<ChecklistItem[]>(() => getInitialItems(projectType))
    const [isExpanded, setIsExpanded] = useState(true)
    const [lastProjectType, setLastProjectType] = useState(projectType)
    
    // Reset items when project type changes (using derived state pattern)
    if (projectType !== lastProjectType) {
        setLastProjectType(projectType)
        setItems(getInitialItems(projectType))
    }

    const toggleItem = (id: string) => {
        setItems(items.map(item => 
            item.id === id ? { ...item, checked: !item.checked } : item
        ))
    }

    const resetChecklist = () => {
        setItems(items.map(item => ({ ...item, checked: false })))
        toast.info("Checklist gereset")
    }

    const completedCount = items.filter(i => i.checked).length
    const requiredCount = items.filter(i => i.required).length
    const completedRequiredCount = items.filter(i => i.required && i.checked).length
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0
    const allRequiredComplete = completedRequiredCount === requiredCount

    const categories = [...new Set(items.map(i => i.category))]

    return (
        <Card className={`${allRequiredComplete ? 'border-emerald-200 dark:border-emerald-800' : ''}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                        {projectType} Checklist
                        {allRequiredComplete && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1 text-[10px]">
                                <Sparkles className="w-3 h-3" />
                                Compleet
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={resetChecklist}
                        >
                            <RotateCcw className="w-3 h-3" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            {completedCount}/{items.length} voltooid
                        </span>
                        <span className={`font-medium ${allRequiredComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {completedRequiredCount}/{requiredCount} verplicht
                        </span>
                    </div>
                    <Progress 
                        value={progress} 
                        className={`h-2 ${allRequiredComplete ? '[&>div]:bg-emerald-500' : ''}`} 
                    />
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-4 pt-2">
                    {categories.map((category) => (
                        <div key={category} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge className={`${categoryLabels[category].color} border-0 text-[10px]`}>
                                    {categoryLabels[category].label}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                {items
                                    .filter(item => item.category === category)
                                    .map((item) => (
                                        <label
                                            key={item.id}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                                item.checked 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/30' 
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <Checkbox
                                                checked={item.checked}
                                                onCheckedChange={() => toggleItem(item.id)}
                                                className={item.checked ? 'border-emerald-500 data-[state=checked]:bg-emerald-500' : ''}
                                            />
                                            <span className={`text-sm flex-1 ${
                                                item.checked ? 'line-through text-muted-foreground' : ''
                                            }`}>
                                                {item.label}
                                            </span>
                                            {item.required && !item.checked && (
                                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                            )}
                                        </label>
                                    ))}
                            </div>
                        </div>
                    ))}

                    {!allRequiredComplete && (
                        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                            <Clock className="w-4 h-4" />
                            <span>Voltooi alle verplichte items voordat je de offerte verstuurt</span>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    )
}
