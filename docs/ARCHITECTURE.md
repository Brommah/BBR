# Architecture Overview

Technical architecture documentation for the Broersma Bouwadvies Backoffice.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  React 19 + Next.js 16 App Router                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Zustand  │ │ React    │ │ Shadcn   │ │ Tailwind │           │
│  │ Store    │ │ Query    │ │ UI       │ │ CSS      │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP / Server Actions
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Next.js)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ API Routes   │  │ Server       │  │ Middleware   │          │
│  │ /api/*       │  │ Actions      │  │ (Auth/CSRF)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │   Prisma ORM      │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│  Supabase    │   Resend     │   Sentry     │   Notion          │
│  (Auth + DB) │   (Email)    │   (Errors)   │   (Roadmap)       │
└──────────────┴──────────────┴──────────────┴───────────────────┘
```

---

## 📁 Directory Structure

```
broersma-backoffice/
│
├── app/                          # Next.js App Router
│   ├── (routes)/                 # Page routes
│   │   ├── admin/               # Admin panel
│   │   ├── inbox/               # New leads inbox
│   │   ├── leads/[id]/          # Lead detail page
│   │   ├── pipeline/            # Kanban board
│   │   └── ...
│   ├── api/                      # API routes
│   │   └── intake/              # Public intake endpoint
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Dashboard
│
├── components/
│   ├── admin/                    # Admin-specific components
│   ├── auth/                     # Authentication components
│   │   ├── access-guard.tsx     # Route protection
│   │   └── login-form.tsx       # Login UI
│   ├── dashboard/               # Dashboard widgets
│   ├── engineer-view/           # Engineer dashboard
│   ├── lead-detail/             # Lead detail panels
│   │   ├── activity-panel.tsx
│   │   ├── context-panel.tsx
│   │   ├── quote-panel.tsx
│   │   └── ...
│   ├── pipeline/                # Kanban components
│   │   ├── kanban-column.tsx
│   │   ├── lead-card.tsx
│   │   └── pipeline-view.tsx
│   ├── templates/               # Email/PDF templates
│   └── ui/                      # Shadcn UI components
│
├── lib/
│   ├── auth.ts                  # Auth Zustand store
│   ├── store.ts                 # Lead Zustand store
│   ├── db-actions.ts            # Server actions (database)
│   ├── db.ts                    # Prisma client
│   ├── config.ts                # App configuration
│   ├── email.ts                 # Email sending
│   ├── incentives.ts            # Incentive calculations
│   └── supabase.ts              # Supabase client
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
│
├── tests/                       # Test files
│   ├── lib/                     # Unit tests
│   ├── api/                     # API tests
│   └── setup.ts                 # Test configuration
│
├── e2e/                         # Playwright E2E tests
│
└── docs/                        # Documentation
```

---

## 🔄 Data Flow

### 1. Lead Creation (Public Intake)

```
User submits form
       │
       ▼
POST /api/intake
       │
       ├── Validate input
       ├── Check rate limit
       ├── Create Lead in DB
       ├── Log Activity
       ├── Send confirmation email
       │
       ▼
Response: { success: true, leadId }
```

### 2. Lead Status Update (Kanban Drag)

```
User drags card
       │
       ▼
Zustand: Optimistic update (instant UI)
       │
       ▼
Server Action: updateLeadStatus()
       │
       ├── Validate permissions
       ├── Update database
       ├── Log activity
       │
       ▼
Success? Keep state : Rollback
```

### 3. Quote Approval Flow

```
Engineer creates quote
       │
       ▼
submitQuoteForApproval()
       │
       ▼
Lead.quoteApproval = 'pending'
       │
       ▼
Admin sees in approval queue
       │
       ├── approveQuote()
       │   └── Status → 'Offerte Verzonden'
       │
       └── rejectQuote(feedback)
           └── Status unchanged, feedback added
```

---

## 🗃️ Database Schema

### Core Models

```prisma
model Lead {
  id              String   @id @default(cuid())
  clientName      String
  clientEmail     String?
  clientPhone     String?
  projectType     String
  city            String
  address         String?
  status          LeadStatus @default(Nieuw)
  value           Float    @default(0)
  assignee        String?
  
  // Quote fields
  quoteApproval   QuoteApprovalStatus @default(none)
  quoteValue      Float?
  quoteLineItems  Json?
  quoteFeedback   Json?
  
  // Soft delete
  deletedAt       DateTime?
  
  // Relations
  specifications  ProjectSpec[]
  notes           Note[]
  activities      Activity[]
  documents       Document[]
  communications  Communication[]
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  role      String   @default("viewer")  // admin | engineer | viewer
  avatar    String?
}
```

### Status Enums

```prisma
enum LeadStatus {
  Nieuw
  Calculatie
  OfferteVerzonden
  Opdracht
  Archief
}

enum QuoteApprovalStatus {
  none
  pending
  approved
  rejected
}
```

---

## 🔐 Authentication & Authorization

### Auth Flow

```
1. User enters credentials
       │
       ▼
2. Supabase Auth validates
       │
       ▼
3. Get user from database (role)
       │
       ▼
4. Store in Zustand (persisted)
       │
       ▼
5. AccessGuard checks permissions
```

### Role Permissions

```typescript
const ROLE_PERMISSIONS = {
  admin: [
    'admin:access',
    'leads:create', 'leads:read', 'leads:update', 'leads:delete',
    'quotes:approve', 'quotes:reject',
    'users:manage',
    'settings:manage',
  ],
  engineer: [
    'leads:read', 'leads:update',
    'quotes:create', 'quotes:submit',
    'notes:create',
  ],
  viewer: [
    'leads:read',
  ],
}
```

### Protected Routes

```typescript
// Middleware checks Supabase session cookie
// AccessGuard component checks specific permissions

<AccessGuard permission="admin:access">
  <AdminPanel />
</AccessGuard>

<AccessGuard roles={['admin', 'engineer']}>
  <QuoteEditor />
</AccessGuard>
```

---

## 🚀 State Management

### Zustand Stores

#### Auth Store (`lib/auth.ts`)

```typescript
interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email, password) => Promise<boolean>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  hasPermission: (permission) => boolean
}
```

#### Lead Store (`lib/store.ts`)

```typescript
interface LeadState {
  leads: Lead[]
  isLoading: boolean
  error: string | null
  
  loadLeads: () => Promise<void>
  updateLeadStatus: (id, status) => Promise<boolean>
  assignLead: (id, assignee) => Promise<boolean>
  submitQuoteForApproval: (id, submission) => Promise<boolean>
  approveQuote: (id, feedback?, adjustedValue?) => Promise<boolean>
  rejectQuote: (id, feedback) => Promise<boolean>
}
```

### Optimistic Updates Pattern

```typescript
updateLeadStatus: async (id, status) => {
  const previousLeads = get().leads
  
  // 1. Optimistic update (instant UI)
  set(state => ({
    leads: state.leads.map(l => 
      l.id === id ? { ...l, status } : l
    )
  }))
  
  try {
    // 2. Server action
    const result = await updateLeadStatusAction(id, status)
    
    if (!result.success) {
      // 3. Rollback on failure
      set({ leads: previousLeads })
      toast.error('Update failed')
      return false
    }
    
    return true
  } catch {
    // 3. Rollback on error
    set({ leads: previousLeads })
    return false
  }
}
```

---

## 📧 Email System

### Template Structure

```typescript
// lib/email.ts
export async function sendQuoteEmail(data: {
  to: string
  clientName: string
  projectType: string
  quoteValue: number
  leadId: string
  sentBy: string
}): Promise<EmailResult> {
  const subject = `Offerte constructieve berekening - ${data.projectType}`
  const body = generateQuoteEmailBody(data)
  
  return sendEmail({
    to: data.to,
    subject,
    body,
    leadId: data.leadId,
    sentBy: data.sentBy
  })
}
```

### Email Logging

All emails are logged to `EmailLog` table with:
- Recipient
- Subject/body
- Status (sent/delivered/failed/bounced)
- Error message if failed
- Associated lead ID

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

```
tests/lib/
├── auth.test.ts       # Auth store logic
├── store.test.ts      # Lead store logic
├── config.test.ts     # Configuration
└── db-actions.test.ts # Server actions
```

### E2E Tests (Playwright)

```
e2e/
├── auth.spec.ts       # Login flows
├── intake.spec.ts     # Public intake form
├── pipeline.spec.ts   # Kanban board
├── api.spec.ts        # API endpoints
└── navigation.spec.ts # Page navigation
```

### Test Commands

```bash
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage
npm run test:e2e       # E2E tests
npm run validate       # All checks
```

---

## 🔒 Security Measures

| Layer | Measure |
|-------|---------|
| **Transport** | HTTPS only, HSTS headers |
| **Auth** | Supabase JWT, session cookies |
| **CSRF** | Token in middleware |
| **XSS** | React escaping, CSP headers |
| **SQL Injection** | Prisma ORM (parameterized) |
| **Rate Limiting** | Per-IP limits on public endpoints |
| **Audit** | All mutations logged |
| **Secrets** | Environment variables only |

---

## 📊 Performance Considerations

1. **Database**
   - Indexed queries via Prisma
   - Pagination for large datasets
   - Connection pooling via Supabase

2. **Frontend**
   - Code splitting per route
   - Optimistic updates (no loading spinners)
   - Image optimization via next/image

3. **Caching**
   - React Query for data fetching
   - Zustand persistence for auth state

---

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables set
- [ ] Database migrated (`npm run db:push`)
- [ ] Users created in Supabase
- [ ] Email domain verified in Resend
- [ ] Sentry project configured
- [ ] SSL certificate active

### Recommended Platforms

| Platform | Use Case |
|----------|----------|
| **Vercel** | Best for Next.js |
| **Railway** | Simple PaaS |
| **AWS Amplify** | Enterprise |
| **Docker** | Self-hosted |
