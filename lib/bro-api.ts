"use server"

/**
 * BRO (Basisregistratie Ondergrond) API Integration
 * 
 * Provides access to soil and ground investigation data from the Dutch
 * national subsurface registry. Used for foundation projects.
 * 
 * API Documentation: https://www.bro-productomgeving.nl/bpo/latest/url-s-publieke-rest-services
 * 
 * NOTE: Currently using mock data for development. Set USE_MOCK_DATA = false
 * to use the real BRO API.
 */

const BRO_BASE_URL = 'https://publiek.broservices.nl'

// CPT (Cone Penetration Test / Sondering) endpoints
const CPT_API = `${BRO_BASE_URL}/sr/cpt/v1`

// BHR-G (Borehole Research - Geotechnical) endpoints
const BHRG_API = `${BRO_BASE_URL}/sr/bhrg/v3`

// Toggle for mock data (set to false to use real API)
const USE_MOCK_DATA = true

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * CPT (Sondering) data from BRO
 */
export interface CPTResult {
  broId: string
  deliveredLocation: {
    x: number
    y: number
    srs: string
  }
  deliveredVerticalPosition?: {
    localVerticalReferencePoint: string
    offset: number
    verticalDatum: string
  }
  researchReportDate?: string
  cptStandard?: string
  qualityClass?: string
  predrilled?: {
    depth: number
  }
  finalDepth?: number
  groundwaterLevel?: number
  dissipationTestPerformed?: boolean
}

/**
 * BHR-G (Boring met geotechnisch onderzoek) data
 */
export interface BHRGResult {
  broId: string
  deliveredLocation: {
    x: number
    y: number
    srs: string
  }
  boredInterval?: {
    beginDepth: number
    endDepth: number
  }
  researchReportDate?: string
}

/**
 * Summary of available ground investigations near a location
 */
export interface GroundInvestigationSummary {
  location: {
    x: number
    y: number
    radius: number
  }
  cptCount: number
  bhrgCount: number
  cptResults: CPTResult[]
  bhrgResults: BHRGResult[]
}

// ============================================================
// Mock Data Generators
// ============================================================

/**
 * Pre-defined mock data for Amsterdam Centrum / Keizersgracht area
 * Realistic soil profiles typical for Amsterdam historic center:
 * - High groundwater (1-2m below surface)
 * - Soft Holocene layers (veen, klei)
 * - Pleistocene sand at ~12-15m depth
 * - Wooden pile foundations typically reach ~13m
 */
const AMSTERDAM_CENTRUM_CPT: CPTResult[] = [
  {
    broId: 'CPT000125847',
    deliveredLocation: { x: 121089, y: 487234, srs: 'EPSG:28992' },
    deliveredVerticalPosition: { localVerticalReferencePoint: 'maaiveld', offset: -0.15, verticalDatum: 'NAP' },
    researchReportDate: '2019-03-14',
    cptStandard: 'NEN-EN-ISO 22476-1',
    qualityClass: 'klasse 2',
    predrilled: { depth: 1.5 },
    finalDepth: 18.2,
    groundwaterLevel: 1.35,
    dissipationTestPerformed: true
  },
  {
    broId: 'CPT000098432',
    deliveredLocation: { x: 121156, y: 487298, srs: 'EPSG:28992' },
    deliveredVerticalPosition: { localVerticalReferencePoint: 'maaiveld', offset: -0.22, verticalDatum: 'NAP' },
    researchReportDate: '2017-09-22',
    cptStandard: 'NEN-EN-ISO 22476-1',
    qualityClass: 'klasse 1',
    finalDepth: 22.5,
    groundwaterLevel: 1.42,
    dissipationTestPerformed: true
  },
  {
    broId: 'CPT000156789',
    deliveredLocation: { x: 121023, y: 487189, srs: 'EPSG:28992' },
    deliveredVerticalPosition: { localVerticalReferencePoint: 'maaiveld', offset: -0.08, verticalDatum: 'NAP' },
    researchReportDate: '2021-05-03',
    cptStandard: 'NEN-EN-ISO 22476-12',
    qualityClass: 'klasse 2',
    predrilled: { depth: 2.0 },
    finalDepth: 16.8,
    groundwaterLevel: 1.28,
    dissipationTestPerformed: false
  },
  {
    broId: 'CPT000203156',
    deliveredLocation: { x: 121198, y: 487156, srs: 'EPSG:28992' },
    deliveredVerticalPosition: { localVerticalReferencePoint: 'maaiveld', offset: 0.05, verticalDatum: 'NAP' },
    researchReportDate: '2022-11-18',
    cptStandard: 'NEN-EN-ISO 22476-1',
    qualityClass: 'klasse 1',
    finalDepth: 25.0,
    groundwaterLevel: 1.55,
    dissipationTestPerformed: true
  },
  {
    broId: 'CPT000087654',
    deliveredLocation: { x: 120967, y: 487312, srs: 'EPSG:28992' },
    deliveredVerticalPosition: { localVerticalReferencePoint: 'maaiveld', offset: -0.18, verticalDatum: 'NAP' },
    researchReportDate: '2015-07-29',
    cptStandard: 'NEN 5140',
    qualityClass: 'klasse 3',
    finalDepth: 14.5,
    groundwaterLevel: 1.62,
    dissipationTestPerformed: false
  }
]

