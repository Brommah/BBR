"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  Shield,
  Clock,
  Star,
  Home,
  Zap,
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileIcon
} from "lucide-react"
import { toast } from "sonner"

const projectTypes = [
  { value: "Dakkapel", label: "Dakkapel", icon: "🏠", description: "Uitbreiding op uw dak" },
  { value: "Uitbouw", label: "Uitbouw", icon: "🏗️", description: "Uitbreiding aan achterzijde" },
  { value: "Aanbouw", label: "Aanbouw", icon: "🏘️", description: "Zijwaartse uitbreiding" },
  { value: "Draagmuur verwijderen", label: "Draagmuur verwijderen", icon: "🧱", description: "Open woonruimte creëren" },
  { value: "Kozijn vergroten", label: "Kozijn vergroten", icon: "🪟", description: "Grotere ramen of deuren" },
  { value: "Fundering herstel", label: "Fundering herstel", icon: "🔧", description: "Funderingsproblemen oplossen" },
  { value: "VvE constructie", label: "VvE constructie", icon: "🏢", description: "Appartementencomplex" },
  { value: "Overig", label: "Overig", icon: "📋", description: "Andere constructieve vraag" },
]

// Allowed file types for upload
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
]

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.xlsx', '.xls', '.csv', '.dwg', '.dxf']

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB total
const MAX_FILES = 5

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) {
    return <ImageIcon className="w-4 h-4 text-purple-500" />
  }
  if (file.type === 'application/pdf') {
    return <FileText className="w-4 h-4 text-red-500" />
  }
  return <FileIcon className="w-4 h-4 text-slate-500" />
}

