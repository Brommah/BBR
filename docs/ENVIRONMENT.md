# Environment Variables Guide

Complete reference for all environment variables used in the Broersma Bouwadvies Backoffice.

---

## 🔐 Required Variables

These must be set for the application to function:

### Database

```env
# PostgreSQL connection string (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Direct connection for migrations (bypasses connection pooler)
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

**Where to find:** Supabase Dashboard → Settings → Database → Connection string

### Authentication (Supabase)

```env
# Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co

# Supabase anonymous key (safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Where to find:** Supabase Dashboard → Settings → API

---

## 📧 Email Configuration

### Resend (Transactional Emails)

```env
# Resend API key for sending emails
RESEND_API_KEY=re_xxxxxxxxxxxxx

# From email address (must be verified in Resend)
FROM_EMAIL=noreply@broersma-bouwadvies.nl

# Reply-to email address
REPLY_TO_EMAIL=info@broersma-bouwadvies.nl

# Webhook secret for email tracking (opens, clicks, bounces)
# Get this from Resend Dashboard → Webhooks → Signing Secret
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Setup:** 
1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Get API key from dashboard

**Webhook Setup (for email tracking):**
1. Go to [resend.com/webhooks](https://resend.com/webhooks)
2. Click "Add Webhook"
3. Enter URL: `https://your-domain.com/api/webhooks/resend`
4. Select events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
5. Copy the "Signing Secret" and add it as `RESEND_WEBHOOK_SECRET`

---

## 📊 Error Tracking (Sentry)

```env
# Sentry DSN for error tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456

# Sentry organization slug
SENTRY_ORG=broersma-bouwadvies

# Sentry project slug
SENTRY_PROJECT=backoffice

# Sentry auth token (for source map uploads)
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxx
```

**Setup:**
1. Create project at [sentry.io](https://sentry.io)
2. Get DSN from Project Settings → Client Keys
3. Create auth token: Settings → Auth Tokens

---

## 📝 Optional Integrations

### Notion (Roadmap Sync)

```env
# Notion API key
NOTION_API_KEY=ntn_xxxxxxxxxxxxx

# Enable/disable Notion sync
NEXT_PUBLIC_ENABLE_NOTION_SYNC=true
```

### WhatsApp Integration

```env
# Enable WhatsApp messaging
NEXT_PUBLIC_ENABLE_WHATSAPP=true
```

### Google Places API (Address Autocomplete)

```env
# Google Places API key for address autocomplete
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSy...
```

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Places API** and **Maps JavaScript API**
4. Create credentials → API Key
5. Restrict the key:
   - Application restrictions: HTTP referrers
   - Add `localhost:*` for development
   - Add your production domain
   - API restrictions: Places API, Maps JavaScript API

---

## 🏢 Company Configuration

```env
# Company branding (used in emails, PDFs, UI)
NEXT_PUBLIC_COMPANY_NAME=Broersma Bouwadvies
NEXT_PUBLIC_COMPANY_LEGAL_NAME=Broersma Bouwadvies B.V.
NEXT_PUBLIC_COMPANY_EMAIL=info@broersma-bouwadvies.nl
NEXT_PUBLIC_COMPANY_WEBSITE=https://broersma-bouwadvies.nl
NEXT_PUBLIC_COMPANY_PHONE=+31 20 123 4567
NEXT_PUBLIC_COMPANY_KVK=12345678
NEXT_PUBLIC_COMPANY_BTW=NL123456789B01
```

---

## 🔧 Development vs Production

### Development (.env.local)

```env
NODE_ENV=development

# Use Supabase local or test project
NEXT_PUBLIC_SUPABASE_URL=https://[TEST-PROJECT].supabase.co

# Disable Sentry in dev
# NEXT_PUBLIC_SENTRY_DSN= (leave empty)

# Use Resend test domain
FROM_EMAIL=onboarding@resend.dev
```

### Production (.env.production)

```env
NODE_ENV=production

# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROD-PROJECT].supabase.co

# Enable Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Verified production domain
FROM_EMAIL=noreply@broersma-bouwadvies.nl
```

---

## 🚀 Deployment Platforms

### Vercel

Add variables in: Project Settings → Environment Variables

```bash
# Or via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add DATABASE_URL --sensitive
```

### Railway

Add in: Project → Variables

### Docker

```dockerfile
ENV NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
ENV DATABASE_URL=postgresql://...
```

Or use docker-compose:

```yaml
services:
  app:
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - DATABASE_URL=${DATABASE_URL}
```

---

## ✅ Validation Checklist

Before deploying, verify:

- [ ] `DATABASE_URL` connects successfully (`npm run db:push`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is accessible
- [ ] Supabase users exist with correct roles
- [ ] `RESEND_API_KEY` is valid (test with API)
- [ ] Email domain is verified in Resend
- [ ] `RESEND_WEBHOOK_SECRET` is configured (for email tracking)
- [ ] Webhook URL is registered in Resend Dashboard
- [ ] `NEXT_PUBLIC_SENTRY_DSN` receives test errors

---

## 🔒 Security Notes

1. **Never commit `.env` files** to git
2. **Use `.env.example`** with placeholder values for documentation
3. **Rotate secrets** if accidentally exposed
4. **Use different values** for development and production
5. **Limit API key permissions** where possible

---

## 📋 Complete .env.example

```env
# ===========================================
# Database (Required)
# ===========================================
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# ===========================================
# Supabase Auth (Required)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ===========================================
# Email - Resend (Required for emails)
# ===========================================
RESEND_API_KEY=re_your_key
FROM_EMAIL=noreply@your-domain.com
REPLY_TO_EMAIL=info@your-domain.com

# Webhook secret for email tracking (opens, clicks, bounces)
# Get from Resend Dashboard → Webhooks → Signing Secret
RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret

# ===========================================
# Error Tracking - Sentry (Recommended)
# ===========================================
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_xxx

# ===========================================
# Company Branding (Optional)
# ===========================================
NEXT_PUBLIC_COMPANY_NAME=Your Company
NEXT_PUBLIC_COMPANY_EMAIL=info@company.com

# ===========================================
# Feature Flags (Optional)
# ===========================================
NEXT_PUBLIC_ENABLE_NOTION_SYNC=false
NEXT_PUBLIC_ENABLE_WHATSAPP=false

# ===========================================
# Google Places API (Address Autocomplete)
# ===========================================
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your-google-api-key

# ===========================================
# Environment
# ===========================================
NODE_ENV=development
```
