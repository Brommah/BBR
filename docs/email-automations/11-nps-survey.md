# 📧 E-mail Automatisering: NPS Survey

## Trigger
**Actie:** Project afgerond  
**Status:** `Opdracht` of `Archief`  
**Timing:** 14 dagen na oplevering

---

## Doel van deze e-mail
- Net Promoter Score meten
- Kwantitatieve data verzamelen
- Promoters identificeren voor referral programma
- Detractors proactief opvangen

---

## Onderwerp
```
Eén vraag over Bureau Broersma | 10 seconden
```

---

## E-mail Body

```
Beste {{client_name}},

Twee weken geleden hebben wij de constructieberekening voor uw **{{project_type}}** opgeleverd.

Mag ik u één simpele vraag stellen?

---

## 📊 De vraag

**Hoe waarschijnlijk is het dat u Bureau Broersma zou aanbevelen aan een vriend, familielid of collega?**

Klik op een cijfer:

[0]({{nps_link_0}}) [1]({{nps_link_1}}) [2]({{nps_link_2}}) [3]({{nps_link_3}}) [4]({{nps_link_4}}) [5]({{nps_link_5}}) [6]({{nps_link_6}}) [7]({{nps_link_7}}) [8]({{nps_link_8}}) [9]({{nps_link_9}}) [10]({{nps_link_10}})

```
0 ━━━━━━━━━━━━━━━━━━━━ 10
Zeer onwaarschijnlijk    Zeer waarschijnlijk
```

---

Dat was alles! Uw antwoord helpt ons om onze service te verbeteren.

Met vriendelijke groet,

**Team Bureau Broersma**

---

*U ontvangt deze e-mail omdat u recent een project heeft afgerond met Bureau Broersma. [Uitschrijven]({{unsubscribe_link}})*
```

---

## Variabelen

| Variabele | Bron | Voorbeeld |
|-----------|------|-----------|
| `{{client_name}}` | Lead.clientName | J. de Vries |
| `{{project_type}}` | Lead.projectType | Dakkapel |
| `{{nps_link_X}}` | Generated links (0-10) | https://app.bureaubroersma.nl/nps/xyz?score=X |
| `{{unsubscribe_link}}` | Preference center | https://app.bureaubroersma.nl/unsub/xyz |

---

## NPS Score styling

```html
<table style="text-align: center; margin: 20px auto;">
  <tr>
    {{#each [0,1,2,3,4,5,6,7,8,9,10]}}
    <td style="padding: 4px;">
      <a href="{{../nps_link_this}}" style="
        width: 36px;
        height: 36px;
        line-height: 36px;
        border-radius: 50%;
        display: inline-block;
        text-decoration: none;
        font-weight: bold;
        color: white;
        background: {{#if (lte this 6)}}#ef4444{{else if (lte this 8)}}#eab308{{else}}#22c55e{{/if}};
      ">{{this}}</a>
    </td>
    {{/each}}
  </tr>
</table>
```

---

## NPS Categorisering

| Score | Categorie | Follow-up actie |
|-------|-----------|-----------------|
| 0-6 | Detractor | Trigger alarm → Manager belt binnen 24 uur |
| 7-8 | Passive | Vraag wat we beter kunnen doen |
| 9-10 | Promoter | Trigger referral programma uitnodiging |

---

## Follow-up pagina's

### Voor Promoters (9-10)
```
Geweldig om te horen! 🎉

Zou u ons willen helpen door uw ervaring te delen?

[SCHRIJF EEN GOOGLE REVIEW] [DEEL OP LINKEDIN]

En nog beter: kent u iemand die ook bouwplannen heeft?
Verwijs hen door en ontvang €50 korting op uw volgende project!

[NODIG IEMAND UIT]
```

### Voor Passives (7-8)
```
Bedankt voor uw feedback!

We zijn benieuwd: wat kunnen we verbeteren om een 9 of 10 te verdienen?

[OPEN TEKSTVELD]
```

### Voor Detractors (0-6)
```
Het spijt ons dat uw ervaring niet optimaal was.

We willen dit graag rechtzetten. Een van onze managers neemt binnen 24 uur contact met u op.

Wilt u alvast aangeven wat er beter kon?

[OPEN TEKSTVELD]

[Liever gebeld worden? Klik hier om een tijdstip te kiezen]
```

---

## Interne alerts

| Score | Alert |
|-------|-------|
| 0-6 | Slack notificatie naar #nps-alerts + e-mail naar management |
| 9-10 | Slack notificatie naar #wins |

---

## Metrics om te meten
- NPS score (target: >50)
- Response rate (target: >25%)
- Detractor → Promoter conversion (na interventie)
- Referral rate vanuit promoters
