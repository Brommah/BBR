# 💎 Klantretentie & Lifetime Value Strategie

## 1. Customer Lifetime Value (LTV) Analyse

### 1.1 Huidige LTV Berekening

```
Gemiddelde orderwaarde:          €700
Gemiddeld aantal orders/klant:   1.05
Bruto marge:                     70%
Acquisitiekosten (CAC):          €45

LTV = €700 × 1.05 × 0.70 = €515
LTV/CAC ratio = €515 / €45 = 11.4x ✅
```

### 1.2 LTV Potentieel (Na Retentie Optimalisatie)

```
Gemiddelde orderwaarde:          €750 (+7%)
Gemiddeld aantal orders/klant:   1.35 (+29%)
Bruto marge:                     70%

LTV = €750 × 1.35 × 0.70 = €709
LTV verbetering = +38%
```

### 1.3 Klant Cohort Analyse

| Cohort | Eerste order | Repeat rate | Avg repeat time | Referral rate |
|--------|-------------|-------------|-----------------|---------------|
| 2023 Q1 | €620 | 3% | 14 maanden | 5% |
| 2023 Q2 | €640 | 4% | 12 maanden | 6% |
| 2023 Q3 | €680 | 5% | 11 maanden | 7% |
| 2023 Q4 | €710 | 6% | - | 8% |
| **Trend** | **↑** | **↑** | **↓** | **↑** |

---

## 2. Retentie Strategie

### 2.1 Klant Levenscyclus

```
   ACQUISITIE          ACTIVATIE           RETENTIE           ADVOCACY
       │                   │                   │                  │
   Lead binnenkomst    Eerste project     Herhalingsaankoop   Referrals & 
       │               afgerond           Cross-sell          Reviews
       ▼                   ▼                   ▼                  ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐    ┌─────────────┐
│ Onboarding  │ ──▶ │  Succes     │ ──▶ │ Engagement  │ ──▶│  Ambassadeur│
│ Experience  │     │  Delivery   │     │  Programma  │    │  Programma  │
└─────────────┘     └─────────────┘     └─────────────┘    └─────────────┘
```

### 2.2 Touchpoint Mapping

| Fase | Timing | Kanaal | Doel |
|------|--------|--------|------|
| Post-delivery | +3 dagen | E-mail | Feedback verzoek |
| Check-in | +14 dagen | E-mail | NPS + support aanbod |
| Vergunning check | +8 weken | E-mail | Status vergunning |
| Bouw check | +4 maanden | E-mail/telefoon | Hoe gaat de bouw? |
| Anniversary | +12 maanden | E-mail | "Een jaar geleden..." |
| Seasonal | Mar/Sep | E-mail | Nieuwe plannen? |

### 2.3 Retentie E-mail Sequentie

**E-mail 1: Vergunning Check-in (+8 weken)**
```
Onderwerp: Hoe verloopt uw vergunningaanvraag?

Beste {{client_name}},

Ongeveer 8 weken geleden leverden wij de constructieberekening 
voor uw {{project_type}} op.

De meeste gemeentes hebben nu een beslissing genomen. 
Hoe is het verlopen?

○ ✅ Goedgekeurd! → [Gefeliciteerd, deel uw ervaring]
○ ⏳ Nog in behandeling → [Tips voor versnelling]
○ ❓ Vragen van gemeente → [Wij helpen kosteloos]
○ ❌ Afgewezen → [Neem direct contact op]

Met vriendelijke groet,
{{engineer_name}}
```

**E-mail 2: Bouw Check-in (+4 maanden)**
```
Onderwerp: Hoe gaat de bouw van uw {{project_type}}?

Beste {{client_name}},

Wij hopen dat uw bouwproject voorspoedig verloopt!

Heeft u of uw aannemer nog vragen over de constructie? 
Wij staan klaar om te helpen.

[💬 Stel een vraag] [⭐ Deel uw ervaring]

PS: Plant u al nieuwe verbouwingen? Als vaste klant krijgt u 
10% korting op uw volgende project.

Met vriendelijke groet,
Team Bureau Broersma
```

**E-mail 3: Anniversary (+12 maanden)**
```
Onderwerp: Een jaar geleden: uw {{project_type}} 🎂

Beste {{client_name}},

Precies een jaar geleden hebben wij de constructieberekening 
voor uw {{project_type}} opgeleverd.

Wij hopen dat u nog steeds geniet van uw verbouwing!

Als dank voor uw vertrouwen:
🎁 15% korting op uw volgende project (code: LOYAL15)
📧 Geldig tot {{expiry_date}}

Nieuwe plannen? Wij denken graag met u mee!

Met vriendelijke groet,
Team Bureau Broersma
```

---

## 3. Cross-sell & Upsell

### 3.1 Natuurlijke Cross-sell Paden

