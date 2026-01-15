# 📋 Changelog - 14 januari 2026

**Overzicht van alle wijzigingen sinds de laatste pull request**

Laatste commit in repo: `9a8e04b` - feat: implement complete email automation system

---

## 📊 Statistieken

| Metric | Waarde |
|--------|--------|
| Gewijzigde bestanden | 50 |
| Nieuwe bestanden | 24 |
| Regels toegevoegd | ~4,762 |
| Regels verwijderd | ~2,286 |
| Netto toevoegingen | ~2,476 |

---

## ✨ Nieuwe Features

### 1. Role-Based Dashboards
- **Admin Dashboard** (`components/dashboard/admin-dashboard.tsx`)
  - Horizontale tab-navigatie voor Dashboard/Instellingen categorieën
  - Goedkeuringen queue met inline preview
  - Tarieven beheer
  - Team & rechten configuratie
  - Email automatisering instellingen
  - Integraties panel (Notion sync)
  - Intake formulier link generator

- **Engineer Dashboard** (`components/dashboard/engineer-dashboard.tsx`)
  - Persoonlijk welkomstbericht met dagoverzicht
  - Overzicht van toegewezen projecten
  - **Nieuw: Time Entry Dialog** - Popup voor urenregistratie met:
    - Flexibele invoerformaten (1.5, 1:30, 90m, 2u)
    - Categorie selectie (Calculatie, Overleg, Administratie, Site bezoek, Overig)
    - Beschrijving veld voor werkzaamheden
  - Week-totaal uren per project
  - Quick-add knoppen per dag (Ma, Di, Wo, Do, Vr)

### 2. Notificatie Systeem
- **Database Model** (`prisma/schema.prisma`)
  - Nieuwe `Notification` tabel met velden:
    - userId, userName, type, title, message
    - leadId, leadName (optioneel)
    - fromUserId, fromUserName
    - read status, createdAt timestamp

- **Notifications Page** (`app/notifications/page.tsx`)
  - Real-time notificaties ophalen uit database
  - Markeren als gelezen (individueel/alles)
  - Verwijder functionaliteit
  - Refresh knop
  - Link naar gerelateerde leads

- **@Mention Systeem** (`components/ui/mention-input.tsx`)
  - MentionInput component voor notities
  - MentionText component voor weergave met highlighting
  - extractMentions utility functie
  - Autocomplete dropdown met teamleden

- **Sidebar Badge** (`components/app-sidebar.tsx`)
  - Real-time unread notification count
  - Polling elke 30 seconden
  - "Meldingen" menu item met @-icon

### 3. AI-Powered Lead Detail Panels
- **Document Classifier** (`components/lead-detail/document-classifier-panel.tsx`)
  - Automatische documenttype herkenning
  - Categorieën: Tekening, Foto, Offerte, Contract, etc.

- **Dimension Extractor** (`components/lead-detail/dimension-extractor-panel.tsx`)
  - Extract afmetingen uit documenten
  - Automatische parsing van maten

- **Checklist Validator** (`components/lead-detail/checklist-validator-panel.tsx`)
  - Controle op benodigde documenten per projecttype
  - Vereiste vs aanbevolen documenten
  - Missing document requests

- **Ground Investigation Panel** (`components/lead-detail/ground-investigation-panel.tsx`)
  - BRO (Basisregistratie Ondergrond) integratie
  - Grondonderzoek data ophalen
  - Relevant voor fundering projecten

- **Kadaster Panel** (`components/lead-detail/kadaster-panel.tsx`)
  - Kadaster data lookup
  - Perceelsinformatie
  - Eigendomsgegevens

### 4. Quote Panel Smart
- **Enhanced Quote Builder** (`components/lead-detail/quote-panel-smart.tsx`)
  - Inline preview in approval queue
  - Line items overzicht
  - Geschatte uren weergave
  - Totaal berekening (excl/incl BTW)
  - Engineer submit → Admin approve flow

### 5. Location & Context Improvements
- **Location Card** (`components/lead-detail/location-card.tsx`)
  - Compacte adresweergave
  - Map preview (indien coordinates beschikbaar)
  - Adresvalidatie indicator

- **Communication Panel** (`components/lead-detail/communication-panel.tsx`)
  - Unified communicatie log (notities + gesprekken + emails)
  - Quick actions: Bellen, E-mail
  - Filter tabs per type
  - @Mentions integratie

### 6. API Integrations
- **BRO API** (`lib/bro-api.ts`)
  - Basisregistratie Ondergrond koppeling
  - Grondonderzoek data ophalen

- **Kadaster API** (`lib/kadaster-api.ts`)
  - Perceelsinformatie ophalen
  - Eigendomsgegevens

- **Document Intelligence** (`lib/document-intelligence.ts`)
  - AI document classificatie
  - Dimensie extractie
  - Checklist validatie

- **Email Automation Actions** (`lib/email-automation-actions.ts`)
  - Server-side email trigger functies

### 7. Webhooks
- **Email Webhooks** (`app/api/webhooks/`)
  - Resend webhook handlers
  - Email delivery tracking
  - Open/click tracking

---

## 🔧 Verbeteringen

### Database Schema Updates (`prisma/schema.prisma`)
- **Lead Model Extensions:**
  - `priority` enum (normal, high, urgent)
  - `deadline` DateTime veld
  - Notification model toegevoegd
  - Indexes voor performance

### Permission System (`lib/auth.ts`)
- Engineers kunnen nu:
  - `quotes:submit` - Offertes indienen ter goedkeuring
  - `quotes:view` - Offerte details bekijken