const AMSTERDAM_CENTRUM_BHRG: BHRGResult[] = [
  {
    broId: 'BHR000034521',
    deliveredLocation: { x: 121112, y: 487245, srs: 'EPSG:28992' },
    boredInterval: { beginDepth: 0, endDepth: 15.0 },
    researchReportDate: '2018-04-12'
  },
  {
    broId: 'BHR000045678',
    deliveredLocation: { x: 121078, y: 487278, srs: 'EPSG:28992' },
    boredInterval: { beginDepth: 0, endDepth: 20.5 },
    researchReportDate: '2020-08-25'
  },
  {
    broId: 'BHR000012345',
    deliveredLocation: { x: 121145, y: 487198, srs: 'EPSG:28992' },
    boredInterval: { beginDepth: 0, endDepth: 12.0 },
    researchReportDate: '2016-02-14'
  }
]

/**
 * Check if coordinates are in Amsterdam Centrum area
 * RD coordinates for Amsterdam center: roughly X: 120000-123000, Y: 485000-489000
 */
function isAmsterdamCentrum(x: number, y: number): boolean {
  return x >= 119000 && x <= 124000 && y >= 485000 && y <= 490000
}

function generateMockCPTResults(count: number, baseX: number, baseY: number): CPTResult[] {
  // Return Amsterdam-specific data if in Amsterdam Centrum
  if (isAmsterdamCentrum(baseX, baseY)) {
    console.log('[BRO Mock] Using Amsterdam Centrum preset data for Jan de Vries dossier')
    return AMSTERDAM_CENTRUM_CPT
  }

  // Generic mock data for other locations
  const results: CPTResult[] = []
  const qualityClasses = ['klasse 1', 'klasse 2', 'klasse 3', 'klasse 4']
  const standards = ['NEN-EN-ISO 22476-1', 'NEN 5140', 'NEN-EN-ISO 22476-12']
  
  for (let i = 0; i < count; i++) {
    const offsetX = (Math.random() - 0.5) * 800
    const offsetY = (Math.random() - 0.5) * 800
    const depth = 8 + Math.random() * 25
    const gwLevel = 0.5 + Math.random() * 3
    
    results.push({
      broId: `CPT${String(100000 + Math.floor(Math.random() * 900000)).padStart(6, '0')}`,
      deliveredLocation: {
        x: Math.round(baseX + offsetX),
        y: Math.round(baseY + offsetY),
        srs: 'EPSG:28992'
      },
      deliveredVerticalPosition: {
        localVerticalReferencePoint: 'maaiveld',
        offset: Math.round((Math.random() * 2 - 0.5) * 100) / 100,
        verticalDatum: 'NAP'
      },
      researchReportDate: new Date(
        Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
      cptStandard: standards[Math.floor(Math.random() * standards.length)],
      qualityClass: qualityClasses[Math.floor(Math.random() * qualityClasses.length)],
      predrilled: Math.random() > 0.7 ? { depth: Math.round(Math.random() * 3 * 10) / 10 } : undefined,
      finalDepth: Math.round(depth * 10) / 10,
      groundwaterLevel: Math.round(gwLevel * 100) / 100,
      dissipationTestPerformed: Math.random() > 0.8
    })
  }
  
  return results
}

function generateMockBHRGResults(count: number, baseX: number, baseY: number): BHRGResult[] {
  // Return Amsterdam-specific data if in Amsterdam Centrum
  if (isAmsterdamCentrum(baseX, baseY)) {
    console.log('[BRO Mock] Using Amsterdam Centrum BHRG preset data')
    return AMSTERDAM_CENTRUM_BHRG
  }

  // Generic mock data for other locations
  const results: BHRGResult[] = []
  
  for (let i = 0; i < count; i++) {
    const offsetX = (Math.random() - 0.5) * 800
    const offsetY = (Math.random() - 0.5) * 800
    const beginDepth = 0
    const endDepth = 5 + Math.random() * 20
    
    results.push({
      broId: `BHR${String(100000 + Math.floor(Math.random() * 900000)).padStart(6, '0')}`,
      deliveredLocation: {
        x: Math.round(baseX + offsetX),
        y: Math.round(baseY + offsetY),
        srs: 'EPSG:28992'
      },
      boredInterval: {
        beginDepth,
        endDepth: Math.round(endDepth * 10) / 10
      },
      researchReportDate: new Date(
        Date.now() - Math.random() * 15 * 365 * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0]
    })
  }
  
  return results
}

// ============================================================
// Coordinate Conversion
// ============================================================

/**
 * Convert WGS84 (lat/lon) to RD coordinates (Dutch national grid)
 * Using simplified transformation - for production use a proper library
 */
function wgs84ToRD(lat: number, lon: number): { x: number; y: number } {
  // Simplified WGS84 to RD transformation
  // For accurate results, use proj4 library
  const X0 = 155000
  const Y0 = 463000
  const PHI0 = 52.15517440
  const LAM0 = 5.38720621

  const dPhi = 0.36 * (lat - PHI0)
  const dLam = 0.36 * (lon - LAM0)

  const x = X0 + 
    190094.945 * dLam -
    11832.228 * dPhi * dLam -
    114.221 * dPhi * dPhi * dLam +
    0.000 * dPhi * dPhi * dPhi * dLam -
    32.391 * dLam * dLam * dLam -
    0.000 * dPhi * dLam * dLam * dLam

  const y = Y0 +
    309056.544 * dPhi -
    3638.893 * dLam * dLam +
    73.077 * dPhi * dPhi -
    157.984 * dPhi * dLam * dLam +
    59.788 * dPhi * dPhi * dPhi +
    0.433 * dLam * dLam * dLam * dLam -
    6.439 * dPhi * dPhi * dLam * dLam -
    0.032 * dPhi * dLam * dLam * dLam * dLam +
    0.092 * dPhi * dPhi * dPhi * dPhi -
    0.054 * dPhi * dPhi * dLam * dLam * dLam * dLam

  return { x: Math.round(x), y: Math.round(y) }
}

/**
 * Search for CPT (sonderingen) near a location
 */
export async function searchCPTNearLocation(
  lat: number,
  lon: number,
  radiusMeters: number = 500
): Promise<ActionResult<CPTResult[]>> {
  // Convert to RD coordinates
  const { x, y } = wgs84ToRD(lat, lon)

  // Use mock data for development
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
    
    // Generate 3-8 mock CPT results
    const count = 3 + Math.floor(Math.random() * 6)
    const results = generateMockCPTResults(count, x, y)
    
    console.log(`[BRO Mock] Generated ${count} CPT results near RD(${x}, ${y})`)
    return { success: true, data: results }
  }

  try {
    // Build bounding box
    const minX = x - radiusMeters
    const maxX = x + radiusMeters
    const minY = y - radiusMeters
    const maxY = y + radiusMeters

    // Search using bounding box
    const url = `${CPT_API}/objects?bbox=${minX},${minY},${maxX},${maxY}&srs=EPSG:28992`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Te veel verzoeken. Probeer later opnieuw.' }
      }
      return { success: false, error: `BRO API error: ${response.status}` }
    }

    const data = await response.json()
    
    // Parse response - format depends on BRO API version
    const results: CPTResult[] = []
    
    if (data.registrationObjects) {
      for (const obj of data.registrationObjects) {
        results.push({
          broId: obj.broId,
          deliveredLocation: obj.deliveredLocation,
          researchReportDate: obj.researchReportDate,
          cptStandard: obj.cptStandard,
          qualityClass: obj.qualityClass,
          finalDepth: obj.finalDepth,
          groundwaterLevel: obj.groundwaterLevel,
          dissipationTestPerformed: obj.dissipationTestPerformed,
        })
      }
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('[BRO] CPT search error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Kon sonderingen niet ophalen' 
    }
  }
}