export default function IntakePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    projectType: "",
    city: "",
    address: "",
    description: ""
  })
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // Validate files
    const validFiles: File[] = []
    const errors: string[] = []
    
    for (const file of selectedFiles) {
      // Check file count
      if (files.length + validFiles.length >= MAX_FILES) {
        errors.push(`Maximaal ${MAX_FILES} bestanden toegestaan`)
        break
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} is te groot (max ${formatFileSize(MAX_FILE_SIZE)})`)
        continue
      }
      
      // Check file type by extension (more reliable than MIME type)
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`${file.name} heeft een niet-ondersteund bestandstype`)
        continue
      }
      
      // Check for duplicates
      if (files.some(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name} is al toegevoegd`)
        continue
      }
      
      validFiles.push(file)
    }
    
    // Check total size
    const totalSize = [...files, ...validFiles].reduce((sum, f) => sum + f.size, 0)
    if (totalSize > MAX_TOTAL_SIZE) {
      errors.push(`Totale bestandsgrootte mag niet groter zijn dan ${formatFileSize(MAX_TOTAL_SIZE)}`)
    } else {
      setFiles(prev => [...prev, ...validFiles])
    }
    
    if (errors.length > 0) {
      toast.error(errors[0], {
        description: errors.length > 1 ? `+${errors.length - 1} andere fout(en)` : undefined
      })
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setUploadProgress(null)

    try {
      // Create FormData for multipart upload
      const submitData = new FormData()
      
      // Add form fields
      submitData.append('clientName', formData.clientName)
      submitData.append('clientEmail', formData.clientEmail)
      submitData.append('clientPhone', formData.clientPhone)
      submitData.append('projectType', formData.projectType)
      submitData.append('city', formData.city)
      submitData.append('address', formData.address)
      submitData.append('description', formData.description)
      
      // Add files
      for (const file of files) {
        submitData.append('files', file)
      }
      
      if (files.length > 0) {
        setUploadProgress(`Uploaden van ${files.length} bestand${files.length > 1 ? 'en' : ''}...`)
      }

      const response = await fetch('/api/intake', {
        method: 'POST',
        body: submitData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.details?.join(', ') || result.error || 'Onbekende fout')
      }

      setIsSubmitted(true)
      toast.success("Aanvraag ontvangen!", {
        description: files.length > 0 
          ? `We hebben uw aanvraag en ${files.length} bestand${files.length > 1 ? 'en' : ''} ontvangen.`
          : "We nemen binnen 1 werkdag contact met u op."
      })

    } catch (error) {
      toast.error("Er ging iets mis", {
        description: error instanceof Error ? error.message : "Probeer het later opnieuw."
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(null)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Aanvraag Ontvangen!
              </h2>
              <p className="text-slate-600">
                Bedankt voor uw aanvraag, {formData.clientName}. We hebben een bevestiging gestuurd naar <strong>{formData.clientEmail}</strong>.
              </p>
              {files.length > 0 && (
                <p className="text-slate-600 mt-2">
                  <Badge variant="secondary" className="gap-1">
                    <File className="w-3 h-3" />
                    {files.length} bestand{files.length > 1 ? 'en' : ''} ontvangen
                  </Badge>
                </p>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-slate-900 mb-2">Wat gebeurt er nu?</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>We bekijken uw aanvraag{files.length > 0 ? ' en documenten' : ''} binnen 1 werkdag</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>U ontvangt een offerte op maat per e-mail</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Na akkoord starten we direct met uw berekening</span>
                </li>
              </ul>
            </div>
            <Button 
              onClick={() => {
                setIsSubmitted(false)
                setFormData({
                  clientName: "",
                  clientEmail: "",
                  clientPhone: "",
                  projectType: "",
                  city: "",
                  address: "",
                  description: ""
                })
                setFiles([])
              }}
              variant="outline"
              className="gap-2"
            >
              Nieuwe Aanvraag Indienen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">Broersma Bouwadvies</h1>
              <p className="text-xs text-amber-400">Constructieve Berekeningen</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-slate-400">
            <a href="mailto:info@broersma-bouwadvies.nl" className="flex items-center gap-1 hover:text-white transition-colors">
              <Mail className="w-4 h-4" />
              info@broersma-bouwadvies.nl
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Info */}
          <div className="space-y-8">
            <div>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
                Gratis & vrijblijvend
              </Badge>
              <h2 className="text-4xl font-bold text-white mb-4">
                Vraag uw<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                  constructieberekening
                </span><br />
                aan
              </h2>
              <p className="text-lg text-slate-400">
                Vul het formulier in en ontvang binnen 1 werkdag een persoonlijke offerte voor uw verbouwingsproject.
              </p>
            </div>

            {/* USPs */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Clock, title: "Snelle levering", desc: "Gemiddeld 5-7 werkdagen" },
                { icon: Shield, title: "Gecertificeerd", desc: "Erkend constructeur" },
                { icon: Star, title: "Ervaren", desc: "500+ projecten per jaar" },
                { icon: Zap, title: "Direct contact", desc: "Persoonlijke aanpak" },
              ].map((usp, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <usp.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{usp.title}</h4>
                    <p className="text-xs text-slate-400">{usp.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Upload Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">Documenten uploaden</h4>
                  <p className="text-xs text-slate-400">
                    Upload bouwtekeningen, foto&apos;s of andere relevante documenten bij uw aanvraag. 
                    Dit helpt ons om sneller een accurate offerte te maken.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600">PDF</Badge>
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600">JPG/PNG</Badge>
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600">DWG</Badge>
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600">Excel</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 italic mb-4">
                &ldquo;Zeer professionele service. Binnen een week hadden we de berekening voor onze uitbouw. Gemeente keurde het direct goed!&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-sm">
                  JV
                </div>
                <div>
                  <p className="font-medium text-white text-sm">Jan van der Berg</p>
                  <p className="text-xs text-slate-400">Uitbouw - Amsterdam</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Aanvraagformulier</CardTitle>
              <CardDescription>
                Alle velden met * zijn verplicht
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Naam *
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Uw volledige naam"
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      required
                      className="pl-10"
                    />
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      E-mail *
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="uw@email.nl"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                        required
                        className="pl-10"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Telefoon
                    </label>
                    <div className="relative">
                      <Input
                        type="tel"
                        placeholder="06 12345678"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                        className="pl-10"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Project Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Type project *
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
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location - Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Adres *
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Straatnaam en huisnummer"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                      className="pl-10"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* City - auto-filled or manual */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Stad/Plaats *
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="bijv. Amsterdam"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                      className="pl-10"
                    />
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Omschrijving project
                  </label>
                  <div className="relative">
                    <Textarea
                      placeholder="Beschrijf uw project. Bijv. afmetingen, specifieke wensen, bijzonderheden..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="min-h-[100px] pl-10 pt-3"
                    />
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Documenten uploaden (optioneel)
                  </label>
                  <div className="text-xs text-slate-500 mb-2">
                    Bouwtekeningen, foto&apos;s, plattegronden — max {MAX_FILES} bestanden, {formatFileSize(MAX_FILE_SIZE)} per bestand
                  </div>
                  
                  {/* Upload Area */}
                  <div 
                    className={`
                      border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                      transition-colors hover:border-amber-400 hover:bg-amber-50/50
                      ${files.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : 'border-slate-300'}
                    `}
                    onClick={() => files.length < MAX_FILES && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      accept={ALLOWED_EXTENSIONS.join(',')}
                      disabled={files.length >= MAX_FILES}
                    />
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      {files.length >= MAX_FILES 
                        ? `Maximum ${MAX_FILES} bestanden bereikt`
                        : 'Klik om bestanden te selecteren of sleep ze hierheen'
                      }
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PDF, JPG, PNG, DWG, Excel
                    </p>
                  </div>

                  {/* Selected Files */}
                  {files.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {files.map((file, index) => (
                        <div 
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          {getFileIcon(file)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <p className="text-xs text-slate-500 text-right">
                        {files.length}/{MAX_FILES} bestanden • {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base gap-2 bg-slate-900 hover:bg-slate-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploadProgress || "Verzenden..."}
                    </>
                  ) : (
                    <>
                      Aanvraag Versturen
                      {files.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          +{files.length} bestand{files.length > 1 ? 'en' : ''}
                        </Badge>
                      )}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  Door te versturen gaat u akkoord met onze algemene voorwaarden en privacybeleid.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Broersma Bouwadvies B.V. Alle rechten voorbehouden.</p>
          <p className="mt-2">
            Constructieve berekeningen voor aanbouw, uitbouw, dakkapel, kozijn & VvE
          </p>
        </div>
      </footer>
    </div>
  )
}
