# 📧 Email Automation Overzicht

## Complete Flow Mapping

### Klant Journey E-mails

```
LEAD BINNENKOMST
     │
     ▼
┌────────────────────────┐
│ 01. Intake Bevestiging │ ─────► Direct
└────────────────────────┘
     │
     ▼
┌────────────────────────┐
│ 02. Engineer Toegewezen│ ─────► Bij toewijzing
└────────────────────────┘
     │
     ▼
┌────────────────────────┐
│ 03. Offerte Verzonden  │ ─────► Bij offerte
└────────────────────────┘
     │
     ├── Geen respons? ──────────────────────┐
     │                                        │
     ▼                                        ▼
┌────────────────────────┐    ┌────────────────────────┐
│ 06. Opdracht Bevestigd │    │ 04. Herinnering #1     │ ─► +4 dagen
└────────────────────────┘    └────────────────────────┘
     │                                        │
     ▼                                        ▼
┌────────────────────────┐    ┌────────────────────────┐
│ 07. Factuur Verzonden  │    │ 05. Herinnering #2     │ ─► +10 dagen
└────────────────────────┘    └────────────────────────┘
     │
     ├── Niet betaald? ──────────────────────┐
     │                                        ▼
     ▼                        ┌────────────────────────┐
┌────────────────────────┐    │ 08. Betaling Herinner. │
│ 09. Oplevering         │    └────────────────────────┘
└────────────────────────┘
     │
     ▼
┌────────────────────────┐
│ 10. Feedback Verzoek   │ ─────► +3 dagen na oplevering
└────────────────────────┘
     │
     ▼
┌────────────────────────┐
│ 11. NPS Survey         │ ─────► +14 dagen na oplevering
└────────────────────────┘
     │
     ▼ (indien NPS 9-10)
┌────────────────────────┐
│ 12. Referral Uitnod.   │ ─────► Direct na NPS 9+
└────────────────────────┘
```

### Reactivatie & Campagnes

```
INACTIEVE KLANTEN
     │
     ▼
┌────────────────────────┐
│ 13. Reactivatie        │ ─────► 90 dagen geen activiteit
└────────────────────────┘

SEIZOENSGEBONDEN
     │
     ▼
┌────────────────────────┐
│ 14. Campagnes          │ ─────► Maart, Juni, Sept, Dec
└────────────────────────┘
```

### Interne Notificaties

```
┌────────────────────────┐
│ 15. Interne Emails     │
├────────────────────────┤
│ • Nieuwe lead alert    │
│ • Offerte goedkeuring  │
│ • Betaling ontvangen   │
│ • Deadline alerts      │
│ • Negatieve feedback   │
│ • Wekelijks rapport    │
└────────────────────────┘
```

---

## Quick Reference

| # | E-mail | Trigger | Timing |
|---|--------|---------|--------|
| 01 | Intake Bevestiging | Lead aangemaakt | Direct |
| 02 | Engineer Toegewezen | Assignee ingesteld | Direct |
| 03 | Offerte Verzonden | Status → Offerte | Direct |
| 04 | Herinnering #1 | Geen respons offerte | +4d |
| 05 | Herinnering #2 | Geen respons | +10d |
| 06 | Opdracht Bevestiging | Akkoord ontvangen | Direct |
| 07 | Factuur | Na opdracht | +1d |
| 08 | Betaling Herinnering | Onbetaald na vervaldatum | +3d |
| 09 | Oplevering | Berekening gereed | Direct |
| 10 | Feedback | Na oplevering | +3d |
| 11 | NPS Survey | Na oplevering | +14d |
| 12 | Referral | NPS 9-10 | Direct |
| 13 | Reactivatie | Inactief | +90d |
| 14 | Seizoens Campagne | Kalender | Kwartaal |
| 15 | Interne Notificaties | Diverse events | Variabel |

---

## Implementatie Prioriteit

### Fase 1 (Week 1-2)
1. ✅ 01-Intake Bevestiging
2. ✅ 03-Offerte Verzonden
3. ✅ 06-Opdracht Bevestiging

### Fase 2 (Week 3-4)
4. ✅ 04-Offerte Herinnering #1
5. ✅ 05-Offerte Herinnering #2
6. ✅ 07-Factuur Verzending

### Fase 3 (Week 5-6)
7. ✅ 09-Oplevering
8. ✅ 10-Feedback Verzoek
9. ✅ 08-Betaling Herinnering

### Fase 4 (Week 7-8)
10. ✅ 11-NPS Survey
11. ✅ 12-Referral Uitnodiging
12. ✅ 02-Engineer Toegewezen

### Fase 5 (Week 9-10)
13. ✅ 13-Reactivatie
14. ✅ 14-Seizoens Campagnes
15. ✅ 15-Interne Notificaties

---

## Technische Setup

### E-mail Provider: Resend/Loops

```typescript
// Voorbeeld trigger
async function sendIntakeConfirmation(lead: Lead) {
  await resend.emails.send({
    from: 'Bureau Broersma <info@bureaubroersma.nl>',
    to: lead.clientEmail,
    subject: `Ontvangstbevestiging: ${lead.projectType} - ${lead.city}`,
    template: 'intake-confirmation',
    data: {
      client_name: lead.clientName,
      project_type: lead.projectType,
      address: lead.address,
      city: lead.city,
      lead_id: lead.id,
      created_at: formatDate(lead.createdAt)
    }
  });
}
```

### Triggers in Database

```sql
-- Activity trigger voor email automations
CREATE TRIGGER lead_status_change
AFTER UPDATE ON "Lead"
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trigger_email_automation();
```

---

## Metrics Dashboard

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
