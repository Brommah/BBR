# 📧 E-mail Automatisering: Referral Programma Uitnodiging

## Trigger
**Actie:** Klant geeft NPS score 9 of 10, of laat positieve review achter  
**Status:** `Archief` (afgerond project)  
**Timing:** Direct na promoter identificatie

---

## Doel van deze e-mail
- Tevreden klanten activeren als ambassadeurs
- Warme leads genereren via mond-tot-mond
- Beloningssysteem introduceren
- Community gevoel creëren

---

## Onderwerp
```
{{client_name}}, verdien €100 door Bureau Broersma aan te bevelen 🎁
```

**Alternatief:**
```
Uw netwerk kan ook profiteren van onze service
```

---

## E-mail Body

```
Beste {{client_name}},

Bedankt voor uw fantastische beoordeling! Wij zijn ontzettend blij dat u tevreden bent met onze service.

---

## 🎁 Ons Referral Programma

Kent u iemand die ook bouwplannen heeft? Help hen én ontvang een beloning!

### Zo werkt het:

**1. Deel uw unieke link**
Stuur onderstaande link naar vrienden, familie of collega's met bouwplannen:

📎 **{{referral_link}}**

[**KOPIEER LINK**](javascript:copyLink()) [**DEEL VIA WHATSAPP**]({{whatsapp_link}}) [**DEEL VIA EMAIL**]({{share_email_link}})

**2. Zij ontvangen korting**
Uw contactpersoon krijgt **€50 korting** op hun eerste opdracht bij Bureau Broersma.

**3. U ontvangt een beloning**
Zodra zij een opdracht afronden, ontvangt u **€100 tegoed** of een **cadeaubon** naar keuze.

---

## 💰 Uw beloningen

| Aantal succesvolle verwijzingen | Uw beloning |
|--------------------------------|-------------|
| 1 verwijzing | €100 tegoed |
| 3 verwijzingen | €350 tegoed + Bureau Broersma goodiebag |
| 5 verwijzingen | €600 tegoed + VIP-status |

---

## 📊 Uw Referral Dashboard

Volg uw verwijzingen en beloningen:

[**BEKIJK UW DASHBOARD**]({{referral_dashboard_link}})

| Status | Aantal |
|--------|--------|
| Uitgenodigde contacten | {{invited_count}} |
| Aangemeld | {{signed_up_count}} |
| Opdracht afgerond | {{completed_count}} |
| Verdiende beloningen | €{{total_earned}} |

---

## 🗣️ Wat u kunt zeggen

> "Wij hebben onze dakkapel laten berekenen door Bureau Broersma. Heel professioneel en snel! Gebruik mijn link voor €50 korting: {{referral_link}}"

Of deel dit bericht via WhatsApp:

[**DEEL STANDAARD BERICHT VIA WHATSAPP**]({{whatsapp_premade_link}})

---

## 📋 Voorwaarden

- Geldig voor nieuwe klanten die nog geen offerte hebben ontvangen
- Beloning wordt uitgekeerd na betaling van de opdracht door de verwezen klant
- Keuze uit tegoed voor volgende opdracht of cadeaubon (bol.com, Rituals, VVV)
- Geen maximum aan aantal verwijzingen

---

Heeft u vragen over het programma?

📧 referrals@bureaubroersma.nl
📞 020-123 4567

Bedankt dat u ambassadeur bent van Bureau Broersma!

Met vriendelijke groet,

**Team Bureau Broersma**

---

*U ontvangt deze e-mail omdat u een promoter bent van Bureau Broersma. [Voorkeuren aanpassen]({{preferences_link}})*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{referral_link}}` | Generated unique link | https://bureaubroersma.nl/ref/jdevries123 |
| `{{whatsapp_link}}` | WhatsApp share URL | https://wa.me/?text=... |
| `{{share_email_link}}` | Mailto link | mailto:?subject=...&body=... |
| `{{referral_dashboard_link}}` | Dashboard link | https://app.bureaubroersma.nl/referrals/xyz |
| `{{invited_count}}` | Referral stats | 0 |
| `{{signed_up_count}}` | Referral stats | 0 |
| `{{completed_count}}` | Referral stats | 0 |
| `{{total_earned}}` | Total earnings | 0 |
| `{{whatsapp_premade_link}}` | Pre-filled WhatsApp | https://wa.me/?text=... |
| `{{preferences_link}}` | Preference center | https://app.bureaubroersma.nl/preferences/xyz |

---

## WhatsApp Pre-made bericht

```
Hoi! 👋

Ik heb net mijn {{project_type}} laten berekenen door Bureau Broersma. Super professionele constructieberekeningen, alles in één keer goed bij de gemeente!

Als je ook bouwplannen hebt, gebruik dan mijn link voor €50 korting: {{referral_link}}

Groetjes, {{client_name}}
```

---

## Metrics om te meten
- Referral link share rate (target: >30%)
- Referral conversion rate (target: >15%)
- Gemiddelde waarde per referred klant
- Referral program ROI
