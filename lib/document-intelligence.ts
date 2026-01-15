"use server"

/**
 * Document Intelligence API (Mock)
 * 
 * AI-powered document analysis for construction drawings:
 * - OCR dimension extraction
 * - Drawing classification
 * - Specification detection
 * 
 * In production, integrate with Azure Document Intelligence or Google Document AI
 */

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================
// Types
// ============================================================

/**
 * Geëxtraheerde dimensie uit een tekening
 */
export interface ExtractedDimension {
  id: string
  label: string
  waarde: number
  eenheid: 'mm' | 'm' | 'm²' | 'm³'
  confidence: number // 0-1
  bron: string // Document naam
  locatie?: string // Beschrijving waar op de tekening
}

/**
 * Classificatie van een document
 */
export interface DocumentClassification {
  type: DocumentType
  subtype?: string
  fase?: 'VO' | 'DO' | 'TO' | 'UO' | 'Revisie'
  schaal?: string
  confidence: number
  suggesties: string[]
}

export type DocumentType = 
  | 'plattegrond'
  | 'doorsnede'
  | 'gevelaanzicht'
  | 'detailtekening'
  | 'constructietekening'
  | 'situatietekening'
  | 'principedetail'
  | 'foto'
  | 'rapport'
  | 'berekening'
  | 'vergunning'
  | 'onbekend'

/**
 * Checklist item met validatie status
 */
export interface ChecklistItem {
  id: string
  naam: string
  categorie: 'vereist' | 'aanbevolen' | 'optioneel'
  status: 'aanwezig' | 'ontbreekt' | 'onvolledig' | 'niet_van_toepassing'
  document?: string // Gekoppeld document
  opmerking?: string
}

/**
 * Volledige document analyse resultaat
 */
export interface DocumentAnalysis {
  documentId: string
  bestandsnaam: string
  classificatie: DocumentClassification
  dimensies: ExtractedDimension[]
  metadata: {
    datum?: string
    auteur?: string
    revisie?: string
    project?: string
    tekeningnummer?: string
  }
}

// ============================================================
// Mock Data - Jan de Vries / Keizersgracht 123
// ============================================================

const JAN_DE_VRIES_DIMENSIONS: ExtractedDimension[] = [
  {
    id: 'dim-1',
    label: 'Breedte uitbouw',
    waarde: 4500,
    eenheid: 'mm',
    confidence: 0.95,
    bron: 'schets-uitbouw-v1.pdf',
    locatie: 'Plattegrond begane grond'
  },
  {
    id: 'dim-2',
    label: 'Diepte uitbouw',
    waarde: 3200,
    eenheid: 'mm',
    confidence: 0.92,
    bron: 'schets-uitbouw-v1.pdf',
    locatie: 'Plattegrond begane grond'
  },
  {
    id: 'dim-3',
    label: 'Hoogte plafond',
    waarde: 2800,
    eenheid: 'mm',
    confidence: 0.88,
    bron: 'schets-uitbouw-v1.pdf',
    locatie: 'Doorsnede A-A'
  },
  {
    id: 'dim-4',
    label: 'Oppervlakte uitbouw',
    waarde: 14.4,
    eenheid: 'm²',
    confidence: 0.98,
    bron: 'Berekend',
    locatie: '4.5m × 3.2m'
  },
  {
    id: 'dim-5',
    label: 'Glasopening breedte',
    waarde: 3800,
    eenheid: 'mm',
    confidence: 0.85,
    bron: 'schets-uitbouw-v1.pdf',
    locatie: 'Achtergevel'
  },
  {
    id: 'dim-6',
    label: 'Afstand tot erfgrens',
    waarde: 1200,
    eenheid: 'mm',
    confidence: 0.78,
    bron: 'bestaande-plattegrond.dwg',
    locatie: 'Situatie'
  },
  {
    id: 'dim-7',
    label: 'Hoogte bovendorpel',
    waarde: 2400,
    eenheid: 'mm',
    confidence: 0.82,
    bron: 'schets-uitbouw-v1.pdf',
    locatie: 'Kozijnstaat'
  },
  {
    id: 'dim-8',
    label: 'Staalkolom afstand',
    waarde: 2250,
    eenheid: 'mm',
    confidence: 0.90,
    bron: 'schets-uitbouw-v1.pdf',
    locatie: 'Constructie schets'
  }
]

const JAN_DE_VRIES_DOCUMENTS: DocumentAnalysis[] = [
  {
    documentId: 'doc-1',
    bestandsnaam: 'schets-uitbouw-v1.pdf',
    classificatie: {
      type: 'plattegrond',
      subtype: 'Begane grond + doorsnede',
      fase: 'VO',
      schaal: '1:100',
      confidence: 0.92,
      suggesties: ['Bevat ook doorsnede A-A', 'Schets kwaliteit, definitief ontwerp nodig']
    },
    dimensies: JAN_DE_VRIES_DIMENSIONS.filter(d => d.bron === 'schets-uitbouw-v1.pdf'),
    metadata: {
      datum: '2025-12-10',
      auteur: 'Architect onbekend',
      project: 'Uitbouw Keizersgracht 123'
    }
  },
  {
    documentId: 'doc-2',
    bestandsnaam: 'foto-achtergevel.jpg',
    classificatie: {
      type: 'foto',
      subtype: 'Bestaande situatie',
      confidence: 0.99,
      suggesties: ['Goede referentie voor gevelaansluiting']
    },
    dimensies: [],
    metadata: {
      datum: '2025-12-08'
    }
  },
  {
    documentId: 'doc-3',
    bestandsnaam: 'bestaande-plattegrond.dwg',
    classificatie: {
      type: 'plattegrond',
      subtype: 'Bestaande situatie',
      schaal: '1:50',
      confidence: 0.88,
      suggesties: ['Controleer of maatvoering up-to-date is']
    },
    dimensies: JAN_DE_VRIES_DIMENSIONS.filter(d => d.bron === 'bestaande-plattegrond.dwg'),
    metadata: {
      tekeningnummer: 'BS-001',
      revisie: 'A'
    }
  }
]

