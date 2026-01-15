"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Building2,
    MapPin,
    Calendar,
    Ruler,
    Home,
    Landmark,
    Shield,
    ExternalLink,
    Loader2,
    AlertTriangle,
    CheckCircle,
    Euro
} from "lucide-react"
import { getKadasterByAddress, type KadasterResponse } from "@/lib/kadaster-api"

interface KadasterPanelProps {
    address?: string | null
    huisnummer?: string
    city: string
}

export function KadasterPanel({ address, huisnummer, city }: KadasterPanelProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<KadasterResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Parse address to extract street and house number
    const parseAddress = () => {
        if (!address) return { straat: '', huisnummer: '' }
        
        // Match patterns like "Keizersgracht 123" or "Keizersgracht 123a"
        const match = address.match(/^(.+?)\s+(\d+\S*)$/)
        if (match) {
            return { straat: match[1], huisnummer: match[2] }
        }
        return { straat: address, huisnummer: huisnummer || '' }
    }

    useEffect(() => {
        const fetchData = async () => {
            const { straat, huisnummer: hn } = parseAddress()
            if (!straat || !hn) return

            setIsLoading(true)
            setError(null)

            const result = await getKadasterByAddress(straat, hn, city)
            
            if (result.success && result.data) {
                setData(result.data)
            } else {
                setError(result.error || 'Kon Kadaster data niet ophalen')
            }
            
            setIsLoading(false)
        }

        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address, city])

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Kadaster data ophalen...</p>
                </CardContent>
            </Card>
        )
    }

    if (error || !data) {
        return (
            <Card>
                <CardContent className="py-6 text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-sm text-muted-foreground">{error || 'Geen data beschikbaar'}</p>
                </CardContent>
            </Card>
        )
    }

    const { property } = data

    return (
        <Card className="border-teal-200/50 dark:border-teal-800/30 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Kadaster / BAG</CardTitle>
                            <p className="text-xs text-muted-foreground">Officiële vastgoedgegevens</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700">
                        {data.bron}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {/* Monument Status - Prominent */}
                {(property.rijksmonument || property.gemeentelijkMonument || property.beschermdStadsgezicht) && (
                    <div className="flex flex-wrap gap-2">
                        {property.rijksmonument && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 gap-1">
                                <Landmark className="w-3 h-3" />
                                Rijksmonument
                            </Badge>
                        )}
                        {property.gemeentelijkMonument && (
                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 gap-1">
                                <Landmark className="w-3 h-3" />
                                Gemeentelijk Monument
                            </Badge>
                        )}
                        {property.beschermdStadsgezicht && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 gap-1">
                                <Shield className="w-3 h-3" />
                                Beschermd Stadsgezicht
                            </Badge>
                        )}
                    </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{property.bouwjaar}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Bouwjaar</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <Ruler className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{property.oppervlakte}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">m² Wonen</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <Home className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{property.aantalVerdiepingen}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Verdiepingen</p>
                    </div>
                </div>

                <Separator />

                {/* Details List */}
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Kadastraal nr.</span>
                        <span className="font-mono text-xs">{property.kadastraalNummer}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">BAG ID</span>
                        <span className="font-mono text-xs">{property.bagId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Perceel opp.</span>
                        <span>{property.perceelOppervlakte} m²</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Gebruiksdoel</span>
                        <span className="capitalize">{property.gebruiksdoel}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            {property.pandStatus}
                        </span>
                    </div>
                </div>

                <Separator />

                {/* Bestemmingsplan */}
                <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Bestemmingsplan
                    </h4>
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                        <p className="font-medium text-sm">{property.bestemmingsplan}</p>
                        <p className="text-xs text-muted-foreground">{property.bestemmingType}</p>
                    </div>
                </div>

                {/* Koopsom (if available) */}
                {property.koopsom && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center gap-2">
                            <Euro className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Laatste verkoop</span>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">€ {property.koopsom.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                                {property.koopsomDatum && new Date(property.koopsomDatum).toLocaleDateString('nl-NL')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-muted-foreground">
                        Bijgewerkt: {new Date(data.laatstBijgewerkt).toLocaleDateString('nl-NL')}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => window.open('https://bagviewer.kadaster.nl', '_blank')}
                    >
                        <ExternalLink className="w-3 h-3" />
                        BAG Viewer
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
