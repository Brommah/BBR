# API Documentation

Complete API reference for the Broersma Bouwadvies Backoffice.

---

## Base URL

```
Production: https://backoffice.broersma-bouwadvies.nl/api
Development: http://localhost:3000/api
```

---

## Authentication

All protected endpoints require a valid Supabase session cookie. The session is automatically handled by the middleware.

### Session Cookie
- **Name**: `sb-*-auth-token`
- **Type**: HTTP-only, Secure
- **Expires**: Configurable (default 1 week)

---

## Endpoints

### Public Endpoints

#### `GET /api/intake`

Health check and API information.

**Response**
```json
{
  "status": "ok",
  "message": "Intake API is running",
  "version": "2.0.0",
  "acceptedProjectTypes": [
    "Dakkapel",
    "Uitbouw",
    "Aanbouw",
    "Draagmuur verwijderen",
    "Kozijn vergroten",
    "Fundering herstel",
    "VvE constructie",
    "Overig"
  ],
  "rateLimit": {
    "maxRequests": 5,
    "windowMs": 3600000
  }
}
```

---

#### `POST /api/intake`

Create a new lead from the public intake form.

**Rate Limit**: 5 requests per hour per IP

**Request Body**
```typescript
{
  clientName: string      // Required, min 2 chars
  clientEmail: string     // Required, valid email
  clientPhone?: string    // Optional, Dutch phone format
  projectType: string     // Required, from acceptedProjectTypes
  city: string            // Required, min 2 chars
  address?: string        // Optional
  description?: string    // Optional, max 2000 chars
}
```

**Success Response (201)**
```json
{
  "success": true,
  "message": "Aanvraag succesvol ontvangen! We nemen binnen 1 werkdag contact met u op.",
  "leadId": "clxyz123...",
  "emailSent": true
}
```

**Error Responses**

| Status | Error |
|--------|-------|
| 400 | Validation errors |
| 429 | Rate limit exceeded |
| 500 | Server error |

**Validation Error (400)**
```json
{
  "error": "Validatie fout",
  "details": [
    "Naam is verplicht (minimaal 2 karakters)",
    "Geldig e-mailadres is verplicht"
  ]
}
```

**Rate Limit Error (429)**
```json
{
  "error": "Te veel aanvragen. Probeer het later opnieuw.",
  "retryAfter": 3600
}
```

**Headers**
```
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 2026-01-13T00:00:00.000Z
```

---

### Protected Endpoints

#### `POST /api/notion-sync`

Sync documentation to Notion (Admin only).

**Authentication**: Required (Admin role)

**Request Body**
```typescript
{
  // No body required, syncs all email automation docs
}
```

**Success Response (200)**
```json
{
  "success": true,
  "message": "5 documenten gesynchroniseerd naar Notion",
  "results": {
    "01-intake-bevestiging": true,
    "02-engineer-toegewezen": true,
    // ...
  }
}
```

**Error Response (403)**
```json
{
  "error": "Geen toegang. Admin rechten vereist."
}
```

---

## Server Actions

The application uses Next.js Server Actions for most mutations. These are not HTTP endpoints but RPC-style function calls.

### Lead Actions

#### `getLeads(params)`

Fetch paginated leads.

```typescript
interface PaginationParams {
  page?: number           // Default: 1
  pageSize?: number       // Default: 20, max: 100
  sortBy?: string         // Field to sort by
  sortOrder?: 'asc' | 'desc'
}

interface LeadFilters {
  status?: string[]       // Filter by status(es)
  assignee?: string       // Filter by assignee name
  projectType?: string    // Filter by project type
  city?: string           // Filter by city
  dateFrom?: string       // ISO date string
  dateTo?: string         // ISO date string
  search?: string         // Search in name, email, city
  includeDeleted?: boolean // Include soft-deleted
}
```

---

#### `updateLeadStatus(id, status)`

Update lead's pipeline status.

