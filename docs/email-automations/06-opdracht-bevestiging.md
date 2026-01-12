# 📧 E-mail Automatisering: Opdracht Bevestiging

## Trigger
**Actie:** Klant geeft akkoord op offerte  
**Status:** `Offerte Verzonden` → `Opdracht`  
**Timing:** Direct na akkoord

---

## Doel van deze e-mail
- Bevestiging van de opdracht
- Duidelijke verwachtingen voor vervolgstappen
- Facturatie aankondiging
- Enthousiasme tonen

---

## Onderwerp
```
🎉 Opdracht bevestigd: {{project_type}} {{address}} | Bureau Broersma
```

**Alternatief:**
```
Bedankt voor uw vertrouwen – we gaan voor u aan de slag!
```

---

## E-mail Body

```
Beste {{client_name}},

Geweldig nieuws! Wij hebben uw akkoord ontvangen en gaan direct aan de slag met uw **{{project_type}}**.

---

## ✅ Opdrachtbevestiging

| Omschrijving | Details |
|--------------|---------|
| **Opdracht** | {{project_type}} |
| **Locatie** | {{address}}, {{city}} |
| **Opdrachtnummer** | {{order_number}} |
| **Opdrachtdatum** | {{order_date}} |
| **Opdrachtbedrag** | €{{quote_total}} (incl. BTW) |

---

## 📅 Planning & Doorlooptijd

**Verwachte oplevering:** {{expected_delivery_date}}

### Uw project doorloopt de volgende stappen:

1. ✅ **Opdracht ontvangen** – vandaag
2. ⏳ **Constructieberekening** – {{engineer_name}} start direct
3. ⏳ **Interne controle** – kwaliteitscheck door senior engineer
4. ⏳ **Oplevering** – digitale levering per e-mail

U ontvangt een e-mail zodra uw berekening gereed is.

---

## 💳 Facturatie

U ontvangt separaat een factuur per e-mail. Onze betalingsvoorwaarden:

- **Betalingstermijn:** 14 dagen
- **Betaalmethode:** Bankoverschrijving of iDEAL

> 💡 De constructieberekening wordt opgeleverd na ontvangst van betaling. Bij spoedprojecten kunnen we in overleg de berekening eerder leveren.

---

## 📞 Vragen tijdens het project?

Uw vaste contactpersoon is **{{engineer_name}}**:

📧 {{engineer_email}}
📞 020-123 4567

Wij houden u op de hoogte van de voortgang!

---

## Bedankt voor uw vertrouwen 💪

Wij zijn trots dat u kiest voor Bureau Broersma. Onze missie is om uw bouwproject constructief én zorgeloos te maken.

Met vriendelijke groet,

**{{engineer_name}}**  
Constructie-ingenieur | Bureau Broersma

---

**Team Bureau Broersma**

*Bureau Broersma | Keizersgracht 123 | 1015 AA Amsterdam*
*KvK 12345678 | BTW NL123456789B01*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{project_type}}` | Lead.projectType | Dakkapel |
| `{{address}}` | Lead.address | Keizersgracht 100 |
| `{{city}}` | Lead.city | Amsterdam |
| `{{order_number}}` | Generated | OPD-2026-0142 |
| `{{order_date}}` | Today formatted | 15 januari 2026 |
| `{{quote_total}}` | Lead.quoteValue + BTW | 707,85 |
| `{{expected_delivery_date}}` | Calculated based on project type | 22 januari 2026 |
| `{{engineer_name}}` | Lead.assignee | Angelo |
| `{{engineer_email}}` | User.email | angelo@bureaubroersma.nl |

---

## Bijlagen
- `Opdrachtbevestiging-{{order_number}}.pdf` – Formele opdrachtbevestiging

---

## Interne trigger

Stuur intern bericht naar:
1. **Engineer** – Opdracht gestart notificatie
2. **Administratie** – Trigger factuur generatie
3. **Dashboard** – Update KPI's

---

## Metrics om te meten
- Delivery time accuracy
- Customer satisfaction score
- Repeat customer rate
