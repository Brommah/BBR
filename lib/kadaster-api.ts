"use server"

/**
 * Kadaster API Integration (Mock)
 * 
 * Provides property data from the Dutch Land Registry (Kadaster)
 * Currently using mock data for development.
 * 
 * Real API: https://www.kadaster.nl/zakelijk/producten/adressen-en-gebouwen/bag-api
 */

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Property information from Kadaster/BAG
 */
export interface KadasterProperty {
  // Identificatie
  bagId: string
  kadastraalNummer: string
  
  // Adresgegevens
  straat: string
  huisnummer: string
  postcode: string
  woonplaats: string
  
  // Gebouw eigenschappen
  bouwjaar: number
  oppervlakte: number // m²
  aantalKamers: number
  aantalVerdiepingen: number
  
  // Type en status
  gebruiksdoel: string
  pandStatus: string
  eigendomType: string
  
  // Kadastrale gegevens
  perceelOppervlakte: number // m²
  koopsom?: number
  koopsomDatum?: string
  
  // Monument/beschermd
  rijksmonument: boolean
  gemeentelijkMonument: boolean
  beschermdStadsgezicht: boolean
  
  // Bestemmingsplan
  bestemmingsplan: string
  bestemmingType: string
  
  // Coördinaten
  rdX: number
  rdY: number
  lat: number
  lon: number
}

/**
 * Eigenaar informatie (privacy-gefilterd)
 */
export interface EigenaarInfo {
  type: 'particulier' | 'rechtspersoon'
  naam?: string // Alleen bij rechtspersoon
  aandeelTeller: number
  aandeelNoemer: number
}

/**
 * Volledige Kadaster response
 */
export interface KadasterResponse {
  property: KadasterProperty
  eigenaren: EigenaarInfo[]
  laatstBijgewerkt: string
  bron: string
}

// ============================================================
// Mock Data - Amsterdam Centrum / Keizersgracht
// ============================================================

const AMSTERDAM_MOCK_DATA: Record<string, KadasterResponse> = {
  // Keizersgracht 123, Amsterdam - Jan de Vries project
  'keizersgracht-123': {
    property: {
      bagId: '0363100012345678',
      kadastraalNummer: 'ASD04-K-12345',
      straat: 'Keizersgracht',
      huisnummer: '123',
      postcode: '1015 CJ',
      woonplaats: 'Amsterdam',
      bouwjaar: 1672,
      oppervlakte: 285,
      aantalKamers: 8,
      aantalVerdiepingen: 4,
      gebruiksdoel: 'woonfunctie',
      pandStatus: 'Pand in gebruik',
      eigendomType: 'Vol eigendom',
      perceelOppervlakte: 142,
      koopsom: 2850000,
      koopsomDatum: '2019-06-15',
      rijksmonument: true,
      gemeentelijkMonument: false,
      beschermdStadsgezicht: true,
      bestemmingsplan: 'Centrum',
      bestemmingType: 'Wonen - Grachtengordel',
      rdX: 121089,
      rdY: 487234,
      lat: 52.3702,
      lon: 4.8873,
    },
    eigenaren: [
      {
        type: 'particulier',
        aandeelTeller: 1,
        aandeelNoemer: 1,
      }
    ],
    laatstBijgewerkt: '2024-12-01',
    bron: 'Kadaster / BAG'
  }
}

/**
 * Zoek property data op basis van adres
 */
export async function getKadasterByAddress(
  straat: string,
  huisnummer: string,
  woonplaats: string
): Promise<ActionResult<KadasterResponse>> {
  // Simuleer network delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400))
  
  // Normaliseer de lookup key
  const key = `${straat.toLowerCase().replace(/\s+/g, '-')}-${huisnummer}`.toLowerCase()
  
  // Check voor mock data
  if (key.includes('keizersgracht') && huisnummer === '123') {
    console.log('[Kadaster Mock] Returning data for Keizersgracht 123, Amsterdam')
    return { success: true, data: AMSTERDAM_MOCK_DATA['keizersgracht-123'] }
  }
  
  // Genereer generic mock data voor andere adressen
  const genericData: KadasterResponse = {
    property: {
      bagId: `0363${Math.floor(Math.random() * 100000000).toString().padStart(12, '0')}`,
      kadastraalNummer: `ASD04-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 99999)}`,
      straat,
      huisnummer,
      postcode: '1000 AA',
      woonplaats,
      bouwjaar: 1900 + Math.floor(Math.random() * 100),
      oppervlakte: 80 + Math.floor(Math.random() * 200),
      aantalKamers: 3 + Math.floor(Math.random() * 5),
      aantalVerdiepingen: 2 + Math.floor(Math.random() * 3),
      gebruiksdoel: 'woonfunctie',
      pandStatus: 'Pand in gebruik',
      eigendomType: 'Vol eigendom',
      perceelOppervlakte: 50 + Math.floor(Math.random() * 150),
      rijksmonument: Math.random() > 0.9,
      gemeentelijkMonument: Math.random() > 0.85,
      beschermdStadsgezicht: Math.random() > 0.7,
      bestemmingsplan: 'Wonen',
      bestemmingType: 'Wonen',
      rdX: 120000 + Math.floor(Math.random() * 5000),
      rdY: 485000 + Math.floor(Math.random() * 5000),
      lat: 52.35 + Math.random() * 0.05,
      lon: 4.85 + Math.random() * 0.05,
    },
    eigenaren: [{ type: 'particulier', aandeelTeller: 1, aandeelNoemer: 1 }],
    laatstBijgewerkt: new Date().toISOString().split('T')[0],
    bron: 'Kadaster / BAG (Mock)'
  }
  
  return { success: true, data: genericData }
}

/**
 * Haal property data op basis van BAG ID
 */
export async function getKadasterByBagId(bagId: string): Promise<ActionResult<KadasterResponse>> {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Check of het de Jan de Vries property is
  if (bagId === '0363100012345678') {
    return { success: true, data: AMSTERDAM_MOCK_DATA['keizersgracht-123'] }
  }
  
  return { success: false, error: 'BAG ID niet gevonden' }
}
