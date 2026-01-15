"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    FileText, 
    Image as ImageIcon, 
    FileSpreadsheet, 
    Download, 
    Trash2, 
    Upload, 
    Eye,
    Calendar,
    FolderOpen,
    File,
    CheckCircle2,
    Clock,
    Loader2,
    AlertCircle,
    CloudUpload,
    X,
    Monitor
} from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { useAuthStore } from "@/lib/auth"
import { getDocuments } from "@/lib/db-actions"
import { uploadFile, deleteFile } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { Lead, QuoteApprovalStatus } from "@/lib/store"

// Format file size for display (client-side utility)
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Document {
    id: string
    name: string
    type: string
    category: string
    size: number
    url: string
    status: string
    uploadedBy: string
    createdAt: string
}

const categoryLabels: Record<string, string> = {
    tekening: "Tekening",
    offerte: "Offerte",
    foto: "Foto",
    vergunning: "Vergunning",
    correspondentie: "Correspondentie",
    overig: "Overig"
}

const categoryColors: Record<string, string> = {
    tekening: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    offerte: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    foto: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    vergunning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    correspondentie: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    overig: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
}

/** Get icon for file type based on filename extension */
function getFileTypeIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
        case 'pdf': 
            return <FileText className="w-5 h-5 text-red-500" />
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp': 
            return <ImageIcon className="w-5 h-5 text-purple-500" />
        case 'xlsx':
        case 'xls':
        case 'csv': 
            return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
        case 'dwg':
        case 'dxf': 
            return <File className="w-5 h-5 text-blue-500" />
        default: 
            return <File className="w-5 h-5 text-slate-500" />
    }
}

interface DocumentsPanelProps {
    leadId?: string
    lead?: Lead
}

/** Get quote status display info */
function getQuoteStatusInfo(lead: Lead): { 
    label: string
    color: string
    icon: typeof CheckCircle2
} | null {
    if (!lead.quoteValue && !lead.quoteLineItems?.length) return null
    
    // Check lead status for "Opdracht" (accepted)
    if (lead.status === "Opdracht") {
        return {
            label: "Geaccepteerd",
            color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            icon: CheckCircle2
        }
    }
    
    // Check lead status for "Offerte Verzonden" (sent)
    if (lead.status === "Offerte Verzonden") {
        return {
            label: "Verzonden",
            color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
            icon: CheckCircle2
        }
    }
    
    // Check approval status
    switch (lead.quoteApproval) {
        case "approved":
            return {
                label: "Goedgekeurd",
                color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                icon: CheckCircle2
            }
        case "pending":
            return {
                label: "Wacht op goedkeuring",
                color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                icon: Clock
            }
        case "rejected":
            return {
                label: "Afgekeurd",
                color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                icon: AlertCircle
            }
        default:
            return {
                label: "Opgemaakt",
                color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                icon: FileText
            }
    }
}

