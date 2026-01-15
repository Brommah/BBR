# Fix: Document Uploads Not Appearing in Supabase Storage

## Problem
Documents uploaded via the UI are saved to the database but not to Supabase Storage.

## Root Cause
The `SUPABASE_SERVICE_ROLE_KEY` is not configured. Without this key, uploads fail due to Row Level Security (RLS) policies.

## Solution

### Option A: Add Service Role Key (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (NOT the anon key)
4. Add it to your `.env` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

5. Restart your dev server:
```bash
# Stop the current server (Ctrl+C) and run:
npm run dev
```

> ⚠️ **Security Note**: The service role key bypasses RLS. Never expose it to the client. The current implementation only uses it in server actions.

### Option B: Add RLS Policies (Alternative)

If you prefer not to use the service role key, add these policies in Supabase:

1. Go to **Storage** → **documents** bucket → **Policies**
2. Add the following policies:

**Allow uploads for authenticated users:**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

**Allow reading files:**
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

**Allow deleting own files:**
```sql
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

## Verification

After applying one of the solutions, run the diagnostic:

```bash
npx tsx scripts/test-storage.ts
```

Expected output with service role key:
```
5. Testing Upload:
   Test upload: ✅ Success
   Cleanup: ✅ Test file removed
```

## Need Help?

Check the storage configuration:
- Bucket name must be `documents`
- Bucket should be **public** for direct downloads
- Or use signed URLs for private access
