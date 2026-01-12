"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
    FileText, 
    Image, 
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
    Plus
} from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Document {
    id: string
    name: string
    type: "pdf" | "image" | "spreadsheet" | "dwg" | "other"
    category: "tekening" | "offerte" | "foto" | "vergunning" | "correspondentie" | "overig"
    size: string
    uploadedAt: string
    uploadedBy: string
    status?: "pending" | "approved" | "final"
}

const mockDocuments: Document[] = [
    {
        id: "1",
        name: "Constructietekening_v2.pdf",
        type: "pdf",
        category: "tekening",
        size: "2.4 MB",
        uploadedAt: "2026-01-10",
        uploadedBy: "Angelo",
        status: "final"
    },
    {
        id: "2",
        name: "Dakkapel_situatie.jpg",
        type: "image",
        category: "foto",
        size: "1.8 MB",
        uploadedAt: "2026-01-09",
        uploadedBy: "Angelo"
    },
    {
        id: "3",
        name: "OFF-20260112-001.pdf",
        type: "pdf",
        category: "offerte",
        size: "156 KB",
        uploadedAt: "2026-01-12",
        uploadedBy: "System",
        status: "approved"
    },
    {
        id: "4",
        name: "Omgevingsvergunning.pdf",
        type: "pdf",
        category: "vergunning",
        size: "890 KB",
        uploadedAt: "2026-01-08",
        uploadedBy: "J. de Vries",
        status: "pending"
    },
    {
        id: "5",
        name: "Berekening_lasten.xlsx",
        type: "spreadsheet",
        category: "overig",
        size: "45 KB",
        uploadedAt: "2026-01-11",
        uploadedBy: "Angelo"
    }
]

const categoryLabels: Record<string, string> = {
    tekening: "Tekeningen",
    offerte: "Offertes",
    foto: "Foto's",
    vergunning: "Vergunningen",
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

export function DocumentsPanel({ leadId }: { leadId: string }) {
    const [documents, setDocuments] = useState<Document[]>(mockDocuments)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [uploadCategory, setUploadCategory] = useState<string>("overig")

    const getFileIcon = (type: string) => {
        switch (type) {
            case "pdf": return <FileText className="w-5 h-5 text-red-500" />
            case "image": return <Image className="w-5 h-5 text-purple-500" />
            case "spreadsheet": return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            case "dwg": return <File className="w-5 h-5 text-blue-500" />
            default: return <File className="w-5 h-5 text-slate-500" />
        }
    }

    const getStatusBadge = (status?: string) => {
        if (!status) return null
        switch (status) {
            case "final":
                return <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1 text-[10px]"><CheckCircle2 className="w-3 h-3" /> Definitief</Badge>
            case "approved":
                return <Badge className="bg-blue-100 text-blue-700 border-0 gap-1 text-[10px]"><CheckCircle2 className="w-3 h-3" /> Goedgekeurd</Badge>
            case "pending":
                return <Badge className="bg-amber-100 text-amber-700 border-0 gap-1 text-[10px]"><Clock className="w-3 h-3" /> In Behandeling</Badge>
            default:
                return null
        }
    }

    const handleUpload = () => {
        // Mock upload
        const newDoc: Document = {
            id: Date.now().toString(),
            name: "Nieuw_document.pdf",
            type: "pdf",
            category: uploadCategory as Document["category"],
            size: "1.2 MB",
            uploadedAt: new Date().toISOString().split('T')[0],
            uploadedBy: "Angelo"
        }
        setDocuments([newDoc, ...documents])
        setIsUploadOpen(false)
        toast.success("Document geüpload", {
            description: "Het bestand is toegevoegd aan het dossier."
        })
    }

    const handleDelete = (id: string) => {
        setDocuments(documents.filter(d => d.id !== id))
        toast.info("Document verwijderd")
    }

    const filteredDocuments = selectedCategory === "all" 
        ? documents 
        : documents.filter(d => d.category === selectedCategory)

    const categories = ["all", ...Object.keys(categoryLabels)]
    const documentCounts = categories.reduce((acc, cat) => {
        acc[cat] = cat === "all" ? documents.length : documents.filter(d => d.category === cat).length
        return acc
    }, {} as Record<string, number>)

    return (
        <Card className="h-full flex flex-col border-none shadow-none bg-slate-50/50 dark:bg-slate-900/30">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FolderOpen className="w-5 h-5 text-amber-600" />
                            Projectdossier
                        </CardTitle>
                        <CardDescription>{documents.length} documenten</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setIsUploadOpen(true)} className="gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col space-y-4">
                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedCategory === cat
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            {cat === "all" ? "Alle" : categoryLabels[cat]} ({documentCounts[cat]})
                        </button>
                    ))}
                </div>

                <Separator />

                {/* Document List */}
                <div className="flex-1 overflow-y-auto space-y-2">
                    {filteredDocuments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Geen documenten in deze categorie</p>
                        </div>
                    ) : (
                        filteredDocuments.map((doc) => (
                            <div 
                                key={doc.id}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                    {getFileIcon(doc.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm truncate">{doc.name}</p>
                                        {getStatusBadge(doc.status)}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="outline" className={`text-[10px] ${categoryColors[doc.category]}`}>
                                            {categoryLabels[doc.category]}
                                        </Badge>
                                        <span>•</span>
                                        <span>{doc.size}</span>
                                        <span>•</span>
                                        <Calendar className="w-3 h-3" />
                                        <span>{doc.uploadedAt}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(doc.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Quick Add Actions */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Snel Toevoegen</p>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="text-xs gap-1 h-8">
                            <Image className="w-3 h-3" /> Foto
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs gap-1 h-8">
                            <FileText className="w-3 h-3" /> Tekening
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs gap-1 h-8">
                            <Plus className="w-3 h-3" /> Ander
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Document Uploaden</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer">
                            <Upload className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                            <p className="text-sm font-medium">Sleep bestanden hierheen</p>
                            <p className="text-xs text-muted-foreground mt-1">of klik om te bladeren</p>
                            <Input type="file" className="hidden" />
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
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                            Annuleren
                        </Button>
                        <Button onClick={handleUpload} className="gap-2">
                            <Upload className="w-4 h-4" />
                            Uploaden
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
