# 📧 E-mail Automatisering: Offerte Herinnering #1

## Trigger
**Actie:** Lead blijft in status `Offerte Verzonden` zonder respons  
**Status:** `Offerte Verzonden`  
**Timing:** 4 dagen na offerte verzending

---

## Doel van deze e-mail
- Vriendelijke herinnering zonder pusherig te zijn
- Eventuele vragen proactief adresseren
- Klant helpen met besluitvorming
- Open houden van dialoog

---

## Onderwerp
```
Heeft u onze offerte ontvangen? | {{project_type}} {{address}}
```

**Alternatief (personalized):**
```
{{client_name}}, kan ik ergens mee helpen?
```

---

## E-mail Body

```
Beste {{client_name}},

Vorige week stuurde ik u de offerte voor de constructieberekening van uw **{{project_type}}** aan de **{{address}}**.

Ik wilde even checken of alles duidelijk is. Soms roepen offertes vragen op, en ik help u daar graag bij.

---

### Veelgestelde vragen die ik vaak krijg:

**"Wat als de gemeente wijzigingen wil?"**
→ Kleine aanpassingen zijn altijd inbegrepen. Bij grote wijzigingen bespreken we dit vooraf.

**"Hoe lang is de berekening geldig?"**
→ Onze berekeningen zijn geldig zolang de bouwvergunning geldig is (meestal 3 jaar).

**"Kan ik de berekening ook gebruiken voor andere aannemers?"**
→ Ja, de berekening is eigendom van u en kunt u delen met elke aannemer.

---

### Laat me weten wat u nodig heeft

Ik help u graag verder. Kies wat het beste past:

📞 **Bel me direct:** 020-123 4567
📅 **Plan een belafspraak:** [Kies een tijdstip]({{calendar_link}})
✉️ **Stuur uw vraag:** Beantwoord gewoon deze e-mail

Of geef direct akkoord:
[**AKKOORD GEVEN OP OFFERTE**]({{accept_quote_link}})

---

De offerte blijft geldig tot **{{quote_valid_until}}**.

Met vriendelijke groet,

**{{engineer_name}}**  
Bureau Broersma

---

*PS: Mocht u nog niet klaar zijn om te beslissen, laat het me dan weten. Ik houd graag contact voor wanneer het moment wel geschikt is.*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{project_type}}` | Lead.projectType | Dakkapel |
| `{{address}}` | Lead.address | Keizersgracht 100 |
| `{{quote_valid_until}}` | Calculated | 12 februari 2026 |
| `{{engineer_name}}` | Lead.assignee | Angelo |
| `{{calendar_link}}` | Calendly link | https://cal.com/bureaubroersma |
| `{{accept_quote_link}}` | Secure link | https://app.bureaubroersma.nl/quote/accept/xyz |

---

## Bijlagen
- Geen (offerte was bij originele e-mail)

---

## Toon & Stijl
- **Warm en behulpzaam** – niet verkoopachtig
- **Proactief** – anticipeer op bezwaren
- **Laagdrempelig** – meerdere contactopties

---

## Condities voor verzending

| Conditie | Actie |
|----------|-------|
| Klant heeft gereageerd | NIET verzenden |
| Quote is geaccepteerd | NIET verzenden |
| Quote is afgewezen | NIET verzenden |
| Klant heeft gebeld/WhatsApp | NIET verzenden |

---

## Metrics om te meten
- Response rate na herinnering (target: >15%)
- Quote acceptance na herinnering (target: >20%)
- Unsubscribe rate (target: <1%)
