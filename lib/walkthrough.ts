import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Walkthrough Step Definition
 * Each step represents a screen/feature in the application
 */
export interface WalkthroughStep {
  id: string
  title: string
  description: string
  /** The route this step corresponds to (for navigation) */
  route?: string
  /** Element selector to highlight (optional) */
  highlightSelector?: string
  /** Position of the tooltip relative to highlight */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  /** Icon name from lucide-react */
  icon: string
  /** Additional tips for this step */
  tips?: string[]
  /** Whether this step requires admin role */
  adminOnly?: boolean
  /** Image to show in the step */
  image?: string
}

/**
 * All walkthrough steps in logical order
 * Covers the full application flow from dashboard to completion
 */
export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welkom bij Broersma Engineer OS',
    description: 'Dit is je nieuwe werkplek voor constructieberekeningen. In deze rondleiding laten we je alle functies zien. Je kunt altijd overslaan en later terugkomen.',
    position: 'center',
    icon: 'Sparkles',
    tips: [
      'De rondleiding duurt ongeveer 3 minuten',
      'Je kunt altijd op Escape drukken om te stoppen',
      'Start de rondleiding opnieuw via het help-menu'
    ]
  },
  {
    id: 'sidebar',
    title: 'Navigatie Sidebar',
    description: 'Links vind je het hoofdmenu. Van hier navigeer je naar alle onderdelen van de applicatie. Het menu past zich aan op basis van je rol.',
    route: '/',
    highlightSelector: '[data-sidebar="sidebar"]',
    position: 'right',
    icon: 'Menu',
    tips: [
      'Home: Je persoonlijke dashboard',
      'Inbox: Nieuwe onbehandelde leads',
      'Pipeline: Kanban-overzicht van alle projecten',
      'Mijn Prestaties: XP en bonussen',
      'Admin: Beheerdersfuncties (alleen voor admins)'
    ]
  },
  {
    id: 'dashboard',
    title: 'Je Dashboard',
    description: 'Dit is je startpagina. Hier zie je in één oogopslag wat er vandaag te doen is. De "Focus Now" kaart toont je #1 prioriteit.',
    route: '/',
    highlightSelector: '.page-container',
    position: 'center',
    icon: 'Home',
    tips: [
      'Werk altijd top-down: urgent → oud → nieuw',
      'KPI-kaarten tonen je huidige werkvoorraad',
      'Bonus jobs zijn optioneel maar leveren extra € en XP'
    ]
  },
  {
    id: 'dashboard-queue',
    title: 'Mijn Queue',
    description: 'Je actieve projecten verschijnen hier in prioriteitsvolgorde. Urgente en oudere projecten komen eerst. Klik op een project om het te openen.',
    route: '/',
    highlightSelector: '[class*="Mijn queue"]',
    position: 'left',
    icon: 'ListTodo',
    tips: [
      'Rode stippen = urgent project',
      'Statuskleuren geven de fase aan',
      'Projectwaarde wordt rechts getoond'
    ]
  },
  {
    id: 'pipeline',
    title: 'Pipeline Kanban',
    description: 'Het Kanban-bord geeft een visueel overzicht van alle leads per fase. Sleep kaarten tussen kolommen om de status te wijzigen.',
    route: '/pipeline',
    highlightSelector: '.page-container',
    position: 'center',
    icon: 'Kanban',
    tips: [
      'Nieuw → Calculatie → Offerte Verzonden → Opdracht → Archief',
      'Drag-and-drop om status te wijzigen',
      'Klik op een kaart voor details',
      'Gebruik filters om specifieke projecten te vinden'
    ]
  },
  {
    id: 'pipeline-legend',
    title: 'Pipeline Legenda',
    description: 'De legenda bovenaan legt de betekenis van statussen en badges uit. Let op de kleurcodes voor snel overzicht.',
    route: '/pipeline',
    highlightSelector: '[class*="legend"]',
    position: 'bottom',
    icon: 'Info',
    tips: [
      'Blauw = Nieuwe lead',
      'Amber = In bewerking (calculatie)',
      'Paars = Offerte verzonden',
      'Groen = Opdracht verkregen',
      'Grijs = Gearchiveerd'
    ]
  },
  {
    id: 'lead-detail',
    title: 'Lead Details',
    description: 'De detailpagina is je werkstation voor een specifiek project. Links context, midden activiteit, rechts de offerte-tool.',
    route: '/leads',
    position: 'center',
    icon: 'FileText',
    tips: [
      'Linkerpaneel: Klantgegevens, checklist, tijdregistratie',
      'Middenpaneel: Activiteit, documenten, geschiedenis',
      'Rechterpaneel: Offerte opstellen en verzenden'
    ]
  },
  {
    id: 'quote-workflow',
    title: 'Offerte Workflow',
    description: 'Stel een offerte op met regelitems en onderbouwing. Na indienen wacht de offerte op admin-goedkeuring voordat je deze kunt verzenden.',
    position: 'center',
    icon: 'Calculator',
    tips: [
      '1. Voeg offerteregels toe (omschrijving + bedrag)',
      '2. Voeg optioneel een onderbouwing toe',
      '3. Klik "Indienen ter Goedkeuring"',
      '4. Na goedkeuring: verzend naar klant',
      'PDF-export beschikbaar voor documentatie'
    ]
  },
  {
    id: 'inbox',
    title: 'Inbox',
    description: 'Nieuwe leads die nog niet zijn toegewezen verschijnen hier. Admins kunnen leads toewijzen, engineers kunnen ze oppakken.',
    route: '/inbox',
    highlightSelector: '.page-container',
    position: 'center',
    icon: 'Inbox',
    tips: [
      'Rode badge in sidebar toont aantal nieuwe leads',
      'Urgente leads hebben een speciale markering',
      'Klik "Oppakken" om een lead aan jezelf toe te wijzen'
    ]
  },
  {
    id: 'incentives',
    title: 'Incentives & Prestaties',
    description: 'Volg je voortgang, verdien XP en unlock bonussen. Hoe meer je doet, hoe hoger je tier en maandelijkse bonus.',
    route: '/incentives',
    highlightSelector: '.page-container',
    position: 'center',
    icon: 'Trophy',
    tips: [
      'XP verdien je door leads af te handelen',
      'Bonus jobs geven extra € en XP',
      'Streaks verhogen je vermenigvuldiger',
      'Hogere tiers = hogere maandbonus'
    ]
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    description: 'Admins beheren hier offertegoedkeuringen, kostentarieven, gebruikers en systeeminstellingen.',
    route: '/admin',
    highlightSelector: '.page-container',
    position: 'center',
    icon: 'Shield',
    adminOnly: true,
    tips: [
      'Offerte Queue: Keur offertes goed of af',
      'Kostentarieven: Pas basisprijzen aan',
      'Gebruikers: Beheer teamleden en rollen',
      'E-mail Automatie: Configureer automatische e-mails'
    ]
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Sneltoetsen',
    description: 'Werk sneller met keyboard shortcuts. Druk ⌘K (of Ctrl+K) om het sneltoetsen-menu te openen.',
    position: 'center',
    icon: 'Keyboard',
    tips: [
      '⌘K / Ctrl+K: Open sneltoetsen menu',
      '⌘B: Toggle sidebar',
      '⌘/: Ga naar zoeken',
      'Escape: Sluit dialogen'
    ]
  },
  {
    id: 'complete',
    title: 'Je bent klaar! 🎉',
    description: 'Je kent nu alle belangrijke functies. Ga aan de slag en neem contact op als je vragen hebt. Succes!',
    position: 'center',
    icon: 'PartyPopper',
    tips: [
      'Begin met je eerste lead in de inbox',
      'Vraag collega\'s om hulp als je vastloopt',
      'Feedback? Gebruik de feedback-knop rechtsonder',
      'Deze rondleiding kun je altijd opnieuw starten via het help-menu'
    ]
  }
]

