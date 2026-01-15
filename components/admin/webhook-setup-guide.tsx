"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw,
  Loader2,
  Webhook,
  Eye,
  MousePointer,
  Send,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

interface WebhookStatus {
  status: 'active' | 'inactive' | 'unknown'
  statusMessage: string
  configuration: {
    webhookSecretConfigured: boolean
    webhookUrl: string
    supportedEvents: string[]
  }
  statistics: {
    totalEvents: number
    last24Hours: number
    last7Days: number
    lastEventAt: string | null
    lastEventType: string | null
    breakdown: Record<string, number>
  }
}

/**
 * WebhookSetupGuide Component
 * 
 * Displays webhook configuration status and provides step-by-step
 * instructions for setting up Resend webhooks.
 */
export function WebhookSetupGuide() {
  const [status, setStatus] = useState<WebhookStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/webhooks/resend/status')
      const data = await response.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch webhook status:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStatus()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Gekopieerd naar klembord')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const isActive = status?.status === 'active'
  const needsSetup = status?.status === 'inactive' || status?.status === 'unknown'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            <CardTitle>Webhook Configuratie</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Vernieuwen
            </Button>
            {isActive ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Actief
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Configuratie nodig
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {status?.statusMessage || 'Webhook status controleren...'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Overview */}
        {isActive && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Send className="w-4 h-4" />
                <span className="text-xs">Totaal Events</span>
              </div>
              <p className="text-2xl font-bold">{status?.statistics.totalEvents || 0}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Eye className="w-4 h-4" />
                <span className="text-xs">Opens (7d)</span>
              </div>
              <p className="text-2xl font-bold">{status?.statistics.breakdown?.opened || 0}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MousePointer className="w-4 h-4" />
                <span className="text-xs">Clicks (7d)</span>
              </div>
              <p className="text-2xl font-bold">{status?.statistics.breakdown?.clicked || 0}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Bounces (7d)</span>
              </div>
              <p className="text-2xl font-bold">{status?.statistics.breakdown?.bounced || 0}</p>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {needsSetup && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Webhook setup vereist</AlertTitle>
            <AlertDescription className="text-amber-700">
              Om open rates en click rates te tracken moet je een webhook configureren in het Resend dashboard.
            </AlertDescription>
          </Alert>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="setup">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                {needsSetup ? (
                  <XCircle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                Stap-voor-stap setup instructies
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Ga naar Resend Dashboard</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Open het Resend dashboard en navigeer naar Webhooks.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://resend.com/webhooks" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Open Resend Dashboard
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Maak een nieuwe webhook</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Klik op &quot;Add Webhook&quot; en vul de volgende URL in:
                  </p>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                    <code className="text-sm flex-1 break-all">
                      {status?.configuration.webhookUrl || 'https://your-domain.com/api/webhooks/resend'}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(status?.configuration.webhookUrl || '')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Selecteer events</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Selecteer de volgende events om te tracken:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['email.delivered', 'email.opened', 'email.clicked', 'email.bounced', 'email.complained'].map(event => (
                      <Badge key={event} variant="secondary" className="font-mono text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Kopieer de signing secret</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Kopieer de &quot;Signing Secret&quot; en voeg deze toe aan je environment variables:
                  </p>
                  <div className="bg-muted rounded-lg p-3">
                    <code className="text-sm">RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx</code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    {status?.configuration.webhookSecretConfigured ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Webhook secret is geconfigureerd
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-amber-500" />
                        Webhook secret nog niet geconfigureerd
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Test de webhook</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Verstuur een test email en controleer of de events worden ontvangen.
                    Events verschijnen binnen enkele seconden na verzending.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Status vernieuwen
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="events">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Welke events worden getrackt?
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="font-medium">email.delivered</p>
                    <p className="text-sm text-muted-foreground">
                      Email is succesvol afgeleverd bij de ontvanger
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">email.opened</p>
                    <p className="text-sm text-muted-foreground">
                      Ontvanger heeft de email geopend (tracking pixel)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <MousePointer className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">email.clicked</p>
                    <p className="text-sm text-muted-foreground">
                      Ontvanger heeft op een link in de email geklikt
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">email.bounced</p>
                    <p className="text-sm text-muted-foreground">
                      Email kon niet worden afgeleverd (hard/soft bounce)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium">email.complained</p>
                    <p className="text-sm text-muted-foreground">
                      Ontvanger heeft de email als spam gemarkeerd
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="troubleshooting">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Probleemoplossing
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="border-l-4 border-amber-400 pl-4 py-2">
                <p className="font-medium">Events worden niet ontvangen?</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" />
                    Controleer of de webhook URL correct is
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" />
                    Controleer of de app publiek bereikbaar is (geen localhost)
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" />
                    Bekijk de Resend webhook logs voor errors
                  </li>
                </ul>
              </div>

              <div className="border-l-4 border-amber-400 pl-4 py-2">
                <p className="font-medium">Open rates zijn 0%?</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" />
                    Resend voegt automatisch een tracking pixel toe
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" />
                    Sommige email clients blokkeren tracking pixels
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" />
                    Privacy features van Apple Mail beïnvloeden tracking
                  </li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-400 pl-4 py-2">
                <p className="font-medium">Test de webhook endpoint</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Je kunt de webhook endpoint testen met een GET request:
                </p>
                <div className="bg-muted rounded-lg p-2 mt-2">
                  <code className="text-xs">
                    curl {status?.configuration.webhookUrl || 'https://your-domain.com/api/webhooks/resend'}
                  </code>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
