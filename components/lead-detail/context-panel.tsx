"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lead, ProjectSpec, useLeadStore, LeadStatus } from "@/lib/store"
import { MapPin, Phone, Mail, Building, ExternalLink, Plus, Pencil, Trash2, Save, X as XIcon, Euro, Hash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AssigneeSelector } from "./assignee-selector"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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

const PROJECT_TYPES = [
    "Dakkapel",
    "Uitbouw",
    "Draagmuur",
    "Fundering",
    "Verbouwing",
    "Nieuwbouw",
    "Renovatie",
    "Overig"
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
                            <div className={`w-2 h-2 rounded-full`} 
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

interface EditableFieldProps {
    label: string
    value: string
    onChange: (value: string) => void
    isEditing: boolean
    icon?: React.ReactNode
    type?: "text" | "email" | "tel" | "number"
    prefix?: string
    href?: string
}

function EditableField({ label, value, onChange, isEditing, icon, type = "text", prefix, href }: EditableFieldProps) {
    if (isEditing) {
        return (
            <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                {icon && <span className="text-slate-500 dark:text-slate-400">{icon}</span>}
                <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                        {label}
                    </label>
                    <div className="flex items-center gap-1">
                        {prefix && <span className="text-sm text-slate-500">{prefix}</span>}
                        <Input
                            type={type}
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value)}
                            className="h-7 text-sm bg-white dark:bg-slate-900"
                            placeholder={`${label}...`}
                        />
                    </div>
                </div>
            </div>
        )
    }

    const content = (
        <div className="flex items-center gap-3 p-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
            {icon && <span className="text-slate-500 dark:text-slate-400">{icon}</span>}
            <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
                    {label}
                </span>
                <span className="text-sm font-medium truncate block">
                    {prefix}{value || <span className="text-slate-400 italic">Niet ingevuld</span>}
                </span>
            </div>
            {href && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />}
        </div>
    )

    if (href && value) {
        return <a href={href}>{content}</a>
    }

    return content
}