/**
 * Walkthrough State Interface
 */
interface WalkthroughState {
  /** Whether the walkthrough is currently active */
  isActive: boolean
  /** Current step index */
  currentStep: number
  /** Whether user has completed the walkthrough before */
  hasCompleted: boolean
  /** Whether user has explicitly skipped */
  hasSkipped: boolean
  /** Timestamp of last completion/skip */
  lastInteraction: string | null
  
  // Actions
  startWalkthrough: () => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (index: number) => void
  skipWalkthrough: () => void
  completeWalkthrough: () => void
  resetWalkthrough: () => void
}

/**
 * Walkthrough Store
 * Manages the state of the introduction tour
 * Persisted to localStorage to remember user's choice
 */
export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      hasCompleted: false,
      hasSkipped: false,
      lastInteraction: null,

      startWalkthrough: () => {
        set({ 
          isActive: true, 
          currentStep: 0 
        })
      },

      nextStep: () => {
        const { currentStep } = get()
        const totalSteps = WALKTHROUGH_STEPS.length
        
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 })
        } else {
          // Last step, complete the walkthrough
          get().completeWalkthrough()
        }
      },

      previousStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },

      goToStep: (index: number) => {
        if (index >= 0 && index < WALKTHROUGH_STEPS.length) {
          set({ currentStep: index })
        }
      },

      skipWalkthrough: () => {
        set({ 
          isActive: false, 
          hasSkipped: true,
          lastInteraction: new Date().toISOString()
        })
      },

      completeWalkthrough: () => {
        set({ 
          isActive: false, 
          hasCompleted: true,
          currentStep: 0,
          lastInteraction: new Date().toISOString()
        })
      },

      resetWalkthrough: () => {
        set({
          isActive: false,
          currentStep: 0,
          hasCompleted: false,
          hasSkipped: false,
          lastInteraction: null
        })
      }
    }),
    {
      name: 'broersma-walkthrough',
      partialize: (state) => ({
        hasCompleted: state.hasCompleted,
        hasSkipped: state.hasSkipped,
        lastInteraction: state.lastInteraction
      })
    }
  )
)

/**
 * Get the current walkthrough step
 */
export function getCurrentStep(): WalkthroughStep | null {
  const { isActive, currentStep } = useWalkthroughStore.getState()
  if (!isActive) return null
  return WALKTHROUGH_STEPS[currentStep] || null
}

/**
 * Check if walkthrough should auto-start for new users
 */
export function shouldAutoStartWalkthrough(): boolean {
  const { hasCompleted, hasSkipped } = useWalkthroughStore.getState()
  return !hasCompleted && !hasSkipped
}