```
            ┌───────────────────────────────────────────┐
            │                                           │
            ▼                                           │
      ┌──────────┐                                      │
      │ Dakkapel │─────────────────┐                    │
      └──────────┘                 │                    │
            │                      ▼                    │
            │               ┌──────────────┐            │
            └──────────────▶│   Uitbouw    │────────────┤
                            └──────────────┘            │
                                   │                    │
                                   ▼                    │
                            ┌──────────────┐            │
                            │   Draagmuur  │────────────┤
                            └──────────────┘            │
                                   │                    │
                                   ▼                    │
                            ┌──────────────┐            │
                            │  Fundering   │            │
                            └──────────────┘            │
                                   │                    │
                                   ▼                    │
                            ┌──────────────────────┐    │
                            │ Volledige Renovatie  │◀───┘
                            └──────────────────────┘
```

### 3.2 Cross-sell Triggers

| Oorspronkelijke aankoop | Cross-sell | Timing | Trigger |
|------------------------|------------|--------|---------|
| Dakkapel | Uitbouw | +6 maanden | Seasonal campaign |
| Uitbouw | Draagmuur | +3 maanden | "Meer ruimte maken?" |
| Draagmuur | Uitbouw | +6 maanden | "Wat is uw volgende project?" |
| Kleine project | Groot project | +12 maanden | Anniversary |

### 3.3 Cross-sell E-mail Template

```
Onderwerp: Nu u een {{previous_project}} heeft... wat is het volgende?

Beste {{client_name}},

Na uw succesvolle {{previous_project}} vroeg ik me af: 
heeft u al nagedacht over de volgende stap?

Veel van onze klanten combineren een dakkapel met:

🏠 **Uitbouw** – Vergroot uw woonkamer of keuken
   Populair bij: Gezinnen met kinderen
   
🚪 **Draagmuur verwijderen** – Open woonkeuken creëren
   Populair bij: Moderne woonwensen

Als vaste klant profiteert u van:
✓ 10% korting op uw volgende project
✓ Prioriteit in de planning
✓ Dezelfde vertrouwde engineer

Interesse? Bel mij of beantwoord deze e-mail.

Met vriendelijke groet,
{{engineer_name}}
```

---

## 4. Loyaliteitsprogramma

### 4.1 Programma Structuur

**Naam:** Broersma Bouwclub

**Levels:**

| Level | Criteria | Voordelen |
|-------|----------|-----------|
| 🥉 **Brons** | 1 project | 5% korting repeat, nieuwsbrief |
| 🥈 **Zilver** | 2 projecten OF 1 referral | 10% korting, prioriteit planning |
| 🥇 **Goud** | 3+ projecten OF 3+ referrals | 15% korting, dedicated contact, VIP events |
| 💎 **Platinum** | €10.000+ lifetime spend | 20% korting, gratis adviesgesprekken |

### 4.2 Voordelen per Level

**Brons:**
- 5% korting op volgende project
- Maandelijkse nieuwsbrief met tips
- Toegang tot kennisbank

**Zilver:**
- 10% korting op volgende project
- Prioriteit in de planning (start binnen 48u)
- Gratis 30-min adviesgesprek per jaar
- Uitnodiging voor webinars

**Goud:**
- 15% korting op volgende project
- Dedicated accountmanager
- 24-uurs respons garantie
- Uitnodiging VIP events (nieuwjaarsborrel)
- Gratis bouw-check ter plaatse (1x/jaar)

**Platinum:**
- 20% korting op alle projecten
- Directe telefoonlijn
- Maatwerk SLA's
- Co-marketing mogelijkheden
- Eerste toegang tot nieuwe diensten

### 4.3 Communicatie naar Levels

**Upgrade e-mail (Brons → Zilver):**
```
Onderwerp: 🎉 U bent nu Zilver lid van de Broersma Bouwclub!

Beste {{client_name}},

Gefeliciteerd! Door uw tweede project bij ons bent u nu 
officieel Zilver lid van de Broersma Bouwclub.

Uw nieuwe voordelen:
✅ 10% korting op alle projecten
✅ Prioriteit in onze planning
✅ Gratis adviesgesprek (30 min/jaar)

Uw persoonlijke kortingscode: ZILVER-{{client_code}}

Nog 1 project of 2 referrals verwijderd van Goud status!

Met vriendelijke groet,
Team Bureau Broersma
```

---

## 5. Referral Programma

### 5.1 Referral Mechanisme

