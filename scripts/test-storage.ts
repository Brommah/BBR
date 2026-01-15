/**
 * Diagnostic script to test Supabase storage connectivity
 * Run with: npx tsx scripts/test-storage.ts
 */

import { createClient } from '@supabase/supabase-js'

const BUCKET_NAME = 'documents'

async function testStorage() {
  console.log('\n=== Supabase Storage Diagnostic ===\n')

  // 1. Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('1. Environment Variables:')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set (will bypass RLS)' : '⚠️ Missing - uploads will fail without RLS policies'}`)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ Cannot proceed: Missing required Supabase credentials')
    console.log('\nTo fix:')
    console.log('1. Create a Supabase project at https://supabase.com')
    console.log('2. Get your API keys from: Project Settings > API')
    console.log('3. Add to .env file:')
    console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
    return
  }

  // Use service role key if available (bypasses RLS), otherwise use anon key
  const useServiceRole = !!supabaseServiceKey
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  
  console.log(`   Using: ${useServiceRole ? 'Service Role Key (bypasses RLS)' : 'Anon Key (subject to RLS)'}`)

  // 2. Test basic connection
  console.log('\n2. Testing Connection:')
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.log(`   Auth check: ⚠️ ${error.message}`)
    } else {
      console.log(`   Auth check: ✅ Connected (session: ${data.session ? 'active' : 'none'})`)
    }
  } catch (err) {
    console.log(`   Auth check: ❌ ${err}`)
  }

  // 3. Try to list buckets (this requires admin)
  console.log('\n3. Storage Buckets:')
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    if (error) {
      console.log(`   List buckets: ⚠️ ${error.message}`)
      console.log('   (This is expected with anon key - requires service role)')
    } else {
      console.log(`   List buckets: ✅ Found ${buckets?.length || 0} bucket(s)`)
      buckets?.forEach(b => {
        console.log(`     - ${b.name} (public: ${b.public})`)
      })
      
      const hasDocumentsBucket = buckets?.some(b => b.name === BUCKET_NAME)
      if (!hasDocumentsBucket) {
        console.log(`\n   ⚠️ Bucket '${BUCKET_NAME}' not found!`)
        console.log('   Create it in Supabase Dashboard > Storage')
      }
    }
  } catch (err) {
    console.log(`   List buckets: ❌ ${err}`)
  }

  // 4. Try to list files in bucket (works with anon key if bucket is public)
  console.log('\n4. Testing Bucket Access:')
  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 5 })
    
    if (error) {
      console.log(`   List files in '${BUCKET_NAME}': ❌ ${error.message}`)
      
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log(`\n   🔧 FIX REQUIRED: Create the '${BUCKET_NAME}' bucket`)
        console.log('   Steps:')
        console.log('   1. Go to Supabase Dashboard')
        console.log('   2. Navigate to Storage')
        console.log('   3. Click "New Bucket"')
        console.log(`   4. Name it "${BUCKET_NAME}"`)
        console.log('   5. Enable "Public bucket" if you want public file access')
      } else if (error.message.includes('permission') || error.message.includes('policy')) {
        console.log('\n   🔧 FIX REQUIRED: Add RLS policies for the bucket')
        console.log('   Steps:')
        console.log('   1. Go to Supabase Dashboard > Storage')
        console.log('   2. Click on the bucket > Policies')
        console.log('   3. Add policies for INSERT, SELECT, DELETE')
      }
    } else {
      console.log(`   List files in '${BUCKET_NAME}': ✅ Success (${files?.length || 0} files)`)
      files?.forEach(f => console.log(`     - ${f.name}`))
    }
  } catch (err) {
    console.log(`   List files: ❌ ${err}`)
  }

  // 5. Try a test upload
  console.log('\n5. Testing Upload:')
  try {
    const testContent = Buffer.from('test file content ' + Date.now())
    const testPath = `_test/test-${Date.now()}.txt`
    
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: false
      })
    
    if (uploadError) {
      console.log(`   Test upload: ❌ ${uploadError.message}`)
      
      if (uploadError.message.includes('policy')) {
        console.log('\n   🔧 FIX: Add INSERT policy for authenticated users')
        console.log('   SQL to run in Supabase SQL Editor:')
        console.log(`
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = '${BUCKET_NAME}');
        `)
      }
    } else {
      console.log(`   Test upload: ✅ Success`)
      
      // Clean up test file
      await supabase.storage.from(BUCKET_NAME).remove([testPath])
      console.log(`   Cleanup: ✅ Test file removed`)
    }
  } catch (err) {
    console.log(`   Test upload: ❌ ${err}`)
  }

  // 6. Get public URL format
  console.log('\n6. Public URL Format:')
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl('example/file.pdf')
  console.log(`   ${urlData.publicUrl}`)

  console.log('\n=== Diagnostic Complete ===\n')
}

// Load env and run
import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

testStorage().catch(console.error)
