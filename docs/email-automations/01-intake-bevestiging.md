# 📧 E-mail Automatisering: Intake Bevestiging

## Trigger
**Actie:** Nieuwe lead wordt aangemaakt in het systeem  
**Status:** `Nieuw`  
**Timing:** Direct (< 2 minuten na aanmelding)

---

## Doel van deze e-mail
- Directe bevestiging van ontvangst (vertrouwen opbouwen)
- Verwachtingen managen over vervolgstappen
- Professionele eerste indruk maken
- Urgentie en betrokkenheid tonen

---

## Onderwerp
```
Ontvangstbevestiging: Uw aanvraag voor {{project_type}} in {{city}} | Bureau Broersma
```

**Alternatief (A/B test):**
```
Bedankt {{client_name}} – we gaan voor u aan de slag! 🏗️
```

---

## E-mail Body

```
Beste {{client_name}},

Hartelijk dank voor uw vertrouwen in Bureau Broersma!

Wij hebben uw aanvraag voor een **{{project_type}}** aan de **{{address}}** te **{{city}}** in goede orde ontvangen.

---

### Wat kunt u verwachten?

📋 **Stap 1 – Beoordeling** (vandaag)
Wij bekijken uw project en bepalen welke specialist het beste bij uw situatie past.

📞 **Stap 2 – Persoonlijk contact** (binnen 1-2 werkdagen)
Een van onze constructie-ingenieurs neemt contact met u op om de details door te nemen en eventuele vragen te beantwoorden.

📄 **Stap 3 – Offerte op maat** 
Na ons gesprek ontvangt u een heldere offerte met vaste prijs. Geen verrassingen achteraf.

---

### Uw projectgegevens

| Gegeven | Waarde |
|---------|--------|
| Projecttype | {{project_type}} |
| Locatie | {{address}}, {{city}} |
| Referentienummer | {{lead_id}} |
| Aanvraagdatum | {{created_at}} |

---

### Heeft u alvast vragen?

U kunt ons bereiken via:
- 📧 info@bureaubroersma.nl
- 📞 020-123 4567
- 💬 WhatsApp: 06-12345678

Wij verheugen ons erop om met uw project aan de slag te gaan!

Met vriendelijke groet,

**Team Bureau Broersma**  
*Constructieberekeningen met zekerheid*

---

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
| `{{lead_id}}` | Lead.id | BRO-2026-0142 |
| `{{created_at}}` | Lead.createdAt (formatted) | 12 januari 2026 |

---

## Bijlagen
- Geen (bewaar bijlagen voor follow-up)

---

## Preheader tekst
```
Uw aanvraag is ontvangen. Binnen 1-2 werkdagen nemen wij contact met u op.
```

---

## Segmentatie

| Conditie | Aanpassing |
|----------|------------|
| Monumentaal pand | Voeg toe: "Wij hebben ruime ervaring met monumentale panden en kennen de specifieke regelgeving." |

---

## Metrics om te meten
- Open rate (target: >50%)
- Reply rate (target: >5%)
- Tijd tot eerste respons van klant

---

## A/B Test suggesties
1. Formele vs. informele toon
2. Met emoji's vs. zonder emoji's
3. Korte vs. uitgebreide e-mail
4. Met projectgegevens tabel vs. zonder
