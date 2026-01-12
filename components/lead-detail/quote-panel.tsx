"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useParams } from "next/navigation"
import { useLeadStore, QuoteLineItem } from "@/lib/store"
import { toast } from "sonner"
import { FileText, Clock, CheckCircle2, XCircle, Send, Eye, Plus, Trash2, Euro, Calculator, MessageSquare, Loader2 } from "lucide-react"
import { DocumentPreview } from "@/components/templates/document-preview"

export function QuotePanel() {
    const params = useParams()
    const { leads, submitQuoteForApproval, updateLeadStatus } = useLeadStore()
    const leadId = params.id as string
    const lead = leads.find(l => l.id === leadId)

    // Custom quote input state
    const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
        { description: "", amount: 0 }
    ])
    const [estimatedHours, setEstimatedHours] = useState<number>(0)
    const [description, setDescription] = useState("")
    const [previewOpen, setPreviewOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSending, setIsSending] = useState(false)

    // Load existing quote data if available
    useEffect(() => {
        if (lead?.quoteLineItems && lead.quoteLineItems.length > 0) {
            setLineItems(lead.quoteLineItems)
        }
        if (lead?.quoteDescription) {
            setDescription(lead.quoteDescription)
        }
        if (lead?.quoteEstimatedHours) {
            setEstimatedHours(lead.quoteEstimatedHours)
        }
    }, [lead?.id])

    const addLineItem = () => {
        setLineItems([...lineItems, { description: "", amount: 0 }])
    }

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index))
        }
    }

    const updateLineItem = (index: number, field: keyof QuoteLineItem, value: string | number) => {
        const updated = [...lineItems]
        if (field === 'amount') {
            updated[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value
        } else {
            updated[index][field] = value as string
        }
        setLineItems(updated)
    }

    const calculateTotal = () => {
        return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    }

    const getValidLineItems = () => {
        return lineItems.filter(item => item.description.trim() && item.amount > 0)
    }

    const handleSubmitForApproval = async () => {
        const validItems = getValidLineItems()
        if (validItems.length === 0) {
            toast.error("Voeg minimaal één regel toe", {
                description: "Vul een beschrijving en bedrag in."
            })
            return
        }

        if (calculateTotal() <= 0) {
            toast.error("Offertebedrag moet groter zijn dan €0")
            return
        }

        setIsSubmitting(true)
        
        try {
            const success = await submitQuoteForApproval(leadId, {
                quoteValue: calculateTotal(),
                quoteDescription: description,
                quoteLineItems: validItems,
                quoteEstimatedHours: estimatedHours || undefined
            })
            
            if (success) {
                toast.info("Offerte ingediend ter goedkeuring", {
                    description: `€${calculateTotal().toLocaleString('nl-NL', { minimumFractionDigits: 2 })} wacht op admin beoordeling.`
                })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSendQuote = async () => {
        setIsSending(true)
        
        try {
            const success = await updateLeadStatus(leadId, "Offerte Verzonden")
            
            if (success) {
                setPreviewOpen(false)
                toast.success("Offerte verzonden naar klant!", {
                    description: `Email verstuurd naar ${lead?.clientName}. Status automatisch bijgewerkt.`
                })
            }
        } finally {
            setIsSending(false)
        }
    }

    const approvalStatus = lead?.quoteApproval || "none"
    const isEditable = approvalStatus === "none" || approvalStatus === "rejected"

    if (!lead) return null

    return (
        <>
            <Card className="h-full flex flex-col border-none shadow-none bg-slate-50 dark:bg-slate-900/50">
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Offerte Opstellen
                            </CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-400">
                                Voer een custom offertebedrag in met onderbouwing.
                            </CardDescription>
                        </div>
                        {approvalStatus === "pending" && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 gap-1 font-medium">
                                <Clock className="w-3 h-3" /> Wacht op Goedkeuring
                            </Badge>
                        )}
                        {approvalStatus === "approved" && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 gap-1 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Goedgekeurd
                            </Badge>
                        )}
                        {approvalStatus === "rejected" && (
                            <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300 gap-1 font-medium">
                                <XCircle className="w-3 h-3" /> Afgekeurd
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 overflow-auto">
                    {/* Rejection feedback */}
                    {approvalStatus === "rejected" && lead.quoteFeedback && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-red-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Admin Feedback:</p>
                                    {lead.quoteFeedback.filter(f => f.type === 'rejection').slice(-1).map(f => (
                                        <p key={f.id} className="text-sm text-red-700 dark:text-red-300 mt-1">
                                            "{f.message}" – {f.authorName}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Line Items */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Offerteregels
                        </label>
                        
                        <div className="space-y-2">
                            {lineItems.map((item, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Omschrijving (bijv. Constructieberekening dakkapel)"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                        disabled={!isEditable || isSubmitting}
                                        className="flex-1 bg-white dark:bg-slate-800"
                                    />
                                    <div className="relative w-32">
                                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            type="number"
                                            placeholder="0,00"
                                            value={item.amount || ''}
                                            onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                                            disabled={!isEditable || isSubmitting}
                                            className="pl-8 bg-white dark:bg-slate-800 font-mono"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    {lineItems.length > 1 && isEditable && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeLineItem(index)}
                                            disabled={isSubmitting}
                                            className="h-10 w-10 text-slate-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isEditable && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addLineItem}
                                disabled={isSubmitting}
                                className="gap-1 text-slate-600"
                            >
                                <Plus className="w-4 h-4" />
                                Regel Toevoegen
                            </Button>
                        )}
                    </div>

                    {/* Estimated Hours */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Geschatte Uren (optioneel)
                        </label>
                        <Input
                            type="number"
                            placeholder="bijv. 8"
                            value={estimatedHours || ''}
                            onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                            disabled={!isEditable || isSubmitting}
                            className="w-32 bg-white dark:bg-slate-800"
                            min="0"
                            step="0.5"
                        />
                    </div>

                    {/* Description / Justification */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Onderbouwing / Notities
                        </label>
                        <Textarea
                            placeholder="Leg uit waarom dit bedrag passend is voor dit project. Bijv. complexiteit, speciale omstandigheden, referentie naar vergelijkbare projecten..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={!isEditable || isSubmitting}
                            className="min-h-[100px] bg-white dark:bg-slate-800"
                        />
                    </div>

                    <Separator className="bg-slate-200 dark:bg-slate-700" />

                    {/* Live Quote Summary */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Offerte Samenvatting
                        </div>
                        <div className="space-y-2 text-sm">
                            {getValidLineItems().length > 0 ? (
                                getValidLineItems().map((item, index) => (
                                    <div key={index} className="flex justify-between text-slate-700 dark:text-slate-300">
                                        <span className="truncate mr-4">{item.description}</span>
                                        <span className="font-mono whitespace-nowrap">€ {item.amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-slate-400 italic">Voeg offerteregels toe...</div>
                            )}
                        </div>
                        <Separator className="bg-slate-200 dark:bg-slate-700" />
                        <div className="flex justify-between items-end pt-1">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Totaal (excl. BTW)</span>
                            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                                € {(lead?.quoteValue || calculateTotal()).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>incl. BTW (21%)</span>
                            <span className="font-mono">
                                € {((lead?.quoteValue || calculateTotal()) * 1.21).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        {estimatedHours > 0 && (
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>Geschatte uren</span>
                                <span>{estimatedHours} uur</span>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-3 pt-0 pb-6">
                    {approvalStatus === "none" || approvalStatus === "rejected" ? (
                        <>
                            <Button 
                                variant="outline"
                                className="w-full gap-2 h-11 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" 
                                onClick={() => setPreviewOpen(true)}
                                disabled={getValidLineItems().length === 0 || isSubmitting}
                            >
                                <Eye className="w-4 h-4" />
                                Voorbeeld Bekijken
                            </Button>
                            <Button 
                                className="w-full gap-2 h-12 text-base shadow-lg shadow-slate-900/10 bg-slate-900 hover:bg-slate-800 text-white" 
                                size="lg"
                                onClick={handleSubmitForApproval}
                                disabled={getValidLineItems().length === 0 || calculateTotal() <= 0 || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <FileText className="w-5 h-5" />
                                )}
                                {isSubmitting ? 'Indienen...' : 'Indienen ter Goedkeuring'}
                            </Button>
                        </>
                    ) : approvalStatus === "pending" ? (
                        <>
                            <Button 
                                variant="outline"
                                className="w-full gap-2 h-11 border-slate-300 dark:border-slate-600" 
                                onClick={() => setPreviewOpen(true)}
                            >
                                <Eye className="w-4 h-4" />
                                Voorbeeld Bekijken
                            </Button>
                            <Button 
                                className="w-full gap-2 h-12 text-base" 
                                size="lg"
                                disabled
                                variant="outline"
                            >
                                <Clock className="w-5 h-5" />
                                Wachten op Admin...
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button 
                                variant="outline"
                                className="w-full gap-2 h-11 border-slate-300 dark:border-slate-600" 
                                onClick={() => setPreviewOpen(true)}
                                disabled={isSending}
                            >
                                <Eye className="w-4 h-4" />
                                Voorbeeld Bekijken
                            </Button>
                            <Button 
                                className="w-full gap-2 h-12 text-base shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white" 
                                size="lg"
                                onClick={handleSendQuote}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                                {isSending ? 'Verzenden...' : 'Verzenden naar Klant'}
                            </Button>
                        </>
                    )}
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                        {approvalStatus === "none" && "Offertes vereisen goedkeuring door een admin."}
                        {approvalStatus === "pending" && "Je ontvangt bericht zodra de offerte is beoordeeld."}
                        {approvalStatus === "approved" && "Klik om de offerte naar de klant te verzenden."}
                        {approvalStatus === "rejected" && "Pas de offerte aan en dien opnieuw in."}
                    </p>
                </CardFooter>
            </Card>

            <DocumentPreview
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                lead={lead}
                items={getValidLineItems().map(item => ({ description: item.description, amount: item.amount }))}
                total={lead?.quoteValue || calculateTotal()}
                onSend={handleSendQuote}
            />
        </>
    )
}
