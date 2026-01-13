# 📚 Documentatie Bureau Broersma Backoffice

## Welkom

Deze map bevat alle documentatie voor Bureau Broersma:

### 🔧 Technical Documentation
- **[API.md](./API.md)** – Complete API reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** – System architecture & data flow
- **[ENVIRONMENT.md](./ENVIRONMENT.md)** – Environment variables guide

### 📧 Business Documentation
- **[Email Automations](./email-automations/)** – Alle geautomatiseerde e-mail flows
- **[Growth Strategy](./growth-strategy/)** – Complete groeistrategie met budget allocatie

---

## 📁 Mapstructuur

```
docs/
├── README.md (dit bestand)
├── API.md                    # API reference
├── ARCHITECTURE.md           # System architecture
├── ENVIRONMENT.md            # Environment variables
├── email-automations/
│   ├── README.md
│   ├── 00-overzicht-email-flows.md
│   ├── 01-intake-bevestiging.md
│   ├── 02-engineer-toegewezen.md
│   ├── 03-offerte-verzonden.md
│   ├── 04-offerte-herinnering-1.md
│   ├── 05-offerte-herinnering-2.md
│   ├── 06-opdracht-bevestiging.md
│   ├── 07-factuur-verzending.md
│   ├── 08-betaling-herinnering.md
│   ├── 09-oplevering-berekening.md
│   ├── 10-feedback-verzoek.md
│   ├── 11-nps-survey.md
│   ├── 12-referral-uitnodiging.md
│   ├── 13-reactivatie-oude-leads.md
│   ├── 14-seizoensgebonden-campagne.md
│   └── 15-interne-notificaties.md
└── growth-strategy/
    ├── README.md
    ├── 01-groeistrategie-2026.md
    ├── 02-budget-allocatie.md
    ├── 03-marketing-kanalen.md
    ├── 04-conversie-optimalisatie.md
    ├── 05-klantretentie-ltv.md
    ├── 06-partnerships.md
    └── 07-operationele-schaling.md
```

---

## 🔧 Technical Documentation

### For Developers

| Document | Description |
|----------|-------------|
| [API.md](./API.md) | Complete API reference with types, endpoints, and examples |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, data flow, state management |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | All environment variables with setup guide |

### Root-Level Docs

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview and quick start |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Development workflow and code style |

---

## 🚀 Quick Start

### For Developers

1. Read [ENVIRONMENT.md](./ENVIRONMENT.md) to set up your local environment
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
3. Check [API.md](./API.md) for endpoint details

### Email Automations

Start met het lezen van het [Email Automations Overzicht](./email-automations/00-overzicht-email-flows.md) voor een complete mapping van alle flows.

**Prioriteit implementatie:**
1. Intake bevestiging (direct waarde)
2. Offerte verzonden (conversie)
3. Opdracht bevestiging (onboarding)

### Growth Strategy

Start met de [Groeistrategie 2026](./growth-strategy/01-groeistrategie-2026.md) voor het master plan, gevolgd door de [Budget Allocatie](./growth-strategy/02-budget-allocatie.md) voor financiële planning.

---

## 📊 Samenvatting Investering

| Categorie | Jaarbudget |
|-----------|------------|
| Marketing | €72.000 |
| Technologie | €24.000 |
| Team | €72.000 |
| Operationeel | €12.000 |
| **Totaal** | **€180.000** |

**Verwachte omzetgroei: +120-360%**

---

## ⚙️ Technische Stack

| Functie | Tool |
|---------|------|
| Frontend | Next.js 16 + React 19 |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| State | Zustand |
| Auth | Supabase Auth |
| Email | Resend |
| Error Tracking | Sentry |
| Testing | Vitest + Playwright |

---

## 📞 Verantwoordelijkheden

| Document type | Eigenaar |
|---------------|----------|
| Email templates | Marketing |
| Growth strategy | Management |
| Budget | Finance |
| Technical docs | Development |
| Implementation | Development |

---

*Bureau Broersma Backoffice Documentation*
*Laatst bijgewerkt: januari 2026*
