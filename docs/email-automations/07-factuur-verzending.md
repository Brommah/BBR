# 📧 E-mail Automatisering: Factuur Verzending

## Trigger
**Actie:** Factuur gegenereerd voor opdracht  
**Status:** `Opdracht`  
**Timing:** Direct na generatie (meestal dag na opdrachtbevestiging)

---

## Doel van deze e-mail
- Professionele factuurverzending
- Duidelijke betalingsinstructies
- Verwachting managen over oplevering
- Gemakkelijke betaalmogelijkheden

---

## Onderwerp
```
Factuur {{invoice_number}} – {{project_type}} {{address}} | €{{invoice_total}}
```

---

## E-mail Body

```
Beste {{client_name}},

Hierbij ontvangt u de factuur voor uw opdracht.

---

## 📄 Factuurgegevens

| Omschrijving | Details |
|--------------|---------|
| **Factuurnummer** | {{invoice_number}} |
| **Factuurdatum** | {{invoice_date}} |
| **Opdrachtnummer** | {{order_number}} |
| **Project** | {{project_type}} – {{address}}, {{city}} |

---

## 💰 Te betalen

| Omschrijving | Bedrag |
|--------------|--------|
| Constructieberekening {{project_type}} | €{{quote_value}} |
| BTW (21%) | €{{invoice_vat}} |
| **Totaal te betalen** | **€{{invoice_total}}** |

---

## 🏦 Betalingsinstructies

**Maak het bedrag over naar:**

| | |
|-|-|
| IBAN | NL91 ABNA 0417 1643 00 |
| T.n.v. | Bureau Broersma B.V. |
| Onder vermelding van | {{invoice_number}} |

**Betalingstermijn:** {{payment_due_date}} (14 dagen)

---

## ⚡ Betaal direct met iDEAL

[**BETAAL NU MET IDEAL**]({{ideal_payment_link}})

Veilig en direct betalen via uw eigen bank.

---

## 📦 Oplevering

De constructieberekening wordt opgeleverd **binnen 2 werkdagen na ontvangst van betaling**.

Bij spoedprojecten: neem contact op en we bespreken de mogelijkheden.

---

## ❓ Vragen over de factuur?

Neem contact op met onze administratie:

📧 administratie@bureaubroersma.nl
📞 020-123 4567

Met vriendelijke groet,

**Administratie Bureau Broersma**

---

*Bijlage: Factuur-{{invoice_number}}.pdf*

---

*Bureau Broersma B.V. | Keizersgracht 123 | 1015 AA Amsterdam*
*KvK 12345678 | BTW NL123456789B01 | IBAN NL91 ABNA 0417 1643 00*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{project_type}}` | Lead.projectType | Dakkapel |
| `{{address}}` | Lead.address | Keizersgracht 100 |
| `{{city}}` | Lead.city | Amsterdam |
| `{{invoice_number}}` | Generated | FACT-2026-0142 |
| `{{invoice_date}}` | Today | 16 januari 2026 |
| `{{order_number}}` | Lead reference | OPD-2026-0142 |
| `{{quote_value}}` | Lead.quoteValue | 585,00 |
| `{{invoice_vat}}` | Calculated (21%) | 122,85 |
| `{{invoice_total}}` | Calculated | 707,85 |
| `{{payment_due_date}}` | Invoice date + 14 days | 30 januari 2026 |
| `{{ideal_payment_link}}` | Payment provider link | https://pay.mollie.com/xyz |

---

## Bijlagen
- `Factuur-{{invoice_number}}.pdf` – Officiële factuur

---

## iDEAL Button styling

```html
<a href="{{ideal_payment_link}}" style="
  background-color: #CC0066;
  color: white;
  padding: 16px 32px;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  display: inline-block;
">
  💳 BETAAL NU MET IDEAL
</a>
```

---

## Metrics om te meten
- Payment time (target: <5 dagen gemiddeld)
- iDEAL usage rate
- On-time payment rate (target: >85%)
