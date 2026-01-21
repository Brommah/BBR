"use client"

import { useState } from "react"
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Euro, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Users,
  Receipt,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  ExternalLink,
  Star,
  StarOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

// ============================================================
// Mock Data - 20 CRM Records
// ============================================================

interface Client {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  address: string
  city: string
  type: 'particulier' | 'zakelijk' | 'vve'
  status: 'actief' | 'inactief' | 'prospect'
  totalRevenue: number
  projectCount: number
  lastContact: string
  notes?: string
  isFavorite: boolean
  createdAt: string
}

interface Invoice {
  id: string
  clientId: string
  clientName: string
  number: string
  amount: number
  status: 'betaald' | 'openstaand' | 'verlopen' | 'concept'
  dueDate: string
  issuedDate: string
  project: string
}

interface Quote {
  id: string
  clientId: string
  clientName: string
  number: string
  amount: number
  status: 'verzonden' | 'geaccepteerd' | 'afgewezen' | 'verlopen' | 'concept'
  validUntil: string
  createdAt: string
  project: string
}

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Jan de Vries', email: 'jan.devries@email.nl', phone: '06-12345678', address: 'Keizersgracht 123', city: 'Amsterdam', type: 'particulier', status: 'actief', totalRevenue: 12500, projectCount: 3, lastContact: '2026-01-18', isFavorite: true, createdAt: '2024-03-15' },
  { id: '2', name: 'Maria van den Berg', email: 'maria@vandenberg.nl', phone: '06-23456789', address: 'Prinsengracht 456', city: 'Amsterdam', type: 'particulier', status: 'actief', totalRevenue: 8750, projectCount: 2, lastContact: '2026-01-15', isFavorite: false, createdAt: '2024-06-22' },
  { id: '3', name: 'Bouwbedrijf Jansen B.V.', email: 'info@jansenbouw.nl', phone: '020-1234567', company: 'Jansen Bouw', address: 'Industrieweg 78', city: 'Zaandam', type: 'zakelijk', status: 'actief', totalRevenue: 45000, projectCount: 8, lastContact: '2026-01-20', isFavorite: true, createdAt: '2023-11-08' },
  { id: '4', name: 'VvE Herengracht 200-220', email: 'bestuur@vveherengracht.nl', phone: '020-9876543', address: 'Herengracht 200', city: 'Amsterdam', type: 'vve', status: 'actief', totalRevenue: 32000, projectCount: 4, lastContact: '2026-01-12', isFavorite: false, createdAt: '2024-01-20' },
  { id: '5', name: 'Peter Bakker', email: 'peter.bakker@gmail.com', phone: '06-34567890', address: 'Dorpsstraat 12', city: 'Haarlem', type: 'particulier', status: 'prospect', totalRevenue: 0, projectCount: 0, lastContact: '2026-01-19', isFavorite: false, createdAt: '2026-01-10' },
  { id: '6', name: 'Architectenbureau Modern', email: 'contact@modern-arch.nl', phone: '023-4567890', company: 'Modern Architecten', address: 'Stationsplein 5', city: 'Haarlem', type: 'zakelijk', status: 'actief', totalRevenue: 67500, projectCount: 12, lastContact: '2026-01-21', isFavorite: true, createdAt: '2023-05-14' },
  { id: '7', name: 'Sophie de Groot', email: 'sophie.degroot@outlook.com', phone: '06-45678901', address: 'Bloemstraat 34', city: 'Utrecht', type: 'particulier', status: 'actief', totalRevenue: 5200, projectCount: 1, lastContact: '2026-01-08', isFavorite: false, createdAt: '2025-08-30' },
  { id: '8', name: 'VvE Amstelkade', email: 'vve@amstelkade.nl', phone: '020-3456789', address: 'Amstelkade 100', city: 'Amsterdam', type: 'vve', status: 'actief', totalRevenue: 18500, projectCount: 2, lastContact: '2026-01-14', isFavorite: false, createdAt: '2024-09-12' },
  { id: '9', name: 'Thomas Mulder', email: 'tmulder@email.nl', phone: '06-56789012', address: 'Parkweg 67', city: 'Rotterdam', type: 'particulier', status: 'inactief', totalRevenue: 3200, projectCount: 1, lastContact: '2025-11-20', isFavorite: false, createdAt: '2025-06-18' },
  { id: '10', name: 'Aannemersbedrijf De Bouwer', email: 'info@debouwer.nl', phone: '010-2345678', company: 'De Bouwer B.V.', address: 'Havenstraat 90', city: 'Rotterdam', type: 'zakelijk', status: 'actief', totalRevenue: 89000, projectCount: 15, lastContact: '2026-01-17', isFavorite: true, createdAt: '2023-02-28' },
  { id: '11', name: 'Linda Visser', email: 'linda.visser@hotmail.com', phone: '06-67890123', address: 'Schoolstraat 23', city: 'Den Haag', type: 'particulier', status: 'actief', totalRevenue: 7800, projectCount: 2, lastContact: '2026-01-10', isFavorite: false, createdAt: '2024-12-05' },
  { id: '12', name: 'VvE Zuidplein', email: 'beheer@vvezuidplein.nl', phone: '070-1234567', address: 'Zuidplein 45', city: 'Den Haag', type: 'vve', status: 'prospect', totalRevenue: 0, projectCount: 0, lastContact: '2026-01-16', isFavorite: false, createdAt: '2026-01-05' },
  { id: '13', name: 'Robert Hendriks', email: 'r.hendriks@zakelijk.nl', phone: '06-78901234', address: 'Marktplein 8', city: 'Leiden', type: 'particulier', status: 'actief', totalRevenue: 15600, projectCount: 3, lastContact: '2026-01-13', isFavorite: false, createdAt: '2024-04-22' },
  { id: '14', name: 'Bouwgroep Noord', email: 'projecten@bouwgroepnoord.nl', phone: '050-9876543', company: 'Bouwgroep Noord', address: 'Bedrijvenpark 12', city: 'Groningen', type: 'zakelijk', status: 'actief', totalRevenue: 54000, projectCount: 9, lastContact: '2026-01-11', isFavorite: false, createdAt: '2023-09-30' },
  { id: '15', name: 'Anna Smit', email: 'anna.smit@gmail.com', phone: '06-89012345', address: 'Laan van Meerdervoort 234', city: 'Den Haag', type: 'particulier', status: 'actief', totalRevenue: 4500, projectCount: 1, lastContact: '2026-01-09', isFavorite: false, createdAt: '2025-10-15' },
  { id: '16', name: 'VvE Rivierenwijk', email: 'secretaris@vverivierenwijk.nl', phone: '030-2345678', address: 'Rijnlaan 78', city: 'Utrecht', type: 'vve', status: 'actief', totalRevenue: 28000, projectCount: 3, lastContact: '2026-01-18', isFavorite: true, createdAt: '2024-02-14' },
  { id: '17', name: 'Klaas de Jong', email: 'klaas.dejong@work.nl', phone: '06-90123456', address: 'Hoofdstraat 156', city: 'Eindhoven', type: 'particulier', status: 'inactief', totalRevenue: 2100, projectCount: 1, lastContact: '2025-08-05', isFavorite: false, createdAt: '2025-05-20' },
  { id: '18', name: 'Woningcorporatie Thuis', email: 'techniek@wcthuis.nl', phone: '040-3456789', company: 'WC Thuis', address: 'Corporatielaan 1', city: 'Eindhoven', type: 'zakelijk', status: 'actief', totalRevenue: 125000, projectCount: 22, lastContact: '2026-01-20', isFavorite: true, createdAt: '2022-11-10' },
  { id: '19', name: 'Emma van Dijk', email: 'emma.vandijk@email.nl', phone: '06-01234567', address: 'Bosweg 45', city: 'Amersfoort', type: 'particulier', status: 'prospect', totalRevenue: 0, projectCount: 0, lastContact: '2026-01-21', isFavorite: false, createdAt: '2026-01-18' },
  { id: '20', name: 'Renovatiebedrijf Plus', email: 'info@renovatieplus.nl', phone: '033-4567890', company: 'Renovatie Plus B.V.', address: 'Ambachtstraat 33', city: 'Amersfoort', type: 'zakelijk', status: 'actief', totalRevenue: 38000, projectCount: 7, lastContact: '2026-01-15', isFavorite: false, createdAt: '2024-07-08' },
]