/**
 * Search for BHR-G (boringen met geotechnisch onderzoek) near a location
 */
export async function searchBHRGNearLocation(
  lat: number,
  lon: number,
  radiusMeters: number = 500
): Promise<ActionResult<BHRGResult[]>> {
  const { x, y } = wgs84ToRD(lat, lon)

  // Use mock data for development
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400))
    
    // Generate 1-5 mock BHRG results
    const count = 1 + Math.floor(Math.random() * 5)
    const results = generateMockBHRGResults(count, x, y)
    
    console.log(`[BRO Mock] Generated ${count} BHRG results near RD(${x}, ${y})`)
    return { success: true, data: results }
  }

  try {
    const minX = x - radiusMeters
    const maxX = x + radiusMeters
    const minY = y - radiusMeters
    const maxY = y + radiusMeters

    const url = `${BHRG_API}/objects?bbox=${minX},${minY},${maxX},${maxY}&srs=EPSG:28992`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Te veel verzoeken. Probeer later opnieuw.' }
      }
      return { success: false, error: `BRO API error: ${response.status}` }
    }

    const data = await response.json()
    
    const results: BHRGResult[] = []
    
    if (data.registrationObjects) {
      for (const obj of data.registrationObjects) {
        results.push({
          broId: obj.broId,
          deliveredLocation: obj.deliveredLocation,
          boredInterval: obj.boredInterval,
          researchReportDate: obj.researchReportDate,
        })
      }
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('[BRO] BHRG search error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Kon boringen niet ophalen' 
    }
  }
}

