"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    MapPin, 
    Building, 
    ExternalLink, 
    Navigation,
    Copy,
    Check
} from "lucide-react"
import { toast } from "sonner"

interface LocationCardProps {
    address?: string | null
    city: string
    postalCode?: string | null
    lat?: number
    lon?: number
    isValidated?: boolean
}

/**
 * Dark satellite-style map card for Amsterdam Centrum
 * Uses CSS gradients to simulate a dark map aesthetic
 */
export function LocationCard({ 
    address, 
    city, 
    postalCode,
    lat,
    lon,
    isValidated = true 
}: LocationCardProps) {
    const [copied, setCopied] = useState(false)
    
    const fullAddress = [address, postalCode, city].filter(Boolean).join(", ")
    const hasCoordinates = lat && lon
    
    const handleOpenMaps = () => {
        if (hasCoordinates) {
            window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank')
        } else if (address) {
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`, '_blank')
        }
    }
    
    const handleCopyCoords = async () => {
        if (hasCoordinates) {
            await navigator.clipboard.writeText(`${lat}, ${lon}`)
            setCopied(true)
            toast.success("Coördinaten gekopieerd")
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
            {/* Dark Satellite Map Background */}
            <div 
                className="h-44 relative cursor-pointer"
                onClick={handleOpenMaps}
            >
                {/* Base dark map layer */}
                <div className="absolute inset-0 bg-[#1a1f3c]" />
                
                {/* Canal/water patterns - Amsterdam style */}
                <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">
                    {/* Horizontal canals */}
                    <rect x="0" y="35" width="400" height="12" fill="#2a3156" />
                    <rect x="0" y="85" width="400" height="14" fill="#252a4a" />
                    <rect x="0" y="140" width="400" height="10" fill="#2a3156" />
                    
                    {/* Vertical streets */}
                    <rect x="80" y="0" width="6" height="180" fill="#3a4166" opacity="0.7" />
                    <rect x="180" y="0" width="5" height="180" fill="#3a4166" opacity="0.7" />
                    <rect x="280" y="0" width="6" height="180" fill="#3a4166" opacity="0.7" />
                    <rect x="350" y="0" width="5" height="180" fill="#3a4166" opacity="0.6" />
                    
                    {/* Building blocks between canals */}
                    <rect x="10" y="50" width="60" height="30" fill="#252847" rx="2" />
                    <rect x="90" y="50" width="80" height="32" fill="#232645" rx="2" />
                    <rect x="190" y="48" width="80" height="34" fill="#252847" rx="2" />
                    <rect x="290" y="50" width="50" height="30" fill="#232645" rx="2" />
                    
                    <rect x="10" y="100" width="60" height="35" fill="#232645" rx="2" />
                    <rect x="90" y="102" width="80" height="32" fill="#252847" rx="2" />
                    <rect x="190" y="100" width="80" height="36" fill="#232645" rx="2" />
                    <rect x="290" y="102" width="50" height="32" fill="#252847" rx="2" />
                    
                    {/* Street labels */}
                    <text x="50" y="82" fill="#7a8cba" fontSize="8" fontFamily="system-ui" opacity="0.8" transform="rotate(-65, 50, 82)">Keizersgracht</text>
                    <text x="320" y="62" fill="#7a8cba" fontSize="7" fontFamily="system-ui" opacity="0.7">Herengracht</text>
                </svg>
                
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/30" />
                
                {/* Center marker */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10">
                    <div className="relative">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 border-2 border-white">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-red-500" />
                    </div>
                </div>
                
                {/* Address overlay at bottom */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
                    <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-white font-semibold text-sm truncate">
                                {address || city}
                            </p>
                            {address && (
                                <p className="text-slate-400 text-xs">
                                    {city}
                                </p>
                            )}
                        </div>
                        <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-7 px-2 text-xs bg-white/10 hover:bg-white/20 text-white border-0 shrink-0"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleOpenMaps()
                            }}
                        >
                            <Navigation className="w-3 h-3 mr-1" />
                            Open
                        </Button>
                    </div>
                </div>
                
                {/* BAG Validated badge */}
                {isValidated && (
                    <div className="absolute top-2 right-2 z-10">
                        <Badge 
                            variant="secondary" 
                            className="bg-emerald-500/90 text-white border-0 shadow-lg text-[10px] font-semibold gap-1"
                        >
                            <Building className="w-3 h-3" />
                            BAG Geverifieerd
                        </Badge>
                    </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white/80 text-xs flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Openen in Google Maps
                    </span>
                </div>
            </div>
            
            {/* Coordinates bar */}
            {hasCoordinates && (
                <div className="px-3 py-2 bg-slate-800 flex items-center justify-between border-t border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span className="font-mono">{lat?.toFixed(4)}°N, {lon?.toFixed(4)}°E</span>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs text-slate-400 hover:text-white"
                        onClick={handleCopyCoords}
                    >
                        {copied ? (
                            <Check className="w-3 h-3" />
                        ) : (
                            <Copy className="w-3 h-3" />
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