export function DocumentsPanel({ leadId, lead }: DocumentsPanelProps = {}) {
    const { currentUser } = useAuthStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dropZoneRef = useRef<HTMLDivElement>(null)
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [pendingFiles, setPendingFiles] = useState<File[]>([])
    const [fileCategories, setFileCategories] = useState<Record<string, string>>({})
    const [deleteConfirm, setDeleteConfirm] = useState<Document | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    // Load documents from database
    useEffect(() => {
        async function loadDocuments() {
            if (!leadId) {
                setIsLoading(false)
                return
            }
            setIsLoading(true)
            
            const result = await getDocuments(leadId)
            if (result.success && result.data) {
                setDocuments(result.data as Document[])
            }
            setIsLoading(false)
        }
        
        loadDocuments()
    }, [leadId])

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "pdf": return <FileText className="w-5 h-5 text-red-500" />
            case "image": return <ImageIcon className="w-5 h-5 text-purple-500" />
            case "spreadsheet": return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            case "dwg": return <File className="w-5 h-5 text-blue-500" />
            default: return <File className="w-5 h-5 text-slate-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />Goedgekeurd
                </Badge>
            case "final":
                return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />Definitief
                </Badge>
            case "pending":
            default:
                return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-0 text-[10px]">
                    <Clock className="w-3 h-3 mr-1" />In behandeling
                </Badge>
        }
    }

    const filteredDocuments = selectedCategory === "all" 
        ? documents 
        : documents.filter(d => d.category === selectedCategory)

    /** Add files to pending list and initialize categories */
    const addFilesToPending = useCallback((files: File[]) => {
        if (files.length > 0) {
            setPendingFiles(prev => [...prev, ...files])
            // Initialize each file with default category based on extension
            const newCategories: Record<string, string> = {}
            files.forEach(file => {
                const ext = file.name.split('.').pop()?.toLowerCase()
                // Smart default category based on file type
                if (['pdf', 'dwg', 'dxf'].includes(ext || '')) {
                    newCategories[file.name] = 'tekening'
                } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
                    newCategories[file.name] = 'foto'
                } else if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
                    newCategories[file.name] = 'offerte'
                } else {
                    newCategories[file.name] = 'overig'
                }
            })
            setFileCategories(prev => ({ ...prev, ...newCategories }))
        }
    }, [])

    /** Handle drag events for drop zone */
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // Only set dragging to false if we're leaving the drop zone entirely
        if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
            setIsDragging(false)
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        
        const files = Array.from(e.dataTransfer.files)
        addFilesToPending(files)
    }, [addFilesToPending])

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        addFilesToPending(files)
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const removeFile = (fileName: string) => {
        setPendingFiles(prev => prev.filter(f => f.name !== fileName))
        setFileCategories(prev => {
            const newCategories = { ...prev }
            delete newCategories[fileName]
            return newCategories
        })
    }

    const updateFileCategory = (fileName: string, category: string) => {
        setFileCategories(prev => ({ ...prev, [fileName]: category }))
    }

    const handleOpenUploadDialog = () => {
        setIsUploadDialogOpen(true)
    }

    const handleCloseUploadDialog = () => {
        setIsUploadDialogOpen(false)
        setPendingFiles([])
        setFileCategories({})
    }

    const handleUpload = async () => {
        if (!currentUser || pendingFiles.length === 0 || !leadId) return
        setIsUploading(true)

        let successCount = 0
        let errorCount = 0

        for (const file of pendingFiles) {
            // Create FormData for server action
            const formData = new FormData()
            formData.append('file', file)
            formData.append('leadId', leadId)
            formData.append('category', fileCategories[file.name] || 'overig')
            formData.append('uploadedBy', currentUser.name)

            const result = await uploadFile(formData)
            if (result.success) {
                successCount++
            } else {
                errorCount++
                console.error('Upload error:', result.error)
            }
        }

        // Refresh documents list after all uploads
        if (successCount > 0) {
            const docsResult = await getDocuments(leadId)
            if (docsResult.success && docsResult.data) {
                setDocuments(docsResult.data as Document[])
            }
        }

        setIsUploading(false)
        handleCloseUploadDialog()

        if (successCount > 0) {
            toast.success(`${successCount} bestand${successCount > 1 ? 'en' : ''} geüpload`)
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} bestand${errorCount > 1 ? 'en' : ''} mislukt`)
        }
    }

    const handleDelete = async (doc: Document) => {
        const result = await deleteFile(doc.id, doc.url)
        if (result.success) {
            setDocuments(documents.filter(d => d.id !== doc.id))
            toast.success("Document verwijderd")
        } else {
            toast.error("Kon document niet verwijderen")
        }
        setDeleteConfirm(null)
    }

    // Check if document has a real cloud storage URL
    const isPlaceholderUrl = (url: string) => {
        return url.startsWith('/documents/') || 
               url.startsWith('/uploads/') || 
               url.startsWith('/demo/')
    }

    const handleDownload = (doc: Document) => {
        // Check if it's a placeholder URL (not a real file)
        if (isPlaceholderUrl(doc.url)) {
            if (doc.url.startsWith('/demo/')) {
                toast.info("Demo bestand", {
                    description: "Dit is een demo bestand en kan niet worden gedownload."
                })
            } else {
                toast.error("Download niet beschikbaar", {
                    description: "Upload mislukt - verwijder dit bestand en upload opnieuw."
                })
            }
            return
        }
        // Open in new tab for actual file downloads
        window.open(doc.url, '_blank')
    }

    const handlePreview = (doc: Document) => {
        // Check if it's a placeholder URL (not a real file)
        if (isPlaceholderUrl(doc.url)) {
            if (doc.url.startsWith('/demo/')) {
                toast.info("Demo bestand", {
                    description: "Dit is een demo bestand en heeft geen preview."
                })
            } else {
                toast.error("Preview niet beschikbaar", {
                    description: "Upload mislukt - verwijder dit bestand en upload opnieuw."
                })
            }
            return
        }
        window.open(doc.url, '_blank')
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FolderOpen className="w-5 h-5" />
                                Documenten
                                <span className="text-sm font-normal text-muted-foreground">
                                    ({documents.length + (lead && getQuoteStatusInfo(lead) ? 1 : 0)})
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Tekeningen, offertes, foto&apos;s en correspondentie
                            </CardDescription>
                        </div>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.csv,.dwg,.dxf"
                            />
                            <Button 
                                size="sm" 
                                className="gap-2"
                                onClick={handleOpenUploadDialog}
                            >
                                <Upload className="w-4 h-4" />
                                Upload
                            </Button>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-1 mt-3 flex-wrap">
                        <Button
                            variant={selectedCategory === "all" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setSelectedCategory("all")}
                        >
                            Alles
                        </Button>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                            <Button
                                key={key}
                                variant={selectedCategory === key ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setSelectedCategory(key)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-4">
                    {/* Quote Document (if exists) */}
                    {lead && (selectedCategory === "all" || selectedCategory === "offerte") && (() => {
                        const quoteStatus = getQuoteStatusInfo(lead)
                        if (!quoteStatus) return null
                        
                        const QuoteIcon = quoteStatus.icon
                        const quoteTotal = lead.quoteValue || lead.quoteLineItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
                        
                        return (
                            <div className="mb-4">
                                <div
                                    className="group flex items-center gap-3 p-3 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                                >
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-foreground">
                                            Offerte - {lead.clientName}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge className={`${categoryColors.offerte} border-0 text-[10px]`}>
                                                Offerte
                                            </Badge>
                                            <Badge className={`${quoteStatus.color} border-0 text-[10px] gap-1`}>
                                                <QuoteIcon className="w-3 h-3" />
                                                {quoteStatus.label}
                                            </Badge>
                                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                                €{quoteTotal.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {lead.quoteLineItems && lead.quoteLineItems.length > 0 && (
                                            <div className="mt-2 text-[10px] text-muted-foreground">
                                                {lead.quoteLineItems.length} regel{lead.quoteLineItems.length !== 1 ? 's' : ''}: {' '}
                                                {lead.quoteLineItems.slice(0, 2).map(item => item.description).join(', ')}
                                                {lead.quoteLineItems.length > 2 && ` +${lead.quoteLineItems.length - 2} meer`}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8"
                                            onClick={() => {
                                                // Navigate to quote tab
                                                toast.info("Bekijk de offerte in het Offerte paneel rechts")
                                            }}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}

                    {filteredDocuments.length === 0 && !(lead && getQuoteStatusInfo(lead)) ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Nog geen documenten</p>
                            <p className="text-xs mt-1">Upload bestanden om te beginnen</p>
                        </div>
                    ) : filteredDocuments.length > 0 ? (
                        <div className="space-y-2">
                            {filteredDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
                                >
                                    <div className="flex-shrink-0">
                                        {getTypeIcon(doc.type)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate text-foreground">
                                            {doc.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className={`${categoryColors[doc.category]} border-0 text-[10px]`}>
                                                {categoryLabels[doc.category]}
                                            </Badge>
                                            {getStatusBadge(doc.status)}
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatFileSize(doc.size)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(doc.createdAt), "d MMM yyyy, HH:mm", { locale: nl })}
                                            <span>•</span>
                                            <span>{doc.uploadedBy}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {(doc.type === "pdf" || doc.type === "image") && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8"
                                                onClick={() => handlePreview(doc)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8"
                                            onClick={() => handleDownload(doc)}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        {/* Only admins can delete documents */}
                                        {currentUser?.role === 'admin' && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => setDeleteConfirm(doc)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* Upload Classification Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={(open) => !open && handleCloseUploadDialog()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CloudUpload className="w-5 h-5" />
                            Documenten Uploaden
                        </DialogTitle>
                        <DialogDescription>
                            Sleep bestanden hierheen of kies vanuit je computer. Classificeer elk document voor betere organisatie.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Drag and Drop Zone */}
                        <div
                            ref={dropZoneRef}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
                                isDragging 
                                    ? "border-primary bg-primary/5 scale-[1.02]" 
                                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                                    isDragging ? "bg-primary/10" : "bg-muted"
                                )}>
                                    <CloudUpload className={cn(
                                        "w-6 h-6 transition-colors",
                                        isDragging ? "text-primary" : "text-muted-foreground"
                                    )} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">
                                        {isDragging ? "Laat los om te uploaden" : "Sleep bestanden hierheen"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        of klik om te bladeren
                                    </p>
                                </div>
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm" 
                                    className="gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        fileInputRef.current?.click()
                                    }}
                                >
                                    <Monitor className="w-4 h-4" />
                                    Kies van computer
                                </Button>
                            </div>
                        </div>

                        {/* Selected Files with Classification */}
                        {pendingFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center justify-between">
                                    <span>Geselecteerde bestanden ({pendingFiles.length})</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        Selecteer een categorie per document
                                    </span>
                                </Label>
                                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                    {pendingFiles.map((file) => (
                                        <div 
                                            key={file.name} 
                                            className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border"
                                        >
                                            <div className="flex-shrink-0">
                                                {getFileTypeIcon(file.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                            <Select 
                                                value={fileCategories[file.name] || 'overig'} 
                                                onValueChange={(value) => updateFileCategory(file.name, value)}
                                            >
                                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                                        <SelectItem key={key} value={key} className="text-xs">
                                                            {label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeFile(file.name)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={handleCloseUploadDialog}
                        >
                            Annuleren
                        </Button>
                        <Button 
                            onClick={handleUpload} 
                            disabled={isUploading || pendingFiles.length === 0}
                            className="gap-2"
                        >
                            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isUploading 
                                ? "Uploaden..." 
                                : `Upload${pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ''}`
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            Document Verwijderen
                        </DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground">
                        Weet je zeker dat je <strong>{deleteConfirm?.name}</strong> wilt verwijderen? 
                        Dit kan niet ongedaan worden gemaakt.
                    </p>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            Annuleren
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                        >
                            Verwijderen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
