"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
    Mail, 
    Send, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Play,
    Eye,
    BarChart3,
    Zap,
    Bell,
    Star,
    RefreshCw,
    CalendarDays,
    Users,
    ChevronDown,
    ChevronUp,
    FileText,
    TrendingUp,
    Target,
    MousePointer,
    Copy,
    ExternalLink,
    Code,
    Loader2,
    AlertTriangle,
    Pencil,
    Save
} from "lucide-react"
import {
    getEmailAutomationStats,
    getEmailAutomationTotals,
    getEmailAutomationConfigs,
    updateAutomationStatus,
    initializeAutomationConfigs,
    type EmailAutomationStats,
    type EmailAutomationConfig
} from "@/lib/email-automation-actions"

interface EmailAutomation {
    id: string
    name: string
    description: string
    trigger: string
    timing: string
    status: "active" | "draft" | "paused"
    category: "klant" | "conversie" | "feedback" | "intern" | "campagne"
    metrics: {
        sent: number
        opened: number
        clicked: number
    }
    targets: {
        openRate: number
        clickRate: number
    }
    icon: React.ReactNode
    subject: string
    subjectAlt?: string
    preheader?: string
    bodyPreview: string
    variables: { name: string; example: string }[]
    doel: string[]
}

// Static automation definitions (templates, triggers, etc.)
const automationDefinitions: Omit<EmailAutomation, 'metrics' | 'status'>[] = [
    {
        id: "01",
        name: "Intake Bevestiging",
        description: "Automatische ontvangstbevestiging bij nieuwe aanvraag",
        trigger: "Lead aangemaakt → Status: Nieuw",
        timing: "Direct (< 2 min)",
        category: "klant",
        targets: { openRate: 50, clickRate: 0 },
        icon: <Mail className="w-4 h-4" />,
        subject: "Ontvangstbevestiging: Uw aanvraag voor {{project_type}} in {{city}} | Bureau Broersma",
        subjectAlt: "Bedankt {{client_name}} – we gaan voor u aan de slag! 🏗️",
        preheader: "Uw aanvraag is ontvangen. Binnen 1-2 werkdagen nemen wij contact met u op.",
        bodyPreview: `Beste {{client_name}},

Hartelijk dank voor uw vertrouwen in Bureau Broersma!

Wij hebben uw aanvraag voor een **{{project_type}}** aan de **{{address}}** te **{{city}}** in goede orde ontvangen.

### Wat kunt u verwachten?

📋 **Stap 1 – Beoordeling** (vandaag)
📞 **Stap 2 – Persoonlijk contact** (binnen 1-2 werkdagen)
📄 **Stap 3 – Offerte op maat**`,
        variables: [
            { name: "client_name", example: "J. de Vries" },
            { name: "project_type", example: "Dakkapel" },
            { name: "address", example: "Keizersgracht 100" },
            { name: "city", example: "Amsterdam" },
            { name: "lead_id", example: "BRO-2026-0142" },
        ],
        doel: [
            "Directe bevestiging van ontvangst",
            "Verwachtingen managen",
            "Professionele eerste indruk",
        ]
    },
    {
        id: "02",
        name: "Engineer Toegewezen",
        description: "Notificatie wanneer engineer wordt toegewezen",
        trigger: "Assignee ingesteld → Status: Calculatie",
        timing: "Direct",
        category: "klant",
        targets: { openRate: 60, clickRate: 30 },
        icon: <Users className="w-4 h-4" />,
        subject: "{{engineer_name}} gaat uw {{project_type}} berekenen | Bureau Broersma",
        subjectAlt: "Goed nieuws: uw project is toegewezen aan onze specialist",
        bodyPreview: `Beste {{client_name}},

Goed nieuws! Uw project is toegewezen aan een van onze ervaren constructie-ingenieurs.

### Uw specialist: {{engineer_name}}

{{engineer_name}} gaat nu aan de slag met:
✓ Analyse van uw projectgegevens
✓ Controle van de bouwkundige situatie
✓ Voorbereiding van de constructieberekening

### Wat hebben we nodig?

📐 **Bouwtekeningen** – plattegronden, gevels
📸 **Foto's** – van de huidige situatie
📄 **Grondonderzoek** – indien beschikbaar`,
        variables: [
            { name: "client_name", example: "J. de Vries" },
            { name: "engineer_name", example: "Angelo" },
            { name: "project_type", example: "Dakkapel" },
            { name: "upload_link", example: "https://app.../upload/abc" },
        ],
        doel: [
            "Persoonlijke connectie creëren",
            "Vertrouwen versterken",
            "Documenten opvragen",
        ]
    },
    {
        id: "03",
        name: "Offerte Verzonden",
        description: "Offerte met CTA voor akkoord",
        trigger: "Status → Offerte Verzonden",
        timing: "Direct",
        category: "conversie",
        targets: { openRate: 70, clickRate: 40 },
        icon: <FileText className="w-4 h-4" />,
        subject: "Uw offerte voor {{project_type}} aan {{address}} | €{{quote_value}} | Bureau Broersma",
        subjectAlt: "{{client_name}}, uw constructieberekening is gereed – bekijk de offerte",
        bodyPreview: `Beste {{client_name}},

Goed nieuws! De offerte voor uw **{{project_type}}** is gereed.

## 📋 Offerte Samenvatting

| Offertebedrag | **€{{quote_value}}** (excl. BTW) |
| Geldig tot | {{quote_valid_until}} |

## 📄 Wat is inbegrepen?

✅ Volledige constructieberekening volgens Eurocode
✅ Constructietekeningen met maatvoering
✅ Certificering door erkend constructeur

## ✍️ Akkoord geven?

[**JA, IK GA AKKOORD MET DEZE OFFERTE**]`,
        variables: [
            { name: "quote_value", example: "585,00" },
            { name: "quote_total", example: "707,85" },
            { name: "quote_valid_until", example: "12 februari 2026" },
            { name: "accept_quote_link", example: "https://app.../quote/accept/xyz" },
        ],
        doel: [
            "Professionele offerte overhandigen",
            "Call-to-action voor akkoord",
            "Verwachtingen managen",
        ]
    },
    {
        id: "04",
        name: "Offerte Herinnering #1",
        description: "Vriendelijke herinnering bij geen respons",
        trigger: "Geen respons op offerte",
        timing: "+4 dagen",
        category: "conversie",
        targets: { openRate: 50, clickRate: 20 },
        icon: <Clock className="w-4 h-4" />,
        subject: "Heeft u onze offerte ontvangen? | {{project_type}} {{address}}",
        subjectAlt: "{{client_name}}, kan ik ergens mee helpen?",
        bodyPreview: `Beste {{client_name}},

Vorige week stuurde ik u de offerte voor de constructieberekening van uw **{{project_type}}**.

Ik wilde even checken of alles duidelijk is.

### Veelgestelde vragen:

**"Wat als de gemeente wijzigingen wil?"**
→ Kleine aanpassingen zijn altijd inbegrepen.

**"Hoe lang is de berekening geldig?"**
→ Zolang de bouwvergunning geldig is (meestal 3 jaar).

📞 **Bel me direct:** 020-123 4567
📅 **Plan een belafspraak**`,
        variables: [
            { name: "client_name", example: "J. de Vries" },
            { name: "quote_valid_until", example: "12 februari 2026" },
            { name: "calendar_link", example: "https://cal.com/bureaubroersma" },
        ],
        doel: [
            "Vriendelijke herinnering",
            "Bezwaren proactief adresseren",
            "Dialoog openhouden",
        ]
    },
    {
        id: "05",
        name: "Offerte Herinnering #2",
        description: "Laatste herinnering met urgentie",
        trigger: "Geen respons na herinnering #1",
        timing: "+10 dagen",
        category: "conversie",
        targets: { openRate: 40, clickRate: 15 },
        icon: <AlertCircle className="w-4 h-4" />,
        subject: "Uw offerte verloopt binnenkort | {{project_type}} {{city}}",
        subjectAlt: "Laatste herinnering: offerte {{quote_number}}",
        bodyPreview: `Beste {{client_name}},

Dit is mijn laatste herinnering over de offerte voor uw **{{project_type}}**.

De offerte is nog geldig tot **{{quote_valid_until}}** – nog **{{days_remaining}} dagen**.

### Nog niet klaar om te beslissen?

- [ ] Ik wacht op andere offertes
- [ ] Het project is uitgesteld
- [ ] Ik heb vragen
- [ ] Ik ga niet door

[**OFFERTE OPNIEUW BEKIJKEN**]
[**AKKOORD GEVEN**]`,
        variables: [
            { name: "days_remaining", example: "20" },
            { name: "quote_pdf_link", example: "https://app.../quote/view/xyz" },
            { name: "pause_link", example: "https://app.../preferences/xyz" },
        ],
        doel: [
            "Laatste zachte herinnering",
            "Urgentie creëren",
            "Alternatief bieden",
        ]
    },
    {
        id: "06",
        name: "Opdracht Bevestiging",
        description: "Bevestiging na akkoord met planning",
        trigger: "Akkoord ontvangen → Status: Opdracht",
        timing: "Direct",
        category: "klant",
        targets: { openRate: 85, clickRate: 50 },
        icon: <CheckCircle2 className="w-4 h-4" />,
        subject: "🎉 Opdracht bevestigd: {{project_type}} {{address}} | Bureau Broersma",
        subjectAlt: "Bedankt voor uw vertrouwen – we gaan voor u aan de slag!",
        bodyPreview: `Beste {{client_name}},

Geweldig nieuws! Wij hebben uw akkoord ontvangen en gaan direct aan de slag.

## ✅ Opdrachtbevestiging

| Opdrachtnummer | {{order_number}} |
| Opdrachtbedrag | €{{quote_total}} (incl. BTW) |

## 📅 Planning & Doorlooptijd

**Verwachte oplevering:** {{expected_delivery_date}}

1. ✅ **Opdracht ontvangen** – vandaag
2. ⏳ **Constructieberekening** – {{engineer_name}} start direct
3. ⏳ **Interne controle** – kwaliteitscheck
4. ⏳ **Oplevering** – digitale levering`,
        variables: [
            { name: "order_number", example: "OPD-2026-0142" },
            { name: "expected_delivery_date", example: "22 januari 2026" },
            { name: "quote_total", example: "707,85" },
        ],
        doel: [
            "Bevestiging van opdracht",
            "Duidelijke verwachtingen",
            "Enthousiasme tonen",
        ]
    },
    {
        id: "07",
        name: "Factuur Verzending",
        description: "Factuur met iDEAL betaallink",
        trigger: "Na opdracht bevestiging",
        timing: "+1 dag",
        category: "klant",
        targets: { openRate: 80, clickRate: 70 },
        icon: <Send className="w-4 h-4" />,
        subject: "Factuur {{invoice_number}} – {{project_type}} {{address}} | €{{invoice_total}}",
        bodyPreview: `Beste {{client_name}},

Hierbij ontvangt u de factuur voor uw opdracht.

## 📄 Factuurgegevens

| Factuurnummer | {{invoice_number}} |
| Totaal te betalen | **€{{invoice_total}}** |

## 🏦 Betalingsinstructies

| IBAN | NL91 ABNA 0417 1643 00 |
| T.n.v. | Bureau Broersma B.V. |

**Betalingstermijn:** {{payment_due_date}} (14 dagen)

## ⚡ Betaal direct met iDEAL

[**BETAAL NU MET IDEAL**]`,
        variables: [
            { name: "invoice_number", example: "FACT-2026-0142" },
            { name: "invoice_total", example: "707,85" },
            { name: "payment_due_date", example: "30 januari 2026" },
            { name: "ideal_payment_link", example: "https://pay.mollie.com/xyz" },
        ],
        doel: [
            "Professionele factuurverzending",
            "Duidelijke betalingsinstructies",
            "iDEAL voor snelle betaling",
        ]
    },
    {
        id: "08",
        name: "Betaling Herinnering",
        description: "Herinnering bij openstaande factuur",
        trigger: "Onbetaald na vervaldatum",
        timing: "+3 dagen",
        category: "klant",
        targets: { openRate: 75, clickRate: 60 },
        icon: <Bell className="w-4 h-4" />,
        subject: "Herinnering: Factuur {{invoice_number}} nog open | €{{invoice_total}}",
        bodyPreview: `Beste {{client_name}},

Ik stuur u een vriendelijke herinnering voor onderstaande factuur.

## 📄 Openstaande factuur

| Factuurnummer | {{invoice_number}} |
| Vervaldatum | {{payment_due_date}} |
| Openstaand bedrag | **€{{invoice_total}}** |

## 💳 Betaal direct

[**BETAAL NU MET IDEAL**]

## ❓ Is er iets aan de hand?

Heeft u de factuur niet ontvangen? Laat het me weten.`,
        variables: [
            { name: "invoice_number", example: "FACT-2026-0142" },
            { name: "payment_due_date", example: "30 januari 2026" },
        ],
        doel: [
            "Vriendelijke herinnering",
            "Problemen identificeren",
            "Relatie niet schaden",
        ]
    },
    {
        id: "09",
        name: "Oplevering Berekening",
        description: "Documenten levering + garantie info",
        trigger: "Berekening gereed + betaling ontvangen",
        timing: "Direct",
        category: "klant",
        targets: { openRate: 90, clickRate: 70 },
        icon: <CheckCircle2 className="w-4 h-4" />,
        subject: "🎉 Uw constructieberekening is gereed! | {{project_type}} {{address}}",
        bodyPreview: `Beste {{client_name}},

Fantastisch nieuws! De constructieberekening voor uw **{{project_type}}** is gereed.

## 📦 Uw documenten

📄 **Constructieberekening.pdf**
📄 **Constructietekening.pdf**

[**DOWNLOAD ALLE DOCUMENTEN (ZIP)**]

## 🏛️ Vergunningaanvraag

U kunt deze documenten gebruiken voor uw omgevingsvergunning.

## ✅ Onze garantie

- Berekening voldoet aan alle normen
- Kosteloos aanpassingen bij gemeentelijke opmerkingen
- 1 jaar ondersteuning`,
        variables: [
            { name: "download_all_link", example: "https://files.../download/xyz" },
            { name: "order_number", example: "OPD-2026-0142" },
            { name: "review_link", example: "https://g.page/bureaubroersma/review" },
        ],
        doel: [
            "Professionele oplevering",
            "Uitleg voor vergunning",
            "Review verzoek voorbereiden",
        ]
    },
    {
        id: "10",
        name: "Feedback Verzoek",
        description: "Emoji feedback + Google review verzoek",
        trigger: "Na oplevering",
        timing: "+3 dagen",
        category: "feedback",
        targets: { openRate: 30, clickRate: 20 },
        icon: <Star className="w-4 h-4" />,
        subject: "Hoe was uw ervaring met Bureau Broersma? | 30 seconden",
        subjectAlt: "{{client_name}}, mogen we u iets vragen?",
        bodyPreview: `Beste {{client_name}},

Een paar dagen geleden heeft u de constructieberekening ontvangen.

## ⭐ Mogen we u iets vragen?

**Hoe zou u uw ervaring omschrijven?**

[😊 UITSTEKEND]  [🙂 GOED]  [😐 NEUTRAAL]  [🙁 KON BETER]

## 🌟 Deel uw ervaring

[**SCHRIJF EEN GOOGLE REVIEW ⭐**]

## 🎁 Als dank voor uw tijd

Iedereen die een review achterlaat, maakt kans op **€50 korting**!`,
        variables: [
            { name: "feedback_link_excellent", example: "https://app.../feedback?rating=5" },
            { name: "google_review_link", example: "https://g.page/bureaubroersma/review" },
        ],
        doel: [
            "Klanttevredenheid meten",
            "Google reviews verzamelen",
            "Testimonials genereren",
        ]
    },
    {
        id: "11",
        name: "NPS Survey",
        description: "Net Promoter Score meting",
        trigger: "Na oplevering",
        timing: "+14 dagen",
        category: "feedback",
        targets: { openRate: 25, clickRate: 15 },
        icon: <BarChart3 className="w-4 h-4" />,
        subject: "Eén vraag over Bureau Broersma | 10 seconden",
        bodyPreview: `Beste {{client_name}},

Twee weken geleden hebben wij de constructieberekening opgeleverd.

## 📊 De vraag

**Hoe waarschijnlijk is het dat u Bureau Broersma zou aanbevelen?**

Klik op een cijfer:

[0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]

0 ━━━━━━━━━━━━━━━━━━━━ 10
Zeer onwaarschijnlijk    Zeer waarschijnlijk`,
        variables: [
            { name: "nps_link_X", example: "https://app.../nps?score=X" },
        ],
        doel: [
            "Net Promoter Score meten",
            "Promoters identificeren voor referral",
            "Detractors proactief opvangen",
        ]
    },
    {
        id: "12",
        name: "Referral Uitnodiging",
        description: "Referral programma voor promoters (NPS 9-10)",
        trigger: "NPS score 9+ ontvangen",
        timing: "Direct",
        category: "feedback",
        targets: { openRate: 70, clickRate: 50 },
        icon: <TrendingUp className="w-4 h-4" />,
        subject: "{{client_name}}, verdien €100 door Bureau Broersma aan te bevelen 🎁",
        subjectAlt: "Uw netwerk kan ook profiteren van onze service",
        bodyPreview: `Beste {{client_name}},

Bedankt voor uw fantastische beoordeling!

## 🎁 Ons Referral Programma

### Zo werkt het:

**1. Deel uw unieke link**
📎 **{{referral_link}}**

**2. Zij ontvangen korting**
Uw contactpersoon krijgt **€50 korting**

**3. U ontvangt een beloning**
Zodra zij afronden, ontvangt u **€100 tegoed**

| Verwijzingen | Beloning |
|--------------|----------|
| 1 | €100 tegoed |
| 3 | €350 + goodiebag |
| 5 | €600 + VIP-status |`,
        variables: [
            { name: "referral_link", example: "https://bureaubroersma.nl/ref/jdevries123" },
            { name: "referral_dashboard_link", example: "https://app.../referrals" },
            { name: "total_earned", example: "0" },
        ],
        doel: [
            "Tevreden klanten activeren",
            "Warme leads genereren",
            "Community gevoel creëren",
        ]
    },
    {
        id: "13",
        name: "Reactivatie Leads",
        description: "Win-back voor inactieve leads",
        trigger: "90 dagen inactief in Archief",
        timing: "Automatisch",
        category: "campagne",
        targets: { openRate: 20, clickRate: 10 },
        icon: <RefreshCw className="w-4 h-4" />,
        subject: "{{client_name}}, zijn uw bouwplannen nog actueel?",
        subjectAlt: "We missen u! 🏠 Update over uw {{project_type}} project",
        bodyPreview: `Beste {{client_name}},

Een tijdje geleden spraken wij over uw plannen voor een **{{project_type}}**.

Ik was benieuwd: zijn deze plannen nog steeds actueel?

## 🏗️ Wat er sindsdien is veranderd

✨ **Snellere doorlooptijden** – 20% sneller
💰 **Scherpe prijzen** – Herziende tarieven 2026
📱 **Digitale tools** – Real-time klantportaal

## ⏱️ Uw project oppakken?

[**JA, NEEM CONTACT OP**]

## 🔄 Of laat ons weten wat de status is

- Project uitgesteld → neem over 6 maanden contact op
- Geen interesse meer
- Al elders uitgevoerd`,
        variables: [
            { name: "original_created_at", example: "oktober 2025" },
            { name: "last_quote_value", example: "€585,00" },
            { name: "reactivation_link_yes", example: "https://app.../reactivate?action=yes" },
        ],
        doel: [
            "Slapende leads wakker schudden",
            "Uitgestelde projecten activeren",
            "Database opschonen",
        ]
    },
    {
        id: "14",
        name: "Seizoens Campagne",
        description: "Voorjaar, zomer, najaar, winter campagnes",
        trigger: "Kalender-based",
        timing: "Kwartaal",
        category: "campagne",
        targets: { openRate: 25, clickRate: 5 },
        icon: <CalendarDays className="w-4 h-4" />,
        subject: "🌷 Het bouwseizoen is begonnen – start uw project nu!",
        subjectAlt: "🍂 Maak uw woning winterklaar – isolatie & uitbouwen",
        bodyPreview: `Beste {{client_name}},

Het voorjaar is dé tijd om te bouwen!

## 🏗️ Populaire projecten dit seizoen

### Dakkapel
Meer ruimte en licht op zolder
**Vanaf €585** | 5 werkdagen

### Uitbouw
Vergroot uw woonkamer of keuken
**Vanaf €850** | 7 werkdagen

### Draagmuur verwijderen
**Vanaf €450** | 3 werkdagen

## ⚡ Voorjaarsactie

✅ **10% vroegboekkorting** (t/m 31 maart)
✅ Gratis adviesgesprek (30 min)
✅ Prioriteit in de planning

[**VRAAG OFFERTE AAN MET KORTING**]`,
        variables: [
            { name: "campaign_link", example: "https://bureaubroersma.nl/voorjaar2026" },
        ],
        doel: [
            "Seizoensgebonden vraag stimuleren",
            "Database warm houden",
            "Cross-sell mogelijkheden",
        ]
    },
    {
        id: "15",
        name: "Interne Notificaties",
        description: "Alerts voor team (leads, goedkeuringen, deadlines)",
        trigger: "Diverse events",
        timing: "Direct",
        category: "intern",
        targets: { openRate: 80, clickRate: 40 },
        icon: <Bell className="w-4 h-4" />,
        subject: "🆕 Nieuwe lead: {{project_type}} in {{city}} (€{{estimated_value}})",
        subjectAlt: "⏳ Offerte ter goedkeuring: {{client_name}} – €{{quote_value}}",
        bodyPreview: `### Nieuwe Lead Notificatie

📋 Details:
• Klant: {{client_name}}
• Project: {{project_type}}
• Locatie: {{address}}, {{city}}
• Geschatte waarde: €{{estimated_value}}

📊 Huidige workload team:
• Angelo: {{angelo_workload}} leads
• Venka: {{venka_workload}} leads
• Roina: {{roina_workload}} leads

[OPEN IN BACKOFFICE]
[TOEWIJZEN AAN MIJZELF]`,
        variables: [
            { name: "lead_url", example: "https://app.../leads/abc123" },
            { name: "quick_assign_url", example: "https://app.../assign/abc123" },
            { name: "approve_url", example: "https://app.../approve/xyz" },
        ],
        doel: [
            "Team op de hoogte houden",
            "Snelle actie mogelijk maken",
            "Workload zichtbaar maken",
        ]
    },
]

