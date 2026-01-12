# 📧 E-mail Automatisering: Offerte Verzonden

## Trigger
**Actie:** Lead status wijzigt naar `Offerte Verzonden`  
**Status:** `Calculatie` → `Offerte Verzonden`  
**Timing:** Direct (inclusief offerte als bijlage)

---

## Doel van deze e-mail
- Professionele offerte overhandigen
- Duidelijkheid geven over inhoud en prijsopbouw
- Call-to-action voor akkoord
- Verwachtingen managen over geldigheid

---

## Onderwerp
```
Uw offerte voor {{project_type}} aan {{address}} | €{{quote_value}} | Bureau Broersma
```

**Alternatief (curiosity gap):**
```
{{client_name}}, uw constructieberekening is gereed – bekijk de offerte
```

---

## E-mail Body

```
Beste {{client_name}},

Goed nieuws! De offerte voor uw **{{project_type}}** is gereed.

---

## 📋 Offerte Samenvatting

| Omschrijving | Details |
|--------------|---------|
| **Project** | {{project_type}} |
| **Locatie** | {{address}}, {{city}} |
| **Offertebedrag** | **€{{quote_value}}** (excl. BTW) |
| **BTW (21%)** | €{{quote_vat}} |
| **Totaal** | **€{{quote_total}}** (incl. BTW) |
| **Offertenummer** | {{quote_number}} |
| **Geldig tot** | {{quote_valid_until}} |

---

## 📄 Wat is inbegrepen?

✅ **Volledige constructieberekening** volgens Eurocode en NEN-normen
✅ **Constructietekeningen** met maatvoering en detaillering
✅ **Sterkteberekening** van alle constructieve elementen
✅ **Certificering** door erkend constructeur (SKG/KOMO)
✅ **Ondersteuning** bij vragen van aannemer of gemeente

{{#if project_type === "Dakkapel"}}
✅ **Dakkapelconstructie** inclusief gordingen en spanten
✅ **Aansluiting** op bestaande dakconstructie
{{/if}}

{{#if project_type === "Uitbouw"}}
✅ **Funderingsadvies** op basis van grondonderzoek
✅ **Staalconstructie** voor de uitbouw
✅ **Gevelondersteuning** bij verwijdering buitenmuur
{{/if}}

{{#if project_type === "Draagmuur"}}
✅ **Staalprofielberekening** voor de overspanning
✅ **Opleggingsdetails** voor de stalen balk
✅ **Tijdelijke stempelplan** voor veilige uitvoering
{{/if}}

---

## ⏱️ Doorlooptijd

Na uw akkoord starten wij direct met de uitwerking:

| Projecttype | Verwachte oplevering |
|-------------|---------------------|
| Dakkapel (standaard) | 5-7 werkdagen |
| Uitbouw | 7-10 werkdagen |
| Draagmuur | 3-5 werkdagen |
| Fundering | 10-14 werkdagen |

---

## ✍️ Akkoord geven?

U kunt op twee manieren akkoord geven:

### Optie 1: Digitaal (snelste)
Klik op onderstaande knop om direct akkoord te geven:

[**JA, IK GA AKKOORD MET DEZE OFFERTE**]({{accept_quote_link}})

### Optie 2: Per e-mail
Beantwoord deze e-mail met "akkoord" en wij gaan direct voor u aan de slag.

---

## ❓ Vragen over de offerte?

Heeft u vragen over de prijsopbouw of inhoud? Ik help u graag!

📞 Bel mij: 020-123 4567
📧 Mail: {{engineer_email}}
📅 [Plan een belafspraak]({{calendar_link}})

De offerte is **{{quote_validity_days}} dagen geldig** (tot {{quote_valid_until}}).

Met vriendelijke groet,

**{{engineer_name}}**  
Constructie-ingenieur | Bureau Broersma

---

*PS: Wist u dat 94% van onze klanten de berekening in één keer goedgekeurd krijgt door de gemeente? Dat is ons doel voor u ook!*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{project_type}}` | Lead.projectType | Dakkapel |
| `{{address}}` | Lead.address | Keizersgracht 100 |
| `{{city}}` | Lead.city | Amsterdam |
| `{{quote_value}}` | Lead.quoteValue | 585,00 |
| `{{quote_vat}}` | Calculated (21%) | 122,85 |
| `{{quote_total}}` | Calculated | 707,85 |
| `{{quote_number}}` | Generated | OFF-2026-0142 |
| `{{quote_valid_until}}` | Created + 30 days | 12 februari 2026 |
| `{{quote_validity_days}}` | Config | 30 |
| `{{engineer_name}}` | Lead.assignee | Angelo |
| `{{engineer_email}}` | User.email | angelo@bureaubroersma.nl |
| `{{accept_quote_link}}` | Generated secure link | https://app.bureaubroersma.nl/quote/accept/xyz |
| `{{calendar_link}}` | Calendly/Cal.com link | https://cal.com/bureaubroersma |

---

## Bijlagen
- `Offerte-{{quote_number}}.pdf` – Volledige offerte document
- `Algemene-Voorwaarden-Bureau-Broersma.pdf` – Voorwaarden (optioneel, link naar website)

---

## CTA Button styling

```html
<a href="{{accept_quote_link}}" style="
  background-color: #16a34a;
  color: white;
  padding: 16px 32px;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  display: inline-block;
">
  JA, IK GA AKKOORD MET DEZE OFFERTE
</a>
```

---

## Segmentatie

| Conditie | Aanpassing |
|----------|------------|
| Grote projecten (>€2.500) | Bied telefonische toelichting aan |
| Herhaalde klant | Verwijs naar eerdere samenwerking |
| Spoed aanvraag | Benadruk snelle doorlooptijd |

---

## Metrics om te meten
- Quote acceptance rate (target: >40%)
- Time to accept (target: <5 dagen)
- Quote open rate (target: >70%)
- Click-through rate op akkoord-button
