import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendIntakeConfirmation } from '@/lib/email'
import { createActivity, checkRateLimit, createAuditLog, createDocument } from '@/lib/db-actions'
import { PROJECT_TYPES, RATE_LIMITS } from '@/lib/config'
import { supabase } from '@/lib/supabase'

// ============================================================
// Constants
// ============================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB total
const MAX_FILES = 5
const BUCKET_NAME = 'documents'

const ALLOWED_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', 
  '.xlsx', '.xls', '.csv', '.dwg', '.dxf'
]

// ============================================================
// Validation Helpers
// ============================================================

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone: string): boolean {
  // Allow various Dutch phone formats
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  return /^(\+31|0031|0)[1-9][0-9]{8,9}$/.test(cleaned)
}

function sanitizeInput(input: string): string {
  // Basic XSS prevention
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

function getFileExtension(filename: string): string {
  return '.' + filename.split('.').pop()?.toLowerCase()
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf': return 'pdf'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp': return 'image'
    case 'xlsx':
    case 'xls':
    case 'csv': return 'spreadsheet'
    case 'dwg':
    case 'dxf': return 'dwg'
    default: return 'other'
  }
}

// ============================================================
// Storage Helper
// ============================================================

async function ensureBucket(): Promise<boolean> {
  if (!supabase) {
    console.log('[INTAKE] Supabase not configured, skipping bucket check')
    return false
  }
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    
    if (!buckets?.find(b => b.name === BUCKET_NAME)) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 52428800 // 50MB
      })
      if (error) {
        console.error('[INTAKE] Failed to create bucket:', error)
        return false
      }
    }
    return true
  } catch (error) {
    console.error('[INTAKE] Bucket check error:', error)
    return false
  }
}

