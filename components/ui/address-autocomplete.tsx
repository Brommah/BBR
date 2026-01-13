"use client"

import * as React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { usePlacesAutocomplete, ParsedAddress, PlaceResult } from "@/hooks/use-google-places"
import { MapPin, Loader2, AlertCircle } from "lucide-react"

export interface AddressAutocompleteProps {
  /** Current value of the input */
  value: string
  /** Callback when the value changes (user typing) */
  onChange: (value: string) => void
  /** Callback when a place is selected from autocomplete */
  onPlaceSelect?: (parsed: ParsedAddress) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether the field is required */
  required?: boolean
  /** Additional className for the input */
  className?: string
  /** Whether to show the icon */
  showIcon?: boolean
  /** Custom icon to show */
  icon?: React.ReactNode
  /** Restrict to specific country (default: 'nl') */
  country?: string | string[]
  /** ID for the input element */
  id?: string
  /** Name for the input element */
  name?: string
  /** Disable the input */
  disabled?: boolean
  /** aria-describedby for accessibility */
  "aria-describedby"?: string
}

/**
 * Address input with Google Places autocomplete
 * 
 * Features:
 * - Auto-suggests Dutch addresses as you type
 * - Parses selected address into components (street, city, postal code, etc.)
 * - Gracefully degrades to regular input if API unavailable
 * - Accessible keyboard navigation
 * 
 * @example
 * ```tsx
 * <AddressAutocomplete
 *   value={address}
 *   onChange={setAddress}
 *   onPlaceSelect={(parsed) => {
 *     setCity(parsed.city)
 *     setAddress(`${parsed.street} ${parsed.houseNumber}`)
 *   }}
 *   placeholder="Zoek adres..."
 * />
 * ```
 */
export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Zoek adres...",
  required = false,
  className,
  showIcon = true,
  icon,
  country = "nl",
  id,
  name,
  disabled = false,
  "aria-describedby": ariaDescribedBy,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  
  const handlePlaceSelect = useCallback(
    (_place: PlaceResult, parsed: ParsedAddress) => {
      // Update the input value with the full address
      onChange(parsed.fullAddress)
      onPlaceSelect?.(parsed)
    },
    [onChange, onPlaceSelect]
  )

  const { isLoaded, error } = usePlacesAutocomplete(inputRef, {
    onPlaceSelect: handlePlaceSelect,
    componentRestrictions: { country },
  })

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  // Prevent form submission on Enter when autocomplete is showing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isFocused) {
      // Check if autocomplete dropdown is visible
      const pacContainer = document.querySelector(".pac-container")
      if (pacContainer && pacContainer.style.display !== "none") {
        e.preventDefault()
      }
    }
  }

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        aria-describedby={ariaDescribedBy}
        aria-autocomplete="list"
        className={cn(
          showIcon && "pl-10",
          className
        )}
      />
      
      {showIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {!isLoaded && !error ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : error ? (
            <AlertCircle className="w-4 h-4 text-amber-500" title={error} />
          ) : (
            icon || <MapPin className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Styled Google Places Autocomplete dropdown CSS
 * Add this to your globals.css to style the dropdown
 */
export const googlePlacesStyles = `
/* Google Places Autocomplete Dropdown Styling */
.pac-container {
  background-color: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  font-family: inherit;
  margin-top: 4px;
  z-index: 9999;
}

.pac-item {
  padding: 8px 12px;
  cursor: pointer;
  border-top: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  font-size: 14px;
  line-height: 1.5;
}

.pac-item:first-child {
  border-top: none;
}

.pac-item:hover,
.pac-item-selected {
  background-color: hsl(var(--accent));
}

.pac-item-query {
  font-weight: 500;
  color: hsl(var(--foreground));
}

.pac-matched {
  font-weight: 600;
  color: hsl(var(--primary));
}

.pac-icon {
  display: none;
}

.pac-logo::after {
  display: none;
}

/* Dark mode support */
.dark .pac-container {
  background-color: hsl(var(--popover));
  border-color: hsl(var(--border));
}

.dark .pac-item {
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
}

.dark .pac-item:hover,
.dark .pac-item-selected {
  background-color: hsl(var(--accent));
}

.dark .pac-item-query {
  color: hsl(var(--foreground));
}

.dark .pac-matched {
  color: hsl(var(--primary));
}
`

export default AddressAutocomplete
