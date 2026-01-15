import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Not set')
console.log('Service Role Key:', serviceRoleKey ? '✅ Set' : '❌ Not set')
console.log('Anon Key:', anonKey ? '✅ Set' : '❌ Not set')

if (!supabaseUrl) {
  console.log('\n❌ Cannot check storage - NEXT_PUBLIC_SUPABASE_URL not set')
  process.exit(1)
}

const key = serviceRoleKey || anonKey
if (!key) {
  console.log('\n❌ Cannot check storage - no API key available')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, key, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function checkStorage() {
  console.log('\n--- Checking Storage Buckets ---')
  
  // Try to list buckets (requires service role)
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  
  if (bucketsError) {
    console.log('❌ Cannot list buckets:', bucketsError.message)
    console.log('   (This may require service_role key)')
  } else {
    console.log('Buckets found:', buckets?.length || 0)
    buckets?.forEach(b => console.log(`  - ${b.name} (public: ${b.public})`))
  }
  
  // Check if 'documents' bucket exists by trying to list files
  console.log('\n--- Checking "documents" bucket ---')
  const { data: files, error: filesError } = await supabase.storage
    .from('documents')
    .list('', { limit: 5 })
  
  if (filesError) {
    console.log('❌ Cannot access "documents" bucket:', filesError.message)
    console.log('\n💡 You need to create the bucket in Supabase:')
    console.log('   1. Go to Supabase Dashboard')
    console.log('   2. Navigate to Storage')
    console.log('   3. Create a new bucket named "documents"')
    console.log('   4. Make it public if you want direct file access')
  } else {
    console.log('✅ "documents" bucket exists!')
    console.log('   Files in root:', files?.length || 0)
    files?.slice(0, 3).forEach(f => console.log(`     - ${f.name}`))
  }
}

checkStorage().catch(console.error)
