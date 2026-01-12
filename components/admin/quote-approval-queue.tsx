"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useLeadStore, QuoteLineItem } from "@/lib/store"
import { useAuthStore } from "@/lib/auth"
import { 
    CheckCircle2, 
    XCircle, 
    Eye, 
    Clock, 
    Euro, 
    FileText, 
    MessageSquare,
    AlertTriangle,
    User,
    Calculator,
    ChevronDown,
    ChevronUp,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface ReviewDialogState {
    isOpen: boolean
    leadId: string | null
    action: 'approve' | 'reject' | null
    adjustedValue?: number
    feedback: string
    isSubmitting: boolean
}

export function QuoteApprovalQueue() {
    const { leads, approveQuote, rejectQuote, isLoading } = useLeadStore()
    const { currentUser } = useAuthStore()
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>({
        isOpen: false,
        leadId: null,
        action: null,
        feedback: "",
        isSubmitting: false
    })
    
    const pendingQuotes = leads.filter(l => l.quoteApproval === "pending")

    const openReviewDialog = (id: string, action: 'approve' | 'reject') => {
        const lead = leads.find(l => l.id === id)
        setReviewDialog({
            isOpen: true,
            leadId: id,
            action,
            adjustedValue: lead?.quoteValue,
            feedback: "",
            isSubmitting: false
        })
    }

    const handleConfirmReview = async () => {
        if (!reviewDialog.leadId || !reviewDialog.action) return

        setReviewDialog(prev => ({ ...prev, isSubmitting: true }))

        try {
            if (reviewDialog.action === 'approve') {
                const success = await approveQuote(
                    reviewDialog.leadId, 
                    reviewDialog.feedback ? {
                        authorId: currentUser?.id || "admin",
                        authorName: currentUser?.name || "Admin",
                        message: reviewDialog.feedback
                    } : undefined,
                    reviewDialog.adjustedValue
                )
                
                if (success) {
                    const originalValue = leads.find(l => l.id === reviewDialog.leadId)?.quoteValue
                    toast.success("Offerte goedgekeurd!", {
                        description: reviewDialog.adjustedValue !== originalValue
                            ? `Bedrag aangepast naar €${reviewDialog.adjustedValue?.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`
                            : "De engineer kan nu de offerte verzenden."
                    })
                }
            } else {
                if (!reviewDialog.feedback.trim()) {
                    toast.error("Feedback vereist", {
                        description: "Geef feedback zodat de engineer de offerte kan aanpassen."
                    })
                    setReviewDialog(prev => ({ ...prev, isSubmitting: false }))
                    return
                }
                
                const success = await rejectQuote(reviewDialog.leadId, {
                    authorId: currentUser?.id || "admin",
                    authorName: currentUser?.name || "Admin",
                    message: reviewDialog.feedback
                })
                
                if (success) {
                    toast.error("Offerte afgekeurd", {
                        description: "De engineer ontvangt je feedback."
                    })
                }
            }

            setReviewDialog({
                isOpen: false,
                leadId: null,
                action: null,
                feedback: "",
                isSubmitting: false
            })
        } catch (error) {
            console.error('Review error:', error)
            setReviewDialog(prev => ({ ...prev, isSubmitting: false }))
        }
    }

    const currentLead = reviewDialog.leadId ? leads.find(l => l.id === reviewDialog.leadId) : null

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Offerte Goedkeuringsqueue
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Offerte Goedkeuringsqueue
                            </CardTitle>
                            <CardDescription>Beoordeel en verifieer ingediende offertes voordat ze naar klanten worden verzonden.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1 gap-1">
                            <Clock className="w-3 h-3" />
                            {pendingQuotes.length} Wachtend
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {pendingQuotes.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p>Geen openstaande offertes ter goedkeuring.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingQuotes.map((lead) => (
                                <div 
                                    key={lead.id} 
                                    className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
                                >
                                    {/* Main Row */}
                                    <div 
                                        className="p-4 flex items-center gap-4 cursor-pointer"
                                        onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                                    >
                                        {/* Expand indicator */}
                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            {expandedId === lead.id 
                                                ? <ChevronUp className="w-4 h-4 text-amber-600" />
                                                : <ChevronDown className="w-4 h-4 text-amber-600" />
                                            }
                                        </div>

                                        {/* Client info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold truncate">{lead.clientName}</span>
                                                <Badge variant="outline" className="text-xs">{lead.projectType}</Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <span>{lead.city}</span>
                                                {lead.address && <span>• {lead.address}</span>}
                                            </div>
                                        </div>

                                        {/* Engineer */}
                                        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="w-4 h-4" />
                                            <span>{lead.assignee || "Niet toegewezen"}</span>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <div className="text-xl font-bold font-mono">
                                                € {(lead.quoteValue || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                            </div>
                                            {lead.quoteEstimatedHours && (
                                                <div className="text-xs text-muted-foreground">
                                                    ~{lead.quoteEstimatedHours} uur
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-9 w-9 p-0"
                                                asChild
                                            >
                                                <Link href={`/leads/${lead.id}`}>
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="h-9 bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => openReviewDialog(lead.id, 'approve')}
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                Goedkeuren
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="destructive"
                                                className="h-9"
                                                onClick={() => openReviewDialog(lead.id, 'reject')}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Afkeuren
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedId === lead.id && (
                                        <div className="border-t bg-muted/30 p-4 space-y-4">
                                            {/* Line Items */}
                                            {lead.quoteLineItems && lead.quoteLineItems.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                        <FileText className="w-4 h-4" />
                                                        Offerteregels
                                                    </h4>
                                                    <div className="bg-card rounded-lg border p-3 space-y-2">
                                                        {lead.quoteLineItems.map((item: QuoteLineItem, index: number) => (
                                                            <div key={index} className="flex justify-between text-sm">
                                                                <span>{item.description}</span>
                                                                <span className="font-mono font-medium">
                                                                    € {item.amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        <Separator />
                                                        <div className="flex justify-between font-semibold">
                                                            <span>Totaal</span>
                                                            <span className="font-mono">
                                                                € {(lead.quoteValue || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Description / Justification */}
                                            {lead.quoteDescription && (
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4" />
                                                        Onderbouwing Engineer
                                                    </h4>
                                                    <div className="bg-card rounded-lg border p-3 text-sm text-muted-foreground">
                                                        {lead.quoteDescription}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Specifications */}
                                            {lead.specifications && lead.specifications.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-2">Projectspecificaties</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {lead.specifications.map((spec, index) => (
                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                {spec.key}: {spec.value}{spec.unit ? ` ${spec.unit}` : ''}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={reviewDialog.isOpen} onOpenChange={(open) => {
                if (!open && !reviewDialog.isSubmitting) {
                    setReviewDialog({
                        isOpen: false,
                        leadId: null,
                        action: null,
                        feedback: "",
                        isSubmitting: false
                    })
                }
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {reviewDialog.action === 'approve' 
                                ? <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Offerte Goedkeuren</>
                                : <><AlertTriangle className="w-5 h-5 text-red-600" /> Offerte Afkeuren</>
                            }
                        </DialogTitle>
                        <DialogDescription>
                            {reviewDialog.action === 'approve'
                                ? "Controleer het bedrag en voeg optioneel feedback toe."
                                : "Geef feedback zodat de engineer de offerte kan aanpassen."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Current Quote Info */}
                        {currentLead && (
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Klant</span>
                                    <span className="font-medium">{currentLead.clientName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Project</span>
                                    <span>{currentLead.projectType}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Engineer</span>
                                    <span>{currentLead.assignee || "Niet toegewezen"}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ingediend bedrag</span>
                                    <span className="font-mono font-bold">
                                        € {(currentLead.quoteValue || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Adjusted Value (only for approval) */}
                        {reviewDialog.action === 'approve' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Euro className="w-4 h-4" />
                                    Definitief Bedrag
                                </label>
                                <div className="relative">
                                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        value={reviewDialog.adjustedValue || ''}
                                        onChange={(e) => setReviewDialog({
                                            ...reviewDialog,
                                            adjustedValue: parseFloat(e.target.value) || 0
                                        })}
                                        disabled={reviewDialog.isSubmitting}
                                        className="pl-9 font-mono text-lg"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                {reviewDialog.adjustedValue !== currentLead?.quoteValue && (
                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Bedrag wijkt af van ingediend bedrag
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Feedback */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Feedback {reviewDialog.action === 'reject' && <span className="text-red-500">*</span>}
                            </label>
                            <Textarea
                                placeholder={reviewDialog.action === 'approve'
                                    ? "Optioneel: voeg feedback toe voor de engineer..."
                                    : "Verplicht: leg uit waarom de offerte wordt afgekeurd..."
                                }
                                value={reviewDialog.feedback}
                                onChange={(e) => setReviewDialog({
                                    ...reviewDialog,
                                    feedback: e.target.value
                                })}
                                disabled={reviewDialog.isSubmitting}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setReviewDialog({
                                isOpen: false,
                                leadId: null,
                                action: null,
                                feedback: "",
                                isSubmitting: false
                            })}
                            disabled={reviewDialog.isSubmitting}
                        >
                            Annuleren
                        </Button>
                        <Button
                            onClick={handleConfirmReview}
                            disabled={reviewDialog.isSubmitting}
                            className={reviewDialog.action === 'approve' 
                                ? "bg-emerald-600 hover:bg-emerald-700" 
                                : "bg-red-600 hover:bg-red-700"
                            }
                        >
                            {reviewDialog.isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : reviewDialog.action === 'approve' ? (
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                            ) : (
                                <XCircle className="w-4 h-4 mr-1" />
                            )}
                            {reviewDialog.isSubmitting 
                                ? 'Verwerken...' 
                                : reviewDialog.action === 'approve' 
                                    ? 'Goedkeuren' 
                                    : 'Afkeuren'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
