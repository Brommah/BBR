# 📧 Email Automation Overzicht

## Implementatie Status: ✅ VOLLEDIG GEÏMPLEMENTEERD

Alle email flows zijn nu geïmplementeerd en geïntegreerd in het systeem.

---

## Complete Flow Mapping

### Klant Journey E-mails

```
LEAD BINNENKOMST (Intake Form)
     │
     ├── ✅ 01. Intake Bevestiging ─────► Direct naar klant
     │
     └── ✅ 15a. Nieuwe Lead Alert ─────► Direct naar admins
     
ENGINEER TOEGEWEZEN
     │
     ├── ✅ 02a. Engineer Notificatie ──► Direct naar engineer
     │
     └── ✅ 02b. Klant Notificatie ─────► Direct naar klant

OFFERTE INGEDIEND (ter goedkeuring)
     │
     └── ✅ 15b. Offerte Pending ───────► Direct naar admins

OFFERTE GOEDGEKEURD → Status: Offerte Verzonden
     │
     └── ✅ 03. Offerte Email ──────────► Direct naar klant
     
OFFERTE AFGEKEURD
     │
     └── ✅ 15c. Afkeuring Notificatie ─► Direct naar engineer

OFFERTE VERZONDEN (geen respons)
     │
     ├── ✅ 04. Herinnering #1 ─────────► +4 dagen (cron)
     │
     └── ✅ 05. Herinnering #2 ─────────► +10 dagen (cron)

STATUS → OPDRACHT
     │
     └── ✅ 06. Opdracht Bevestiging ───► Direct naar klant

STATUS → ARCHIEF (Project voltooid)
     │
     └── ✅ 09. Oplevering Notificatie ─► Direct naar klant
           │
           ├── ✅ 10. Feedback Verzoek ─► +3 dagen (cron)
           │
           └── ✅ 11. NPS Survey ───────► +14 dagen (cron)

INACTIEVE LEADS (90+ dagen)
     │
     └── ✅ 13. Reactivatie Email ──────► Cron
```

---

## Trigger Mapping

### Directe Triggers (Event-based)

| Email | Trigger Functie | Locatie | Wanneer |
|-------|-----------------|---------|---------|
| ✅ Intake Bevestiging | `sendIntakeConfirmation()` | `app/api/intake/route.ts` | Na intake form submit |
| ✅ Nieuwe Lead Alert | `sendNewLeadNotification()` | `app/api/intake/route.ts` | Na intake form submit |
| ✅ Engineer Toegewezen | `triggerAssignmentEmails()` | `lib/db-actions.ts` | Bij assignee update |
| ✅ Offerte Pending | `sendQuotePendingApprovalNotification()` | `lib/db-actions.ts` | Quote submitted |
| ✅ Offerte Verzonden | `sendQuoteEmail()` | `lib/db-actions.ts` | Quote approved |
| ✅ Afkeuring Notificatie | `sendQuoteRejectedNotification()` | `lib/db-actions.ts` | Quote rejected |
| ✅ Opdracht Bevestiging | `triggerStatusChangeEmail()` | `lib/db-actions.ts` | Status → Opdracht |
| ✅ Oplevering Notificatie | `triggerStatusChangeEmail()` | `lib/db-actions.ts` | Status → Archief |

### Geplande Triggers (Cron-based)

| Email | Trigger Functie | Schedule | Database Check |
|-------|-----------------|----------|----------------|
| ✅ Herinnering #1 | `sendScheduledQuoteReminder()` | Daily 9:00 | `quoteSentAt` + 4 dagen |
| ✅ Herinnering #2 | `sendScheduledQuoteReminder()` | Daily 9:00 | `quoteSentAt` + 10 dagen |
| ✅ Feedback Verzoek | `sendScheduledFeedbackRequest()` | Daily 9:00 | `deliveryNotifSentAt` + 3 dagen |
| ✅ NPS Survey | `sendNpsSurvey()` | Daily 9:00 | `deliveryNotifSentAt` + 14 dagen |
| ✅ Reactivatie | `sendReactivationEmail()` | Daily 9:00 | `updatedAt` + 90 dagen |

---

## Tracking Velden in Database (Lead model)

```prisma
// Email automation tracking
quoteSentAt           DateTime?  // Offerte verstuurd naar klant
quoteReminder1SentAt  DateTime?  // Eerste herinnering
quoteReminder2SentAt  DateTime?  // Tweede herinnering
orderConfirmSentAt    DateTime?  // Opdracht bevestiging
deliveryNotifSentAt   DateTime?  // Oplevering notificatie
feedbackRequestSentAt DateTime?  // Feedback verzoek
npsSurveySentAt       DateTime?  // NPS survey
referralInviteSentAt  DateTime?  // Referral uitnodiging
reactivationSentAt    DateTime?  // Reactivatie email
assigneeNotifiedAt    DateTime?  // Engineer toewijzing notificatie
```

---

## Bestandsstructuur

```
lib/
├── email.ts              # Core email functies + templates
├── email-triggers.ts     # Email trigger service + alle template functies

app/api/
├── intake/route.ts       # Intake + admin notificatie
└── cron/
    └── email-reminders/
        └── route.ts      # Cron job voor geplande emails

vercel.json               # Cron configuratie (dagelijks 9:00)
```

---

## Cron Job Configuratie

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/email-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Beveiliging:** Protected door `CRON_SECRET` environment variable.

---

## Quick Reference

| # | E-mail | Trigger | Timing | Status |
|---|--------|---------|--------|--------|
| 01 | Intake Bevestiging | Lead aangemaakt | Direct | ✅ |
| 02a | Engineer Notificatie | Assignee gezet | Direct | ✅ |
| 02b | Klant - Engineer Toegewezen | Assignee gezet | Direct | ✅ |
| 03 | Offerte Verzonden | Quote approved | Direct | ✅ |
| 04 | Herinnering #1 | Geen respons offerte | +4d | ✅ |
| 05 | Herinnering #2 | Geen respons | +10d | ✅ |
| 06 | Opdracht Bevestiging | Status → Opdracht | Direct | ✅ |
| 09 | Oplevering | Status → Archief | Direct | ✅ |
| 10 | Feedback Verzoek | Na oplevering | +3d | ✅ |
| 11 | NPS Survey | Na oplevering | +14d | ✅ |
| 13 | Reactivatie | Inactief | +90d | ✅ |
| 15a | Admin: Nieuwe Lead | Lead aangemaakt | Direct | ✅ |
| 15b | Admin: Quote Pending | Quote submitted | Direct | ✅ |
| 15c | Engineer: Afkeuring | Quote rejected | Direct | ✅ |

---

## Environment Variables

```env
# Email Provider
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@broersma-bouwadvies.nl

# Cron Protection
CRON_SECRET=your-secret-here

# App URL (voor links in emails)
NEXT_PUBLIC_APP_URL=https://backoffice.broersma-bouwadvies.nl
```

---

## Metrics Dashboard (Targets)

| E-mail | Open Rate | Click Rate | Conversie |
|--------|-----------|------------|-----------|
| Intake | 75%+ | N/A | N/A |
| Offerte | 80%+ | 40%+ | Akkoord rate |
| Herinnering 1 | 50%+ | 20%+ | Response |
| Herinnering 2 | 40%+ | 15%+ | Response |
| Feedback | 35%+ | 25%+ | Submission |
| NPS | 30%+ | 50%+ | Score submit |

---

*Laatst bijgewerkt: januari 2026*
*Status: ✅ Volledig geïmplementeerd*