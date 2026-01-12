# 📧 E-mail Automatisering: Reactivatie Oude Leads

## Trigger
**Actie:** Lead in Archief zonder conversie  
**Status:** `Archief` (reden: geen respons, offerte verlopen, project uitgesteld)  
**Timing:** 90 dagen na archivering

---

## Doel van deze e-mail
- Slapende leads wakker schudden
- Uitgestelde projecten opnieuw activeren
- Tweede kans creëren voor conversie
- Database opschonen (reactie of uitschrijving)

---

## Onderwerp
```
{{client_name}}, zijn uw bouwplannen nog actueel?
```

**Alternatief:**
```
We missen u! 🏠 Update over uw {{project_type}} project
```

---

## E-mail Body

```
Beste {{client_name}},

Een tijdje geleden spraken wij over uw plannen voor een **{{project_type}}** aan de **{{address}}** te **{{city}}**.

Ik was benieuwd: zijn deze plannen nog steeds actueel?

---

## 🏗️ Wat er sindsdien is veranderd bij Bureau Broersma

Wij hebben niet stilgezeten! Dit is nieuw:

✨ **Snellere doorlooptijden** – Gemiddeld 20% sneller dan vorig jaar
💰 **Scherpe prijzen** – Herziende tariefstructuur voor 2026
📱 **Digitale tools** – Volg uw project real-time via ons klantportaal
🌱 **Duurzaamheidsadvies** – Nu ook advies over circulair bouwen

---

## ⏱️ Uw project oppakken?

Indien u nog steeds interesse heeft, kan ik:

- [ ] **Nieuwe offerte opstellen** – met actuele prijzen
- [ ] **Vorige offerte updaten** – als uw plannen niet zijn gewijzigd
- [ ] **Vrijblijvend adviesgesprek** – om uw opties te bespreken

[**JA, NEEM CONTACT MET MIJ OP**]({{reactivation_link_yes}})

---

## 🔄 Of laat ons weten wat de status is

- [Mijn plannen zijn uitgesteld, neem over 6 maanden contact op]({{reactivation_link_later}})
- [Ik heb geen interesse meer]({{reactivation_link_no}})
- [Ik heb het project al elders laten uitvoeren]({{reactivation_link_competitor}})

---

## 📋 Uw eerdere aanvraag

| Gegeven | Details |
|---------|---------|
| **Project** | {{project_type}} |
| **Locatie** | {{address}}, {{city}} |
| **Oorspronkelijke aanvraag** | {{original_created_at}} |
| **Laatste offerte** | {{last_quote_value}} ({{last_quote_date}}) |

---

Ik hoop van u te horen!

Met vriendelijke groet,

**{{original_engineer_name}}**  
Bureau Broersma

---

*Wilt u geen e-mails meer ontvangen? [Uitschrijven]({{unsubscribe_link}})*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{project_type}}` | Lead.projectType | Dakkapel |
| `{{address}}` | Lead.address | Keizersgracht 100 |
| `{{city}}` | Lead.city | Amsterdam |
| `{{original_created_at}}` | Lead.createdAt | oktober 2025 |
| `{{last_quote_value}}` | Last quote | €585,00 |
| `{{last_quote_date}}` | Last quote date | november 2025 |
| `{{original_engineer_name}}` | Original assignee | Angelo |
| `{{reactivation_link_yes}}` | Tracking link | https://app.bureaubroersma.nl/reactivate/xyz?action=yes |
| `{{reactivation_link_later}}` | Tracking link | https://app.bureaubroersma.nl/reactivate/xyz?action=later |
| `{{reactivation_link_no}}` | Tracking link | https://app.bureaubroersma.nl/reactivate/xyz?action=no |
| `{{reactivation_link_competitor}}` | Tracking link | https://app.bureaubroersma.nl/reactivate/xyz?action=competitor |
| `{{unsubscribe_link}}` | Unsubscribe link | https://app.bureaubroersma.nl/unsub/xyz |

---

## Response handling

| Actie | Follow-up |
|-------|-----------|
| Ja, neem contact op | Verplaats naar `Nieuw`, assign engineer, bel binnen 24 uur |
| Uitgesteld (6 maanden) | Zet reminder voor over 6 maanden |
| Geen interesse | Verwijder uit actieve marketing, behoud voor marktonderzoek |
| Bij concurrent | Stuur korte survey: "Wat was doorslaggevend?" |

---

## Reactivatie sequentie

| Dag | Actie |
|-----|-------|
| 0 | Reactivatie e-mail #1 |
| 7 | Geen respons? Reactivatie e-mail #2 (korter, urgenter) |
| 14 | Geen respons? SMS/WhatsApp poging |
| 21 | Geen respons? Final e-mail + auto-uitschrijving |

---

## Metrics om te meten
- Reactivation rate (target: >10%)
- Click-through rate per actie
- Competitor loss reasons (feedback verzamelen)
- Database cleanup rate