```
┌─────────────────────────────────────────────────────────────┐
│                    REFERRAL FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Bestaande klant                    Nieuwe klant           │
│        │                                  ▲                 │
│        ▼                                  │                 │
│   [Deel unieke link] ───────────────────▶ │                 │
│        │                                  │                 │
│        │    ┌──────────────────────┐      │                 │
│        └───▶│ Nieuwe klant meldt   │──────┘                 │
│             │ zich aan met link    │                        │
│             └──────────────────────┘                        │
│                        │                                    │
│                        ▼                                    │
│             ┌──────────────────────┐                        │
│             │ Nieuwe klant krijgt  │                        │
│             │ €50 korting          │                        │
│             └──────────────────────┘                        │
│                        │                                    │
│                        ▼                                    │
│             ┌──────────────────────┐                        │
│             │ Na afgerond project: │                        │
│             │ Verwijzer krijgt €100│                        │
│             └──────────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Referral Beloning Structuur

| Aantal referrals | Beloning per referral | Bonus |
|-----------------|----------------------|-------|
| 1-2 | €100 | - |
| 3-5 | €100 | +€50 bonus |
| 6-10 | €125 | +€100 bonus |
| 10+ | €150 | +€250 bonus + VIP status |

### 5.3 Referral Tracking Dashboard

**Voor klanten:**
```
┌─────────────────────────────────────────────────────────────┐
│                  UW REFERRAL DASHBOARD                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Uw unieke link:                                           │
│   [bureaubroersma.nl/ref/jdevries123] [📋 Kopieer]          │
│                                                             │
│   ─────────────────────────────────────────────────         │
│                                                             │
│   📊 Statistieken                                           │
│   ┌──────────────┬──────────────┬──────────────┐            │
│   │ Uitgenodigd  │  Aangemeld   │  Afgerond    │            │
│   │      5       │      3       │      2       │            │
│   └──────────────┴──────────────┴──────────────┘            │
│                                                             │
│   💰 Verdiend: €200                                         │
│   🎁 Openstaand: €100 (1 project in behandeling)            │
│                                                             │
│   ─────────────────────────────────────────────────         │
│                                                             │
│   📋 Recente activiteit:                                    │
│   • M. Jansen - Offerte verzonden (in afwachting)           │
│   • P. de Groot - Project afgerond ✅ (€100 uitgekeerd)     │
│   • A. Bakker - Aangemeld, nog geen offerte                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Churn Prevention

### 6.1 Churn Indicators

| Indicator | Score | Actie |
|-----------|-------|-------|
| Geen interactie 6+ maanden | -20 | Reactivatie e-mail |
| Negatieve feedback gegeven | -30 | Outreach door manager |
| Offerte afgewezen | -15 | Feedback vragen |
| Geen review achtergelaten | -5 | Herinnering sturen |
| E-mails niet geopend (3+) | -10 | Kanaal wisselen |

### 6.2 Win-back Campagne

**Timing:** 6 maanden geen activiteit

**E-mail 1:**
```
Onderwerp: We missen u, {{client_name}} 👋

Beste {{client_name}},

Het is even geleden dat wij contact hadden. 

Ik vroeg me af: heeft u nog bouwplannen?

Als welkomstgeschenk voor terugkerende klanten:
🎁 20% korting op uw volgende project (code: WELKOM20)

Geldig tot {{expiry_date}}.

Met vriendelijke groet,
{{engineer_name}}
```

### 6.3 Negatieve Feedback Afhandeling

**Protocol:**

1. **Binnen 4 uur:** Automatische bevestiging
2. **Binnen 24 uur:** Telefonisch contact door manager
3. **Binnen 48 uur:** Concrete oplossing voorgesteld
4. **Binnen 1 week:** Oplossing geïmplementeerd + check-in
5. **Binnen 1 maand:** Follow-up: tevreden met oplossing?

**Escalatie matrix:**

| Ernst | Actie |
|-------|-------|
| Minor (kleine vertraging) | Engineer belt klant |
| Medium (kwaliteitsissue) | Manager belt klant |
| Major (klacht, dreiging) | Directie belt klant |

---

## 7. Customer Success Metrics

### 7.1 Retentie Dashboard

| Metric | Huidige waarde | Target | Status |
|--------|----------------|--------|--------|
| Repeat customer rate | 5% | 15% | 🔴 |
| Time to repeat | 18 maanden | 12 maanden | 🟡 |
| NPS | 42 | 60 | 🟡 |
| Referral rate | 8% | 25% | 🔴 |
| Churn rate | N/A | <10% | - |
| Email engagement | 25% open | 35% open | 🟡 |

### 7.2 Cohort Retentie Curves

```
100% ─┬───────────────────────────────────────
      │\
  80% ─┼──\────────────────────────────────────
      │   \
  60% ─┼────\──────────────────────────────────
      │     \
  40% ─┼──────\────────────────────────────────
      │       \___
  20% ─┼───────────\___________________________
      │            
   0% ─┼───┬───┬───┬───┬───┬───┬───┬───┬───┬───
         M1  M2  M3  M4  M5  M6  M7  M8  M9  M10
         
      ─── Huidige cohorts
      ─── Target cohorts (na interventies)
```

---

## 8. Personalisatie Strategie

### 8.1 Klant Segmenten

| Segment | Criteria | Communicatie aanpak |
|---------|----------|---------------------|
| Starters | Eerste project, woning <5 jaar | Educatief, veel uitleg |
| Verbouwers | 2+ projecten | Cross-sell focus |
| Investeerders | Meerdere panden | B2B aanpak, volume |
| Professionals | Aannemer/architect | Partnership model |

### 8.2 Personalisatie Triggers

| Trigger | Actie |
|---------|-------|
| Project type: Dakkapel | Content over zolder inrichting |
| Project type: Uitbouw | Content over keuken/woonkamer |
| Locatie: Monument | Monumenten expertise benadrukken |
| Waarde: >€2.000 | Persoonlijke benadering |
| Repeat customer | Loyalty voordelen tonen |

---

*Laatst bijgewerkt: januari 2026*
*Customer Success eigenaar: Operations Team Bureau Broersma*
