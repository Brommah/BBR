"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  Check,
  Sparkles
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

      await createActivity({
        leadId,
        type: "lead_created",
        content: `Handmatig ingevoerd via receptie (bron: ${formData.source})${formData.description ? ` - ${formData.description.substring(0, 100)}${formData.description.length > 100 ? '...' : ''}` : ''}`,
        author: currentUser?.name || "Receptie"
      })

      if (formData.description.trim()) {
        await addNote(
          leadId,
          `**Projectomschrijving:**\n${formData.description.trim()}`,
          currentUser?.name || "Receptie"
        )
      }

      if (formData.initialNote.trim()) {
        await addNote(
          leadId,
          formData.initialNote.trim(),
          currentUser?.name || "Receptie"
        )
      }

      if (formData.assignee) {
        const selectedEngineer = engineers.find(e => e.id === formData.assignee)
        if (selectedEngineer) {
          await updateLeadAssignee(leadId, selectedEngineer.name)
        }
      }

      if (pendingFiles.length > 0) {
        const uploadErrors: string[] = []
        
        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i]
          
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
                  <div className="flex items-center gap-2 text-sm">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium pill-glass-amber"
                    )}>
                      {projectTypeIcons[formData.projectType]} {formData.projectType}
                    </span>
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
                  {/* Step 1: Klantgegevens */}
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
                        <h2 className="text-xl font-semibold">Klantgegevens</h2>
                        <p className="text-sm text-muted-foreground mt-1">Wie is de klant?</p>
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
                            className="pl-10 h-12 rounded-xl input-focus"
                            autoFocus
                          />
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                              className="pl-10 h-12 rounded-xl"
                            />
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                              className="pl-10 h-12 rounded-xl"
                            />
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bron aanvraag</label>
                        <Select 
                          value={formData.source} 
                          onValueChange={(value: typeof formData.source) => setFormData({...formData, source: value})}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
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
                        <h2 className="text-xl font-semibold">Projectdetails</h2>
                        <p className="text-sm text-muted-foreground mt-1">Wat voor project is het?</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Type project <span className="text-rose-500">*</span>
                        </label>
                        <Select 
                          value={formData.projectType} 
                          onValueChange={(value) => setFormData({...formData, projectType: value})}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
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
                              className="pl-10 h-12 rounded-xl"
                            />
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Adres</label>
                          <div className="relative">
                            <Input
                              placeholder="Straatnaam 123"
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                              className="pl-10 h-12 rounded-xl"
                            />
                            <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Projectomschrijving</label>
                        <Textarea
                          placeholder="Beschrijving: afmetingen, wensen, bijzonderheden..."
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="min-h-[100px] resize-none rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Extra Details */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <motion.div 
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center mx-auto mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.1 }}
                        >
                          <Sparkles className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                        </motion.div>
                        <h2 className="text-xl font-semibold">Extra Informatie</h2>
                        <p className="text-sm text-muted-foreground mt-1">Optionele details</p>
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
                              className="pl-10 h-12 rounded-xl"
                              min="0"
                              step="0.01"
                            />
                            <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Werknummer</label>
                          <div className="relative">
                            <Input
                              placeholder="bijv. 2026-001"
                              value={formData.werknummer}
                              onChange={(e) => setFormData({...formData, werknummer: e.target.value})}
                              className="pl-10 h-12 rounded-xl"
                            />
                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Toewijzen aan</label>
                        <Select 
                          value={formData.assignee || "_none_"} 
                          onValueChange={(value) => setFormData({...formData, assignee: value === "_none_" ? "" : value})}
                          disabled={loadingEngineers}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder={loadingEngineers ? "Laden..." : "Selecteer (optioneel)"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none_">
                              <span className="text-muted-foreground">Niet toewijzen</span>
                            </SelectItem>
                            {engineers.map((engineer) => (
                              <SelectItem key={engineer.id} value={engineer.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-xs font-semibold text-amber-700">
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
                          placeholder="Opmerkingen voor het team..."
                          value={formData.initialNote}
                          onChange={(e) => setFormData({...formData, initialNote: e.target.value})}
                          className="min-h-[80px] resize-none rounded-xl"
                        />
                      </div>

                      {/* File Upload */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Documenten
                        </label>
                        <motion.div 
                          className="card-tactile rounded-xl p-6 text-center cursor-pointer group"
                          onClick={() => fileInputRef.current?.click()}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                          <p className="text-sm text-muted-foreground">
                            Klik om bestanden toe te voegen
                          </p>
                        </motion.div>
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
                          <div className="flex flex-wrap gap-2 mt-3">
                            {pendingFiles.map((file, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="pill-glass-slate px-2 py-1 rounded-full text-xs flex items-center gap-1"
                              >
                                <File className="w-3 h-3" />
                                {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPendingFiles(prev => prev.filter((_, i) => i !== idx))
                                  }}
                                  className="ml-1 p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600 rounded"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Bevestigen */}
                  {currentStep === 4 && (
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
                            <p className="font-semibold">{formData.clientName}</p>
                            <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                              {formData.clientEmail && (
                                <p className="flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5" /> {formData.clientEmail}
                                </p>
                              )}
                              {formData.clientPhone && (
                                <p className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5" /> {formData.clientPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <hr className="border-border/50" />

                        {/* Project Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <span className="pill-glass-amber px-2 py-0.5 rounded-full text-xs font-medium">
                              {projectTypeIcons[formData.projectType]} {formData.projectType}
                            </span>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                              <MapPin className="w-3.5 h-3.5" />
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
                            <hr className="border-border/50" />
                            <div className="flex flex-wrap gap-2">
                              {formData.assignee && (
                                <span className="pill-glass-blue px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" />
                                  {engineers.find(e => e.id === formData.assignee)?.name}
                                </span>
                              )}
                              {formData.estimatedValue && (
                                <span className="pill-glass-emerald px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                                  <Euro className="w-3 h-3" />
                                  €{parseFloat(formData.estimatedValue).toLocaleString('nl-NL')}
                                </span>
                              )}
                              {pendingFiles.length > 0 && (
                                <span className="pill-glass-violet px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                                  <File className="w-3 h-3" />
                                  {pendingFiles.length} bestand{pendingFiles.length > 1 ? 'en' : ''}
                                </span>
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

                {currentStep < 4 ? (
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
                        <Send className="w-4 h-4" />
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
