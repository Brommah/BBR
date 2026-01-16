"use client"

import React, { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AccessGuard } from "@/components/auth/access-guard"
import { useAuthStore } from "@/lib/auth"
import { useLeadStore } from "@/lib/store"
import { createActivity, addNote } from "@/lib/db-actions"
import { uploadFile } from "@/lib/storage"
import { PROJECT_TYPES } from "@/lib/config"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
  ClipboardPlus, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Upload,
  File,
  X,
  Check,
  Camera,
  FileText,
  Search,
  Users,
  HardHat
} from "lucide-react"
import { Label } from "@/components/ui/label"

// Client role options
const CLIENT_ROLES = [
  { value: "particulier", label: "Particulier", icon: User },
  { value: "architect", label: "Architect & Ontwerper", icon: Users },
  { value: "aannemer", label: "Aannemer & Bouwbedrijf", icon: HardHat },
] as const

type ClientRole = typeof CLIENT_ROLES[number]["value"]

const projectTypeIcons: Record<string, string> = {
  "Dakkapel": "🏠",
  "Uitbouw": "🏗️",
  "Aanbouw": "🏘️",
  "Draagmuur verwijderen": "🧱",
  "Kozijn vergroten": "🪟",
  "Fundering herstel": "🔧",
  "VvE constructie": "🏢",
  "Overig": "📋",
}

const WIZARD_STEPS = [
  { id: 1, title: "Klant", icon: User, description: "Contactgegevens" },
  { id: 2, title: "Project", icon: Building2, description: "Locatie & type" },
  { id: 3, title: "Bevestigen", icon: CheckCircle2, description: "Controleren" },
]

interface AddressLookupResult {
  straat: string
  woonplaats: string
  gemeente: string
  provincie: string
  volledigAdres: string
}

/**
 * Lookup address from postcode + huisnummer using PDOK Locatieserver
 */
