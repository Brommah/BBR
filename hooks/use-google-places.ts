import { useState, useEffect, useCallback } from 'react'

declare global {
  interface Window {
    google: typeof google
    initGooglePlaces?: () => void
  }
}

/**
 * Google Places API types
 */
export interface PlaceResult {
  formatted_address: string
  address_components: AddressComponent[]
  geometry?: {
    location: {
      lat: () => number
      lng: () => number
    }
  }
  place_id: string
}

interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

/**
 * Parsed address structure from Google Places
 */
export interface ParsedAddress {
  street: string
  houseNumber: string
  postalCode: string
  city: string
  province: string
  country: string
  fullAddress: string
  lat?: number
  lng?: number
}

/**
 * Parse address components from Google Places result
 */
export function parseAddressComponents(place: PlaceResult): ParsedAddress {
  const components = place.address_components || []
  
  const getComponent = (types: string[]): string => {
    const component = components.find(c => 
      types.some(type => c.types.includes(type))
    )
    return component?.long_name || ''
  }
  
  const getShortComponent = (types: string[]): string => {
    const component = components.find(c => 
      types.some(type => c.types.includes(type))
    )
    return component?.short_name || ''
  }
  
  return {
    street: getComponent(['route']),
    houseNumber: getComponent(['street_number']),
    postalCode: getComponent(['postal_code']),
    city: getComponent(['locality', 'sublocality', 'administrative_area_level_2']),
    province: getComponent(['administrative_area_level_1']),
    country: getShortComponent(['country']),
    fullAddress: place.formatted_address,
    lat: place.geometry?.location?.lat(),
    lng: place.geometry?.location?.lng(),
  }
}

/**
 * Google Places script loading status
 */
type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

let loadStatus: LoadStatus = 'idle'
let loadPromise: Promise<void> | null = null

/**
 * Hook to load Google Places API script
 * @returns Object with isLoaded boolean and error state
 */
export function useGooglePlaces() {
  const [status, setStatus] = useState<LoadStatus>(loadStatus)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      setError('Google Places API key not configured')
      setStatus('error')
      return
    }

    // Already loaded
    if (loadStatus === 'loaded' && window.google?.maps?.places) {
      setStatus('loaded')
      return
    }

    // Already loading
    if (loadStatus === 'loading' && loadPromise) {
      loadPromise
        .then(() => setStatus('loaded'))
        .catch((err) => {
          setError(err.message)
          setStatus('error')
        })
      return
    }

    // Start loading
    loadStatus = 'loading'
    setStatus('loading')

    loadPromise = new Promise<void>((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
      if (existingScript) {
        // Wait for it to load
        if (window.google?.maps?.places) {
          loadStatus = 'loaded'
          resolve()
          return
        }
        existingScript.addEventListener('load', () => {
          loadStatus = 'loaded'
          resolve()
        })
        existingScript.addEventListener('error', () => {
          loadStatus = 'error'
          reject(new Error('Failed to load Google Places script'))
        })
        return
      }

      // Create and load script
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=nl&region=NL`
      script.async = true
      script.defer = true

      script.onload = () => {
        loadStatus = 'loaded'
        setStatus('loaded')
        resolve()
      }

      script.onerror = () => {
        loadStatus = 'error'
        const errorMsg = 'Failed to load Google Places script'
        setError(errorMsg)
        setStatus('error')
        reject(new Error(errorMsg))
      }

      document.head.appendChild(script)
    })

    loadPromise
      .then(() => setStatus('loaded'))
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }, [])

  return {
    isLoaded: status === 'loaded',
    isLoading: status === 'loading',
    error,
  }
}

/**
 * Hook to create and manage a Google Places Autocomplete instance
 */
export function usePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement | null>,
  options?: {
    onPlaceSelect?: (place: PlaceResult, parsed: ParsedAddress) => void
    types?: string[]
    componentRestrictions?: { country: string | string[] }
  }
) {
  const { isLoaded, error } = useGooglePlaces()
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)

  const initAutocomplete = useCallback(() => {
    if (!isLoaded || !inputRef.current || autocomplete) return

    const instance = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: options?.types || ['address'],
      componentRestrictions: options?.componentRestrictions || { country: 'nl' },
      fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
    })

    instance.addListener('place_changed', () => {
      const place = instance.getPlace() as PlaceResult
      
      if (place.address_components) {
        const parsed = parseAddressComponents(place)
        options?.onPlaceSelect?.(place, parsed)
      }
    })

    setAutocomplete(instance)
  }, [isLoaded, inputRef, autocomplete, options])

  useEffect(() => {
    initAutocomplete()
  }, [initAutocomplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autocomplete) {
        window.google?.maps?.event?.clearInstanceListeners(autocomplete)
      }
    }
  }, [autocomplete])

  return {
    isLoaded,
    error,
    autocomplete,
  }
}
