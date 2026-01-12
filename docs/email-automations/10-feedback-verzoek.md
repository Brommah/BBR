# 📧 E-mail Automatisering: Feedback Verzoek

## Trigger
**Actie:** Constructieberekening is opgeleverd  
**Status:** `Opdracht` (na oplevering)  
**Timing:** 3 dagen na oplevering

---

## Doel van deze e-mail
- Klanttevredenheid meten
- Google reviews verzamelen
- Testimonials genereren
- Verbeterpunten identificeren

---

## Onderwerp
```
Hoe was uw ervaring met Bureau Broersma? | 30 seconden
```

**Alternatief:**
```
{{client_name}}, mogen we u iets vragen?
```

---

## E-mail Body

```
Beste {{client_name}},

Een paar dagen geleden heeft u de constructieberekening voor uw **{{project_type}}** ontvangen.

Ik hoop dat alles naar wens is!

---

## ⭐ Mogen we u iets vragen?

Wij streven ernaar om de beste service te leveren. Uw feedback helpt ons om nog beter te worden.

**Eén vraag:** Hoe zou u uw ervaring met Bureau Broersma omschrijven?

[**😊 UITSTEKEND**]({{feedback_link_excellent}})  
[**🙂 GOED**]({{feedback_link_good}})  
[**😐 NEUTRAAL**]({{feedback_link_neutral}})  
[**🙁 KON BETER**]({{feedback_link_poor}})

---

## 🌟 Deel uw ervaring

Bent u tevreden? Een Google review helpt andere huiseigenaren bij het vinden van een betrouwbare constructeur:

[**SCHRIJF EEN GOOGLE REVIEW ⭐**]({{google_review_link}})

> *"Dankzij Bureau Broersma heb ik mijn dakkapel binnen 3 weken vergund gekregen. Zeer professioneel!"* – M. Jansen, Amsterdam

---

## 💬 Specifieke feedback?

Wilt u iets kwijt over onze service? Beantwoord deze e-mail of vul ons korte formulier in:

[**GEEF UITGEBREIDE FEEDBACK**]({{feedback_form_link}})

---

## 🎁 Als dank voor uw tijd

Iedereen die een review achterlaat, maakt kans op **€50 korting** op een volgende opdracht!

---

Bedankt voor uw vertrouwen in Bureau Broersma.

Met vriendelijke groet,

**{{engineer_name}}**  
Bureau Broersma

---

*PS: Heeft u vragen over de berekening of het vergunningstraject? Neem gerust contact op – wij helpen u graag verder.*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{project_type}}` | Lead.projectType | Dakkapel |
| `{{feedback_link_excellent}}` | Tracking link | https://app.bureaubroersma.nl/feedback/xyz?rating=5 |
| `{{feedback_link_good}}` | Tracking link | https://app.bureaubroersma.nl/feedback/xyz?rating=4 |
| `{{feedback_link_neutral}}` | Tracking link | https://app.bureaubroersma.nl/feedback/xyz?rating=3 |
| `{{feedback_link_poor}}` | Tracking link | https://app.bureaubroersma.nl/feedback/xyz?rating=2 |
| `{{google_review_link}}` | Google Business link | https://g.page/bureaubroersma/review |
| `{{feedback_form_link}}` | Typeform/Tally link | https://tally.so/bureaubroersma-feedback |
| `{{engineer_name}}` | Lead.assignee | Angelo |

---

## Emoji Button Styling

```html
<table style="border-collapse: collapse;">
  <tr>
    <td style="padding: 10px;">
      <a href="{{feedback_link_excellent}}" style="
        font-size: 32px;
        text-decoration: none;
        padding: 16px;
        background: #f0fdf4;
        border-radius: 8px;
        display: inline-block;
      ">😊</a>
      <br><span style="font-size: 12px;">Uitstekend</span>
    </td>
    <!-- Repeat for other ratings -->
  </tr>
</table>
```

---

## Feedback routing

| Rating | Actie |
|--------|-------|
| 😊 Uitstekend | Redirect naar Google Review |
| 🙂 Goed | Bedankpagina + optionele review |
| 😐 Neutraal | Vraag om toelichting |
| 🙁 Kon beter | Directe escalatie naar management |

---

## Metrics om te meten
- Feedback response rate (target: >20%)
- Google review completion (target: >10%)
- Average rating (target: >4.5)
- Negative feedback follow-up time (<24 uur)
