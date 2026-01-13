<div align="center">

# 🏗️ Broersma Bouwadvies Backoffice

**Het complete managementsysteem voor bouwadvies — van lead tot factuur.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## 🎯 Wat is dit?

Een volledig backoffice platform gebouwd voor **Broersma Bouwadvies** om het hele klanttraject te stroomlijnen:

| Van | Tot |
|-----|-----|
| 📥 Nieuwe aanvraag binnenkomt | 📊 Verschijnt in pipeline |
| 👷 Engineer wordt toegewezen | 📧 Klant ontvangt notificatie |
| 📝 Offerte wordt opgesteld | ✅ Admin keurt goed |
| 💰 Factuur wordt verstuurd | 📈 KPI's worden bijgewerkt |

> **Eén systeem, volledig overzicht.** Geen spreadsheets meer, geen gemiste follow-ups.

---

## ⚡ Snel Starten

```bash
# 1. Kloon & installeer
git clone https://github.com/Brommah/BBR.git && cd BBR && npm install

# 2. Configureer (kopieer .env.example naar .env.local en vul in)

# 3. Database setup
npm run db:push && npm run db:seed

# 4. Start!
npm run dev
```

**→ Open [localhost:3000](http://localhost:3000)** en log in.

---

## ✨ Kernfunctionaliteiten

<table>
<tr>
<td width="50%">

### 📊 Pipeline & Leads
- Visueel **Kanban-bord** met drag-and-drop
- Automatische **statustracking**
- **Toewijzing** aan engineers
- Volledige **klantgeschiedenis**

</td>
<td width="50%">

### 📝 Offertes & Goedkeuring
- Offertebouwer met **regelitems**
- **Admin goedkeuringsflow**
- **PDF generatie** met branding
- Feedback bij afwijzing

</td>
</tr>
<tr>
<td width="50%">

### 👥 Team & Prestaties
- **Engineer dashboards**
- Incentive & bonus tracking
- **Werkbelasting** overzicht
- Resource kalender

</td>
<td width="50%">

### 📧 Automatisering
- **15+ e-mail templates**
- Automatische herinneringen
- NPS & feedback surveys
- Reactivatie campagnes

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Laag | Technologie |
|------|-------------|
| **Frontend** | Next.js 16 · React 19 · TypeScript · Tailwind CSS |
| **Backend** | Supabase (Auth + PostgreSQL) |
| **ORM** | Prisma met type-safety |
| **State** | Zustand (client) + React Query (server) |
| **UI** | Radix UI + Shadcn componenten |
| **Testing** | Vitest (unit) + Playwright (e2e) |
| **Monitoring** | Sentry error tracking |
| **Email** | Resend transactional emails |

---

## 📋 Inhoudsopgave

- [Installatie](#-installatie)
- [Database Commando's](#-database-commandos)
- [Architectuur](#-architectuur)
- [Projectstructuur](#-projectstructuur)
- [Beveiliging](#-beveiliging)
- [Documentatie](#-documentatie)

---

## 🚀 Installatie

### 1. Repository klonen

```bash
git clone https://github.com/Brommah/BBR.git
cd BBR
npm install
```

### 2. Omgevingsvariabelen configureren

Maak `.env.local` aan in de root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://puxthqumkuvspzpukouy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key

# Database (Supabase Dashboard → Settings → Database)
DATABASE_URL=postgresql://postgres:[wachtwoord]@db.puxthqumkuvspzpukouy.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[wachtwoord]@db.puxthqumkuvspzpukouy.supabase.co:5432/postgres

# Notion (optioneel, voor roadmap sync)
NOTION_API_KEY=jouw-notion-key

# Omgeving
NODE_ENV=development
```

### 3. Database initialiseren

```bash
npm run db:push    # Schema naar database
npm run db:seed    # Testdata laden
```

### 4. Gebruikers aanmaken

Ga naar [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → Users:

| E-mail | Rol | Metadata |
|--------|-----|----------|
| `mart@broersma-bouwadvies.nl` | admin | `{"name": "Mart Broersma", "role": "admin"}` |
| `angelo@broersma-bouwadvies.nl` | engineer | `{"name": "Angelo", "role": "engineer"}` |
| `venka@broersma-bouwadvies.nl` | engineer | `{"name": "Venka", "role": "engineer"}` |
| `roina@broersma-bouwadvies.nl` | engineer | `{"name": "Roina", "role": "engineer"}` |

### 5. Ontwikkelserver starten

```bash
npm run dev
```

---

## 📦 Database Commando's

| Commando | Wat doet het? |
|----------|---------------|
| `npm run db:studio` | 🔍 Prisma Studio openen (visuele editor) |
| `npm run db:push` | ⬆️ Schema synchroniseren |
| `npm run db:migrate` | 📝 Migratie aanmaken |
| `npm run db:seed` | 🌱 Testdata laden |
| `npm run db:generate` | ⚙️ Prisma client regenereren |

---

## 🏛️ Architectuur

### State Management
- **Zustand store** met optimistische updates
- **Server actions** voor alle database-mutaties
- **Automatische rollback** bij fouten
- Real-time **laadstatussen**

### Authenticatie & Autorisatie
- **Supabase Auth** (e-mail/wachtwoord)
- **Drie rollen:** admin · engineer · viewer
- **AccessGuard** component voor route-beveiliging
- Persistente sessies

### Database
- **PostgreSQL** via Supabase
- **Prisma ORM** met 100% type-safety
- Complete CRUD voor leads, offertes, notities
- **Audit trail** voor alle wijzigingen

---

## 📁 Projectstructuur

```
broersma-backoffice/
├── app/                      # Next.js App Router
│   ├── admin/               # 🔐 Beheerderspaneel
│   ├── inbox/               # 📥 Nieuwe leads
│   ├── leads/[id]/          # 📋 Lead details
│   ├── pipeline/            # 📊 Kanban-bord
│   ├── incentives/          # 🏆 Incentives
│   ├── marketing-preview/   # 🎨 Marketing
│   └── templates/           # 📄 Sjablonen
│
├── components/
│   ├── admin/               # Admin-specifiek
│   ├── auth/                # Login & guards
│   ├── dashboard/           # KPI widgets
│   ├── engineer-view/       # Engineer tools
│   ├── lead-detail/         # Lead panelen
│   ├── pipeline/            # Kanban componenten
│   └── ui/                  # Shadcn UI
│
├── lib/
│   ├── auth.ts              # Auth store
│   ├── store.ts             # Data store
│   ├── db-actions.ts        # Server actions
│   └── supabase.ts          # Supabase client
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data
│
└── docs/                    # 📚 Documentatie
    ├── email-automations/   # E-mail specs
    └── growth-strategy/     # Strategie docs
```

---

## 🔒 Beveiliging

| ✅ | Maatregel |
|----|-----------|
| 🔑 | Geen hardcoded credentials |
| 🔐 | Environment variables voor secrets |
| ✔️ | Inputvalidatie op alle server actions |
| 👥 | Rolgebaseerde toegangscontrole |
| 🍪 | Sessie-gebaseerde authenticatie |
| 🛡️ | Beveiligde API-routes |

---

## 🧪 Testen

```bash
# Unit tests (Vitest)
npm run test           # Watch mode
npm run test:run       # Eenmalig
npm run test:coverage  # Met coverage rapport

# E2E tests (Playwright)
npm run test:e2e       # Alle e2e tests draaien
npm run test:e2e:ui    # Met Playwright UI

# Validatie (alle checks)
npm run validate       # Lint + TypeScript + Tests
```

### Test Coverage

| Type | Aantal Tests | Dekking |
|------|--------------|---------|
| Unit | 165+ | Auth, Store, Config, Utils, Email |
| E2E | 30+ | Auth, API, Navigation, Pipeline |
| Components | 25+ | AccessGuard, ErrorBoundary |

---

## 🔧 Alle NPM Scripts

```bash
# Development
npm run dev            # Ontwikkelserver starten
npm run build          # Productie build
npm run start          # Productie server

# Database
npm run db:push        # Schema pushen
npm run db:migrate     # Migratie maken
npm run db:seed        # Testdata laden
npm run db:studio      # Prisma Studio openen
npm run db:generate    # Client genereren

# Kwaliteit
npm run lint           # ESLint draaien
npm run lint:fix       # ESLint auto-fix
npm run typecheck      # TypeScript check
npm run validate       # Alle checks

# Testing
npm run test           # Unit tests (watch)
npm run test:run       # Unit tests (single)
npm run test:coverage  # Met coverage
npm run test:e2e       # E2E tests
```

---

## 📚 Documentatie

### 📧 E-mail Automatiseringen

Uitgebreide e-mailflows voor het hele klanttraject:

- Intakebevestigingen & engineer-toewijzingen
- Offerteverzendingen met herinneringen
- Opdrachtbevestigingen & facturen
- NPS surveys & feedback verzoeken
- Reactivatie campagnes

**→ Zie [`/docs/email-automations/`](./docs/email-automations/)**

### 📈 Groeistrategie 2026

Strategische planning en documentatie:

- Budget allocatie & marketing kanalen
- Conversie-optimalisatie
- Klantretentie & LTV analyse
- Partnership strategieën

**→ Zie [`/docs/growth-strategy/`](./docs/growth-strategy/)**

---

## 📄 Licentie

**Privé** — © 2026 Broersma Bouwadvies. Alle rechten voorbehouden.

---

<div align="center">

Gebouwd met 💛 voor Broersma Bouwadvies

**[🏠 Dashboard](http://localhost:3000)** · **[📊 Pipeline](http://localhost:3000/pipeline)** · **[🔐 Admin](http://localhost:3000/admin)**

</div>
