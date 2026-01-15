/**
 * Setup Supabase Storage bucket for documents
 * Run with: npx tsx scripts/setup-storage.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const BUCKET_NAME = 'documents'

async function setupStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables:')
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    if (!serviceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  console.log('🔧 Setting up Supabase Storage...')
  console.log(`   URL: ${supabaseUrl}`)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })

  // Check if bucket exists
  console.log(`\n📦 Checking for "${BUCKET_NAME}" bucket...`)
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message)
    process.exit(1)
  }

  const existingBucket = buckets?.find(b => b.name === BUCKET_NAME)
  
  if (existingBucket) {
    console.log(`✅ Bucket "${BUCKET_NAME}" already exists`)
    console.log(`   Public: ${existingBucket.public}`)
    
    // Make sure it's public
    if (!existingBucket.public) {
      console.log('   Making bucket public...')
      const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
        public: true
      })
      
      if (updateError) {
        console.error('❌ Error making bucket public:', updateError.message)
      } else {
        console.log('✅ Bucket is now public')
      }
    }
  } else {
    console.log(`   Bucket not found. Creating...`)
    
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'image/*',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/octet-stream'
      ]
    })
    
    if (createError) {
      console.error('❌ Error creating bucket:', createError.message)
      process.exit(1)
    }
    
    console.log(`✅ Bucket "${BUCKET_NAME}" created successfully`)
  }

  // Test upload
  console.log('\n🧪 Testing upload...')
  const testFile = Buffer.from('test')
  const testPath = `_test/${Date.now()}.txt`
  
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(testPath, testFile, {
      contentType: 'text/plain',
      upsert: true
    })
  
  if (uploadError) {
    console.error('❌ Test upload failed:', uploadError.message)
    console.log('\n💡 You may need to configure RLS policies in Supabase Dashboard:')
    console.log('   1. Go to Storage > Policies')
    console.log('   2. Create a policy for the "documents" bucket')
    console.log('   3. Allow public read access')
    process.exit(1)
  }
  
  // Clean up test file
  await supabase.storage.from(BUCKET_NAME).remove([testPath])
  
  console.log('✅ Test upload successful!')
  console.log('\n✨ Storage is ready to use!')
}

setupStorage().catch(console.error)
