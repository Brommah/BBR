"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lead, ProjectSpec, useLeadStore, LeadStatus } from "@/lib/store"
import { MapPin, Phone, Mail, Building, ExternalLink, Plus, Pencil, Trash2, Save, X as XIcon, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AssigneeSelector } from "./assignee-selector"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// Status configuration with colors
const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string; bgColor: string }[] = [
    { value: "Nieuw", label: "Nieuw", color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-950" },
    { value: "Calculatie", label: "Calculatie", color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-950" },
    { value: "Offerte Verzonden", label: "Offerte Verzonden", color: "text-purple-700", bgColor: "bg-purple-100 dark:bg-purple-950" },
    { value: "Opdracht", label: "Opdracht", color: "text-emerald-700", bgColor: "bg-emerald-100 dark:bg-emerald-950" },
    { value: "Archief", label: "Archief", color: "text-slate-600", bgColor: "bg-slate-100 dark:bg-slate-800" },
]

function StatusSelector({ currentStatus, onStatusChange }: { currentStatus: LeadStatus; onStatusChange: (status: LeadStatus) => void }) {
    const currentOption = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[0]
    
    return (
        <Select value={currentStatus} onValueChange={(v) => onStatusChange(v as LeadStatus)}>
            <SelectTrigger className={`h-10 font-semibold ${currentOption.bgColor} ${currentOption.color} border-0`}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                    <SelectItem 
                        key={status.value} 
                        value={status.value}
                        className="font-medium"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.bgColor.replace('bg-', 'bg-').replace('-100', '-500').replace('-950', '-400')}`} 
                                 style={{ 
                                     backgroundColor: status.value === "Nieuw" ? "#3b82f6" :
                                                      status.value === "Calculatie" ? "#f59e0b" :
                                                      status.value === "Offerte Verzonden" ? "#a855f7" :
                                                      status.value === "Opdracht" ? "#10b981" : "#64748b"
                                 }} 
                            />
                            {status.label}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export function ContextPanel({ lead }: { lead: Lead }) {
    const { updateLeadStatus, updateProjectSpecs } = useLeadStore()
    const router = useRouter()
    const [isEditingSpecs, setIsEditingSpecs] = useState(false)
    const [editedSpecs, setEditedSpecs] = useState<ProjectSpec[]>(lead.specifications || [])
    const [isAddingSpec, setIsAddingSpec] = useState(false)
    const [newSpec, setNewSpec] = useState<ProjectSpec>({ key: "", value: "", unit: "" })

    const handleSaveSpecs = () => {
        updateProjectSpecs(lead.id, editedSpecs)
        setIsEditingSpecs(false)
        toast.success("Specificaties opgeslagen")
    }

    const handleAddSpec = () => {
        if (!newSpec.key.trim() || !newSpec.value.trim()) {
            toast.error("Vul beide velden in")
            return
        }
        setEditedSpecs([...editedSpecs, { ...newSpec }])
        setNewSpec({ key: "", value: "", unit: "" })
        setIsAddingSpec(false)
    }

    const handleDeleteSpec = (index: number) => {
        setEditedSpecs(editedSpecs.filter((_, i) => i !== index))
    }

    const handleUpdateSpec = (index: number, field: keyof ProjectSpec, value: string) => {
        setEditedSpecs(editedSpecs.map((spec, i) => 
            i === index ? { ...spec, [field]: value } : spec
        ))
    }

    const specs = isEditingSpecs ? editedSpecs : (lead.specifications || [])

    return (
        <Card className="h-full flex flex-col overflow-hidden border-none shadow-none bg-transparent">
            {/* Map Section */}
            <div className="h-56 bg-slate-900 relative rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600 group cursor-pointer hover:border-slate-400 transition-colors">
                {/* Mock Satellite Map */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800" />
                <div className="absolute inset-0 opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%)] bg-[length:10px_10px]" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <MapPin className="w-8 h-8 text-white/80 mx-auto mb-2" />
                        <span className="text-white font-medium text-sm">
                            {lead.address || `${lead.city}`}
                        </span>
                        <p className="text-white/60 text-xs mt-1">Klik om te openen in Maps</p>
                    </div>
                </div>
                
                {/* BAG Overlay */}
                <div className="absolute top-3 right-3 bg-white dark:bg-slate-800 shadow-lg p-3 rounded-lg text-xs border-2 border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Building className="w-4 h-4" />
                        <span>BAG Gevalideerd</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="text-slate-700 dark:text-slate-300 space-y-1">
                        <p><span className="text-slate-500 dark:text-slate-400">Bouwjaar:</span> <span className="font-medium">1934</span></p>
                        <p><span className="text-slate-500 dark:text-slate-400">Oppervlakte:</span> <span className="font-medium">145m²</span></p>
                        <p><span className="text-slate-500 dark:text-slate-400">Functie:</span> <span className="font-medium">Wonen</span></p>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-6 flex-1 overflow-y-auto">
                {/* Client Header */}
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{lead.clientName}</h3>
                        <AssigneeSelector leadId={lead.id} currentAssignee={lead.assignee} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="rounded-sm uppercase tracking-wider text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 font-semibold">
                            {lead.projectType}
                        </Badge>
                        <Badge variant="secondary" className="rounded-sm uppercase tracking-wider text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold">
                            {lead.city}
                        </Badge>
                        {lead.isUrgent && (
                            <Badge className="rounded-sm text-[10px] bg-red-600 text-white border-0 font-semibold">
                                SPOED
                            </Badge>
                        )}
                    </div>

                    {/* Status Selector */}
                    <div className="mt-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                            Status
                        </label>
                        <StatusSelector 
                            currentStatus={lead.status} 
                            onStatusChange={(status) => {
                                updateLeadStatus(lead.id, status)
                                toast.success(`Status gewijzigd naar ${status}`)
                            }} 
                        />
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                    {lead.clientEmail && (
                        <a href={`mailto:${lead.clientEmail}`} className="flex items-center gap-3 p-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                            <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-sm">{lead.clientEmail}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 ml-auto" />
                        </a>
                    )}
                    {lead.clientPhone && (
                        <a href={`tel:${lead.clientPhone}`} className="flex items-center gap-3 p-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                            <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-sm">{lead.clientPhone}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 ml-auto" />
                        </a>
                    )}
                    <div className="flex items-center gap-3 p-2 rounded-md text-slate-700 dark:text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm">{lead.address || lead.city}</span>
                    </div>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                {/* Project Specs - Configurable */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Project Specificaties
                        </h4>
                        {isEditingSpecs ? (
                            <div className="flex gap-1">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                        setIsEditingSpecs(false)
                                        setEditedSpecs(lead.specifications || [])
                                    }}
                                >
                                    <XIcon className="w-3 h-3 mr-1" /> Annuleren
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                    onClick={handleSaveSpecs}
                                >
                                    <Save className="w-3 h-3 mr-1" /> Opslaan
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                    setEditedSpecs(lead.specifications || [])
                                    setIsEditingSpecs(true)
                                }}
                            >
                                <Pencil className="w-3 h-3 mr-1" /> Bewerken
                            </Button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        {specs.map((spec, index) => (
                            <div 
                                key={index} 
                                className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 relative group"
                            >
                                {isEditingSpecs ? (
                                    <>
                                        <Input
                                            value={spec.key}
                                            onChange={(e) => handleUpdateSpec(index, 'key', e.target.value)}
                                            className="h-6 text-[10px] uppercase tracking-wider font-semibold mb-1 bg-transparent border-dashed p-1"
                                            placeholder="Naam..."
                                        />
                                        <div className="flex gap-1">
                                            <Input
                                                value={spec.value}
                                                onChange={(e) => handleUpdateSpec(index, 'value', e.target.value)}
                                                className="h-7 text-sm font-semibold bg-white dark:bg-slate-900 flex-1"
                                                placeholder="Waarde..."
                                            />
                                            <Input
                                                value={spec.unit || ''}
                                                onChange={(e) => handleUpdateSpec(index, 'unit', e.target.value)}
                                                className="h-7 text-sm w-12 bg-white dark:bg-slate-900"
                                                placeholder="eenheid"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteSpec(index)}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="block text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">{spec.key}</span>
                                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                            {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                                        </span>
                                    </>
                                )}
                            </div>
                        ))}
                        
                        {isEditingSpecs && (
                            <button
                                onClick={() => setIsAddingSpec(true)}
                                className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-xs font-medium">Toevoegen</span>
                            </button>
                        )}
                    </div>

                    {specs.length === 0 && !isEditingSpecs && (
                        <div className="text-center py-4 text-slate-500 text-sm">
                            Geen specificaties. Klik op &quot;Bewerken&quot; om toe te voegen.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Spec Dialog */}
            <Dialog open={isAddingSpec} onOpenChange={setIsAddingSpec}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nieuwe Specificatie</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Naam</label>
                            <Input
                                value={newSpec.key}
                                onChange={(e) => setNewSpec({ ...newSpec, key: e.target.value })}
                                placeholder="bijv. Breedte, Oppervlakte, Type..."
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium">Waarde</label>
                                <Input
                                    value={newSpec.value}
                                    onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                                    placeholder="bijv. 4.5"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Eenheid</label>
                                <Input
                                    value={newSpec.unit || ''}
                                    onChange={(e) => setNewSpec({ ...newSpec, unit: e.target.value })}
                                    placeholder="m, m², kg"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingSpec(false)}>
                            Annuleren
                        </Button>
                        <Button onClick={handleAddSpec} className="bg-emerald-600 hover:bg-emerald-700">
                            Toevoegen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