const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-2026-001', clientId: '1', clientName: 'Jan de Vries', number: 'F2026-001', amount: 2500, status: 'openstaand', dueDate: '2026-02-15', issuedDate: '2026-01-15', project: 'Dakkapel berekening' },
  { id: 'INV-2026-002', clientId: '3', clientName: 'Bouwbedrijf Jansen B.V.', number: 'F2026-002', amount: 8500, status: 'openstaand', dueDate: '2026-02-01', issuedDate: '2026-01-01', project: 'Constructieberekening nieuwbouw' },
  { id: 'INV-2026-003', clientId: '6', clientName: 'Architectenbureau Modern', number: 'F2026-003', amount: 4200, status: 'betaald', dueDate: '2026-01-20', issuedDate: '2025-12-20', project: 'Fundering advies' },
  { id: 'INV-2026-004', clientId: '4', clientName: 'VvE Herengracht 200-220', number: 'F2026-004', amount: 6800, status: 'verlopen', dueDate: '2026-01-10', issuedDate: '2025-12-10', project: 'VvE constructie rapport' },
  { id: 'INV-2026-005', clientId: '10', clientName: 'Aannemersbedrijf De Bouwer', number: 'F2026-005', amount: 12000, status: 'openstaand', dueDate: '2026-02-28', issuedDate: '2026-01-28', project: 'Meerdere projecten Q1' },
  { id: 'INV-2026-006', clientId: '18', clientName: 'Woningcorporatie Thuis', number: 'F2026-006', amount: 15000, status: 'betaald', dueDate: '2026-01-15', issuedDate: '2025-12-15', project: 'Renovatie flat complex' },
  { id: 'INV-2026-007', clientId: '8', clientName: 'VvE Amstelkade', number: 'F2026-007', amount: 3500, status: 'openstaand', dueDate: '2026-02-10', issuedDate: '2026-01-10', project: 'Balkon renovatie' },
  { id: 'INV-2026-008', clientId: '14', clientName: 'Bouwgroep Noord', number: 'F2026-008', amount: 7200, status: 'concept', dueDate: '', issuedDate: '2026-01-21', project: 'Nieuwbouw kantoor' },
]

