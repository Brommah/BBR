# 📧 E-mail Automatisering: Offerte Herinnering #2 (Laatste)

## Trigger
**Actie:** Lead blijft in status `Offerte Verzonden` zonder respons  
**Status:** `Offerte Verzonden`  
**Timing:** 10 dagen na offerte verzending (6 dagen na herinnering #1)

---

## Doel van deze e-mail
- Laatste zachte herinnering
- Urgentie creëren rond geldigheid
- Alternatief bieden (later contacteren)
- Relatie warm houden

---

## Onderwerp
```
Uw offerte verloopt binnenkort | {{project_type}} {{city}}
```

**Alternatief:**
```
Laatste herinnering: offerte {{quote_number}}
```

---

## E-mail Body

```
Beste {{client_name}},

Dit is mijn laatste herinnering over de offerte voor uw **{{project_type}}** aan de **{{address}}**.

De offerte is nog geldig tot **{{quote_valid_until}}** – nog **{{days_remaining}} dagen**.

---

### Nog niet klaar om te beslissen?

Dat begrijp ik helemaal. Bouwprojecten vragen tijd en overweging.

Laat me weten wat er speelt:

- [ ] Ik wacht op andere offertes → *Ik hoor graag als ik iets kan verduidelijken*
- [ ] Het project is uitgesteld → *Ik contacteer u graag over X maanden*
- [ ] Ik heb vragen → *Bel of mail me gerust*
- [ ] Ik ga niet door → *Jammer, maar bedankt voor de overweging*

Beantwoord gerust deze e-mail met wat van toepassing is.

---

### Nog steeds interesse?

[**OFFERTE OPNIEUW BEKIJKEN**]({{quote_pdf_link}})

[**AKKOORD GEVEN**]({{accept_quote_link}})

---

### Na verloopdatum

Als de offerte verloopt, kunt u altijd een nieuwe offerte aanvragen. Mogelijk zijn de prijzen dan aangepast.

Ik hoop van u te horen!

Met vriendelijke groet,

**{{engineer_name}}**  
Bureau Broersma

---

*Wilt u tijdelijk geen e-mails meer ontvangen over dit project? [Klik hier]({{pause_link}}).*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{project_type}}` | Lead.projectType | Dakkapel |
| `{{address}}` | Lead.address | Keizersgracht 100 |
| `{{quote_valid_until}}` | Calculated | 12 februari 2026 |
| `{{days_remaining}}` | Calculated | 20 |
| `{{quote_number}}` | Generated | OFF-2026-0142 |
| `{{quote_pdf_link}}` | Secure link | https://app.bureaubroersma.nl/quote/view/xyz |
| `{{accept_quote_link}}` | Secure link | https://app.bureaubroersma.nl/quote/accept/xyz |
| `{{pause_link}}` | Preference center | https://app.bureaubroersma.nl/preferences/xyz |
| `{{engineer_name}}` | Lead.assignee | Angelo |

---

## Na deze e-mail

Als geen respons:
1. Wacht tot offerte verloopt
2. Verplaats lead naar `Archief` met reden "Geen respons"
3. Voeg toe aan **nurture sequence** (kwartaalnieuwsbrief)
4. Trigger reactivatie e-mail na 3 maanden

---

## Metrics om te meten
- Finale conversie na herinnering #2 (target: >10%)
- Response rate (ook "nee" is waardevolle data)
- Pause link clicks (indiceert nog interesse maar timing is off)
- Archief rate
