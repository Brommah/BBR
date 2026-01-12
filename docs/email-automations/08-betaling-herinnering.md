# 📧 E-mail Automatisering: Betalingsherinnering

## Trigger
**Actie:** Factuur is onbetaald na vervaldatum  
**Status:** `Opdracht` + onbetaalde factuur  
**Timing:** 3 dagen na vervaldatum

---

## Doel van deze e-mail
- Vriendelijke herinnering aan openstaande factuur
- Eventuele problemen identificeren
- Relatie niet schaden
- Betaling faciliteren

---

## Onderwerp
```
Herinnering: Factuur {{invoice_number}} nog open | €{{invoice_total}}
```

---

## E-mail Body

```
Beste {{client_name}},

Ik stuur u een vriendelijke herinnering voor onderstaande factuur.

---

## 📄 Openstaande factuur

| Omschrijving | Details |
|--------------|---------|
| **Factuurnummer** | {{invoice_number}} |
| **Factuurdatum** | {{invoice_date}} |
| **Vervaldatum** | {{payment_due_date}} |
| **Openstaand bedrag** | **€{{invoice_total}}** |

---

## 💳 Betaal direct

[**BETAAL NU MET IDEAL**]({{ideal_payment_link}})

Of maak het bedrag over naar:
- **IBAN:** NL91 ABNA 0417 1643 00
- **T.n.v.:** Bureau Broersma B.V.
- **Onder vermelding van:** {{invoice_number}}

---

## ❓ Is er iets aan de hand?

Heeft u de factuur niet ontvangen, of is er een andere reden voor de vertraging? Laat het me weten – samen vinden we een oplossing.

📧 administratie@bureaubroersma.nl
📞 020-123 4567

---

## 📦 Status van uw project

{{#if already_delivered}}
Uw constructieberekening is reeds opgeleverd op {{delivery_date}}.
{{else}}
Uw constructieberekening wordt opgeleverd zodra de betaling is ontvangen.
{{/if}}

---

Mocht u inmiddels betaald hebben, dan kunt u deze e-mail als niet verzonden beschouwen.

Met vriendelijke groet,

**Administratie Bureau Broersma**

---

*Bureau Broersma B.V. | Keizersgracht 123 | 1015 AA Amsterdam*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{invoice_number}}` | Invoice reference | FACT-2026-0142 |
| `{{invoice_date}}` | Invoice date | 16 januari 2026 |
| `{{payment_due_date}}` | Invoice due date | 30 januari 2026 |
| `{{invoice_total}}` | Invoice amount | 707,85 |
| `{{ideal_payment_link}}` | Payment link | https://pay.mollie.com/xyz |
| `{{already_delivered}}` | Boolean | true |
| `{{delivery_date}}` | Delivery date | 20 januari 2026 |

---

## Tweede herinnering (Dag 10 na vervaldatum)

**Onderwerp:**
```
Tweede herinnering: Factuur {{invoice_number}} | Actie vereist
```

**Aanpassingen:**
- Toon meer urgentie
- Bied betalingsregeling aan
- Vermeld vervolgstappen bij uitblijven betaling

---

## Aanmaanbeleid

| Dag na vervaldatum | Actie |
|-------------------|-------|
| +3 dagen | Herinnering #1 (vriendelijk) |
| +10 dagen | Herinnering #2 (dringend) |
| +21 dagen | Laatste sommatie |
| +30 dagen | Incasso overdracht |

---

## Metrics om te meten
- Betaling na herinnering #1 (target: >60%)
- Gemiddelde betaaltijd
- Incasso rate (target: <2%)