const MOCK_QUOTES: Quote[] = [
  { id: 'Q-2026-001', clientId: '5', clientName: 'Peter Bakker', number: 'OFF2026-001', amount: 1850, status: 'verzonden', validUntil: '2026-02-19', createdAt: '2026-01-19', project: 'Uitbouw berekening' },
  { id: 'Q-2026-002', clientId: '12', clientName: 'VvE Zuidplein', number: 'OFF2026-002', amount: 9500, status: 'verzonden', validUntil: '2026-02-16', createdAt: '2026-01-16', project: 'Fundering onderzoek complex' },
  { id: 'Q-2026-003', clientId: '19', clientName: 'Emma van Dijk', number: 'OFF2026-003', amount: 1200, status: 'concept', validUntil: '', createdAt: '2026-01-21', project: 'Draagmuur verwijderen' },
  { id: 'Q-2026-004', clientId: '2', clientName: 'Maria van den Berg', number: 'OFF2026-004', amount: 2800, status: 'geaccepteerd', validUntil: '2026-01-30', createdAt: '2025-12-30', project: 'Dakkapel constructie' },
  { id: 'Q-2026-005', clientId: '11', clientName: 'Linda Visser', number: 'OFF2026-005', amount: 1650, status: 'verzonden', validUntil: '2026-02-10', createdAt: '2026-01-10', project: 'Aanbouw berekening' },
  { id: 'Q-2026-006', clientId: '13', clientName: 'Robert Hendriks', number: 'OFF2026-006', amount: 3200, status: 'afgewezen', validUntil: '2026-01-13', createdAt: '2025-12-13', project: 'Verbouwing woning' },
  { id: 'Q-2026-007', clientId: '16', clientName: 'VvE Rivierenwijk', number: 'OFF2026-007', amount: 11000, status: 'verzonden', validUntil: '2026-02-18', createdAt: '2026-01-18', project: 'Gevel renovatie' },
]