const JAN_DE_VRIES_CHECKLIST: ChecklistItem[] = [
  // Vereist
  {
    id: 'chk-1',
    naam: 'Plattegrond bestaande situatie',
    categorie: 'vereist',
    status: 'aanwezig',
    document: 'bestaande-plattegrond.dwg'
  },
  {
    id: 'chk-2',
    naam: 'Plattegrond nieuwe situatie',
    categorie: 'vereist',
    status: 'aanwezig',
    document: 'schets-uitbouw-v1.pdf',
    opmerking: 'Schets kwaliteit - definitief ontwerp benodigd'
  },
  {
    id: 'chk-3',
    naam: 'Doorsnede(n)',
    categorie: 'vereist',
    status: 'onvolledig',
    document: 'schets-uitbouw-v1.pdf',
    opmerking: 'Alleen schematische doorsnede aanwezig'
  },
  {
    id: 'chk-4',
    naam: 'Gevelaanzichten',
    categorie: 'vereist',
    status: 'ontbreekt',
    opmerking: 'Nodig voor monumentenvergunning'
  },
  {
    id: 'chk-5',
    naam: 'Situatietekening',
    categorie: 'vereist',
    status: 'ontbreekt',
    opmerking: 'Met erfgrenzen en bouwvlak'
  },
  {
    id: 'chk-6',
    naam: 'Funderingsgegevens bestaand',
    categorie: 'vereist',
    status: 'onvolledig',
    opmerking: 'Type fundering bekend (houten palen), maar geen inspectieRapport'
  },
  // Aanbevolen
  {
    id: 'chk-7',
    naam: 'Foto\'s bestaande situatie',
    categorie: 'aanbevolen',
    status: 'aanwezig',
    document: 'foto-achtergevel.jpg'
  },
  {
    id: 'chk-8',
    naam: 'Constructieve uitgangspunten',
    categorie: 'aanbevolen',
    status: 'ontbreekt',
    opmerking: 'Welke belastingen, materialen gewenst?'
  },
  {
    id: 'chk-9',
    naam: 'Sonderingsgegevens',
    categorie: 'aanbevolen',
    status: 'aanwezig',
    opmerking: 'Via BRO/DINO beschikbaar'
  },
  {
    id: 'chk-10',
    naam: 'Grondwaterstand',
    categorie: 'aanbevolen',
    status: 'aanwezig',
    opmerking: 'Via BRO/DINO: ~1.35m -mv'
  },
  // Optioneel
  {
    id: 'chk-11',
    naam: 'Bouwhistorisch onderzoek',
    categorie: 'optioneel',
    status: 'niet_van_toepassing',
    opmerking: 'Aanbevolen voor Rijksmonument, maar niet beschikbaar'
  },
  {
    id: 'chk-12',
    naam: 'Warmteberekening / EPC',
    categorie: 'optioneel',
    status: 'niet_van_toepassing'
  }
]

// ============================================================
// API Functions
// ============================================================

/**
 * Analyseer een document en extraheer dimensies
 */
export async function analyzeDocument(
  documentId: string,
  leadId?: string
): Promise<ActionResult<DocumentAnalysis>> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
  
  // Return mock data for Jan de Vries documents
  const analysis = JAN_DE_VRIES_DOCUMENTS.find(d => d.documentId === documentId)
  
  if (analysis) {
    return { success: true, data: analysis }
  }
  
  return { success: false, error: 'Document niet gevonden' }
}

/**
 * Haal alle geëxtraheerde dimensies op voor een lead
 */
export async function getExtractedDimensions(
  leadId: string
): Promise<ActionResult<ExtractedDimension[]>> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Mock: Check if this is Jan de Vries lead
  // In production, fetch from database based on leadId
  console.log('[Document AI Mock] Returning dimensions for lead:', leadId)
  
  return { success: true, data: JAN_DE_VRIES_DIMENSIONS }
}

/**
 * Classificeer alle documenten voor een lead
 */
export async function classifyDocuments(
  leadId: string
): Promise<ActionResult<DocumentAnalysis[]>> {
  await new Promise(resolve => setTimeout(resolve, 400))
  
  console.log('[Document AI Mock] Classifying documents for lead:', leadId)
  
  return { success: true, data: JAN_DE_VRIES_DOCUMENTS }
}

/**
 * Valideer checklist op basis van aanwezige documenten
 */
export async function validateChecklist(
  leadId: string,
  projectType: string
): Promise<ActionResult<ChecklistItem[]>> {
  await new Promise(resolve => setTimeout(resolve, 350))
  
  console.log('[Document AI Mock] Validating checklist for:', projectType)
  
  // Filter checklist based on project type
  let checklist = [...JAN_DE_VRIES_CHECKLIST]
  
  // Voor funderingsprojecten, markeer grondonderzoek als vereist
  if (projectType.toLowerCase().includes('fundering')) {
    checklist = checklist.map(item => {
      if (item.id === 'chk-9' || item.id === 'chk-10') {
        return { ...item, categorie: 'vereist' as const }
      }
      return item
    })
  }
  
  return { success: true, data: checklist }
}

