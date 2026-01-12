"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { 
    Home, 
    Building2, 
    Columns, 
    Warehouse, 
    Construction,
    Zap,
    Check,
    ArrowRight,
    Clock,
    Euro
} from "lucide-react"
import { ProjectSpec } from "@/lib/store"

export interface ProjectTemplate {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    category: string
    baseRate: number
    estimatedHours: number
    defaultSpecs: ProjectSpec[]
    checklist: string[]
    color: string
}

export const projectTemplates: ProjectTemplate[] = [
    {
        id: "dakkapel-standaard",
        name: "Standaard Dakkapel",
        description: "Constructieberekening voor een standaard dakkapel tot 3m breed",
        icon: <Home className="w-6 h-6" />,
        category: "Dakkapel",
        baseRate: 585,
        estimatedHours: 4,
        defaultSpecs: [
            { key: "Breedte", value: "", unit: "m" },
            { key: "Diepte", value: "", unit: "m" },
            { key: "Hoogte", value: "", unit: "m" },
            { key: "Type dak", value: "Schuin" },
            { key: "Dakbedekking", value: "Pannen" },
        ],
        checklist: [
            "BAG-gegevens gecontroleerd",
            "Satellietfoto bekeken",
            "Bouwjaar genoteerd",
            "Afmetingen geverifieerd",
            "Bestaande constructie geanalyseerd",
        ],
        color: "bg-blue-500"
    },
    {
        id: "dakkapel-groot",
        name: "Grote Dakkapel",
        description: "Constructieberekening voor dakkapellen groter dan 3m breed",
        icon: <Home className="w-6 h-6" />,
        category: "Dakkapel",
        baseRate: 850,
        estimatedHours: 6,
        defaultSpecs: [
            { key: "Breedte", value: "", unit: "m" },
            { key: "Diepte", value: "", unit: "m" },
            { key: "Hoogte", value: "", unit: "m" },
            { key: "Type dak", value: "Schuin" },
            { key: "Dakbedekking", value: "Pannen" },
            { key: "Constructietype", value: "Staal" },
        ],
        checklist: [
            "BAG-gegevens gecontroleerd",
            "Satellietfoto bekeken",
            "Bouwjaar genoteerd",
            "Afmetingen geverifieerd",
            "Bestaande constructie geanalyseerd",
            "Staalprofiel bepaald",
        ],
        color: "bg-blue-600"
    },
    {
        id: "uitbouw-standaard",
        name: "Standaard Uitbouw",
        description: "Constructieberekening voor uitbouw tot 20m²",
        icon: <Building2 className="w-6 h-6" />,
        category: "Uitbouw",
        baseRate: 850,
        estimatedHours: 6,
        defaultSpecs: [
            { key: "Oppervlakte", value: "", unit: "m²" },
            { key: "Breedte", value: "", unit: "m" },
            { key: "Diepte", value: "", unit: "m" },
            { key: "Fundering", value: "Op staal" },
            { key: "Constructie", value: "Staal" },
        ],
        checklist: [
            "BAG-gegevens gecontroleerd",
            "Grondonderzoek beschikbaar",
            "Funderingstype bepaald",
            "Bestaande fundering geanalyseerd",
            "Staalconstructie berekend",
            "Aansluiting op bestaand gecontroleerd",
        ],
        color: "bg-emerald-500"
    },
    {
        id: "uitbouw-groot",
        name: "Grote Uitbouw",
        description: "Constructieberekening voor uitbouw groter dan 20m²",
        icon: <Building2 className="w-6 h-6" />,
        category: "Uitbouw",
        baseRate: 1250,
        estimatedHours: 10,
        defaultSpecs: [
            { key: "Oppervlakte", value: "", unit: "m²" },
            { key: "Breedte", value: "", unit: "m" },
            { key: "Diepte", value: "", unit: "m" },
            { key: "Fundering", value: "Op staal" },
            { key: "Constructie", value: "Staal" },
            { key: "Verdiepingen", value: "1" },
        ],
        checklist: [
            "BAG-gegevens gecontroleerd",
            "Grondonderzoek beschikbaar",
            "Funderingstype bepaald",
            "Bestaande fundering geanalyseerd",
            "Staalconstructie berekend",
            "Aansluiting op bestaand gecontroleerd",
            "Overleg met architect",
        ],
        color: "bg-emerald-600"
    },
    {
        id: "draagmuur-standaard",
        name: "Draagmuur Verwijderen",
        description: "Berekening voor het verwijderen van een dragende muur",
        icon: <Columns className="w-6 h-6" />,
        category: "Draagmuur",
        baseRate: 450,
        estimatedHours: 3,
        defaultSpecs: [
            { key: "Lengte opening", value: "", unit: "m" },
            { key: "Wanddikte", value: "", unit: "mm" },
            { key: "Draagvermogen", value: "Woonfunctie" },
            { key: "Verdieping", value: "Begane grond" },
        ],
        checklist: [
            "Bouwjaar gecontroleerd",
            "Type woning bepaald",
            "Belasting bovenbouw geanalyseerd",
            "Oplegging bepaald",
            "Profiel geselecteerd",
        ],
        color: "bg-amber-500"
    },
    {
        id: "draagmuur-complex",
        name: "Complexe Draagmuur",
        description: "Berekening voor meerdere doorbrekingen of grote overspanningen",
        icon: <Columns className="w-6 h-6" />,
        category: "Draagmuur",
        baseRate: 750,
        estimatedHours: 5,
        defaultSpecs: [
            { key: "Lengte opening", value: "", unit: "m" },
            { key: "Wanddikte", value: "", unit: "mm" },
            { key: "Draagvermogen", value: "Woonfunctie" },
            { key: "Verdieping", value: "Begane grond" },
            { key: "Extra doorbrekingen", value: "0" },
        ],
        checklist: [
            "Bouwjaar gecontroleerd",
            "Type woning bepaald",
            "Belasting bovenbouw geanalyseerd",
            "Oplegging bepaald",
            "Profiel geselecteerd",
            "Meerdere scenario's doorgerekend",
        ],
        color: "bg-amber-600"
    },
    {
        id: "fundering",
        name: "Funderingsberekening",
        description: "Volledige funderingsberekening incl. grondonderzoek analyse",
        icon: <Warehouse className="w-6 h-6" />,
        category: "Fundering",
        baseRate: 950,
        estimatedHours: 8,
        defaultSpecs: [
            { key: "Oppervlakte", value: "", unit: "m²" },
            { key: "Belasting", value: "", unit: "kN/m²" },
            { key: "Grondsoort", value: "" },
            { key: "Funderingstype", value: "" },
        ],
        checklist: [
            "Grondonderzoek ontvangen",
            "Grondwaterstand genoteerd",
            "Belastingen berekend",
            "Funderingstype bepaald",
            "Wapening berekend",
        ],
        color: "bg-purple-500"
    },
    {
        id: "renovatie",
        name: "Renovatieproject",
        description: "Complete constructieve analyse voor renovatie",
        icon: <Construction className="w-6 h-6" />,
        category: "Renovatie",
        baseRate: 1500,
        estimatedHours: 12,
        defaultSpecs: [
            { key: "Oppervlakte", value: "", unit: "m²" },
            { key: "Verdiepingen", value: "" },
            { key: "Bouwjaar", value: "" },
            { key: "Monument", value: "Nee" },
        ],
        checklist: [
            "Bestaande tekeningen ontvangen",
            "Inspectie ter plaatse",
            "Bestaande constructie geanalyseerd",
            "Nieuwe belastingen berekend",
            "Versterkingsplan opgesteld",
        ],
        color: "bg-rose-500"
    }
]

