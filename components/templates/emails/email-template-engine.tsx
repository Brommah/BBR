"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Template {
    id: string
    name: string
    subject: string
    body: string
    variables: string[]
}

const defaultTemplates: Template[] = [
    {
        id: "1",
        name: "Intake Bevestiging",
        subject: "Ontvangstbevestiging aanvraag {{project_type}} - {{address}}",
        body: "Beste {{client_name}},\n\nHartelijk dank voor uw aanvraag betreffende een {{project_type}} aan de {{address}} te {{city}}.\n\nWij hebben uw gegevens in goede orde ontvangen. Een van onze ingenieurs zal binnen 2 werkdagen contact met u opnemen om de details door te nemen.\n\nMet vriendelijke groet,\n\nTeam Bureau Broersma",
        variables: ["client_name", "project_type", "address", "city"]
    },
    {
        id: "2",
        name: "Offerte Follow-up",
        subject: "Betreft: Uw offerte voor {{address}}",
        body: "Beste {{client_name}},\n\nVorige week hebben wij u de offerte gestuurd voor de {{project_type}}.\n\nHeeft u al de gelegenheid gehad om hiernaar te kijken? Mocht u nog vragen hebben over de constructieberekeningen of de prijsopbouw, dan hoor ik het graag.\n\nMet vriendelijke groet,\n\n{{engineer_name}}\nBureau Broersma",
        variables: ["client_name", "address", "project_type", "engineer_name"]
    },
    {
        id: "3",
        name: "Factuur Verzending",
        subject: "Factuur {{invoice_number}} - {{project_type}}",
        body: "Beste {{client_name}},\n\nHierbij ontvangt u de factuur voor de werkzaamheden aan de {{address}}.\n\nWij verzoeken u vriendelijk het bedrag van €{{amount}} binnen 14 dagen over te maken.\n\nMet vriendelijke groet,\n\nAdministratie Bureau Broersma",
        variables: ["client_name", "invoice_number", "project_type", "address", "amount"]
    }
]

export function EmailTemplateEngine() {
    const [templates] = useState<Template[]>(defaultTemplates)
    const [selectedId, setSelectedId] = useState<string>(defaultTemplates[0].id)
    const [previewData, setPreviewData] = useState<Record<string, string>>({
        client_name: "J. de Vries",
        project_type: "Dakopbouw",
        address: "Keizersgracht 123",
        city: "Amsterdam",
        engineer_name: "Angelo",
        invoice_number: "2024-001",
        amount: "650,00"
    })

    const activeTemplate = templates.find(t => t.id === selectedId) || templates[0]

    const processTemplate = (text: string) => {
        let processed = text
        Object.entries(previewData).forEach(([key, value]) => {
            processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value)
        })
        return processed
    }

    const copyToClipboard = () => {
        const text = processTemplate(activeTemplate.body)
        navigator.clipboard.writeText(text)
        toast.success("Template copied to clipboard!")
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">Template Editor</CardTitle>
                    <CardDescription>Beheer en bewerk email templates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Selecteer Template</label>
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                         <label className="text-sm font-medium">Onderwerp</label>
                         <Input value={activeTemplate.subject} readOnly className="bg-muted/50" />
                    </div>

                    <div className="space-y-2 flex-1">
                         <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Inhoud</label>
                            <div className="flex gap-1">
                                {activeTemplate.variables.map(v => (
                                    <Badge key={v} variant="outline" className="text-[10px] cursor-help" title={`Variable: ${v}`}>
                                        {`{{${v}}}`}
                                    </Badge>
                                ))}
                            </div>
                         </div>
                         <Textarea value={activeTemplate.body} readOnly className="min-h-[200px] font-mono text-sm bg-muted/50" />
                    </div>
                </CardContent>
            </Card>

            <Card className="flex flex-col border-l-4 border-l-blue-500 bg-blue-50/10">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Live Preview</CardTitle>
                        <Button size="sm" variant="outline" onClick={copyToClipboard} className="gap-2">
                            <Copy className="w-4 h-4" />
                            Copy
                        </Button>
                    </div>
                    <CardDescription>Real-time view met test data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="p-4 bg-white dark:bg-slate-900 rounded-md border shadow-sm space-y-4">
                        <div className="border-b pb-2">
                            <span className="text-xs text-muted-foreground block">Onderwerp:</span>
                            <span className="font-medium">{processTemplate(activeTemplate.subject)}</span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                            {processTemplate(activeTemplate.body)}
                        </div>
                     </div>

                     <div className="bg-muted p-3 rounded-md">
                        <p className="text-xs font-medium mb-2 flex items-center gap-2">
                            <RefreshCw className="w-3 h-3" /> Test Data (Variables)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(previewData).map(([key, value]) => (
                                <div key={key} className="text-xs">
                                    <span className="text-muted-foreground block mb-0.5">{`{{${key}}}`}</span>
                                    <Input 
                                        value={value} 
                                        onChange={(e) => setPreviewData({...previewData, [key]: e.target.value})}
                                        className="h-6 text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                     </div>
                </CardContent>
            </Card>
        </div>
    )
}