// ============================================================
// Helper Functions
// ============================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getInitials(name: string): string {
  const parts = name.split(' ')
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getClientTypeColor(type: Client['type']): string {
  switch (type) {
    case 'particulier': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
    case 'zakelijk': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
    case 'vve': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
  }
}

function getStatusColor(status: Client['status']): string {
  switch (status) {
    case 'actief': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
    case 'inactief': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    case 'prospect': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
  }
}

function getInvoiceStatusColor(status: Invoice['status']): string {
  switch (status) {
    case 'betaald': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
    case 'openstaand': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
    case 'verlopen': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
    case 'concept': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  }
}

function getQuoteStatusColor(status: Quote['status']): string {
  switch (status) {
    case 'geaccepteerd': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
    case 'verzonden': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
    case 'afgewezen': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
    case 'verlopen': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
    case 'concept': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  }
}

// ============================================================
// Main Component
// ============================================================

export default function CRMPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Calculate KPIs
  const totalClients = MOCK_CLIENTS.length
  const activeClients = MOCK_CLIENTS.filter(c => c.status === 'actief').length
  const totalRevenue = MOCK_CLIENTS.reduce((sum, c) => sum + c.totalRevenue, 0)
  const openInvoicesAmount = MOCK_INVOICES.filter(i => i.status === 'openstaand' || i.status === 'verlopen').reduce((sum, i) => sum + i.amount, 0)
  const pendingQuotesAmount = MOCK_QUOTES.filter(q => q.status === 'verzonden').reduce((sum, q) => sum + q.amount, 0)

  // Filter clients
  const filteredClients = MOCK_CLIENTS.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.city.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || client.type === selectedType
    return matchesSearch && matchesType
  })

  // Get client-specific data
  const getClientInvoices = (clientId: string) => MOCK_INVOICES.filter(i => i.clientId === clientId)
  const getClientQuotes = (clientId: string) => MOCK_QUOTES.filter(q => q.clientId === clientId)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            CRM - Relatiebeheer
          </h1>
          <p className="page-description mt-1">Beheer klantrelaties, facturen en offertes</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nieuwe Relatie
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="card-tactile">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label">Totaal Relaties</p>
                <p className="text-2xl font-bold mt-1">{totalClients}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{activeClients} actief</p>
          </CardContent>
        </Card>

        <Card className="card-tactile">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label">Totale Omzet</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2">+12% vs vorig jaar</p>
          </CardContent>
        </Card>

        <Card className="card-tactile">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label">Openstaand</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(openInvoicesAmount)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{MOCK_INVOICES.filter(i => i.status === 'openstaand').length} facturen</p>
          </CardContent>
        </Card>

        <Card className="card-tactile">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label">Offertes Uit</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(pendingQuotesAmount)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{MOCK_QUOTES.filter(q => q.status === 'verzonden').length} in afwachting</p>
          </CardContent>
        </Card>

        <Card className="card-tactile border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label">Verlopen</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(MOCK_INVOICES.filter(i => i.status === 'verlopen').reduce((s, i) => s + i.amount, 0))}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2">{MOCK_INVOICES.filter(i => i.status === 'verlopen').length} facturen over datum</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-2">
          <Card className="card-tactile">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Relaties</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Zoeken..." 
                      className="pl-9 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="w-4 h-4" />
                        {selectedType === 'all' ? 'Alle types' : selectedType}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedType('all')}>Alle types</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedType('particulier')}>Particulier</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedType('zakelijk')}>Zakelijk</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedType('vve')}>VvE</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredClients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 border-b border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors",
                      selectedClient?.id === client.id && "bg-slate-100 dark:bg-slate-800"
                    )}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={cn(
                          "text-xs font-semibold",
                          client.type === 'zakelijk' ? "bg-purple-100 text-purple-700" :
                          client.type === 'vve' ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      {client.isFavorite && (
                        <Star className="absolute -top-1 -right-1 w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{client.name}</span>
                        <Badge variant="secondary" className={cn("text-[10px]", getClientTypeColor(client.type))}>
                          {client.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {client.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {client.projectCount} projecten
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(client.totalRevenue)}</p>
                      <Badge variant="secondary" className={cn("text-[10px] mt-1", getStatusColor(client.status))}>
                        {client.status}
                      </Badge>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Detail Panel */}
        <div className="lg:col-span-1">
          {selectedClient ? (
            <Card className="card-tactile sticky top-4">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className={cn(
                        "text-sm font-semibold",
                        selectedClient.type === 'zakelijk' ? "bg-purple-100 text-purple-700" :
                        selectedClient.type === 'vve' ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {getInitials(selectedClient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{selectedClient.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={cn("text-[10px]", getClientTypeColor(selectedClient.type))}>
                          {selectedClient.type}
                        </Badge>
                        <Badge variant="secondary" className={cn("text-[10px]", getStatusColor(selectedClient.status))}>
                          {selectedClient.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Star className="w-4 h-4 mr-2" />
                        {selectedClient.isFavorite ? 'Verwijder favoriet' : 'Maak favoriet'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Bekijk projecten
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Deactiveren</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <a href={`mailto:${selectedClient.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-4 h-4" />
                    {selectedClient.email}
                  </a>
                  <a href={`tel:${selectedClient.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="w-4 h-4" />
                    {selectedClient.phone}
                  </a>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {selectedClient.address}, {selectedClient.city}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Totale Omzet</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedClient.totalRevenue)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Projecten</p>
                    <p className="text-lg font-bold">{selectedClient.projectCount}</p>
                  </div>
                </div>

                {/* Tabs for Invoices/Quotes */}
                <Tabs defaultValue="invoices" className="pt-2">
                  <TabsList className="w-full">
                    <TabsTrigger value="invoices" className="flex-1 text-xs">Facturen</TabsTrigger>
                    <TabsTrigger value="quotes" className="flex-1 text-xs">Offertes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="invoices" className="mt-3">
                    {getClientInvoices(selectedClient.id).length > 0 ? (
                      <div className="space-y-2">
                        {getClientInvoices(selectedClient.id).map(invoice => (
                          <div key={invoice.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div>
                              <p className="text-sm font-medium">{invoice.number}</p>
                              <p className="text-xs text-muted-foreground">{invoice.project}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(invoice.amount)}</p>
                              <Badge variant="secondary" className={cn("text-[9px]", getInvoiceStatusColor(invoice.status))}>
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Geen facturen</p>
                    )}
                  </TabsContent>
                  <TabsContent value="quotes" className="mt-3">
                    {getClientQuotes(selectedClient.id).length > 0 ? (
                      <div className="space-y-2">
                        {getClientQuotes(selectedClient.id).map(quote => (
                          <div key={quote.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div>
                              <p className="text-sm font-medium">{quote.number}</p>
                              <p className="text-xs text-muted-foreground">{quote.project}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(quote.amount)}</p>
                              <Badge variant="secondary" className={cn("text-[9px]", getQuoteStatusColor(quote.status))}>
                                {quote.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Geen offertes</p>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Last Contact */}
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Laatste contact: {formatDate(selectedClient.lastContact)}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    Klant sinds: {formatDate(selectedClient.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-tactile">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Selecteer een relatie om details te bekijken</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Invoices */}
        <Card className="card-tactile">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                Openstaande Facturen
              </CardTitle>
              <Button variant="ghost" size="sm">Bekijk alle</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factuur</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Vervaldatum</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_INVOICES.filter(i => i.status !== 'betaald' && i.status !== 'concept').map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getInvoiceStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Quotes */}
        <Card className="card-tactile">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Verzonden Offertes
              </CardTitle>
              <Button variant="ghost" size="sm">Bekijk alle</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offerte</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Geldig tot</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_QUOTES.filter(q => q.status === 'verzonden').map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.number}</TableCell>
                    <TableCell>{quote.clientName}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(quote.amount)}</TableCell>
                    <TableCell>{formatDate(quote.validUntil)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getQuoteStatusColor(quote.status)}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
