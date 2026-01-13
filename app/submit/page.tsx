"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { AccessGuard } from "@/components/auth/access-guard"
import { useAuthStore } from "@/lib/auth"
import { createLead, createActivity, addNote, getEngineers, updateLeadAssignee, createDocument } from "@/lib/db-actions"
import { PROJECT_TYPES } from "@/lib/config"
import { toast } from "sonner"
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
  Plus,
  Euro,
  StickyNote,
  Building2,
  Send,
  Hash,
  Upload,
  File,
  X
} from "lucide-react"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { ParsedAddress } from "@/hooks/use-google-places"

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

export default function SubmitPage() {
  const router = useRouter()
  const { currentUser } = useAuthStore()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.clientName.trim()) {
        toast.error("Klantnaam is verplicht")
        setIsSubmitting(false)
        return
      }
      if (!formData.projectType) {
        toast.error("Projecttype is verplicht")
        setIsSubmitting(false)
        return
      }
      if (!formData.city.trim()) {
        toast.error("Stad/plaats is verplicht")
        setIsSubmitting(false)
        return
      }

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

      // Upload pending documents
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await createDocument({
            leadId,
            name: file.name,
            type: file.type.split('/')[1] || 'other',
            category: 'overig',
            size: file.size,
            url: `/uploads/${leadId}/${file.name}`, // Placeholder URL
            uploadedBy: currentUser?.name || 'Receptie'
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
                  <strong>{formData.clientName}</strong> is toegevoegd aan het systeem als nieuw project.
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <ClipboardPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-lg">Nieuw Project Invoeren</h1>
                <p className="text-xs text-muted-foreground">Handmatige invoer door receptie</p>
              </div>
              {currentUser && (
                <Badge variant="outline" className="ml-auto gap-1">
                  <User className="w-3 h-3" />
                  {currentUser.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-500" />
                  Klantgegevens
                </CardTitle>
                <CardDescription>
                  Basisinformatie over de klant en contactgegevens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Naam klant <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Volledige naam"
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      required
                      className="pl-10"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      E-mailadres
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="klant@email.nl"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                        className="pl-10"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Telefoonnummer
                    </label>
                    <div className="relative">
                      <Input
                        type="tel"
                        placeholder="06 12345678"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                        className="pl-10"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Bron aanvraag
                  </label>
                  <Select 
                    value={formData.source} 
                    onValueChange={(value: typeof formData.source) => setFormData({...formData, source: value})}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
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
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  Projectdetails
                </CardTitle>
                <CardDescription>
                  Type project en locatiegegevens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Type project <span className="text-rose-500">*</span>
                  </label>
                  <Select 
                    value={formData.projectType} 
                    onValueChange={(value) => setFormData({...formData, projectType: value})}
                    required
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

                {/* Location - Address Autocomplete */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Adres
                  </label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({...formData, address: value})}
                    onPlaceSelect={(parsed: ParsedAddress) => {
                      // Auto-fill address and city from selected place
                      setFormData(prev => ({
                        ...prev,
                        address: parsed.street && parsed.houseNumber 
                          ? `${parsed.street} ${parsed.houseNumber}` 
                          : parsed.fullAddress,
                        city: parsed.city || prev.city
                      }))
                    }}
                    placeholder="Zoek adres of straat..."
                    showIcon
                  />
                  <p className="text-xs text-muted-foreground">
                    Begin met typen om adressen te zoeken
                  </p>
                </div>

                {/* City - auto-filled or manual */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Stad/Plaats <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="bijv. Amsterdam"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                      className="pl-10"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Projectomschrijving
                  </label>
                  <div className="relative">
                    <Textarea
                      placeholder="Beschrijving van het project: afmetingen, specifieke wensen, bijzonderheden..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="min-h-[100px] pl-10 pt-3"
                    />
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Estimated Value & Werknummer */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Geschatte waarde (optioneel)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.estimatedValue}
                        onChange={(e) => setFormData({...formData, estimatedValue: e.target.value})}
                        className="pl-10"
                        min="0"
                        step="0.01"
                      />
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Werknummer (optioneel)
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="bijv. 2026-001"
                        value={formData.werknummer}
                        onChange={(e) => setFormData({...formData, werknummer: e.target.value})}
                        className="pl-10"
                      />
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  Toewijzing
                </CardTitle>
                <CardDescription>
                  Wijs het project direct toe aan een engineer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Engineer Assignment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Direct toewijzen aan engineer
                  </label>
                  <Select 
                    value={formData.assignee || "_none_"} 
                    onValueChange={(value) => setFormData({...formData, assignee: value === "_none_" ? "" : value})}
                    disabled={loadingEngineers}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
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
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-amber-500" />
                  Interne Notitie
                </CardTitle>
                <CardDescription>
                  Extra opmerkingen voor het team (niet zichtbaar voor klant)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Interne opmerkingen, bijzonderheden of instructies voor het team..."
                  value={formData.initialNote}
                  onChange={(e) => setFormData({...formData, initialNote: e.target.value})}
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-500" />
                  Documenten
                </CardTitle>
                <CardDescription>
                  Upload tekeningen, foto&apos;s of andere relevante documenten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Klik om bestanden te uploaden
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, afbeeldingen, DWG of andere bestanden
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
                
                {/* File list */}
                {pendingFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Geselecteerde bestanden ({pendingFiles.length})
                    </p>
                    <div className="space-y-2">
                      {pendingFiles.map((file, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <File className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                          >
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Submit Button */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                <span className="text-rose-500">*</span> Verplichte velden
              </p>
              <Button 
                type="submit" 
                size="lg"
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Project aanmaken...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Project Aanmaken
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AccessGuard>
  )
}
