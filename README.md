# 🏗️ Broersma Bouwadvies Backoffice

Productie-klaar backofficemanagementsysteem voor constructieadvies met Supabase Auth en PostgreSQL.

## 📋 Inhoudsopgave

- [Tech Stack](#-tech-stack)
- [Installatie](#-installatie)
- [Database Commando's](#-database-commandos)
- [Architectuur](#-architectuur)
- [Functionaliteiten](#-functionaliteiten)
- [Projectstructuur](#-projectstructuur)
- [Beveiliging](#-beveiliging)
- [Licentie](#-licentie)

## 🛠️ Tech Stack

| Categorie | Technologie |
|-----------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **Backend** | Supabase (Auth + Postgres) |
| **Database** | Prisma ORM |
| **State Management** | Zustand met database-synchronisatie |
| **UI Componenten** | Radix UI + Shadcn |

## 🚀 Installatie

### 1. Kloon en installeer afhankelijkheden

```bash
git clone https://github.com/Brommah/BBR.git
cd BBR
npm install
```

### 2. Configureer omgevingsvariabelen

Maak een `.env.local` bestand aan met je Supabase-gegevens:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://puxthqumkuvspzpukouy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key

# Database (verkrijg via Supabase Dashboard > Settings > Database)
DATABASE_URL=postgresql://postgres:[wachtwoord]@db.puxthqumkuvspzpukouy.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[wachtwoord]@db.puxthqumkuvspzpukouy.supabase.co:5432/postgres

# Omgeving
NODE_ENV=development
```

### 3. Initialiseer de database

```bash
npm run db:push    # Synchroniseer schema naar database
npm run db:seed    # Vul met testgegevens
```

### 4. Maak gebruikers aan in Supabase

Ga naar [Supabase Dashboard](https://supabase.com/dashboard) > Authentication > Users en maak gebruikers aan:

| E-mail | Rol | user_metadata |
|--------|-----|---------------|
| mart@broersma-bouwadvies.nl | admin | `{"name": "Mart Broersma", "role": "admin"}` |
| angelo@broersma-bouwadvies.nl | engineer | `{"name": "Angelo", "role": "engineer"}` |
| venka@broersma-bouwadvies.nl | engineer | `{"name": "Venka", "role": "engineer"}` |
| roina@broersma-bouwadvies.nl | engineer | `{"name": "Roina", "role": "engineer"}` |

### 5. Start de ontwikkelserver

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## 📦 Database Commando's

| Commando | Beschrijving |
|----------|-------------|
| `npm run db:studio` | Open Prisma Studio (visuele database-editor) |
| `npm run db:push` | Synchroniseer schema naar database |
| `npm run db:migrate` | Maak een nieuwe migratie aan |
| `npm run db:seed` | Vul database met testgegevens |
| `npm run db:generate` | Genereer Prisma client |

## 🏛️ Architectuur

### State Management

- **Zustand store** met optimistische updates
- **Server actions** voor alle mutaties
- **Automatische rollback** bij fouten
- **Laadstatussen** door de hele applicatie

### Authenticatie

- **Supabase Auth** met e-mail/wachtwoord
- **Rolgebaseerde toegangscontrole** (admin, engineer, viewer)
- **Beveiligde routes** met AccessGuard component
- **Sessiebehoud** bij pagina-verversingen

### Database

- **PostgreSQL** via Supabase
- **Prisma ORM** met volledige type-veiligheid
- **Complete CRUD** voor leads, offertes, notities, kostentarieven
- **Activiteitenlog** voor audit trail

## ✨ Functionaliteiten

### Leadbeheer
- 📊 Kanban-bord met drag-and-drop
- 📋 Gedetailleerde leadweergave met specificaties
- 👥 Toewijzing aan engineers
- 🔄 Statusworkflow-tracking

### Offertesysteem
- 📝 Aangepaste offertebouwer met regelitems
- ✅ Goedkeuringsworkflow voor beheerders
- 💬 Feedbacksysteem voor afwijzingen
- 📄 PDF-preview en -generatie

### Beheerderspaneel
- 📋 Wachtrij voor offertegoedkeuringen
- 💰 Beheer van kostentarieven
- 🔐 Gebruikersrechten en -machtigingen
- 📧 Overzicht e-mailautomatiseringen

### Engineer Dashboard
- 📈 Prestatie-overzicht
- 🏆 Incentive-dashboard
- 📅 Resource-kalender
- 📊 Werkbelastinggrafieken

### Marketing
- 🎨 Marketingmaterialen beheer
- 📧 E-mailsjablonen
- 📊 NPS-dashboard voor feedback

## 📁 Projectstructuur

```
├── app/                    # Next.js app router pagina's
│   ├── admin/             # Beheerderspaneel
│   ├── inbox/             # Nieuwe leads inbox
│   ├── leads/[id]/        # Lead detailweergave
│   ├── pipeline/          # Kanban-bord
│   ├── incentives/        # Incentive-overzicht
│   ├── marketing-preview/ # Marketing materialen
│   ├── templates/         # Documentsjablonen
│   └── login/             # Authenticatie
├── components/
│   ├── admin/             # Beheerder-specifieke componenten
│   ├── auth/              # Authenticatie componenten
│   ├── dashboard/         # Dashboard widgets
│   ├── engineer-view/     # Engineer dashboard
│   ├── feedback/          # Feedback componenten
│   ├── lead-detail/       # Lead detail panelen
│   ├── marketing/         # Marketing componenten
│   ├── pipeline/          # Kanban componenten
│   ├── templates/         # Sjabloon componenten
│   └── ui/                # Shadcn UI componenten
├── lib/
│   ├── auth.ts            # Supabase auth store
│   ├── store.ts           # Lead data store
│   ├── db-actions.ts      # Server actions
│   ├── supabase.ts        # Supabase client
│   ├── incentives.ts      # Incentive berekeningen
│   ├── notion.ts          # Notion integratie
│   └── db.ts              # Prisma client
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── tests/                 # Test bestanden
│   ├── lib/               # Unit tests
│   └── setup.ts           # Test configuratie
└── docs/                  # Documentatie
    ├── email-automations/ # E-mail flow specificaties
    └── growth-strategy/   # Bedrijfsstrategie documenten
```

## 🔒 Beveiliging

| Status | Maatregel |
|--------|-----------|
| ✅ | Geen hardcoded credentials |
| ✅ | Omgevingsvariabelen voor geheimen |
| ✅ | Inputvalidatie op alle server actions |
| ✅ | Rolgebaseerde toegangscontrole |
| ✅ | Sessie-gebaseerde authenticatie |
| ✅ | Beveiligde API-routes |

## 🧪 Testen

```bash
npm run test           # Start Vitest in watch mode
npm run test:run       # Voer tests eenmalig uit
npm run test:coverage  # Genereer coverage rapport
```

## 📧 E-mail Automatiseringen

Het systeem bevat uitgebreide e-mailautomatiseringen voor:

- Intakebevestigingen
- Engineer-toewijzingen
- Offerteverzendingen en -herinneringen
- Opdrachtbevestigingen
- Factuurverzendingen en betaalherinneringen
- Feedback- en NPS-verzoeken
- Reactivatiecampagnes

Zie `/docs/email-automations/` voor volledige documentatie.

## 📈 Groeistrategie

Strategische documentatie beschikbaar in `/docs/growth-strategy/`:

- Groeistrategie 2026
- Budget allocatie
- Marketing kanalen
- Conversie-optimalisatie
- Klantretentie en LTV
- Partnership strategieën
- Operationele schaling

## 🤝 Bijdragen

Dit is een privé-repository voor Broersma Bouwadvies. Neem contact op met het ontwikkelteam voor bijdrage-richtlijnen.

## 📄 Licentie

Privé - © 2026 Broersma Bouwadvies. Alle rechten voorbehouden.

---

Ontwikkeld met ❤️ voor Broersma Bouwadvies
