"use client"

import { useState, useEffect, useRef } from "react"
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
    AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { useAuthStore } from "@/lib/auth"
import { getDocuments } from "@/lib/db-actions"
import { uploadFile, deleteFile } from "@/lib/storage"

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

interface DocumentsPanelProps {
    leadId?: string
}

export function DocumentsPanel({ leadId }: DocumentsPanelProps = {}) {
    const { currentUser } = useAuthStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [uploadCategory, setUploadCategory] = useState<string>("overig")
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [pendingFiles, setPendingFiles] = useState<File[]>([])
    const [deleteConfirm, setDeleteConfirm] = useState<Document | null>(null)

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

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        if (files.length > 0) {
            setPendingFiles(files)
            setIsUploadDialogOpen(true)
        }
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
            formData.append('category', uploadCategory)
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
        setIsUploadDialogOpen(false)
        setPendingFiles([])
        setUploadCategory("overig")

        if (successCount > 0) {
            toast.success(`${successCount} bestand${successCount > 1 ? 'en' : ''} geüpload`)
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} bestand${errorCount > 1 ? 'en' : ''} mislukt`)
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
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

    const handleDownload = (doc: Document) => {
        // Check if it's a placeholder URL (not a real file)
        if (doc.url.startsWith('/documents/') || doc.url.startsWith('/uploads/')) {
            toast.error("Download niet beschikbaar", {
                description: "Bestand is opgeslagen in database maar niet in cloud storage. Configureer Supabase Storage om downloads te activeren."
            })
            return
        }
        window.open(doc.url, '_blank')
    }

    const handlePreview = (doc: Document) => {
        // Check if it's a placeholder URL (not a real file)
        if (doc.url.startsWith('/documents/') || doc.url.startsWith('/uploads/')) {
            toast.error("Preview niet beschikbaar", {
                description: "Bestand is opgeslagen in database maar niet in cloud storage."
            })
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
                                    ({documents.length})
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
                                onClick={() => fileInputRef.current?.click()}
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
                    {filteredDocuments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Nog geen documenten</p>
                            <p className="text-xs mt-1">Upload bestanden om te beginnen</p>
                        </div>
                    ) : (
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
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteConfirm(doc)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload Category Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bestanden Uploaden</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Geselecteerde bestanden</label>
                            <div className="space-y-1">
                                {pendingFiles.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                                        <File className="w-4 h-4" />
                                        <span className="truncate flex-1">{file.name}</span>
                                        <span className="text-muted-foreground text-xs">
                                            {formatFileSize(file.size)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categorie</label>
                            <Select value={uploadCategory} onValueChange={setUploadCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsUploadDialogOpen(false)
                                setPendingFiles([])
                            }}
                        >
                            Annuleren
                        </Button>
                        <Button onClick={handleUpload} disabled={isUploading}>
                            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isUploading ? "Uploaden..." : "Uploaden"}
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