```typescript
type LeadStatus = 
  | "Nieuw" 
  | "Calculatie" 
  | "Offerte Verzonden" 
  | "Opdracht" 
  | "Archief"

// Returns
interface ActionResult<Lead> {
  success: boolean
  data?: Lead
  error?: string
}
```

---

#### `updateLeadAssignee(id, assignee)`

Assign lead to an engineer.

```typescript
// assignee: string - Name of the engineer
// Returns: ActionResult<Lead>
```

---

#### `submitQuoteForApproval(id, submission)`

Submit a quote for admin approval.

```typescript
interface QuoteSubmission {
  quoteValue: number
  quoteDescription?: string
  quoteLineItems?: QuoteLineItem[]
  quoteEstimatedHours?: number
}

interface QuoteLineItem {
  description: string
  amount: number
}
```

---

#### `approveQuote(id, feedback?, adjustedValue?)`

Approve a pending quote (Admin only).

```typescript
interface QuoteFeedback {
  authorId: string
  authorName: string
  message: string
}
```

---

#### `rejectQuote(id, feedback)`

Reject a pending quote with feedback (Admin only).

---

### Activity Actions

#### `createActivity(data)`

Log an activity for a lead.

```typescript
interface ActivityData {
  leadId: string
  type: 'status_change' | 'email_sent' | 'note_added' | 'quote_generated' | string
  content: string
  author?: string
  metadata?: Record<string, unknown>
}
```

---

### Email Actions

#### `sendIntakeConfirmation(data)`

Send confirmation email after intake.

```typescript
interface IntakeEmailData {
  to: string
  clientName: string
  projectType: string
  leadId: string
  sentBy: string
}
```

---

#### `sendQuoteEmail(data)`

Send quote to client.

```typescript
interface QuoteEmailData {
  to: string
  clientName: string
  projectType: string
  quoteValue: number
  validDays: number
  lineItems: QuoteLineItem[]
  leadId: string
  sentBy: string
}
```

---

## Error Handling

All server actions return a consistent result type:

```typescript
interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Not authorized for action |
| `RATE_LIMITED` | Too many requests |
| `SERVER_ERROR` | Internal server error |

---

## Data Models

### Lead

```typescript
interface Lead {
  id: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  projectType: string
  city: string
  address?: string
  status: LeadStatus
  value: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  assignee?: string
  addressValid: boolean
  
  // Quote data
  quoteApproval: QuoteApprovalStatus
  quoteValue?: number
  quoteDescription?: string
  quoteLineItems?: QuoteLineItem[]
  quoteEstimatedHours?: number
  quoteFeedback?: QuoteFeedbackItem[]
  
  // Relations
  specifications?: ProjectSpec[]
  notes?: Note[]
  activities?: Activity[]
  documents?: Document[]
  communications?: Communication[]
}
```

### User

```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'engineer' | 'viewer'
  avatar?: string
  createdAt: string
  deletedAt?: string
}
```

### QuoteFeedbackItem

```typescript
interface QuoteFeedbackItem {
  id: string
  authorId: string
  authorName: string
  message: string
  createdAt: string
  type: 'approval' | 'rejection' | 'comment'
}
```

---

## Webhooks (Future)

Planned webhook events for external integrations:

| Event | Payload |
|-------|---------|
| `lead.created` | Full lead object |
| `lead.status_changed` | Lead ID, old status, new status |
| `quote.approved` | Lead ID, quote value |
| `quote.rejected` | Lead ID, feedback |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/intake` | 5 requests | 1 hour |
| Server Actions | 60 requests | 1 minute |

Rate limit headers are included in responses:
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (on 429)

---

## Changelog

### v2.0.0 (2026-01-13)
- Added rate limiting
- Added audit logging
- Added quote approval workflow
- Added email templates

### v1.0.0 (Initial)
- Basic CRUD operations
- Lead management
- Authentication
