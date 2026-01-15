"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AccessGuard } from "@/components/auth/access-guard"
import { useAuthStore } from "@/lib/auth"
import { createLead, createActivity, addNote, getEngineers, updateLeadAssignee } from "@/lib/db-actions"
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
  Home, 
  FileText, 
  UserCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Euro,
  StickyNote,
  Building2,
  Send,
  Hash,
  Upload,
  File,
  X,
  Check
} from "lucide-react"

interface Engineer {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
}

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
  { id: 2, title: "Project", icon: Building2, description: "Type & locatie" },
  { id: 3, title: "Details", icon: FileText, description: "Extra informatie" },
  { id: 4, title: "Bevestigen", icon: CheckCircle2, description: "Controleren" },
]

export default function SubmitPage() {
  const router = useRouter()
  const { currentUser } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null)
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [loadingEngineers, setLoadingEngineers] = useState(true)

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    projectType: "",
    city: "",
    address: "",
    description: "",
    assignee: "",
    estimatedValue: "",
    initialNote: "",
    werknummer: "",
    source: "telefoon" as "telefoon" | "email" | "balie" | "doorverwijzing" | "anders"
  })
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load engineers on mount
  useEffect(() => {
    async function loadEngineers() {
      setLoadingEngineers(true)
      try {
        const result = await getEngineers()
        if (result.success && result.data) {
          setEngineers(result.data as Engineer[])
        }
      } catch (error) {
        console.error("Failed to load engineers:", error)
      } finally {
        setLoadingEngineers(false)
      }
    }
    loadEngineers()
  }, [])

  // Validate current step before proceeding
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.clientName.trim()) {
          toast.error("Vul een klantnaam in")
          return false
        }
        return true
      case 2:
        if (!formData.projectType) {
          toast.error("Selecteer een projecttype")
          return false
        }
        if (!formData.city.trim()) {
          toast.error("Vul een stad/plaats in")
          return false
        }
        return true
      case 3:
        return true // Optional fields
      case 4:
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    // Only allow going back or to completed steps
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
      // Create the lead
      const leadResult = await createLead({
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim() || undefined,
        clientPhone: formData.clientPhone.trim() || undefined,
        projectType: formData.projectType,
        city: formData.city.trim(),
        address: formData.address.trim() || undefined,
        value: formData.estimatedValue ? parseFloat(formData.estimatedValue) : 0,
        werknummer: formData.werknummer.trim() || undefined,
      })

      if (!leadResult.success || !leadResult.data) {
        throw new Error(leadResult.error || "Kon lead niet aanmaken")
      }

      const leadId = (leadResult.data as { id: string }).id
      setCreatedLeadId(leadId)

      // Log activity for manual submission
      await createActivity({
        leadId,
        type: "lead_created",
        content: `Handmatig ingevoerd via receptie (bron: ${formData.source})${formData.description ? ` - ${formData.description.substring(0, 100)}${formData.description.length > 100 ? '...' : ''}` : ''}`,
        author: currentUser?.name || "Receptie"
      })

      // Add description as note if provided
      if (formData.description.trim()) {
        await addNote(
          leadId,
          `**Projectomschrijving:**\n${formData.description.trim()}`,
          currentUser?.name || "Receptie"
        )
      }

      // Add initial note if provided
      if (formData.initialNote.trim()) {
        await addNote(
          leadId,
          formData.initialNote.trim(),
          currentUser?.name || "Receptie"
        )
      }

      // Assign engineer if selected
      if (formData.assignee) {
        const selectedEngineer = engineers.find(e => e.id === formData.assignee)
        if (selectedEngineer) {
          await updateLeadAssignee(leadId, selectedEngineer.name)
        }
      }

      // Upload pending documents to Supabase Storage
      if (pendingFiles.length > 0) {
        const uploadErrors: string[] = []
        
        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i]
          
          // Create FormData for the upload
          const uploadData = new FormData()
          uploadData.append('file', file)
          uploadData.append('leadId', leadId)
          uploadData.append('category', 'overig')
          uploadData.append('uploadedBy', currentUser?.name || 'Receptie')
          
          const result = await uploadFile(uploadData)
          
          if (!result.success) {
            uploadErrors.push(`${file.name}: ${result.error}`)
          }
        }
        
        // Show warning if some uploads failed
        if (uploadErrors.length > 0) {
          toast.warning(`${uploadErrors.length} bestand(en) niet geüpload`, {
            description: uploadErrors[0]
          })
        }
      }

      setIsSubmitted(true)
      toast.success("Project succesvol aangemaakt!", {
        description: `${formData.clientName} - ${formData.projectType}`
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
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      projectType: "",
      city: "",
      address: "",
      description: "",
      assignee: "",
      estimatedValue: "",
      initialNote: "",
      werknummer: "",
      source: "telefoon"
    })
    setPendingFiles([])
    setIsSubmitted(false)
    setCreatedLeadId(null)
    setCurrentStep(1)
  }

  // Success state
  if (isSubmitted && createdLeadId) {
    return (
      <AccessGuard permission="leads:create" redirectTo="/login">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full shadow-xl border-0 bg-white dark:bg-slate-900">
            <CardContent className="pt-12 pb-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Project Aangemaakt!
                </h2>
                <p className="text-muted-foreground">
                  <strong>{formData.clientName}</strong> is toegevoegd aan het systeem.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="gap-1">
                    {projectTypeIcons[formData.projectType]}
                    {formData.projectType}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {formData.city}{formData.address && `, ${formData.address}`}
                </p>
                {formData.assignee && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Toegewezen aan: {engineers.find(e => e.id === formData.assignee)?.name}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => router.push(`/leads/${createdLeadId}`)}
                  className="flex-1 gap-2"
                >
                  Bekijk Project
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nieuw Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AccessGuard>
    )
  }

  return (
    <AccessGuard permission="leads:create" redirectTo="/login">
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <ClipboardPlus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">Nieuw Project Invoeren</h1>
                <p className="text-xs text-muted-foreground">Handmatige invoer door receptie</p>
              </div>
              {currentUser && (
                <Badge variant="outline" className="ml-auto gap-1 text-xs">
                  <User className="w-3 h-3" />
                  {currentUser.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="bg-card/50 border-b border-border flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {WIZARD_STEPS.map((step, index) => {
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                const StepIcon = step.icon
                
                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => goToStep(step.id)}
                      disabled={step.id > currentStep}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                        isActive && "bg-amber-100 dark:bg-amber-900/30",
                        isCompleted && "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                        step.id > currentStep && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                        isActive && "bg-amber-500 text-white",
                        isCompleted && "bg-emerald-500 text-white",
                        !isActive && !isCompleted && "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      )}>
                        {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <div className="hidden sm:block text-left">
                        <p className={cn(
                          "text-sm font-medium",
                          isActive && "text-amber-700 dark:text-amber-400",
                          isCompleted && "text-emerald-700 dark:text-emerald-400",
                          !isActive && !isCompleted && "text-slate-500"
                        )}>
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </button>
                    
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5 mx-2 rounded transition-colors",
                        currentStep > step.id ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                      )} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-2xl mx-auto px-4 py-6 h-full flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardContent className="flex-1 p-6 overflow-y-auto">
                {/* Step 1: Klantgegevens */}
                {currentStep === 1 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                        <User className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h2 className="text-xl font-semibold">Klantgegevens</h2>
                      <p className="text-sm text-muted-foreground">Contactinformatie van de klant</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Naam klant <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Volledige naam"
                          value={formData.clientName}
                          onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                          className="pl-10 h-11"
                          autoFocus
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">E-mailadres</label>
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="klant@email.nl"
                            value={formData.clientEmail}
                            onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                            className="pl-10 h-11"
                          />
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Telefoonnummer</label>
                        <div className="relative">
                          <Input
                            type="tel"
                            placeholder="06 12345678"
                            value={formData.clientPhone}
                            onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                            className="pl-10 h-11"
                          />
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bron aanvraag</label>
                      <Select 
                        value={formData.source} 
                        onValueChange={(value: typeof formData.source) => setFormData({...formData, source: value})}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="telefoon">📞 Telefoon</SelectItem>
                          <SelectItem value="email">📧 E-mail</SelectItem>
                          <SelectItem value="balie">🏢 Balie</SelectItem>
                          <SelectItem value="doorverwijzing">🔗 Doorverwijzing</SelectItem>
                          <SelectItem value="anders">📝 Anders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 2: Projectdetails */}
                {currentStep === 2 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h2 className="text-xl font-semibold">Projectdetails</h2>
                      <p className="text-sm text-muted-foreground">Type project en locatie</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Type project <span className="text-rose-500">*</span>
                      </label>
                      <Select 
                        value={formData.projectType} 
                        onValueChange={(value) => setFormData({...formData, projectType: value})}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecteer projecttype" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                <span>{projectTypeIcons[type] || "📋"}</span>
                                <span>{type}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Stad/Plaats <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            placeholder="bijv. Amsterdam"
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            className="pl-10 h-11"
                          />
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Adres</label>
                        <div className="relative">
                          <Input
                            placeholder="Straatnaam en huisnummer"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="pl-10 h-11"
                          />
                          <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Projectomschrijving</label>
                      <Textarea
                        placeholder="Beschrijving: afmetingen, wensen, bijzonderheden..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="min-h-[80px] resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Extra Details */}
                {currentStep === 3 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h2 className="text-xl font-semibold">Extra Informatie</h2>
                      <p className="text-sm text-muted-foreground">Optionele details en toewijzing</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Geschatte waarde</label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={formData.estimatedValue}
                            onChange={(e) => setFormData({...formData, estimatedValue: e.target.value})}
                            className="pl-10 h-11"
                            min="0"
                            step="0.01"
                          />
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Werknummer</label>
                        <div className="relative">
                          <Input
                            placeholder="bijv. 2026-001"
                            value={formData.werknummer}
                            onChange={(e) => setFormData({...formData, werknummer: e.target.value})}
                            className="pl-10 h-11"
                          />
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Direct toewijzen aan engineer</label>
                      <Select 
                        value={formData.assignee || "_none_"} 
                        onValueChange={(value) => setFormData({...formData, assignee: value === "_none_" ? "" : value})}
                        disabled={loadingEngineers}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={loadingEngineers ? "Engineers laden..." : "Selecteer engineer (optioneel)"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">
                            <span className="text-muted-foreground">Niet toewijzen</span>
                          </SelectItem>
                          {engineers.map((engineer) => (
                            <SelectItem key={engineer.id} value={engineer.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-semibold text-amber-700 dark:text-amber-300">
                                  {engineer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <span>{engineer.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <StickyNote className="w-4 h-4" />
                        Interne notitie
                      </label>
                      <Textarea
                        placeholder="Opmerkingen voor het team (niet zichtbaar voor klant)..."
                        value={formData.initialNote}
                        onChange={(e) => setFormData({...formData, initialNote: e.target.value})}
                        className="min-h-[60px] resize-none"
                      />
                    </div>

                    {/* Compact file upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Documenten
                      </label>
                      <div 
                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-amber-400 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <p className="text-sm text-muted-foreground">
                          Klik om bestanden toe te voegen
                        </p>
                      </div>
                      <input 
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          setPendingFiles(prev => [...prev, ...files])
                          e.target.value = ""
                        }}
                      />
                      
                      {pendingFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {pendingFiles.map((file, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              <File className="w-3 h-3" />
                              {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                              <button
                                type="button"
                                onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
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
                )}

                {/* Step 4: Bevestigen */}
                {currentStep === 4 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h2 className="text-xl font-semibold">Bevestigen</h2>
                      <p className="text-sm text-muted-foreground">Controleer de gegevens</p>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 space-y-4">
                      {/* Client Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold">{formData.clientName}</p>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            {formData.clientEmail && (
                              <p className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {formData.clientEmail}
                              </p>
                            )}
                            {formData.clientPhone && (
                              <p className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {formData.clientPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-200 dark:border-slate-700" />

                      {/* Project Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <Badge variant="outline" className="gap-1 mb-1">
                            {projectTypeIcons[formData.projectType]}
                            {formData.projectType}
                          </Badge>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {formData.city}{formData.address && `, ${formData.address}`}
                          </p>
                          {formData.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {formData.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Optional Info */}
                      {(formData.assignee || formData.estimatedValue || pendingFiles.length > 0) && (
                        <>
                          <hr className="border-slate-200 dark:border-slate-700" />
                          <div className="flex flex-wrap gap-2">
                            {formData.assignee && (
                              <Badge variant="secondary" className="gap-1">
                                <UserCheck className="w-3 h-3" />
                                {engineers.find(e => e.id === formData.assignee)?.name}
                              </Badge>
                            )}
                            {formData.estimatedValue && (
                              <Badge variant="secondary" className="gap-1">
                                <Euro className="w-3 h-3" />
                                €{parseFloat(formData.estimatedValue).toLocaleString('nl-NL')}
                              </Badge>
                            )}
                            {pendingFiles.length > 0 && (
                              <Badge variant="secondary" className="gap-1">
                                <File className="w-3 h-3" />
                                {pendingFiles.length} bestand{pendingFiles.length > 1 ? 'en' : ''}
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Navigation Footer - Always visible */}
              <div className="border-t border-border p-4 flex items-center justify-between bg-card flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Vorige
                </Button>

                <div className="flex items-center gap-1">
                  {WIZARD_STEPS.map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        currentStep === step.id ? "bg-amber-500" : 
                        currentStep > step.id ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      )}
                    />
                  ))}
                </div>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Volgende
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Aanmaken...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Project Aanmaken
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AccessGuard>
  )
}
