"use server"

import { supabase } from './supabase'
import { createDocument, deleteDocument as deleteDocumentDb } from './db-actions'

const BUCKET_NAME = 'documents'

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

// Check if bucket exists (don't try to create - requires admin)
async function checkBucketExists(): Promise<boolean> {
  if (!supabase) return false
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) {
      console.warn('[STORAGE] Cannot list buckets:', error.message)
      return false
    }
    return buckets?.some(b => b.name === BUCKET_NAME) ?? false
  } catch (err) {
    console.warn('[STORAGE] Bucket check failed:', err)
    return false
  }
}

// Get file type from extension
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

// Upload file - stores in Supabase if available, otherwise database-only
export async function uploadFile(formData: FormData): Promise<UploadResult> {
  try {
    const file = formData.get('file') as File | null
    const leadId = formData.get('leadId') as string | null
    const category = formData.get('category') as string | null
    const uploadedBy = formData.get('uploadedBy') as string | null

    if (!file || !leadId || !category || !uploadedBy) {
      return { success: false, error: 'Missing required fields' }
    }

    // Check if Supabase storage is available
    const bucketExists = await checkBucketExists()
    
    if (!supabase || !bucketExists) {
      // Supabase storage not available - save to database with placeholder URL
      console.log('[STORAGE] Supabase storage not available - saving document record only')
      
      const placeholderUrl = `/documents/${leadId}/${encodeURIComponent(file.name)}`
      
      const dbResult = await createDocument({
        leadId,
        name: file.name,
        type: getFileType(file.name),
        category,
        size: file.size,
        url: placeholderUrl,
        uploadedBy
      })
      
      if (!dbResult.success) {
        return { success: false, error: dbResult.error }
      }
      
      return { success: true, url: placeholderUrl }
    }

    // Supabase storage is available - upload file
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `${leadId}/${timestamp}-${safeName}`
    
    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      })
    
    if (uploadError) {
      console.error('[STORAGE] Upload error:', uploadError)
      
      // Fall back to database-only if upload fails
      console.log('[STORAGE] Falling back to database-only storage')
      const placeholderUrl = `/documents/${leadId}/${encodeURIComponent(file.name)}`
      
      const dbResult = await createDocument({
        leadId,
        name: file.name,
        type: getFileType(file.name),
        category,
        size: file.size,
        url: placeholderUrl,
        uploadedBy
      })
      
      if (!dbResult.success) {
        return { success: false, error: dbResult.error }
      }
      
      return { success: true, url: placeholderUrl }
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path)
    
    // Save to database
    const dbResult = await createDocument({
      leadId,
      name: file.name,
      type: getFileType(file.name),
      category,
      size: file.size,
      url: urlData.publicUrl,
      uploadedBy
    })
    
    if (!dbResult.success) {
      // Cleanup uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([path])
      return { success: false, error: dbResult.error }
    }
    
    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('[STORAGE] Upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

// Delete file from storage and database
export async function deleteFile(documentId: string, url: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Only try to delete from Supabase if it's a Supabase URL
    if (supabase && url.includes('supabase')) {
      try {
        const urlObj = new URL(url)
        const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)/)
        
        if (pathMatch) {
          const filePath = decodeURIComponent(pathMatch[1])
          await supabase.storage.from(BUCKET_NAME).remove([filePath])
        }
      } catch (storageErr) {
        console.warn('[STORAGE] Could not delete from storage:', storageErr)
        // Continue to delete from database anyway
      }
    }
    
    // Delete from database
    const result = await deleteDocumentDb(documentId)
    return result
  } catch (error) {
    console.error('[STORAGE] Delete error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    }
  }
}

// Get signed URL for private file access
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
  if (!supabase) {
    console.error('[STORAGE] Supabase not configured')
    return null
  }
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)
  
  if (error) {
    console.error('[STORAGE] Signed URL error:', error)
    return null
  }
  
  return data.signedUrl
}
