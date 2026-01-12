# 📧 E-mail Automatisering: Engineer Toegewezen

## Trigger
**Actie:** Lead krijgt een assignee (engineer) toegewezen  
**Status:** `Nieuw` → `Calculatie`  
**Timing:** Direct na toewijzing

---

## Doel van deze e-mail
- Klant informeren dat hun project actief in behandeling is
- Persoonlijke connectie creëren met de toegewezen engineer
- Vertrouwen versterken door expertise te tonen
- Eventuele aanvullende informatie opvragen

---

## Onderwerp
```
{{engineer_name}} gaat uw {{project_type}} berekenen | Bureau Broersma
```

**Alternatief:**
```
Goed nieuws: uw project is toegewezen aan onze specialist
```

---

## E-mail Body

```
Beste {{client_name}},

Goed nieuws! Uw project is toegewezen aan een van onze ervaren constructie-ingenieurs.

---

### Uw specialist: {{engineer_name}}

{{engineer_name}} is gespecialiseerd in {{project_type_plural}} en heeft ruime ervaring met vergelijkbare projecten in de regio {{city}}. 

{{engineer_name}} gaat nu aan de slag met:
✓ Analyse van uw projectgegevens
✓ Controle van de bouwkundige situatie
✓ Voorbereiding van de constructieberekening

---

### Wat hebben we nodig?

Om uw offerte zo snel en nauwkeurig mogelijk op te stellen, ontvangen wij graag (indien beschikbaar):

📐 **Bouwtekeningen** – plattegronden, gevels, doorsneden
📸 **Foto's** – van de huidige situatie (binnen en buiten)
📄 **Grondonderzoek** – indien al uitgevoerd (alleen bij funderingen/uitbouwen)

> 💡 **Tip:** Heeft u geen tekeningen? Geen probleem! Wij kunnen ook werken met duidelijke foto's en uw omschrijving.

**Upload uw documenten:** {{upload_link}}

Of stuur ze per e-mail naar: projecten@bureaubroersma.nl

---

### Tijdlijn

| Stap | Verwachte doorlooptijd |
|------|------------------------|
| Analyse & calculatie | 2-3 werkdagen |
| Offerte ontvangst | Aansluitend per e-mail |
| Start berekening (na akkoord) | Binnen 1 week |
| Oplevering | Afhankelijk van projectomvang |

---

### Vragen? Neem contact op!

Heeft u vragen over uw project? U kunt {{engineer_name}} direct bereiken:

📧 {{engineer_email}}
📞 020-123 4567 (kantoor)

Wij houden u op de hoogte van de voortgang!

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
| `{{project_type_plural}}` | Lookup table | dakkapellen |
| `{{city}}` | Lead.city | Amsterdam |
| `{{engineer_name}}` | Lead.assignee → User.name | Angelo |
| `{{engineer_email}}` | User.email | angelo@bureaubroersma.nl |
| `{{upload_link}}` | Generated secure link | https://app.bureaubroersma.nl/upload/abc123 |

---

## Bijlagen
- Geen

---

## Segmentatie

| Conditie | Aanpassing |
|----------|------------|
| Uitbouw/Fundering | Benadruk belang van grondonderzoek |
| Dakkapel | Vraag specifiek om foto's van het dak |
| Monument | Verwijs naar monumentenexpertise |
| Grote projecten (value > €50.000) | Persoonlijke telefonische introductie aanbieden |

---

## Interne notificatie (naar engineer)

Stuur parallel een interne e-mail naar de engineer:

```
Onderwerp: Nieuwe toewijzing: {{project_type}} - {{client_name}} ({{city}})

Hoi {{engineer_name}},

Je hebt een nieuwe opdracht toegewezen gekregen:

• Klant: {{client_name}}
• Project: {{project_type}}
• Locatie: {{address}}, {{city}}
• Waarde: €{{value}}
• Urgentie: {{is_urgent ? "JA - Spoed" : "Normaal"}}

Open in backoffice: {{lead_url}}

Succes!
```

---

## Metrics om te meten
- Document upload rate (target: >30%)
- Gemiddelde tijd tussen toewijzing en offerte
- Klant response rate op informatievraag