/**
 * Get detailed CPT data by BRO ID
 */
export async function getCPTDetails(broId: string): Promise<ActionResult<CPTResult>> {
  // Use mock data for development
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Generate a single mock CPT with the requested ID
    const mockResult: CPTResult = {
      broId,
      deliveredLocation: {
        x: 155000 + Math.floor(Math.random() * 10000),
        y: 463000 + Math.floor(Math.random() * 10000),
        srs: 'EPSG:28992'
      },
      deliveredVerticalPosition: {
        localVerticalReferencePoint: 'maaiveld',
        offset: Math.round((Math.random() * 2 - 0.5) * 100) / 100,
        verticalDatum: 'NAP'
      },
      researchReportDate: '2022-06-15',
      cptStandard: 'NEN-EN-ISO 22476-1',
      qualityClass: 'klasse 2',
      finalDepth: 18.5,
      groundwaterLevel: 1.85,
      dissipationTestPerformed: true
    }
    
    return { success: true, data: mockResult }
  }

  try {
    const url = `${CPT_API}/objects/${broId}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return { success: false, error: `BRO API error: ${response.status}` }
    }

    const data = await response.json()
    
    return { 
      success: true, 
      data: {
        broId: data.broId,
        deliveredLocation: data.deliveredLocation,
        deliveredVerticalPosition: data.deliveredVerticalPosition,
        researchReportDate: data.researchReportDate,
        cptStandard: data.cptStandard,
        qualityClass: data.qualityClass,
        predrilled: data.predrilled,
        finalDepth: data.finalDepth,
        groundwaterLevel: data.groundwaterLevel,
        dissipationTestPerformed: data.dissipationTestPerformed,
      }
    }
  } catch (error) {
    console.error('[BRO] CPT details error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Kon sondering niet ophalen' 
    }
  }
}

// Note: getCPTVisualizationUrl is in lib/project-utils.ts for client-side use

/**
 * Get all ground investigations near a location
 * Useful for foundation projects
 */
export async function getGroundInvestigationsNearLocation(
  lat: number,
  lon: number,
  radiusMeters: number = 500
): Promise<ActionResult<GroundInvestigationSummary>> {
  try {
    const { x, y } = wgs84ToRD(lat, lon)
    
    // Fetch both CPT and BHRG in parallel
    const [cptResult, bhrgResult] = await Promise.all([
      searchCPTNearLocation(lat, lon, radiusMeters),
      searchBHRGNearLocation(lat, lon, radiusMeters),
    ])

    const summary: GroundInvestigationSummary = {
      location: { x, y, radius: radiusMeters },
      cptCount: cptResult.success && cptResult.data ? cptResult.data.length : 0,
      bhrgCount: bhrgResult.success && bhrgResult.data ? bhrgResult.data.length : 0,
      cptResults: cptResult.success && cptResult.data ? cptResult.data : [],
      bhrgResults: bhrgResult.success && bhrgResult.data ? bhrgResult.data : [],
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error('[BRO] Ground investigations error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Kon grondonderzoek niet ophalen' 
    }
  }
}

// Note: requiresGroundInvestigation is in lib/project-utils.ts for client-side use