- Admin blijft vereist voor:
  - `quotes:approve` / `quotes:reject`

### Notes Panel (`components/lead-detail/notes-panel.tsx`)
- **@Mentions Support:**
  - Autocomplete bij typen van @
  - Real-time notificatie creatie
  - Highlighted mentions in weergave
- **Admin Delete Functie:**
  - Alleen admins kunnen notities verwijderen
  - Audit trail bij verwijdering

### Quote Approval Queue (`components/admin/quote-approval-queue.tsx`)
- **Inline Preview Enhancement:**
  - Line items direct zichtbaar in queue
  - Geschatte uren weergave
  - Truncated justification
  - Totaal (excl. BTW) in collapsed view
  - Volledige details in expanded view

### Timeline Panel (`components/lead-detail/timeline-panel.tsx`)
- Verbeterde activity types
- Time logged entries
- Document upload events

### Pipeline View (`components/pipeline/pipeline-view.tsx`)
- Drag-and-drop verbeteringen
- Status tracking updates

### Storage (`lib/storage.ts`)
- Verbeterde file upload handling
- Error handling improvements

---

## 🗑️ Verwijderd

### Routes
- `/werkvoorraad` route en folder volledig verwijderd
- Engineers gebruiken nu `/` (home) voor hun werk queue
- `/leads/[id]` voor project details (unified voor admin/engineer)

### Admin Dashboard Simplificatie
- "Financieel" tab verwijderd uit admin dashboard
- "Team KPI" tab verwijderd uit admin dashboard
- Focus op Goedkeuringen als primaire dashboard functie

### Unused Imports
- Opgeschoonde imports in admin-dashboard.tsx
- Verwijderde unused components

---

## 📦 Dependencies

### Toegevoegd (`package.json`)
```json
{
  "@radix-ui/react-collapsible": "^1.x.x"
}
```

---

## 🧪 Test Updates

### E2E Tests
- `e2e/api.spec.ts` - API endpoint tests
- `e2e/dashboard.spec.ts` - Dashboard navigation
- `e2e/inbox.spec.ts` - Inbox functionaliteit
- `e2e/incentives.spec.ts` - Incentive systeem
- `e2e/intake.spec.ts` - Intake formulier
- `e2e/navigation.spec.ts` - App navigatie
- `e2e/pipeline.spec.ts` - Pipeline/Kanban
- `e2e/templates.spec.ts` - Template systeem

### Unit Tests
- `tests/lib/auth.test.ts` - Updated permission tests
  - Engineer quote submission permissions
  - Admin-only approval permissions

---

## 📄 Nieuwe Bestanden Overzicht

### Components (14 nieuwe)
```
components/dashboard/admin-dashboard.tsx
components/dashboard/engineer-dashboard.tsx
components/lead-detail/checklist-validator-panel.tsx
components/lead-detail/communication-panel.tsx
components/lead-detail/dimension-extractor-panel.tsx
components/lead-detail/document-classifier-panel.tsx
components/lead-detail/ground-investigation-panel.tsx
components/lead-detail/kadaster-panel.tsx
components/lead-detail/location-card.tsx
components/lead-detail/quote-panel-smart.tsx
components/ui/collapsible.tsx
components/ui/mention-input.tsx
```

### Libraries (5 nieuwe)
```
lib/bro-api.ts
lib/document-intelligence.ts
lib/email-automation-actions.ts
lib/kadaster-api.ts
lib/project-utils.ts
```

### Pages (1 nieuwe)
```
app/notifications/page.tsx
```

### API Routes (1 nieuwe folder)
```
app/api/webhooks/
```

### Scripts (3 nieuwe)
```
scripts/cleanup-leads.ts
scripts/create-dummy-lead.ts
scripts/test-storage.ts
```

### Documentation (1 nieuwe)
```
docs/fix-storage-uploads.md
```

---

## 🐛 Bug Fixes

1. **Admin Dashboard Tab Navigation**
   - Fixed: Financieel en Team KPI tabs waren niet klikbaar
   - Oplossing: Verwijderd negatieve margin overlap, tabs vereenvoudigd

2. **TypeScript Errors**
   - Fixed: Missing imports in various components
   - Fixed: Type mismatches in notification system

3. **Storage Upload Issues**
   - Verbeterde error handling
   - Gedocumenteerd in `docs/fix-storage-uploads.md`

---

## 📝 Database Actions Updates (`lib/db-actions.ts`)

### Nieuwe Functies
```typescript
// Notification CRUD
createNotification(data)
getNotifications(userName, options)
getUnreadNotificationCount(userName)
markNotificationRead(notificationId)
markAllNotificationsRead(userName)
deleteNotification(notificationId)
createMentionNotifications(noteContent, leadId, leadName, fromUserName, allUsers)

// Note Management
deleteNote(noteId, adminName)
```

---

## 🔄 Migration Notes

### Database
Run these commands after pull:
```bash
npx prisma generate  # Regenerate client
npx prisma db push   # Push schema changes
```

### New Environment Variables
Geen nieuwe environment variables vereist.

---

## 📅 Volgende Stappen (Suggesties)

1. [ ] Email templates testen met Resend webhooks
2. [ ] Kadaster API credentials configureren
3. [ ] BRO API authenticatie instellen
4. [ ] Performance testing voor notificatie polling
5. [ ] Mobile responsiveness review voor nieuwe dashboards

---

*Gegenereerd op: 14 januari 2026*
*Door: Claude AI Assistant*
