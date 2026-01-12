# 📧 E-mail Automatisering: Oplevering Constructieberekening

## Trigger
**Actie:** Constructieberekening is gereed en betaling is ontvangen  
**Status:** `Opdracht`  
**Timing:** Direct na goedkeuring oplevering

---

## Doel van deze e-mail
- Professionele oplevering van het eindproduct
- Uitleg over gebruik van de documenten
- Verwachtingen voor vergunningstraject
- Referentie & review verzoek voorbereiden

---

## Onderwerp
```
🎉 Uw constructieberekening is gereed! | {{project_type}} {{address}}
```

---

## E-mail Body

```
Beste {{client_name}},

Fantastisch nieuws! De constructieberekening voor uw **{{project_type}}** is gereed.

---

## 📦 Uw documenten

Hieronder vindt u alle documenten die u nodig heeft:

{{#each documents}}
📄 **{{this.name}}** – {{this.description}}
{{/each}}

[**DOWNLOAD ALLE DOCUMENTEN (ZIP)**]({{download_all_link}})

Of download individueel:
{{#each documents}}
- [{{this.name}}]({{this.link}})
{{/each}}

---

## 📋 Wat heeft u ontvangen?

### 1. Constructieberekening (PDF)
Volledige berekening volgens Eurocode en NEN-normen. Dit document is vereist voor uw vergunningaanvraag.

### 2. Constructietekeningen (PDF)
Gedetailleerde tekeningen met maatvoering voor de aannemer.

### 3. Materiaalspecificaties
Overzicht van benodigde staalprofielen, verbindingen en overige constructieve elementen.

---

## 🏛️ Vergunningaanvraag

U kunt deze documenten gebruiken voor uw omgevingsvergunning aanvraag:

**Stap 1:** Ga naar [www.omgevingsloket.nl](https://www.omgevingsloket.nl)
**Stap 2:** Start een nieuwe aanvraag voor "Bouwen"
**Stap 3:** Upload de constructieberekening en tekeningen
**Stap 4:** Vul de overige gegevens in

> 💡 **Tip:** De gemeente kan aanvullende vragen stellen. Wij beantwoorden deze kosteloos binnen de garantieperiode.

---

## 👷 Voor uw aannemer

Deel gerust de constructietekeningen met uw aannemer. Mocht de aannemer technische vragen hebben, kunnen zij contact opnemen met:

📧 {{engineer_email}}
📞 020-123 4567

Referentie: {{order_number}}

---

## ✅ Onze garantie

- **Berekening voldoet aan alle normen** – Eurocode, NEN, Bouwbesluit
- **Kosteloos aanpassingen** bij gemeentelijke opmerkingen (binnen redelijkheid)
- **1 jaar ondersteuning** voor vragen over deze berekening

---

## 🌟 Tevreden met onze service?

Wij werken hard voor tevreden klanten. Zou u 30 seconden willen nemen om uw ervaring te delen?

[**LAAT EEN REVIEW ACHTER ⭐**]({{review_link}})

---

## 📞 Vragen over de documenten?

Neem gerust contact op met {{engineer_name}}:

📧 {{engineer_email}}
📞 020-123 4567

Wij wensen u veel succes met uw project!

Met vriendelijke groet,

**{{engineer_name}}**  
Constructie-ingenieur | Bureau Broersma

---

*Bureau Broersma | Constructieberekeningen met zekerheid*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{project_type}}` | Lead.projectType | Dakkapel |
| `{{address}}` | Lead.address | Keizersgracht 100 |
| `{{documents}}` | Array of documents | [{ name: "Constructieberekening.pdf", ... }] |
| `{{download_all_link}}` | Secure download link | https://files.bureaubroersma.nl/download/xyz |
| `{{order_number}}` | Order reference | OPD-2026-0142 |
| `{{engineer_name}}` | Lead.assignee | Angelo |
| `{{engineer_email}}` | User.email | angelo@bureaubroersma.nl |
| `{{review_link}}` | Google/Trustpilot link | https://g.page/bureaubroersma/review |

---

## Bijlagen
- `Constructieberekening-{{order_number}}.pdf`
- `Constructietekening-{{order_number}}.pdf`
- Eventuele aanvullende documenten

---

## Post-oplevering flow

Na 3 dagen:
→ Trigger e-mail #10 (Feedback verzoek)

Na 14 dagen:
→ Trigger e-mail #11 (NPS survey)

---

## Metrics om te meten
- Document download rate
- Support ticket rate (target: <5%)
- Review completion rate
- Vergunning goedkeuring rate (feedback verzamelen)