// ============================================================
// POST - Create new lead from intake form (with file uploads)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Check rate limit (database-backed)
    const rateLimitKey = `intake:${ip}`
    const rateCheck = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.intake.maxRequests,
      RATE_LIMITS.intake.windowMs
    )

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Te veel aanvragen. Probeer het later opnieuw.',
          retryAfter: Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateCheck.resetAt.toISOString(),
          }
        }
      )
    }

    // Check content type to determine parsing method
    const contentType = request.headers.get('content-type') || ''
    
    let clientName: string | undefined
    let clientEmail: string | undefined
    let clientPhone: string | undefined
    let projectType: string | undefined
    let city: string | undefined
    let address: string | undefined
    let description: string | undefined
    let files: File[] = []

    if (contentType.includes('multipart/form-data')) {
      // Parse multipart form data
      const formData = await request.formData()
      
      clientName = formData.get('clientName') as string | undefined
      clientEmail = formData.get('clientEmail') as string | undefined
      clientPhone = formData.get('clientPhone') as string | undefined
      projectType = formData.get('projectType') as string | undefined
      city = formData.get('city') as string | undefined
      address = formData.get('address') as string | undefined
      description = formData.get('description') as string | undefined
      
      // Get all files
      const fileEntries = formData.getAll('files')
      for (const entry of fileEntries) {
        if (entry instanceof File && entry.size > 0) {
          files.push(entry)
        }
      }
    } else {
      // Parse JSON body (backwards compatibility)
      try {
        const body = await request.json()
        clientName = body.clientName
        clientEmail = body.clientEmail
        clientPhone = body.clientPhone
        projectType = body.projectType
        city = body.city
        address = body.address
        description = body.description
      } catch {
        return NextResponse.json(
          { error: 'Ongeldige request body' },
          { status: 400 }
        )
      }
    }

    // Validation
    const errors: string[] = []
    
    if (!clientName || typeof clientName !== 'string' || clientName.trim().length < 2) {
      errors.push('Naam is verplicht (minimaal 2 karakters)')
    }
    
    if (!clientEmail || typeof clientEmail !== 'string' || !validateEmail(clientEmail)) {
      errors.push('Geldig e-mailadres is verplicht')
    }
    
    if (clientPhone && typeof clientPhone === 'string' && clientPhone.trim() && !validatePhone(clientPhone)) {
      errors.push('Ongeldig telefoonnummer formaat')
    }
    
    if (!projectType || typeof projectType !== 'string') {
      errors.push('Projecttype is verplicht')
    } else if (!PROJECT_TYPES.includes(projectType as typeof PROJECT_TYPES[number])) {
      errors.push('Ongeldig projecttype')
    }
    
    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      errors.push('Stad/plaats is verplicht')
    }

    // Description length check
    if (description && typeof description === 'string' && description.length > 2000) {
      errors.push('Beschrijving mag maximaal 2000 karakters zijn')
    }

    // File validation
    if (files.length > MAX_FILES) {
      errors.push(`Maximaal ${MAX_FILES} bestanden toegestaan`)
    }

    let totalFileSize = 0
    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} is te groot (max 10MB per bestand)`)
      }
      totalFileSize += file.size
      
      // Check file extension
      const ext = getFileExtension(file.name)
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`${file.name} heeft een niet-ondersteund bestandstype`)
      }
    }

    if (totalFileSize > MAX_TOTAL_SIZE) {
      errors.push('Totale bestandsgrootte mag niet groter zijn dan 50MB')
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validatie fout', details: errors },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      clientName: sanitizeInput(clientName as string),
      clientEmail: (clientEmail as string).trim().toLowerCase(),
      clientPhone: clientPhone && clientPhone.trim() ? sanitizeInput(clientPhone as string) : null,
      projectType: projectType as string,
      city: sanitizeInput(city as string),
      address: address && address.trim() ? sanitizeInput(address as string) : null,
      description: description && description.trim() ? sanitizeInput(description as string) : null,
    }

    // Create lead in database
    const lead = await prisma.lead.create({
      data: {
        clientName: sanitizedData.clientName,
        clientEmail: sanitizedData.clientEmail,
        clientPhone: sanitizedData.clientPhone,
        projectType: sanitizedData.projectType,
        city: sanitizedData.city,
        address: sanitizedData.address,
        status: 'Nieuw',
        value: 0,
      }
    })

    // Log activity
    await createActivity({
      leadId: lead.id,
      type: 'lead_created',
      content: `Lead aangemaakt via website intake${sanitizedData.description ? `: ${sanitizedData.description.substring(0, 100)}...` : ''}${files.length > 0 ? ` (${files.length} bestand${files.length > 1 ? 'en' : ''} geüpload)` : ''}`,
      author: 'Website'
    })

    // Add description as a note if provided
    if (sanitizedData.description) {
      await prisma.note.create({
        data: {
          leadId: lead.id,
          content: sanitizedData.description,
          author: sanitizedData.clientName
        }
      })
    }

    // Upload files if any
    const uploadedFiles: { name: string; url: string; success: boolean }[] = []
    
    if (files.length > 0 && supabase) {
      await ensureBucket()
      
      for (const file of files) {
        try {
          // Create unique filename
          const timestamp = Date.now()
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          const path = `${lead.id}/${timestamp}-${safeName}`
          
          // Convert File to ArrayBuffer for upload
          const arrayBuffer = await file.arrayBuffer()
          const buffer = new Uint8Array(arrayBuffer)
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, buffer, {
              contentType: file.type || 'application/octet-stream'
            })
          
          if (uploadError) {
            console.error('[INTAKE] Upload error:', uploadError)
            uploadedFiles.push({ name: file.name, url: '', success: false })
            continue
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path)
          
          // Save to database - categorize as 'tekening' for intake uploads
          const dbResult = await createDocument({
            leadId: lead.id,
            name: file.name,
            type: getFileType(file.name),
            category: 'tekening', // Default category for intake uploads
            size: file.size,
            url: urlData.publicUrl,
            uploadedBy: sanitizedData.clientName
          })
          
          if (dbResult.success) {
            uploadedFiles.push({ name: file.name, url: urlData.publicUrl, success: true })
            
            // Log document upload activity
            await createActivity({
              leadId: lead.id,
              type: 'document_uploaded',
              content: `Document "${file.name}" geüpload door klant`,
              author: sanitizedData.clientName
            })
          } else {
            // Cleanup uploaded file on DB error
            await supabase.storage.from(BUCKET_NAME).remove([path])
            uploadedFiles.push({ name: file.name, url: '', success: false })
          }
        } catch (error) {
          console.error('[INTAKE] File upload error:', error)
          uploadedFiles.push({ name: file.name, url: '', success: false })
        }
      }
    }

    // Create audit log
    await createAuditLog({
      entityType: 'lead',
      entityId: lead.id,
      action: 'create',
      changes: [
        { field: 'source', oldValue: null, newValue: 'website_intake' },
        { field: 'clientName', oldValue: null, newValue: sanitizedData.clientName },
        { field: 'projectType', oldValue: null, newValue: sanitizedData.projectType },
        ...(files.length > 0 ? [{ field: 'documents', oldValue: null, newValue: `${uploadedFiles.filter(f => f.success).length} files uploaded` }] : []),
      ],
      userId: 'system',
      userName: 'Website Intake',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    // Send confirmation email to client
    const emailResult = await sendIntakeConfirmation({
      to: sanitizedData.clientEmail,
      clientName: sanitizedData.clientName,
      projectType: sanitizedData.projectType,
      leadId: lead.id,
      sentBy: 'Website'
    })

    // Log if email failed (but don't fail the request)
    if (!emailResult.success) {
      console.error('[INTAKE] Failed to send confirmation email:', emailResult.error)
    }

    // Calculate successful uploads
    const successfulUploads = uploadedFiles.filter(f => f.success).length
    const failedUploads = uploadedFiles.filter(f => !f.success).length

    // Return success response with rate limit headers
    return NextResponse.json(
      {
        success: true,
        message: 'Aanvraag succesvol ontvangen! We nemen binnen 1 werkdag contact met u op.',
        leadId: lead.id,
        emailSent: emailResult.success,
        filesUploaded: successfulUploads,
        filesFailed: failedUploads,
        uploadedFiles: uploadedFiles.filter(f => f.success).map(f => f.name)
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateCheck.remaining),
          'X-RateLimit-Reset': rateCheck.resetAt.toISOString(),
        }
      }
    )

  } catch (error) {
    console.error('[INTAKE] Error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het later opnieuw.' },
      { status: 500 }
    )
  }
}

// ============================================================
// GET - API health check and info
// ============================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Intake API is running',
    version: '2.1.0',
    acceptedProjectTypes: PROJECT_TYPES,
    rateLimit: {
      maxRequests: RATE_LIMITS.intake.maxRequests,
      windowMs: RATE_LIMITS.intake.windowMs,
    },
    fileUpload: {
      maxFiles: MAX_FILES,
      maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
      maxTotalSizeMB: MAX_TOTAL_SIZE / (1024 * 1024),
      allowedExtensions: ALLOWED_EXTENSIONS
    }
  })
}
