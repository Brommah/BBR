"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
    Mail,
    Plus,
    Save,
    Eye,
    Trash2,
    Copy,
    RefreshCw,
    Loader2,
    Code,
    FileText,
    Check,
    X,
    Pencil,
    ChevronRight
} from "lucide-react"
import {
    getAllEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    seedDefaultEmailTemplates
} from "@/lib/db-actions"
import { cn } from "@/lib/utils"

interface EmailTemplate {
    id: string
    name: string
    subject: string
    body: string
    variables: string[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

/**
 * Email Templates Panel for Admin
 * Allows viewing, editing, and creating email templates stored in the database.
 */
export function EmailTemplatesPanel() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
    const [editMode, setEditMode] = useState(false)
    const [isNewTemplate, setIsNewTemplate] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    // Edit form state
    const [editForm, setEditForm] = useState({
        name: "",
        subject: "",
        body: "",
        variables: [] as string[],
        isActive: true
    })

    // Preview data state
    const [previewData, setPreviewData] = useState<Record<string, string>>({
        client_name: "J. de Vries",
        project_type: "Dakkapel",
        address: "Keizersgracht 123",
        city: "Amsterdam",
        engineer_name: "Angelo",
        quote_value: "585,00",
        quote_valid_until: "15 februari 2026",
        quote_total: "707,85",
        order_number: "OPD-2026-0042",
        expected_delivery_date: "28 januari 2026",
        invoice_number: "FACT-2026-0042",
        invoice_total: "707,85",
        payment_due_date: "10 februari 2026"
    })

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getAllEmailTemplates()
            if (result.success && result.data) {
                setTemplates(result.data as EmailTemplate[])
                // Auto-select first template if none selected
                if (!selectedTemplateId && (result.data as EmailTemplate[]).length > 0) {
                    setSelectedTemplateId((result.data as EmailTemplate[])[0].id)
                }
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error)
            toast.error('Kon templates niet laden')
        } finally {
            setIsLoading(false)
        }
    }, [selectedTemplateId])

    useEffect(() => {
        fetchTemplates()
    }, [fetchTemplates])

    // Update edit form when template selection changes
    useEffect(() => {
        if (selectedTemplate && !editMode) {
            setEditForm({
                name: selectedTemplate.name,
                subject: selectedTemplate.subject,
                body: selectedTemplate.body,
                variables: selectedTemplate.variables as string[],
                isActive: selectedTemplate.isActive
            })
        }
    }, [selectedTemplate, editMode])

    const handleSeedDefaults = async () => {
        setIsSaving(true)
        try {
            const result = await seedDefaultEmailTemplates()
            if (result.success) {
                const data = result.data as { seeded: number }
                if (data.seeded > 0) {
                    toast.success(`${data.seeded} standaard templates aangemaakt`)
                    await fetchTemplates()
                } else {
                    toast.info('Templates bestaan al')
                }
            } else {
                toast.error('Kon templates niet aanmaken')
            }
        } catch {
            toast.error('Er ging iets mis')
        } finally {
            setIsSaving(false)
        }
    }

    const handleStartEdit = () => {
        if (selectedTemplate) {
            setEditForm({
                name: selectedTemplate.name,
                subject: selectedTemplate.subject,
                body: selectedTemplate.body,
                variables: selectedTemplate.variables as string[],
                isActive: selectedTemplate.isActive
            })
            setEditMode(true)
            setIsNewTemplate(false)
        }
    }

    const handleStartNew = () => {
        setEditForm({
            name: "",
            subject: "",
            body: "",
            variables: [],
            isActive: true
        })
        setEditMode(true)
        setIsNewTemplate(true)
        setSelectedTemplateId(null)
    }

    const handleCancelEdit = () => {
        setEditMode(false)
        setIsNewTemplate(false)
        if (selectedTemplate) {
            setEditForm({
                name: selectedTemplate.name,
                subject: selectedTemplate.subject,
                body: selectedTemplate.body,
                variables: selectedTemplate.variables as string[],
                isActive: selectedTemplate.isActive
            })
        }
    }

    const handleSave = async () => {
        if (!editForm.name.trim() || !editForm.subject.trim()) {
            toast.error('Naam en onderwerp zijn verplicht')
            return
        }

        setIsSaving(true)
        try {
            // Extract variables from subject and body
            const allText = editForm.subject + " " + editForm.body
            const variableMatches = allText.match(/\{\{([^}]+)\}\}/g) || []
            const extractedVars = [...new Set(variableMatches.map(v => v.replace(/\{\{|\}\}/g, '').trim()))]

            if (isNewTemplate) {
                const result = await createEmailTemplate({
                    name: editForm.name.trim(),
                    subject: editForm.subject.trim(),
                    body: editForm.body,
                    variables: extractedVars
                })
                if (result.success && result.data) {
                    toast.success('Template aangemaakt')
                    await fetchTemplates()
                    setSelectedTemplateId((result.data as EmailTemplate).id)
                    setEditMode(false)
                    setIsNewTemplate(false)
                } else {
                    toast.error(result.error || 'Kon template niet aanmaken')
                }
            } else if (selectedTemplateId) {
                const result = await updateEmailTemplate(selectedTemplateId, {
                    name: editForm.name.trim(),
                    subject: editForm.subject.trim(),
                    body: editForm.body,
                    variables: extractedVars,
                    isActive: editForm.isActive
                })
                if (result.success) {
                    toast.success('Template opgeslagen')
                    await fetchTemplates()
                    setEditMode(false)
                } else {
                    toast.error(result.error || 'Kon template niet opslaan')
                }
            }
        } catch {
            toast.error('Er ging iets mis')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedTemplateId) return

        setIsSaving(true)
        try {
            const result = await deleteEmailTemplate(selectedTemplateId)
            if (result.success) {
                toast.success('Template verwijderd')
                setShowDeleteDialog(false)
                setSelectedTemplateId(null)
                await fetchTemplates()
            } else {
                toast.error(result.error || 'Kon template niet verwijderen')
            }
        } catch {
            toast.error('Er ging iets mis')
        } finally {
            setIsSaving(false)
        }
    }

    const processTemplate = (text: string) => {
        let processed = text
        Object.entries(previewData).forEach(([key, value]) => {
            processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        })
        return processed
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Gekopieerd naar klembord')
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Empty state
    if (templates.length === 0 && !isNewTemplate) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardContent className="p-12 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Geen email templates</h3>
                    <p className="text-muted-foreground mb-6">
                        Begin met het aanmaken van standaard templates of maak een nieuwe aan.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={handleSeedDefaults} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            Standaard templates laden
                        </Button>
                        <Button variant="outline" onClick={handleStartNew}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nieuwe template
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template List */}
            <Card className="lg:col-span-1 flex flex-col h-[700px]">
                <CardHeader className="pb-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Templates</CardTitle>
                        <Button size="sm" variant="outline" onClick={handleStartNew}>
                            <Plus className="w-4 h-4 mr-1" />
                            Nieuw
                        </Button>
                    </div>
                    <CardDescription>
                        {templates.filter(t => t.isActive).length} actief van {templates.length}
                    </CardDescription>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <CardContent className="space-y-2 pt-0">
                        {templates.map(template => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => {
                                    setSelectedTemplateId(template.id)
                                    setEditMode(false)
                                    setIsNewTemplate(false)
                                }}
                                className={cn(
                                    "w-full p-3 rounded-lg border text-left transition-all",
                                    selectedTemplateId === template.id
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-transparent hover:border-border hover:bg-muted/50",
                                    !template.isActive && "opacity-50"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        template.isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm truncate">{template.name}</span>
                                            {!template.isActive && (
                                                <Badge variant="secondary" className="text-[10px]">Inactief</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {template.subject}
                                        </p>
                                    </div>
                                    <ChevronRight className={cn(
                                        "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
                                        selectedTemplateId === template.id && "text-primary rotate-90"
                                    )} />
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </ScrollArea>
            </Card>

            {/* Template Editor/Viewer */}
            <Card className="lg:col-span-2 flex flex-col h-[700px]">
                <CardHeader className="pb-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                {isNewTemplate ? "Nieuwe Template" : editMode ? "Template Bewerken" : "Template Details"}
                            </CardTitle>
                            <CardDescription>
                                {editMode 
                                    ? "Bewerk de template inhoud en sla op" 
                                    : "Klik op bewerken om wijzigingen aan te brengen"
                                }
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {editMode ? (
                                <>
                                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                        <X className="w-4 h-4 mr-1" />
                                        Annuleren
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                                        Opslaan
                                    </Button>
                                </>
                            ) : selectedTemplate ? (
                                <>
                                    <Button size="sm" variant="outline" onClick={() => setShowPreview(true)}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        Preview
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleStartEdit}>
                                        <Pencil className="w-4 h-4 mr-1" />
                                        Bewerken
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : null}
                        </div>
                    </div>
                </CardHeader>

                <ScrollArea className="flex-1">
                    <CardContent className="space-y-4">
                        {(selectedTemplate || isNewTemplate) ? (
                            <>
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Template Naam</label>
                                    {editMode ? (
                                        <Input
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            placeholder="bijv. intake-bevestiging"
                                            className="font-mono"
                                        />
                                    ) : (
                                        <div className="p-2.5 rounded-md bg-muted/50 font-mono text-sm">
                                            {selectedTemplate?.name}
                                        </div>
                                    )}
                                </div>

                                {/* Active Switch */}
                                {editMode && !isNewTemplate && (
                                    <div className="flex items-center justify-between p-3 rounded-lg border">
                                        <div>
                                            <p className="text-sm font-medium">Template actief</p>
                                            <p className="text-xs text-muted-foreground">Inactieve templates worden niet gebruikt</p>
                                        </div>
                                        <Switch
                                            checked={editForm.isActive}
                                            onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                                        />
                                    </div>
                                )}

                                {/* Subject */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        Onderwerp
                                    </label>
                                    {editMode ? (
                                        <Input
                                            value={editForm.subject}
                                            onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                            placeholder="Email onderwerp met {{variabelen}}"
                                        />
                                    ) : (
                                        <div className="p-2.5 rounded-md bg-muted/50 text-sm">
                                            {selectedTemplate?.subject}
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            Inhoud (Markdown)
                                        </label>
                                        {!editMode && selectedTemplate && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7"
                                                onClick={() => copyToClipboard(selectedTemplate.body)}
                                            >
                                                <Copy className="w-3 h-3 mr-1" />
                                                Kopiëren
                                            </Button>
                                        )}
                                    </div>
                                    {editMode ? (
                                        <Textarea
                                            value={editForm.body}
                                            onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                                            placeholder="Email inhoud met {{variabelen}}..."
                                            className="min-h-[300px] font-mono text-sm"
                                        />
                                    ) : (
                                        <pre className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap font-mono overflow-x-auto max-h-[300px] overflow-y-auto">
                                            {selectedTemplate?.body}
                                        </pre>
                                    )}
                                </div>

                                {/* Variables */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Code className="w-4 h-4 text-muted-foreground" />
                                        Variabelen
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {(editMode ? (() => {
                                            const allText = editForm.subject + " " + editForm.body
                                            const matches = allText.match(/\{\{([^}]+)\}\}/g) || []
                                            return [...new Set(matches.map(v => v.replace(/\{\{|\}\}/g, '').trim()))]
                                        })() : (selectedTemplate?.variables as string[] || [])).map((v, i) => (
                                            <Badge key={i} variant="secondary" className="font-mono text-xs">
                                                {`{{${v}}}`}
                                            </Badge>
                                        ))}
                                        {(editMode ? (() => {
                                            const allText = editForm.subject + " " + editForm.body
                                            const matches = allText.match(/\{\{([^}]+)\}\}/g) || []
                                            return [...new Set(matches.map(v => v.replace(/\{\{|\}\}/g, '').trim()))]
                                        })() : (selectedTemplate?.variables as string[] || [])).length === 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                Geen variabelen gevonden. Gebruik {`{{variabele_naam}}`} in de tekst.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    Selecteer een template uit de lijst of maak een nieuwe aan.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </Card>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Email Preview</DialogTitle>
                        <DialogDescription>
                            Preview met testdata – pas variabelen aan hieronder
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 max-h-[50vh]">
                        <div className="p-4 bg-white dark:bg-slate-950 rounded-lg border space-y-4">
                            <div className="border-b pb-2">
                                <span className="text-xs text-muted-foreground block">Onderwerp:</span>
                                <span className="font-medium">{processTemplate(selectedTemplate?.subject || "")}</span>
                            </div>
                            <div className="whitespace-pre-wrap text-sm">
                                {processTemplate(selectedTemplate?.body || "")}
                            </div>
                        </div>
                    </ScrollArea>

                    <div className="border-t pt-4 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                            <RefreshCw className="w-3 h-3" /> Test Variabelen
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                            {(selectedTemplate?.variables as string[] || []).map((key) => (
                                <div key={key} className="text-xs">
                                    <span className="text-muted-foreground block mb-0.5 font-mono">{`{{${key}}}`}</span>
                                    <Input
                                        value={previewData[key] || ""}
                                        onChange={(e) => setPreviewData({ ...previewData, [key]: e.target.value })}
                                        className="h-7 text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Sluiten
                        </Button>
                        <Button onClick={() => copyToClipboard(processTemplate(selectedTemplate?.body || ""))}>
                            <Copy className="w-4 h-4 mr-2" />
                            Kopieer tekst
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Template verwijderen?</DialogTitle>
                        <DialogDescription>
                            Weet je zeker dat je &quot;{selectedTemplate?.name}&quot; wilt verwijderen? 
                            De template wordt gedeactiveerd en kan later eventueel hersteld worden.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Annuleren
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Verwijderen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