export function ContextPanel({ lead }: { lead: Lead }) {
    const { updateLeadStatus, updateProjectSpecs, updateLead } = useLeadStore()
    const [isEditing, setIsEditing] = useState(false)
    
    // Editable lead fields
    const [editedLead, setEditedLead] = useState({
        clientName: lead.clientName,
        clientEmail: lead.clientEmail || "",
        clientPhone: lead.clientPhone || "",
        address: lead.address || "",
        city: lead.city,
        projectType: lead.projectType,
        value: lead.value,
        werknummer: lead.werknummer || "",
    })

    // Specs editing
    const [isEditingSpecs, setIsEditingSpecs] = useState(false)
    const [editedSpecs, setEditedSpecs] = useState<ProjectSpec[]>(lead.specifications || [])
    const [isAddingSpec, setIsAddingSpec] = useState(false)
    const [newSpec, setNewSpec] = useState<ProjectSpec>({ key: "", value: "", unit: "" })

    const handleSaveLead = () => {
        updateLead(lead.id, {
            clientName: editedLead.clientName,
            clientEmail: editedLead.clientEmail || null,
            clientPhone: editedLead.clientPhone || null,
            address: editedLead.address || null,
            city: editedLead.city,
            projectType: editedLead.projectType,
            value: editedLead.value,
        })
        setIsEditing(false)
        toast.success("Wijzigingen opgeslagen")
    }

    const handleCancelEdit = () => {
        setEditedLead({
            clientName: lead.clientName,
            clientEmail: lead.clientEmail || "",
            clientPhone: lead.clientPhone || "",
            address: lead.address || "",
            city: lead.city,
            projectType: lead.projectType,
            value: lead.value,
            werknummer: lead.werknummer || "",
        })
        setIsEditing(false)
    }

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
            <div className="h-40 bg-slate-900 relative rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600 group cursor-pointer hover:border-slate-400 transition-colors">
                {/* Mock Satellite Map */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800" />
                <div className="absolute inset-0 opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%)] bg-[length:10px_10px]" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <MapPin className="w-6 h-6 text-white/80 mx-auto mb-1" />
                        <span className="text-white font-medium text-sm">
                            {isEditing ? editedLead.address || editedLead.city : lead.address || lead.city}
                        </span>
                        <p className="text-white/60 text-[10px] mt-1">Klik om te openen in Maps</p>
                    </div>
                </div>
                
                {/* BAG Overlay */}
                <div className="absolute top-2 right-2 bg-white dark:bg-slate-800 shadow-lg p-2 rounded-lg text-[10px] border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Building className="w-3 h-3" />
                        <span>BAG Gevalideerd</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-4 flex-1 overflow-y-auto">
                {/* Header with edit toggle */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {isEditing ? "Bewerken" : "Projectgegevens"}
                    </h3>
                    {isEditing ? (
                        <div className="flex gap-1">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 px-2 text-xs"
                                onClick={handleCancelEdit}
                            >
                                <XIcon className="w-3 h-3 mr-1" /> Annuleren
                            </Button>
                            <Button 
                                size="sm" 
                                className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleSaveLead}
                            >
                                <Save className="w-3 h-3 mr-1" /> Opslaan
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-xs"
                            onClick={() => setIsEditing(true)}
                        >
                            <Pencil className="w-3 h-3 mr-1" /> Bewerken
                        </Button>
                    )}
                </div>

                {/* Client Name & Assignee */}
                <div className="space-y-2">
                    {isEditing ? (
                        <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                            <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                                Klantnaam
                            </label>
                            <Input
                                value={editedLead.clientName}
                                onChange={(e) => setEditedLead({ ...editedLead, clientName: e.target.value })}
                                className="h-8 text-base font-bold bg-white dark:bg-slate-900"
                            />
                        </div>
                    ) : (
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
                                    Klant
                                </span>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{lead.clientName}</h4>
                            </div>
                            <AssigneeSelector leadId={lead.id} currentAssignee={lead.assignee} />
                        </div>
                    )}
                </div>

                {/* Werknummer */}
                <EditableField
                    label="Werknummer"
                    value={editedLead.werknummer}
                    onChange={(v) => setEditedLead({ ...editedLead, werknummer: v })}
                    isEditing={isEditing}
                    icon={<Hash className="w-4 h-4" />}
                />

                {/* Project Type */}
                {isEditing ? (
                    <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block mb-1">
                            Projecttype
                        </label>
                        <Select 
                            value={editedLead.projectType} 
                            onValueChange={(v) => setEditedLead({ ...editedLead, projectType: v })}
                        >
                            <SelectTrigger className="h-8 bg-white dark:bg-slate-900">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PROJECT_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="rounded-sm uppercase tracking-wider text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 font-semibold">
                            {lead.projectType}
                        </Badge>
                        <Badge variant="secondary" className="rounded-sm uppercase tracking-wider text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold">
                            {lead.city}
                        </Badge>
                    </div>
                )}

                {/* Value */}
                <EditableField
                    label="Projectwaarde"
                    value={isEditing ? editedLead.value.toString() : lead.value.toLocaleString()}
                    onChange={(v) => setEditedLead({ ...editedLead, value: parseFloat(v) || 0 })}
                    isEditing={isEditing}
                    icon={<Euro className="w-4 h-4" />}
                    type="number"
                    prefix="€ "
                />

                {/* Status Selector */}
                <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">
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

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                {/* Contact Info */}
                <div className="space-y-1">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Contactgegevens
                    </h4>
                    <EditableField
                        label="E-mail"
                        value={isEditing ? editedLead.clientEmail : (lead.clientEmail || "")}
                        onChange={(v) => setEditedLead({ ...editedLead, clientEmail: v })}
                        isEditing={isEditing}
                        icon={<Mail className="w-4 h-4" />}
                        type="email"
                        href={lead.clientEmail ? `mailto:${lead.clientEmail}` : undefined}
                    />
                    <EditableField
                        label="Telefoon"
                        value={isEditing ? editedLead.clientPhone : (lead.clientPhone || "")}
                        onChange={(v) => setEditedLead({ ...editedLead, clientPhone: v })}
                        isEditing={isEditing}
                        icon={<Phone className="w-4 h-4" />}
                        type="tel"
                        href={lead.clientPhone ? `tel:${lead.clientPhone}` : undefined}
                    />
                    <EditableField
                        label="Adres"
                        value={isEditing ? editedLead.address : (lead.address || "")}
                        onChange={(v) => setEditedLead({ ...editedLead, address: v })}
                        isEditing={isEditing}
                        icon={<MapPin className="w-4 h-4" />}
                    />
                    {isEditing && (
                        <EditableField
                            label="Plaats"
                            value={editedLead.city}
                            onChange={(v) => setEditedLead({ ...editedLead, city: v })}
                            isEditing={isEditing}
                            icon={<Building className="w-4 h-4" />}
                        />
                    )}
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                {/* Project Specs - Configurable */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                                className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700 relative group"
                            >
                                {isEditingSpecs ? (
                                    <>
                                        <Input
                                            value={spec.key}
                                            onChange={(e) => handleUpdateSpec(index, 'key', e.target.value)}
                                            className="h-5 text-[10px] uppercase tracking-wider font-semibold mb-1 bg-transparent border-dashed p-1"
                                            placeholder="Naam..."
                                        />
                                        <div className="flex gap-1">
                                            <Input
                                                value={spec.value}
                                                onChange={(e) => handleUpdateSpec(index, 'value', e.target.value)}
                                                className="h-6 text-sm font-semibold bg-white dark:bg-slate-900 flex-1"
                                                placeholder="Waarde..."
                                            />
                                            <Input
                                                value={spec.unit || ''}
                                                onChange={(e) => handleUpdateSpec(index, 'unit', e.target.value)}
                                                className="h-6 text-sm w-10 bg-white dark:bg-slate-900"
                                                placeholder="eenheid"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteSpec(index)}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-2 h-2" />
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
                                className="bg-slate-50 dark:bg-slate-900 p-2 rounded-md border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                <span className="text-xs font-medium">Toevoegen</span>
                            </button>
                        )}
                    </div>

                    {specs.length === 0 && !isEditingSpecs && (
                        <div className="text-center py-3 text-slate-500 text-xs">
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