async function lookupAddress(postcode: string, huisnummer: string): Promise<AddressLookupResult | null> {
  try {
    // Clean postcode (remove spaces)
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase()
    const query = `${cleanPostcode} ${huisnummer}`
    
    const response = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(query)}&fq=type:adres&rows=1`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (data.response?.docs?.length > 0) {
      const doc = data.response.docs[0]
      return {
        straat: doc.straatnaam || '',
        woonplaats: doc.woonplaatsnaam || '',
        gemeente: doc.gemeentenaam || '',
        provincie: doc.provincienaam || '',
        volledigAdres: doc.weergavenaam || `${doc.straatnaam} ${huisnummer}, ${doc.woonplaatsnaam}`
      }
    }
    
    return null
  } catch (error) {
    console.error('Address lookup error:', error)
    return null
  }
}

export default function SubmitPage() {
  const router = useRouter()
  const { currentUser } = useAuthStore()
  const { addLead } = useLeadStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null)

  // Form state - Klant
  const [formData, setFormData] = useState({
    // Klant section
    rol: "" as ClientRole | "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    architectName: "",
    architectEmail: "",
    // Project section
    postcode: "",
    huisnummer: "",
    city: "",
    address: "",
    projectTypes: [] as string[],
    description: "",
  })
  
  // Address lookup state
  const [isLookingUpAddress, setIsLookingUpAddress] = useState(false)
  const [addressFound, setAddressFound] = useState(false)
  
  // File uploads - separated by category
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  // Address lookup handler
  const handleAddressLookup = useCallback(async () => {
    if (!formData.postcode || !formData.huisnummer) return
    
    setIsLookingUpAddress(true)
    setAddressFound(false)
    
    const result = await lookupAddress(formData.postcode, formData.huisnummer)
    
    if (result) {
      setFormData(prev => ({
        ...prev,
        address: `${result.straat} ${prev.huisnummer}`,
        city: result.woonplaats,
      }))
      setAddressFound(true)
      toast.success("Adres gevonden", {
        description: result.volledigAdres
      })
    } else {
      toast.error("Adres niet gevonden", {
        description: "Controleer de postcode en het huisnummer"
      })
    }
    
    setIsLookingUpAddress(false)
  }, [formData.postcode, formData.huisnummer])

  // Toggle project type selection
  const toggleProjectType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      projectTypes: prev.projectTypes.includes(type)
        ? prev.projectTypes.filter(t => t !== type)
        : [...prev.projectTypes, type]
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.rol) {
          toast.error("Selecteer een rol")
          return false
        }
        if (!formData.clientName.trim()) {
          toast.error("Vul de naam van de opdrachtgever in")
          return false
        }
        if (!formData.clientEmail.trim()) {
          toast.error("Vul het e-mailadres van de opdrachtgever in")
          return false
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
          toast.error("Vul een geldig e-mailadres in")
          return false
        }
        return true
      case 2:
        if (!formData.postcode.trim() || !formData.huisnummer.trim()) {
          toast.error("Vul postcode en huisnummer in")
          return false
        }
        if (formData.projectTypes.length === 0) {
          toast.error("Selecteer minimaal één projecttype")
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      toast.error("Controleer de verplichte velden")
      return
    }

    setIsSubmitting(true)

    try {
      // Create lead with primary project type (first selected)
      const primaryProjectType = formData.projectTypes[0]
      
      const leadResult = await addLead({
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim(),
        clientPhone: formData.clientPhone.trim() || undefined,
        projectType: primaryProjectType,
        city: formData.city.trim(),
        address: formData.address.trim() || undefined,
        status: "Nieuw",
        value: 0,
      })

      if (!leadResult.success || !leadResult.data) {
        throw new Error(leadResult.error || "Kon lead niet aanmaken")
      }

      const leadId = (leadResult.data as { id: string }).id
      setCreatedLeadId(leadId)

      // Build activity content
      const rolLabel = CLIENT_ROLES.find(r => r.value === formData.rol)?.label || formData.rol
      let activityContent = `Handmatig ingevoerd (rol: ${rolLabel})`
      if (formData.projectTypes.length > 1) {
        activityContent += ` - Projecttypes: ${formData.projectTypes.join(', ')}`
      }

      await createActivity({
        leadId,
        type: "lead_created",
        content: activityContent,
        author: currentUser?.name || "Receptie"
      })

      // Add notes for additional info
      const notes: string[] = []
      
      if (formData.architectName || formData.architectEmail) {
        notes.push(`**Architect:** ${formData.architectName || 'Niet opgegeven'}${formData.architectEmail ? ` (${formData.architectEmail})` : ''}`)
      }
      
      if (formData.projectTypes.length > 1) {
        notes.push(`**Projecttypes:** ${formData.projectTypes.join(', ')}`)
      }
      
      if (formData.description.trim()) {
        notes.push(`**Projectomschrijving:**\n${formData.description.trim()}`)
      }
      
      if (notes.length > 0) {
        await addNote(
          leadId,
          notes.join('\n\n'),
          currentUser?.name || "Receptie"
        )
      }

      // Upload photos
      const allFiles = [...photoFiles, ...documentFiles]
      if (allFiles.length > 0) {
        const uploadErrors: string[] = []
        
        for (const file of allFiles) {
          const isPhoto = photoFiles.includes(file)
          const uploadData = new FormData()
          uploadData.append('file', file)
          uploadData.append('leadId', leadId)
          uploadData.append('category', isPhoto ? 'fotos' : 'tekeningen')
          uploadData.append('uploadedBy', currentUser?.name || 'Receptie')
          
          const result = await uploadFile(uploadData)
          
          if (!result.success) {
            uploadErrors.push(`${file.name}: ${result.error}`)
          }
        }
        
        if (uploadErrors.length > 0) {
          toast.warning(`${uploadErrors.length} bestand(en) niet geüpload`, {
            description: uploadErrors[0]
          })
        }
      }

      setIsSubmitted(true)
      toast.success("Project succesvol aangemaakt!", {
        description: `${formData.clientName} - ${primaryProjectType}`
      })

    } catch (error) {
      console.error("Error creating lead:", error)
      toast.error("Fout bij aanmaken project", {
        description: error instanceof Error ? error.message : "Probeer het opnieuw"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      rol: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      architectName: "",
      architectEmail: "",
      postcode: "",
      huisnummer: "",
      city: "",
      address: "",
      projectTypes: [],
      description: "",
    })
    setPhotoFiles([])
    setDocumentFiles([])
    setIsSubmitted(false)
    setCreatedLeadId(null)
    setCurrentStep(1)
    setAddressFound(false)
  }

  // Success state
  if (isSubmitted && createdLeadId) {
    return (
      <AccessGuard permission="leads:create" redirectTo="/login">
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-lg w-full"
          >
            <div className="sheet-elevated rounded-2xl overflow-hidden">
              <div className="p-8 text-center space-y-6">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Project Aangemaakt!
                  </h2>
                  <p className="text-muted-foreground">
                    <strong>{formData.clientName}</strong> is toegevoegd aan het systeem.
                  </p>
                </div>

                <div className="card-tactile rounded-xl p-4 text-left space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {formData.projectTypes.map(type => (
                      <Badge key={type} variant="secondary" className="pill-glass-amber">
                        {projectTypeIcons[type]} {type}
                      </Badge>
                    ))}
                  </div>
                  {formData.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {formData.address}, {formData.city}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => router.push(`/leads/${createdLeadId}`)}
                    className="flex-1 gap-2 h-11"
                  >
                    Bekijk Project
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 gap-2 h-11"
                  >
                    <Plus className="w-4 h-4" />
                    Nieuw Project
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AccessGuard>
    )
  }

  return (
    <AccessGuard permission="leads:create" redirectTo="/login">
      <div className="min-h-screen bg-background flex flex-col">
        {/* Glassmorphism Header */}
        <div className="border-b border-border/50 glass-panel sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <ClipboardPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">Nieuw Project</h1>
                <p className="text-xs text-muted-foreground">Handmatige invoer</p>
              </div>
              {currentUser && (
                <Badge variant="outline" className="ml-auto gap-1 text-xs pill-glass-slate">
                  <User className="w-3 h-3" />
                  {currentUser.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Stepper */}
        <div className="border-b border-border/30 bg-card/30">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between relative">
              {/* Progress Line Background */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border/50 mx-12" />
              {/* Progress Line Fill */}
              <motion.div 
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-amber-500 to-emerald-500 mx-12"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
              
              {WIZARD_STEPS.map((step) => {
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                const StepIcon = step.icon
                
                return (
                  <motion.button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    disabled={step.id > currentStep}
                    className={cn(
                      "relative flex flex-col items-center gap-2 z-10",
                      step.id > currentStep && "opacity-50 cursor-not-allowed"
                    )}
                    whileHover={step.id <= currentStep ? { scale: 1.05 } : {}}
                    whileTap={step.id <= currentStep ? { scale: 0.95 } : {}}
                  >
                    <motion.div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                        isActive && "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30",
                        isCompleted && "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                      )}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </motion.div>
                    <div className="text-center hidden sm:block">
                      <p className={cn(
                        "text-sm font-medium",
                        isActive && "text-amber-600 dark:text-amber-400",
                        isCompleted && "text-emerald-600 dark:text-emerald-400",
                        !isActive && !isCompleted && "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">{step.description}</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Form Container - Centered Elevated Sheet */}
        <div className="flex-1 flex items-start justify-center p-6 pb-24">
          <motion.div 
            className="w-full max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="sheet-elevated rounded-2xl overflow-hidden ring-1 ring-border/50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="p-6 sm:p-8"
                >
                  {/* Step 1: Klant */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <motion.div 
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center mx-auto mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.1 }}
                        >
                          <User className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                        </motion.div>
                        <h2 className="text-xl font-semibold">Klant</h2>
                        <p className="text-sm text-muted-foreground mt-1">Contactgegevens opdrachtgever</p>
                      </div>

                      {/* Rol dropdown */}
                      <div className="space-y-2">
                        <Label>
                          Rol <span className="text-rose-500">*</span>
                        </Label>
                        <Select 
                          value={formData.rol} 
                          onValueChange={(value: ClientRole) => setFormData({...formData, rol: value})}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Selecteer rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLIENT_ROLES.map((role) => {
                              const Icon = role.icon
                              return (
                                <SelectItem key={role.value} value={role.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                    <span>{role.label}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Naam opdrachtgever */}
                      <div className="space-y-2">
                        <Label>
                          Volledige naam opdrachtgever <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            placeholder="Bijv. Jan de Vries"
                            value={formData.clientName}
                            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                            className="pl-10 h-12 rounded-xl input-focus"
                            autoFocus
                          />
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* E-mail opdrachtgever */}
                      <div className="space-y-2">
                        <Label>
                          E-mail opdrachtgever <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="klant@email.nl"
                            value={formData.clientEmail}
                            onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                            className="pl-10 h-12 rounded-xl"
                          />
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Telefoonnummer */}
                      <div className="space-y-2">
                        <Label>Telefoonnummer</Label>
                        <div className="relative">
                          <Input
                            type="tel"
                            placeholder="06 12345678"
                            value={formData.clientPhone}
                            onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                            className="pl-10 h-12 rounded-xl"
                          />
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Architect info (optional) */}
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-sm font-medium text-muted-foreground mb-4">Architect gegevens (optioneel)</p>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Volledige naam architect</Label>
                            <div className="relative">
                              <Input
                                placeholder="Naam architect"
                                value={formData.architectName}
                                onChange={(e) => setFormData({...formData, architectName: e.target.value})}
                                className="pl-10 h-12 rounded-xl"
                              />
                              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>E-mail architect</Label>
                            <div className="relative">
                              <Input
                                type="email"
                                placeholder="architect@email.nl"
                                value={formData.architectEmail}
                                onChange={(e) => setFormData({...formData, architectEmail: e.target.value})}
                                className="pl-10 h-12 rounded-xl"
                              />
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Projectlocatie en details */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <motion.div 
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center mx-auto mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.1 }}
                        >
                          <Building2 className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                        </motion.div>
                        <h2 className="text-xl font-semibold">Projectlocatie en details</h2>
                        <p className="text-sm text-muted-foreground mt-1">Waar en wat voor project?</p>
                      </div>

                      {/* Postcode + Huisnummer with lookup */}
                      <div className="space-y-2">
                        <Label>
                          Postcode en huisnummer <span className="text-rose-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="1234 AB"
                              value={formData.postcode}
                              onChange={(e) => {
                                setFormData({...formData, postcode: e.target.value})
                                setAddressFound(false)
                              }}
                              className="pl-10 h-12 rounded-xl"
                            />
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="relative w-28">
                            <Input
                              placeholder="123"
                              value={formData.huisnummer}
                              onChange={(e) => {
                                setFormData({...formData, huisnummer: e.target.value})
                                setAddressFound(false)
                              }}
                              className="h-12 rounded-xl"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 px-4 rounded-xl"
                            onClick={handleAddressLookup}
                            disabled={isLookingUpAddress || !formData.postcode || !formData.huisnummer}
                          >
                            {isLookingUpAddress ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Search className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        {/* Address result */}
                        {addressFound && formData.address && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-emerald-800 dark:text-emerald-200">
                              {formData.address}, {formData.city}
                            </span>
                          </motion.div>
                        )}
                      </div>

                      {/* Project Type - Multi-select */}
                      <div className="space-y-3">
                        <Label>
                          Type project <span className="text-rose-500">*</span>
                          <span className="text-muted-foreground font-normal ml-2">(meerdere mogelijk)</span>
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {PROJECT_TYPES.map((type) => {
                            const isSelected = formData.projectTypes.includes(type)
                            return (
                              <motion.button
                                key={type}
                                type="button"
                                onClick={() => toggleProjectType(type)}
                                className={cn(
                                  "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                                  isSelected
                                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                                    : "border-border hover:border-amber-200 hover:bg-muted/50"
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className={cn(
                                  "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0",
                                  isSelected
                                    ? "bg-amber-500 border-amber-500"
                                    : "border-muted-foreground/30"
                                )}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-lg mr-1">{projectTypeIcons[type] || "📋"}</span>
                                  <span className="text-sm font-medium truncate">{type}</span>
                                </div>
                              </motion.button>
                            )
                          })}
                        </div>
                        {formData.projectTypes.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Geselecteerd: {formData.projectTypes.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label>Projectomschrijving</Label>
                        <Textarea
                          placeholder="Beschrijving: afmetingen, wensen, bijzonderheden..."
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="min-h-[100px] resize-none rounded-xl"
                        />
                      </div>

                      {/* Document uploads */}
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <p className="text-sm font-medium">Documenten uploaden</p>
                        
                        {/* Photos */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            Foto&apos;s van de huidige situatie
                          </Label>
                          <motion.div 
                            className="card-tactile rounded-xl p-4 text-center cursor-pointer group"
                            onClick={() => photoInputRef.current?.click()}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <Camera className="w-6 h-6 mx-auto mb-1 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                            <p className="text-xs text-muted-foreground">Klik om foto&apos;s te selecteren</p>
                          </motion.div>
                          <input 
                            ref={photoInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              setPhotoFiles(prev => [...prev, ...files])
                              e.target.value = ""
                            }}
                          />
                          {photoFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {photoFiles.map((file, idx) => (
                                <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                                  <Camera className="w-3 h-3" />
                                  {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                                  <button
                                    type="button"
                                    onClick={() => setPhotoFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="ml-1 p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600 rounded"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Technical drawings */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Bouwkundige en/of archieftekeningen
                          </Label>
                          <motion.div 
                            className="card-tactile rounded-xl p-4 text-center cursor-pointer group"
                            onClick={() => documentInputRef.current?.click()}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                            <p className="text-xs text-muted-foreground">Klik om tekeningen te uploaden (PDF, DWG)</p>
                          </motion.div>
                          <input 
                            ref={documentInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.dwg,.dxf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              setDocumentFiles(prev => [...prev, ...files])
                              e.target.value = ""
                            }}
                          />
                          {documentFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {documentFiles.map((file, idx) => (
                                <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                                  <File className="w-3 h-3" />
                                  {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                                  <button
                                    type="button"
                                    onClick={() => setDocumentFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="ml-1 p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600 rounded"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Bevestigen */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <motion.div 
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center mx-auto mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.1 }}
                        >
                          <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                        </motion.div>
                        <h2 className="text-xl font-semibold">Bevestigen</h2>
                        <p className="text-sm text-muted-foreground mt-1">Controleer de gegevens</p>
                      </div>

                      {/* Summary Card */}
                      <div className="card-tactile rounded-xl p-6 space-y-5">
                        {/* Client Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-1 text-xs">
                              {CLIENT_ROLES.find(r => r.value === formData.rol)?.label}
                            </Badge>
                            <p className="font-semibold">{formData.clientName}</p>
                            <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                              <p className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" /> {formData.clientEmail}
                              </p>
                              {formData.clientPhone && (
                                <p className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5" /> {formData.clientPhone}
                                </p>
                              )}
                            </div>
                            {(formData.architectName || formData.architectEmail) && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <p className="text-xs text-muted-foreground">Architect:</p>
                                <p className="text-sm">{formData.architectName || '-'}</p>
                                {formData.architectEmail && (
                                  <p className="text-xs text-muted-foreground">{formData.architectEmail}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <hr className="border-border/50" />

                        {/* Project Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {formData.projectTypes.map(type => (
                                <Badge key={type} className="pill-glass-amber text-xs">
                                  {projectTypeIcons[type]} {type}
                                </Badge>
                              ))}
                            </div>
                            {formData.address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {formData.address}, {formData.city}
                              </p>
                            )}
                            {!formData.address && formData.postcode && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {formData.postcode} {formData.huisnummer}
                              </p>
                            )}
                            {formData.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {formData.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Uploaded files */}
                        {(photoFiles.length > 0 || documentFiles.length > 0) && (
                          <>
                            <hr className="border-border/50" />
                            <div className="flex flex-wrap gap-2">
                              {photoFiles.length > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <Camera className="w-3 h-3" />
                                  {photoFiles.length} foto{photoFiles.length > 1 ? "'s" : ""}
                                </Badge>
                              )}
                              {documentFiles.length > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <FileText className="w-3 h-3" />
                                  {documentFiles.length} document{documentFiles.length > 1 ? "en" : ""}
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Footer */}
              <div className="border-t border-border/50 p-4 sm:p-6 flex items-center justify-between bg-card/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="gap-2 h-11"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Vorige</span>
                </Button>

                <div className="flex items-center gap-1.5">
                  {WIZARD_STEPS.map((step) => (
                    <motion.div
                      key={step.id}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        currentStep === step.id ? "bg-amber-500" : 
                        currentStep > step.id ? "bg-emerald-500" : "bg-border"
                      )}
                      animate={currentStep === step.id ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="gap-2 h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25"
                  >
                    <span className="hidden sm:inline">Volgende</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="gap-2 h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Aanmaken...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Aanmaken</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AccessGuard>
  )
}