interface QuickTemplatesProps {
    onSelectTemplate: (template: ProjectTemplate) => void
}

export function QuickTemplates({ onSelectTemplate }: QuickTemplatesProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    const categories = [...new Set(projectTemplates.map(t => t.category))]

    const handleSelect = (template: ProjectTemplate) => {
        setSelectedTemplate(template)
        setIsPreviewOpen(true)
    }

    const handleConfirm = () => {
        if (selectedTemplate) {
            onSelectTemplate(selectedTemplate)
            setIsPreviewOpen(false)
        }
    }

    return (
        <>
            <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Quick Templates
                    </CardTitle>
                    <CardDescription>
                        Selecteer een template om automatisch specificaties en tarieven in te vullen
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {categories.map((category) => (
                        <div key={category} className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                {category}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {projectTemplates
                                    .filter(t => t.category === category)
                                    .map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleSelect(template)}
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-all hover:shadow-md text-left group"
                                        >
                                            <div className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center text-white`}>
                                                {template.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{template.name}</p>
                                                <p className="text-xs text-muted-foreground">€{template.baseRate}</p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                        </button>
                                    ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Template Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {selectedTemplate && (
                                <>
                                    <div className={`w-10 h-10 rounded-lg ${selectedTemplate.color} flex items-center justify-center text-white`}>
                                        {selectedTemplate.icon}
                                    </div>
                                    {selectedTemplate.name}
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedTemplate?.description}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTemplate && (
                        <div className="space-y-4 py-4">
                            {/* Quick Info */}
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Euro className="w-4 h-4 text-emerald-500" />
                                    <span className="font-bold">€{selectedTemplate.baseRate}</span>
                                    <span className="text-muted-foreground">basis</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span className="font-bold">{selectedTemplate.estimatedHours}u</span>
                                    <span className="text-muted-foreground">geschat</span>
                                </div>
                            </div>

                            {/* Default Specs */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Specificaties die worden toegevoegd:</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedTemplate.defaultSpecs.map((spec, i) => (
                                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm">
                                            <Check className="w-3 h-3 text-emerald-500" />
                                            <span>{spec.key}</span>
                                            {spec.unit && <Badge variant="outline" className="text-[10px] ml-auto">{spec.unit}</Badge>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Checklist Preview */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Checklist items:</h4>
                                <div className="space-y-1">
                                    {selectedTemplate.checklist.slice(0, 4).map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                    {selectedTemplate.checklist.length > 4 && (
                                        <p className="text-xs text-muted-foreground pl-6">
                                            +{selectedTemplate.checklist.length - 4} meer...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Annuleren
                        </Button>
                        <Button onClick={handleConfirm} className="gap-2">
                            <Check className="w-4 h-4" />
                            Template Toepassen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