const categoryColors: Record<string, string> = {
    klant: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    conversie: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    feedback: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    intern: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    campagne: "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

const categoryLabels: Record<string, string> = {
    klant: "Klant Journey",
    conversie: "Conversie",
    feedback: "Feedback",
    intern: "Intern",
    campagne: "Campagnes",
}

const statusColors: Record<string, string> = {
    active: "bg-emerald-500",
    draft: "bg-slate-400",
    paused: "bg-amber-500",
}

export function EmailAutomationPanel() {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [selectedTab, setSelectedTab] = useState("all")
    const [isLoading, setIsLoading] = useState(true)
    const [isInitializing, setIsInitializing] = useState(false)
    
    // Edit template state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingAutomation, setEditingAutomation] = useState<EmailAutomation | null>(null)
    const [editForm, setEditForm] = useState({
        subject: "",
        subjectAlt: "",
        preheader: "",
        bodyPreview: "",
    })
    const [isSaving, setIsSaving] = useState(false)
    
    // Template overrides (stored locally until we have a backend)
    const [templateOverrides, setTemplateOverrides] = useState<Record<string, {
        subject?: string
        subjectAlt?: string
        preheader?: string
        bodyPreview?: string
    }>>(() => {
        // Load from localStorage on mount
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('email-template-overrides')
            return saved ? JSON.parse(saved) : {}
        }
        return {}
    })
    
    // Real data from database
    const [stats, setStats] = useState<EmailAutomationStats[]>([])
    const [configs, setConfigs] = useState<EmailAutomationConfig[]>([])
    const [totals, setTotals] = useState({
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        activeFlows: 13,
        totalFlows: 15,
    })

    // Merge static definitions with real data and overrides
    const automations: EmailAutomation[] = automationDefinitions.map(def => {
        const stat = stats.find(s => s.flowId === def.id)
        const config = configs.find(c => c.flowId === def.id)
        const override = templateOverrides[def.id]
        
        return {
            ...def,
            // Apply template overrides
            subject: override?.subject || def.subject,
            subjectAlt: override?.subjectAlt || def.subjectAlt,
            preheader: override?.preheader || def.preheader,
            bodyPreview: override?.bodyPreview || def.bodyPreview,
            status: (config?.status || (def.id === '13' || def.id === '14' ? 'draft' : 'active')) as 'active' | 'paused' | 'draft',
            metrics: {
                sent: stat?.sent || 0,
                opened: stat?.opened || 0,
                clicked: stat?.clicked || 0,
            }
        }
    })
    
    // Open edit dialog for a template
    const openEditDialog = (automation: EmailAutomation) => {
        setEditingAutomation(automation)
        setEditForm({
            subject: automation.subject,
            subjectAlt: automation.subjectAlt || "",
            preheader: automation.preheader || "",
            bodyPreview: automation.bodyPreview,
        })
        setIsEditDialogOpen(true)
    }
    
    // Save template changes
    const handleSaveTemplate = async () => {
        if (!editingAutomation) return
        
        setIsSaving(true)
        
        // Save to localStorage (and could be extended to save to database)
        const newOverrides = {
            ...templateOverrides,
            [editingAutomation.id]: {
                subject: editForm.subject,
                subjectAlt: editForm.subjectAlt || undefined,
                preheader: editForm.preheader || undefined,
                bodyPreview: editForm.bodyPreview,
            }
        }
        
        setTemplateOverrides(newOverrides)
        localStorage.setItem('email-template-overrides', JSON.stringify(newOverrides))
        
        setIsSaving(false)
        setIsEditDialogOpen(false)
        setEditingAutomation(null)
        toast.success("Template opgeslagen")
    }

    const fetchData = useCallback(async () => {
        try {
            const [statsResult, totalsResult, configsResult] = await Promise.all([
                getEmailAutomationStats(),
                getEmailAutomationTotals(),
                getEmailAutomationConfigs(),
            ])

            if (statsResult.success && statsResult.data) {
                setStats(statsResult.data)
            }
            if (totalsResult.success && totalsResult.data) {
                setTotals(totalsResult.data)
            }
            if (configsResult.success && configsResult.data) {
                setConfigs(configsResult.data)
            }
        } catch (error) {
            console.error('Failed to fetch email automation data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleInitialize = async () => {
        setIsInitializing(true)
        try {
            const result = await initializeAutomationConfigs()
            if (result.success) {
                toast.success('Automation configuraties geïnitialiseerd')
                await fetchData()
            } else {
                toast.error('Kon configuraties niet initialiseren')
            }
        } catch {
            toast.error('Er ging iets mis')
        } finally {
            setIsInitializing(false)
        }
    }

    const toggleStatus = async (id: string) => {
        const automation = automations.find(a => a.id === id)
        if (!automation || automation.status === 'draft') return

        const newStatus = automation.status === 'active' ? 'paused' : 'active'
        
        // Optimistic update
        setConfigs(prev => {
            const existing = prev.find(c => c.flowId === id)
            if (existing) {
                return prev.map(c => c.flowId === id ? { ...c, status: newStatus } : c)
            }
            return [...prev, { flowId: id, name: automation.name, status: newStatus, category: automation.category }]
        })

        try {
            const result = await updateAutomationStatus(id, newStatus)
            if (!result.success) {
                // Revert on error
                setConfigs(prev => prev.map(c => 
                    c.flowId === id ? { ...c, status: automation.status } : c
                ))
                toast.error('Kon status niet bijwerken')
            } else {
                toast.success(`${automation.name} ${newStatus === 'active' ? 'geactiveerd' : 'gepauzeerd'}`)
            }
        } catch {
            toast.error('Er ging iets mis')
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <Skeleton className="h-12 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-32 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Totaal Verzonden</p>
                                <p className="text-2xl font-bold text-blue-600">{totals.totalSent.toLocaleString()}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Send className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Open Rate</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold text-emerald-600">{totals.avgOpenRate}%</p>
                                    {totals.totalOpened === 0 && totals.totalSent > 0 && (
                                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Webhook nodig
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Click Rate</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-bold text-amber-600">{totals.avgClickRate}%</p>
                                    {totals.totalClicked === 0 && totals.totalSent > 0 && (
                                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Webhook nodig
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <MousePointer className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Actieve Flows</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {automations.filter(a => a.status === "active").length}/{automations.length}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Play className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Initialize button if no configs */}
            {configs.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground mb-4">
                            Configuraties niet gevonden. Initialiseer de standaard automation flows.
                        </p>
                        <Button onClick={handleInitialize} disabled={isInitializing}>
                            {isInitializing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Initialiseren...
                                </>
                            ) : (
                                'Initialiseer Configuraties'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Flow Visualization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Email Automation Flow
                    </CardTitle>
                    <CardDescription>
                        Visuele weergave van de klant journey en automatische e-mails
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        {/* Flow Diagram */}
                        <div className="flex items-center justify-center gap-2 p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl overflow-x-auto">
                            {/* Lead */}
                            <div className="flex flex-col items-center min-w-[100px]">
                                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                                    1
                                </div>
                                <span className="text-xs font-medium mt-2 text-center">Nieuwe Lead</span>
                                <span className="text-[10px] text-muted-foreground">Intake email</span>
                            </div>
                            
                            <ArrowRight className="w-6 h-6 text-slate-300 flex-shrink-0" />
                            
                            {/* Calculatie */}
                            <div className="flex flex-col items-center min-w-[100px]">
                                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg">
                                    2
                                </div>
                                <span className="text-xs font-medium mt-2 text-center">Calculatie</span>
                                <span className="text-[10px] text-muted-foreground">Engineer email</span>
                            </div>
                            
                            <ArrowRight className="w-6 h-6 text-slate-300 flex-shrink-0" />
                            
                            {/* Offerte */}
                            <div className="flex flex-col items-center min-w-[100px]">
                                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-lg">
                                    3
                                </div>
                                <span className="text-xs font-medium mt-2 text-center">Offerte</span>
                                <span className="text-[10px] text-muted-foreground">+ herinneringen</span>
                            </div>
                            
                            <ArrowRight className="w-6 h-6 text-slate-300 flex-shrink-0" />
                            
                            {/* Opdracht */}
                            <div className="flex flex-col items-center min-w-[100px]">
                                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold shadow-lg">
                                    4
                                </div>
                                <span className="text-xs font-medium mt-2 text-center">Opdracht</span>
                                <span className="text-[10px] text-muted-foreground">Factuur email</span>
                            </div>
                            
                            <ArrowRight className="w-6 h-6 text-slate-300 flex-shrink-0" />
                            
                            {/* Oplevering */}
                            <div className="flex flex-col items-center min-w-[100px]">
                                <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold shadow-lg">
                                    5
                                </div>
                                <span className="text-xs font-medium mt-2 text-center">Oplevering</span>
                                <span className="text-[10px] text-muted-foreground">Documenten</span>
                            </div>
                            
                            <ArrowRight className="w-6 h-6 text-slate-300 flex-shrink-0" />
                            
                            {/* Feedback */}
                            <div className="flex flex-col items-center min-w-[100px]">
                                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                                    6
                                </div>
                                <span className="text-xs font-medium mt-2 text-center">Feedback</span>
                                <span className="text-[10px] text-muted-foreground">NPS + Review</span>
                            </div>
                            
                            <ArrowRight className="w-6 h-6 text-slate-300 flex-shrink-0" />
                            
                            {/* Referral */}
                            <div className="flex flex-col items-center min-w-[100px]">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
                                    <Star className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium mt-2 text-center">Ambassadeur</span>
                                <span className="text-[10px] text-muted-foreground">Referral</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Automation List */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                <TabsList className="bg-muted/50 flex-wrap h-auto p-1">
                    <TabsTrigger value="all" className="gap-1">
                        Alle <Badge variant="secondary" className="ml-1 text-[10px]">{automations.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="klant" className="gap-1">Klant Journey</TabsTrigger>
                    <TabsTrigger value="conversie" className="gap-1">Conversie</TabsTrigger>
                    <TabsTrigger value="feedback" className="gap-1">Feedback</TabsTrigger>
                    <TabsTrigger value="intern" className="gap-1">Intern</TabsTrigger>
                    <TabsTrigger value="campagne" className="gap-1">Campagnes</TabsTrigger>
                </TabsList>

                {["all", "klant", "conversie", "feedback", "intern", "campagne"].map(category => (
                    <TabsContent key={category} value={category} className="space-y-3 mt-4">
                        {automations
                            .filter(a => category === "all" || a.category === category)
                            .map(automation => (
                                <Card 
                                    key={automation.id} 
                                    className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                                        automation.status === "draft" ? "opacity-70" : ""
                                    } ${expandedId === automation.id ? "ring-2 ring-primary/20 shadow-lg" : ""}`}
                                    onClick={() => setExpandedId(expandedId === automation.id ? null : automation.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            {/* Status indicator */}
                                            <div className={`w-2 h-2 rounded-full ${statusColors[automation.status]} shrink-0`} />
                                            
                                            {/* Icon */}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[automation.category]} shrink-0`}>
                                                {automation.icon}
                                            </div>
                                            
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-mono text-muted-foreground">#{automation.id}</span>
                                                    <h4 className="font-semibold truncate">{automation.name}</h4>
                                                    <Badge variant="outline" className={`text-[10px] ${categoryColors[automation.category]}`}>
                                                        {categoryLabels[automation.category]}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">{automation.description}</p>
                                            </div>
                                            
                                            {/* Timing */}
                                            <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                                                <Badge variant="secondary" className="text-xs">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {automation.timing}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground max-w-[150px] truncate">{automation.trigger}</span>
                                            </div>
                                            
                                            {/* Metrics */}
                                            <div className="hidden lg:flex items-center gap-4 text-sm shrink-0">
                                                <div className="text-center">
                                                    <p className="font-semibold">{automation.metrics.sent}</p>
                                                    <p className="text-[10px] text-muted-foreground">Verzonden</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className={`font-semibold ${
                                                        automation.metrics.sent > 0 
                                                            ? (automation.metrics.opened / automation.metrics.sent) * 100 >= automation.targets.openRate
                                                                ? "text-emerald-600"
                                                                : "text-amber-600"
                                                            : ""
                                                    }`}>
                                                        {automation.metrics.sent > 0 
                                                            ? Math.round((automation.metrics.opened / automation.metrics.sent) * 100)
                                                            : 0}%
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">Open</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className={`font-semibold ${
                                                        automation.metrics.opened > 0 
                                                            ? (automation.metrics.clicked / automation.metrics.opened) * 100 >= automation.targets.clickRate
                                                                ? "text-emerald-600"
                                                                : "text-amber-600"
                                                            : ""
                                                    }`}>
                                                        {automation.metrics.opened > 0 
                                                            ? Math.round((automation.metrics.clicked / automation.metrics.opened) * 100)
                                                            : 0}%
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">Click</p>
                                                </div>
                                            </div>
                                            
                                            {/* Toggle & Expand */}
                                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <Switch 
                                                    checked={automation.status === "active"}
                                                    onCheckedChange={() => toggleStatus(automation.id)}
                                                    disabled={automation.status === "draft"}
                                                />
                                                <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
                                                    {expandedId === automation.id 
                                                        ? <ChevronUp className="w-4 h-4" />
                                                        : <ChevronDown className="w-4 h-4" />
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Expanded details */}
                                        {expandedId === automation.id && (
                                            <div className="mt-4 pt-4 border-t space-y-4">
                                                {/* Subject Lines */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <h5 className="text-sm font-medium flex items-center gap-2">
                                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                                            Onderwerp
                                                        </h5>
                                                        <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm">
                                                            {automation.subject}
                                                        </div>
                                                        {automation.subjectAlt && (
                                                            <div className="text-xs text-muted-foreground">
                                                                <span className="font-medium">A/B variant:</span> {automation.subjectAlt}
                                                            </div>
                                                        )}
                                                        {automation.preheader && (
                                                            <div className="text-xs text-muted-foreground">
                                                                <span className="font-medium">Preheader:</span> {automation.preheader}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <h5 className="text-sm font-medium flex items-center gap-2">
                                                            <Target className="w-4 h-4 text-muted-foreground" />
                                                            Doel & Triggers
                                                        </h5>
                                                        <div className="space-y-1">
                                                            {automation.doel.map((d, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                    {d}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                            <span>Target Open: <strong className="text-foreground">{automation.targets.openRate}%</strong></span>
                                                            <span>Target Click: <strong className="text-foreground">{automation.targets.clickRate}%</strong></span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Email Preview */}
                                                <div className="space-y-2">
                                                    <h5 className="text-sm font-medium flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                                        E-mail Preview
                                                    </h5>
                                                    <ScrollArea className="h-[200px] w-full rounded-lg border bg-white dark:bg-slate-950 p-4">
                                                        <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                                                            {automation.bodyPreview}
                                                        </pre>
                                                    </ScrollArea>
                                                </div>

                                                {/* Variables */}
                                                <div className="space-y-2">
                                                    <h5 className="text-sm font-medium flex items-center gap-2">
                                                        <Code className="w-4 h-4 text-muted-foreground" />
                                                        Variabelen
                                                    </h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {automation.variables.map((v, i) => (
                                                            <Badge 
                                                                key={i} 
                                                                variant="secondary" 
                                                                className="font-mono text-xs gap-1 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                                            >
                                                                <span className="text-amber-600 dark:text-amber-400">{`{{${v.name}}}`}</span>
                                                                <span className="text-muted-foreground">→ {v.example}</span>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-2">
                                                    <Button 
                                                        size="sm" 
                                                        className="gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openEditDialog(automation)
                                                        }}
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                        Bewerken
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        Full Preview
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-1">
                                                        <Copy className="w-3 h-3" />
                                                        Kopieer HTML
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-1" asChild>
                                                        <a href={`/docs/email-automations/${automation.id.padStart(2, '0')}`} target="_blank">
                                                            <ExternalLink className="w-3 h-3" />
                                                            Docs
                                                        </a>
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-1">
                                                        <BarChart3 className="w-3 h-3" />
                                                        Analytics
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Edit Template Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-amber-500" />
                            Template Bewerken: {editingAutomation?.name}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        {/* Subject */}
                        <div className="space-y-2">
                            <Label htmlFor="subject">Onderwerp</Label>
                            <Input
                                id="subject"
                                value={editForm.subject}
                                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                placeholder="Email onderwerp..."
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Gebruik {`{{variabele}}`} voor dynamische content
                            </p>
                        </div>

                        {/* Subject Alt (A/B variant) */}
                        <div className="space-y-2">
                            <Label htmlFor="subjectAlt">A/B Variant Onderwerp (optioneel)</Label>
                            <Input
                                id="subjectAlt"
                                value={editForm.subjectAlt}
                                onChange={(e) => setEditForm({ ...editForm, subjectAlt: e.target.value })}
                                placeholder="Alternatief onderwerp voor A/B test..."
                                className="font-mono text-sm"
                            />
                        </div>

                        {/* Preheader */}
                        <div className="space-y-2">
                            <Label htmlFor="preheader">Preheader (optioneel)</Label>
                            <Input
                                id="preheader"
                                value={editForm.preheader}
                                onChange={(e) => setEditForm({ ...editForm, preheader: e.target.value })}
                                placeholder="Preview text in inbox..."
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Dit is de tekst die naast het onderwerp in de inbox wordt getoond
                            </p>
                        </div>

                        {/* Body */}
                        <div className="space-y-2">
                            <Label htmlFor="body">Email Content (Markdown)</Label>
                            <Textarea
                                id="body"
                                value={editForm.bodyPreview}
                                onChange={(e) => setEditForm({ ...editForm, bodyPreview: e.target.value })}
                                placeholder="Email content in Markdown format..."
                                className="font-mono text-sm min-h-[300px]"
                            />
                            <p className="text-xs text-muted-foreground">
                                Gebruik Markdown voor opmaak: **vet**, *cursief*, ### headers, - lijsten
                            </p>
                        </div>

                        {/* Variables Reference */}
                        {editingAutomation && (
                            <div className="space-y-2">
                                <Label>Beschikbare Variabelen</Label>
                                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                                    {editingAutomation.variables.map((v, i) => (
                                        <Badge 
                                            key={i}
                                            variant="secondary"
                                            className="font-mono text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`{{${v.name}}}`)
                                                toast.success(`{{${v.name}}} gekopieerd`)
                                            }}
                                        >
                                            {`{{${v.name}}}`}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isSaving}>Annuleren</Button>
                        </DialogClose>
                        <Button onClick={handleSaveTemplate} disabled={isSaving} className="gap-2">
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Opslaan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
