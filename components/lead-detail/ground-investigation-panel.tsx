"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Layers,
    MapPin,
    Search,
    ExternalLink,
    AlertCircle,
    Loader2,
    RefreshCw,
    ArrowDown,
    Droplets,
} from "lucide-react"
import { toast } from "sonner"
import { 
    getGroundInvestigationsNearLocation, 
    type GroundInvestigationSummary,
    type CPTResult
} from "@/lib/bro-api"
import { requiresGroundInvestigation, getCPTVisualizationUrl } from "@/lib/project-utils"

interface GroundInvestigationPanelProps {
    projectType: string
    address?: string | null
    city: string
    /** Latitude of the project location */
    lat?: number
    /** Longitude of the project location */
    lon?: number
    /** Lead specifications to extract coordinates from */
    specifications?: Array<{ key: string; value: string; unit?: string | null }>
    /** Auto-search on mount if coordinates are available */
    autoSearch?: boolean
}

export function GroundInvestigationPanel({ 
    projectType, 
    address, 
    city,
    lat,
    lon,
    specifications = [],
    autoSearch = true
}: GroundInvestigationPanelProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState<GroundInvestigationSummary | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [selectedCPT, setSelectedCPT] = useState<CPTResult | null>(null)
    const [searchRadius, setSearchRadius] = useState(500)
    const [hasAutoSearched, setHasAutoSearched] = useState(false)
    
    // Extract coordinates from specifications if not provided directly
    const extractedLat = lat ?? parseFloat(
        specifications.find(s => s.key.toLowerCase().includes('latitude') || s.key.toLowerCase() === 'lat')?.value || ''
    )
    const extractedLon = lon ?? parseFloat(
        specifications.find(s => s.key.toLowerCase().includes('longitude') || s.key.toLowerCase() === 'lon')?.value || ''
    )
    
    const [manualLat, setManualLat] = useState(
        !isNaN(extractedLat) ? extractedLat.toString() : ""
    )
    const [manualLon, setManualLon] = useState(
        !isNaN(extractedLon) ? extractedLon.toString() : ""
    )

    const isRelevant = requiresGroundInvestigation(projectType)
    const hasValidCoords = !isNaN(parseFloat(manualLat)) && !isNaN(parseFloat(manualLon))

    const handleSearch = async () => {
        const searchLat = parseFloat(manualLat)
        const searchLon = parseFloat(manualLon)

        if (isNaN(searchLat) || isNaN(searchLon)) {
            toast.error("Voer geldige coördinaten in")
            return
        }

        setIsLoading(true)
        setError(null)

        const result = await getGroundInvestigationsNearLocation(
            searchLat,
            searchLon,
            searchRadius
        )

        if (result.success && result.data) {
            setData(result.data)
            if (result.data.cptCount === 0 && result.data.bhrgCount === 0) {
                toast.info("Geen onderzoeken gevonden", {
                    description: "Probeer een grotere zoekradius"
                })
            } else {
                toast.success(`${result.data.cptCount} sonderingen en ${result.data.bhrgCount} boringen gevonden`)
            }
        } else {
            setError(result.error || "Kon data niet ophalen")
            toast.error("Fout bij ophalen data", {
                description: result.error
            })
        }

        setIsLoading(false)
    }

    // Auto-search on mount if coordinates are available
    useEffect(() => {
        if (autoSearch && hasValidCoords && !hasAutoSearched && !data) {
            setHasAutoSearched(true)
            handleSearch()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasValidCoords, autoSearch, hasAutoSearched])

    // Don't show panel for non-foundation projects
    if (!isRelevant) {
        return null
    }

    return (
        <div className="h-full overflow-auto">
            <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="w-5 h-5" />
                            Grondonderzoek
                            <Badge variant="outline" className="text-xs">BRO / DINO</Badge>
                        </CardTitle>
                        <CardDescription>
                            Sonderingen en boringen in de omgeving
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Location Info */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{address || city}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Latitude (N)</Label>
                            <Input
                                type="number"
                                step="0.0001"
                                placeholder="52.0..."
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Longitude (E)</Label>
                            <Input
                                type="number"
                                step="0.0001"
                                placeholder="4.3..."
                                value={manualLon}
                                onChange={(e) => setManualLon(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Radius (m)</Label>
                            <Input
                                type="number"
                                value={searchRadius}
                                onChange={(e) => setSearchRadius(parseInt(e.target.value) || 500)}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>

                    <Button 
                        onClick={handleSearch} 
                        disabled={isLoading || !manualLat || !manualLon}
                        className="w-full mt-3 gap-2"
                        size="sm"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                        Zoek Grondonderzoek
                    </Button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-destructive/10 rounded-lg text-center">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* No Data State */}
                {!data && !isLoading && !error && (
                    <div className="flex-1 flex items-center justify-center text-center p-4">
                        <div>
                            <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground mb-1">
                                Voer coördinaten in
                            </p>
                            <p className="text-xs text-muted-foreground">
                                of gebruik Google Maps om lat/lon te vinden
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Ophalen van BRO data...
                            </p>
                        </div>
                    </div>
                )}

                {/* Results */}
                {data && !isLoading && (
                    <div className="mt-4">
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ArrowDown className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs font-medium text-blue-600">Sonderingen (CPT)</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                        {data.cptCount}
                                    </p>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Layers className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs font-medium text-amber-600">Boringen (BHR-G)</span>
                                    </div>
                                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                        {data.bhrgCount}
                                    </p>
                                </div>
                            </div>

                            {/* CPT List */}
                            {data.cptResults.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <ArrowDown className="w-4 h-4" />
                                        Sonderingen
                                    </h4>
                                    <div className="space-y-2">
                                        {data.cptResults.map((cpt) => (
                                            <div 
                                                key={cpt.broId}
                                                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedCPT(selectedCPT?.broId === cpt.broId ? null : cpt)}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-mono text-xs font-medium">
                                                        {cpt.broId}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {cpt.qualityClass || 'Onbekend'}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    {cpt.finalDepth && (
                                                        <span className="flex items-center gap-1">
                                                            <ArrowDown className="w-3 h-3" />
                                                            {cpt.finalDepth}m diep
                                                        </span>
                                                    )}
                                                    {cpt.groundwaterLevel && (
                                                        <span className="flex items-center gap-1">
                                                            <Droplets className="w-3 h-3" />
                                                            GWS: {cpt.groundwaterLevel}m
                                                        </span>
                                                    )}
                                                    {cpt.researchReportDate && (
                                                        <span>
                                                            {new Date(cpt.researchReportDate).toLocaleDateString('nl-NL')}
                                                        </span>
                                                    )}
                                                </div>

                                                {selectedCPT?.broId === cpt.broId && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="w-full gap-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                window.open(getCPTVisualizationUrl(cpt.broId), '_blank')
                                                            }}
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Bekijk Grafiek (BRO)
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* BHR-G List */}
                            {data.bhrgResults.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <Layers className="w-4 h-4" />
                                        Boringen
                                    </h4>
                                    <div className="space-y-2">
                                        {data.bhrgResults.map((bhrg) => (
                                            <div 
                                                key={bhrg.broId}
                                                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-mono text-xs font-medium">
                                                        {bhrg.broId}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    {bhrg.boredInterval && (
                                                        <span className="flex items-center gap-1">
                                                            <ArrowDown className="w-3 h-3" />
                                                            {bhrg.boredInterval.beginDepth} - {bhrg.boredInterval.endDepth}m
                                                        </span>
                                                    )}
                                                    {bhrg.researchReportDate && (
                                                        <span>
                                                            {new Date(bhrg.researchReportDate).toLocaleDateString('nl-NL')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Link to BROloket */}
                            <Separator />
                            <div className="text-center">
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="gap-2 text-xs"
                                    onClick={() => window.open('https://www.broloket.nl', '_blank')}
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Meer data op BROloket
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        </div>
    )
}
