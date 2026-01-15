"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle2, 
  FileText, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  Euro,
  Building2,
  MapPin,
  Calendar,
  Shield,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface QuoteData {
  id: string
  version: number
  leadId: string
  clientName: string
  clientEmail: string
  projectType: string
  city: string
  address?: string
  value: number
  lineItems: Array<{ description: string; amount: number }>
  description?: string
  createdAt: string
  expiresAt?: string
  status: string
  termsUrl?: string
}

type PageState = "loading" | "valid" | "expired" | "already_accepted" | "not_found" | "error"

export default function QuoteAcceptancePage() {
  const params = useParams()
  const hash = params.hash as string
  
  const [pageState, setPageState] = useState<PageState>("loading")
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load quote data
  useEffect(() => {
    async function loadQuote() {
      try {
        const response = await fetch(`/api/offerte/${hash}`)
        const data = await response.json()
        
        if (!response.ok) {
          if (response.status === 404) {
            setPageState("not_found")
          } else if (response.status === 410) {
            setPageState("expired")
          } else if (response.status === 409) {
            setPageState("already_accepted")
            setQuote(data.quote)
          } else {
            setPageState("error")
            setError(data.error || "Er is een fout opgetreden")
          }
          return
        }
        
        setQuote(data)
        setPageState("valid")
      } catch {
        setPageState("error")
        setError("Kon offerte niet laden. Probeer het later opnieuw.")
      }
    }
    
    if (hash) {
      loadQuote()
    }
  }, [hash])

  const handleAccept = async () => {
    if (!termsAccepted || !quote) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/offerte/${hash}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsAccepted: true,
          note: note || undefined
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "Acceptatie mislukt")
        setIsSubmitting(false)
        return
      }
      
      setIsAccepted(true)
    } catch {
      setError("Er is een fout opgetreden. Probeer het opnieuw.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR"
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Offerte laden...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not found state
  if (pageState === "not_found") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Offerte niet gevonden</h2>
            <p className="text-muted-foreground">
              Deze offerte-link is ongeldig of bestaat niet meer.
              Neem contact op met Broersma Bouwadvies voor een nieuwe offerte.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Expired state
  if (pageState === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Offerte verlopen</h2>
            <p className="text-muted-foreground">
              De geldigheid van deze offerte is verlopen.
              Neem contact op met Broersma Bouwadvies voor een actuele offerte.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Already accepted state
  if (pageState === "already_accepted") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-emerald-800">Offerte reeds geaccepteerd</h2>
            <p className="text-emerald-700">
              U heeft deze offerte al geaccepteerd. 
              U ontvangt binnenkort een opdrachtbevestiging per e-mail.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Er ging iets mis</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state after acceptance
  if (isAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-emerald-200 shadow-xl">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-emerald-800">Offerte geaccepteerd!</h2>
            <p className="text-emerald-700 mb-6">
              Bedankt voor uw opdracht. U ontvangt binnen enkele minuten een bevestiging per e-mail.
            </p>
            <div className="bg-emerald-100/50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-emerald-800 mb-2">Wat gebeurt er nu?</h3>
              <ul className="space-y-2 text-sm text-emerald-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>U ontvangt een opdrachtbevestiging per e-mail</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Onze projectleider neemt binnen 2 werkdagen contact met u op</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>We plannen samen de uitvoering van uw project</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main quote display
  if (!quote) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/branding/logo-white-gold.png"
            alt="Broersma Bouwadvies"
            width={180}
            height={60}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-800">Offerte</h1>
          <p className="text-muted-foreground">Versie {quote.version}</p>
        </div>

        {/* Quote Details Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{quote.projectType}</CardTitle>
                <CardDescription className="mt-1">
                  Offerte voor {quote.clientName}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-base font-bold px-4 py-2">
                {formatCurrency(quote.value)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="py-6 space-y-6">
            {/* Project Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>{quote.clientName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{quote.address || quote.city}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Datum: {formatDate(quote.createdAt)}</span>
              </div>
              {quote.expiresAt && (
                <div className="flex items-center gap-3 text-sm text-amber-600">
                  <Clock className="w-4 h-4" />
                  <span>Geldig tot: {formatDate(quote.expiresAt)}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Specificatie
              </h3>
              <div className="bg-slate-50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium">Omschrijving</th>
                      <th className="text-right py-2 px-4 font-medium">Bedrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.lineItems.map((item, index) => (
                      <tr key={index} className="border-t border-slate-200">
                        <td className="py-2 px-4">{item.description}</td>
                        <td className="py-2 px-4 text-right font-mono">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-semibold">
                    <tr className="border-t-2 border-slate-300">
                      <td className="py-3 px-4">Totaal (excl. BTW)</td>
                      <td className="py-3 px-4 text-right font-mono text-lg">
                        {formatCurrency(quote.value)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {quote.description && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Toelichting</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {quote.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Acceptance Card */}
        <Card className="shadow-lg border-2 border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Offerte accepteren
            </CardTitle>
            <CardDescription>
              Door op de knop te klikken gaat u een overeenkomst aan met Broersma Bouwadvies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Terms checkbox */}
            <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                Ik heb de offerte gelezen en ga akkoord met de{" "}
                <a 
                  href="/algemene-voorwaarden" 
                  target="_blank" 
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  algemene voorwaarden
                  <ExternalLink className="w-3 h-3" />
                </a>
                . Ik begrijp dat dit een bindende overeenkomst is.
              </Label>
            </div>

            {/* Optional note */}
            <div>
              <Label htmlFor="note" className="text-sm text-muted-foreground">
                Opmerking (optioneel)
              </Label>
              <Textarea
                id="note"
                placeholder="Eventuele opmerkingen bij uw acceptatie..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button 
              onClick={handleAccept}
              disabled={!termsAccepted || isSubmitting}
              size="lg"
              className={cn(
                "w-full gap-2 text-base",
                termsAccepted 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-slate-400"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verwerken...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Offerte definitief accepteren
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              <Euro className="w-3 h-3 inline mr-1" />
              Totaalbedrag: {formatCurrency(quote.value)} excl. BTW
            </p>
          </CardFooter>
        </Card>

        {/* Legal notice */}
        <p className="text-xs text-center text-muted-foreground px-4">
          Door te accepteren stemt u in met de uitvoering van de werkzaamheden zoals beschreven in deze offerte.
          Uw IP-adres en tijdstip worden geregistreerd als bewijs van aanvaarding conform artikel 6:217 BW.
        </p>
      </div>
    </div>
  )
}
