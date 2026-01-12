# 📧 Email Automations Bureau Broersma

## Overzicht

Dit document bevat alle e-mail automatiseringen voor Bureau Broersma, volledig in het Nederlands en geoptimaliseerd voor maximale conversie en klantbeleving.

---

## 📁 Documentstructuur

| # | Bestand | Trigger | Fase |
|---|---------|---------|------|
| 00 | [overzicht-email-flows.md](./00-overzicht-email-flows.md) | - | Overzicht |
| 01 | [intake-bevestiging.md](./01-intake-bevestiging.md) | Nieuwe lead | Acquisitie |
| 02 | [engineer-toegewezen.md](./02-engineer-toegewezen.md) | Assignee set | Activatie |
| 03 | [offerte-verzonden.md](./03-offerte-verzonden.md) | Status change | Conversie |
| 04 | [offerte-herinnering-1.md](./04-offerte-herinnering-1.md) | +4 dagen | Conversie |
| 05 | [offerte-herinnering-2.md](./05-offerte-herinnering-2.md) | +10 dagen | Conversie |
| 06 | [opdracht-bevestiging.md](./06-opdracht-bevestiging.md) | Akkoord | Onboarding |
| 07 | [factuur-verzending.md](./07-factuur-verzending.md) | Na opdracht | Betaling |
| 08 | [betaling-herinnering.md](./08-betaling-herinnering.md) | Onbetaald | Betaling |
| 09 | [oplevering-berekening.md](./09-oplevering-berekening.md) | Gereed | Delivery |
| 10 | [feedback-verzoek.md](./10-feedback-verzoek.md) | +3d oplevering | Feedback |
| 11 | [nps-survey.md](./11-nps-survey.md) | +14d oplevering | Feedback |
| 12 | [referral-uitnodiging.md](./12-referral-uitnodiging.md) | NPS 9-10 | Advocacy |
| 13 | [reactivatie-oude-leads.md](./13-reactivatie-oude-leads.md) | 90d inactief | Retentie |
| 14 | [seizoensgebonden-campagne.md](./14-seizoensgebonden-campagne.md) | Kalender | Marketing |
| 15 | [interne-notificaties.md](./15-interne-notificaties.md) | Diverse | Intern |

---

## 🎯 Doelstellingen

| Metric | Target |
|--------|--------|
| Open rate gemiddeld | >40% |
| Click-through rate | >15% |
| Offerte acceptatie | +15pp via herinneringen |
| Review completion | >15% |
| Referral rate | 25% |

---

## 🔧 Technische Implementatie

### Aanbevolen Tools

| Tool | Kosten | Features |
|------|--------|----------|
| **Resend** | €20-80/maand | Developer-friendly, React Email |
| **Loops** | €49-199/maand | No-code, automation builder |
| **Customer.io** | €100+/maand | Enterprise, segmentatie |

### Code Voorbeeld (Resend + React Email)

```typescript
import { Resend } from 'resend';
import IntakeConfirmation from './emails/IntakeConfirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendIntakeEmail(lead: Lead) {
  await resend.emails.send({
    from: 'Bureau Broersma <info@bureaubroersma.nl>',
    to: lead.clientEmail,
    subject: `Ontvangstbevestiging: ${lead.projectType} - ${lead.city}`,
    react: IntakeConfirmation({ 
      clientName: lead.clientName,
      projectType: lead.projectType,
      city: lead.city,
      createdAt: lead.createdAt
    }),
  });
}
```

---

## 📊 Variabelen Referentie

### Lead Variabelen

| Variabele | Type | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | string | J. de Vries |
| `{{client_email}}` | string | j.devries@email.nl |
| `{{project_type}}` | string | Dakkapel |
| `{{address}}` | string | Keizersgracht 100 |
| `{{city}}` | string | Amsterdam |
| `{{lead_id}}` | string | clxyz123 |
| `{{value}}` | number | 6500 |
| `{{is_urgent}}` | boolean | true |

### Quote Variabelen

| Variabele | Type | Voorbeeld |
|-----------|------|-----------|
| `{{quote_value}}` | number | 585.00 |
| `{{quote_total}}` | number | 707.85 |
| `{{quote_number}}` | string | OFF-2026-0142 |
| `{{quote_valid_until}}` | date | 12 feb 2026 |

### User Variabelen

| Variabele | Type | Voorbeeld |
|-----------|------|-----------|
| `{{engineer_name}}` | string | Angelo |
| `{{engineer_email}}` | string | angelo@bureaubroersma.nl |

---

## ✅ Checklist voor Implementatie

### Fase 1: Setup
- [ ] E-mail provider account aanmaken
- [ ] Domain verificatie (SPF, DKIM, DMARC)
- [ ] Sender reputation opbouwen
- [ ] Template engine configureren

### Fase 2: Core Emails
- [ ] 01-Intake Bevestiging
- [ ] 03-Offerte Verzonden  
- [ ] 06-Opdracht Bevestiging
- [ ] 07-Factuur Verzending

### Fase 3: Conversion Emails
- [ ] 04-Offerte Herinnering #1
- [ ] 05-Offerte Herinnering #2
- [ ] 08-Betaling Herinnering

### Fase 4: Feedback Loop
- [ ] 09-Oplevering
- [ ] 10-Feedback Verzoek
- [ ] 11-NPS Survey
- [ ] 12-Referral Uitnodiging

### Fase 5: Advanced
- [ ] 02-Engineer Toegewezen
- [ ] 13-Reactivatie
- [ ] 14-Seizoens Campagnes
- [ ] 15-Interne Notificaties

---

## 🧪 Testing Protocol

1. **Variabelen testen** - Alle placeholders correct?
2. **Responsive check** - Desktop + mobile
3. **Spam check** - Mail-tester.com score >8
4. **Link check** - Alle links werken?
5. **Tracking check** - UTM parameters correct?

---

*Laatst bijgewerkt: januari 2026*
