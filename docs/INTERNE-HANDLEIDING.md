# 📋 Broersma Engineer OS - Interne Handleiding

> **Voor intern gebruik** - Laatste update: januari 2026

## Inhoudsopgave

1. [Rollenstructuur](#1-rollenstructuur)
2. [Project Workflow](#2-project-workflow)
3. [Pipeline Statussen](#3-pipeline-statussen)
4. [Team Toewijzing & "Aan Zet" Systeem](#4-team-toewijzing--aan-zet-systeem)
5. [Offerte Proces](#5-offerte-proces)
6. [Email Automatisering](#6-email-automatisering)
7. [Documenten & Communicatie](#7-documenten--communicatie)
8. [Navigatie per Rol](#8-navigatie-per-rol)

---

## 1. Rollenstructuur

### 1.1 Admin (Fred & Pim)

**Beschrijving:** Volledige beheerdersrol met toegang tot alle functionaliteit.

| Gebied | Permissies |
|--------|------------|
| **Offertes** | Goedkeuren, afkeuren, indienen, bekijken, feedback geven |
| **Leads** | Aanmaken, toewijzen, alle leads zien, bewerken, verwijderen |
| **Admin** | Gebruikers beheren, tarieven beheren, instellingen wijzigen |

**Zichtbaarheid:**
- Ziet **alle projecten** in de pipeline
- Ziet projecten in **alle statussen** (inclusief offertefase)
- Volledige toegang tot admin dashboard

---

### 1.2 Projectleider (Femke & Rohina)

**Beschrijving:** Verantwoordelijk voor projectlevering en teamcoördinatie.

| Gebied | Permissies |
|--------|------------|
| **Offertes** | Indienen, bekijken, feedback geven |
| **Leads** | Aanmaken, bewerken, team toewijzen, "aan zet" bepalen |
| **Zichtbaarheid** | Alleen eigen toegewezen projecten |

**Belangrijke taken:**
- ✅ Wijst Rekenaar en Tekenaar toe aan projecten
- ✅ Bepaalt wie "aan zet" is
- ✅ Is contactpersoon voor de klant (wordt vermeld in offerte-email)
- ✅ Ziet projecten in alle statussen (voor eigen projecten)

**Zichtbaarheid:**
- Ziet alleen projecten waar zij als **Projectleider** zijn toegewezen
- Ziet deze projecten in alle statussen (inclusief offertefase)

---

### 1.3 Engineer - Rekenaar

**Beschrijving:** Maakt constructieve berekeningen.

| Gebied | Permissies |
|--------|------------|
| **Leads** | Alleen eigen toegewezen leads bekijken (wanneer "aan zet") |
| **Offertes** | Bekijken (alleen lezen) |
| **Uren** | Registreren op eigen projecten |

**Zichtbaarheid - Een Rekenaar ziet een project ALLEEN als:**
1. ✅ Status = **"Opdracht"** (offerte geaccepteerd)
2. ✅ Zij zijn toegewezen als **Rekenaar**
3. ✅ **"Aan zet"** staat op **"rekenaar"**

---

### 1.4 Engineer - Tekenaar

**Beschrijving:** Maakt technische tekeningen.

| Gebied | Permissies |
|--------|------------|
| **Leads** | Alleen eigen toegewezen leads bekijken (wanneer "aan zet") |
| **Offertes** | Bekijken (alleen lezen) |
| **Uren** | Registreren op eigen projecten |

**Zichtbaarheid - Een Tekenaar ziet een project ALLEEN als:**
1. ✅ Status = **"Opdracht"** (offerte geaccepteerd)
2. ✅ Zij zijn toegewezen als **Tekenaar**
3. ✅ **"Aan zet"** staat op **"tekenaar"**

---

## 2. Project Workflow

### 2.1 Hoofdproces

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. INTAKE
   └── Klant vult intake formulier in
       └── Lead wordt aangemaakt (Status: Nieuw)
       └── Email: Intake bevestiging → Klant
       └── Email: Nieuwe lead alert → Admins

2. CALCULATIE
   └── Admin/Projectleider wijst project toe
       └── Projectleider toegewezen
       └── Rekenaar toegewezen
       └── Tekenaar toegewezen
   └── Offerte wordt opgesteld
   └── Offerte ingediend ter goedkeuring (Status: Calculatie)
       └── Email: Offerte pending → Admins

3. OFFERTE FASE
   └── Admin keurt offerte goed/af
       ├── Goedgekeurd → Status: Offerte Verzonden
       │   └── Email: Offerte → Klant (met contactpersoon!)
       │   └── Email: Herinnering #1 → +4 dagen (automatisch)
       │   └── Email: Herinnering #2 → +10 dagen (automatisch)
       │
       └── Afgekeurd → Terug naar Calculatie
           └── Email: Afkeuring notificatie → Engineer

4. OPDRACHT
   └── Klant accepteert offerte (via secure link)
       └── Status: Opdracht
       └── Email: Opdracht bevestiging → Klant
   └── Projectleider zet "aan zet" naar Rekenaar
   └── Rekenaar maakt berekening
   └── Projectleider zet "aan zet" naar Tekenaar
   └── Tekenaar maakt tekeningen

5. ARCHIEF
   └── Project voltooid
       └── Status: Archief
       └── Email: Oplevering notificatie → Klant
       └── Email: Feedback verzoek → +3 dagen (automatisch)
       └── Email: NPS Survey → +14 dagen (automatisch)
```

---

## 3. Pipeline Statussen

| Status | Kleur | Beschrijving | Zichtbaar voor |
|--------|-------|--------------|----------------|
| **Nieuw** | 🔵 Blauw | Nieuwe aanvragen, nog niet opgepakt | Admin |
| **Calculatie** | 🟡 Amber | In berekening, offerte wordt opgesteld | Admin, Projectleider* |
| **Offerte Verzonden** | 🟣 Paars | Offerte naar klant, wacht op akkoord | Admin, Projectleider* |
| **Opdracht** | 🟢 Groen | Akkoord klant, werk in uitvoering | Admin, Projectleider*, Engineer** |
| **Archief** | ⚫ Grijs | Afgerond of vervallen | Admin, Projectleider* |

\* Alleen voor eigen toegewezen projecten  
\** Alleen wanneer toegewezen EN "aan zet"

---

## 4. Team Toewijzing & "Aan Zet" Systeem

### 4.1 Team Toewijzing

Elk project kan drie teamleden hebben:

| Rol | Veld | Beschrijving |
|-----|------|--------------|
| **Projectleider** | `assignedProjectleider` | Verantwoordelijk voor levering, contactpersoon klant |
| **Rekenaar** | `assignedRekenaar` | Maakt constructieve berekeningen |
| **Tekenaar** | `assignedTekenaar` | Maakt technische tekeningen |

### 4.2 "Aan Zet" Systeem

Het "Aan Zet" veld bepaalt wie momenteel aan het project werkt:

| Waarde | Betekenis |
|--------|-----------|
| `projectleider` | Projectleider is aan de beurt (coördinatie/review) |
| `rekenaar` | Rekenaar is aan de beurt (berekeningen maken) |
| `tekenaar` | Tekenaar is aan de beurt (tekeningen maken) |

**Belangrijk:** Rekenaar en Tekenaar werken **nooit** tegelijkertijd aan hetzelfde project!

### 4.3 Voorbeeld Workflow

```
Dag 1:  Klant accepteert offerte → Status = "Opdracht"
        Projectleider wijst Cees (Rekenaar) en Marieke (Tekenaar) toe
        Projectleider zet "Aan Zet" = rekenaar
        → Cees ziet project in zijn werkvoorraad

Dag 3:  Cees voltooit berekening
        Projectleider zet "Aan Zet" = tekenaar
        → Project verdwijnt bij Cees
        → Marieke ziet project in haar werkvoorraad

Dag 5:  Marieke voltooit tekeningen
        Projectleider zet status naar Archief
```

---

## 5. Offerte Proces

### 5.1 Offerte Goedkeuringsflow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│  Engineer maakt  │────►│  Admin beoordeelt│────►│  Offerte naar    │
│  offerte         │     │  offerte         │     │  klant           │
│                  │     │                  │     │                  │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                         ┌────────▼─────────┐
                         │                  │
                         │  Afgekeurd:      │
                         │  Terug naar      │
                         │  Engineer        │
                         │                  │
                         └──────────────────┘
```

### 5.2 Offerte Goedkeuringsstatus

| Status | Beschrijving |
|--------|--------------|
| `none` | Geen offerte ingediend |
| `pending` | Wacht op goedkeuring Admin |
| `approved` | Goedgekeurd, verzonden naar klant |
| `rejected` | Afgekeurd, revisie nodig |

### 5.3 Digitale Acceptatie

Klanten ontvangen een **beveiligde link** waarmee ze de offerte kunnen:
- Bekijken met alle details
- Digitaal accepteren (juridisch bindend)
- Algemene voorwaarden accepteren

De link is 30 dagen geldig en uniek per offerte.

---

## 6. Email Automatisering

### 6.1 Directe Emails (Event-triggered)

| Wanneer | Email | Ontvanger |
|---------|-------|-----------|
| Intake formulier ingevuld | Intake bevestiging | Klant |
| Intake formulier ingevuld | Nieuwe lead alert | Admins |
| Engineer toegewezen | Toewijzing notificatie | Engineer |
| Engineer toegewezen | Klant notificatie | Klant |
| Offerte ingediend | Pending approval | Admins |
| Offerte goedgekeurd | Offerte email + contactpersoon | Klant |
| Offerte afgekeurd | Afkeuring notificatie | Engineer |
| Status → Opdracht | Opdracht bevestiging | Klant |
| Status → Archief | Oplevering notificatie | Klant |

### 6.2 Geplande Emails (Cron - dagelijks 09:00)

| Timing | Email | Conditie |
|--------|-------|----------|
| +4 dagen | Offerte herinnering #1 | Status = Offerte Verzonden, geen respons |
| +10 dagen | Offerte herinnering #2 | Status = Offerte Verzonden, geen respons |
| +3 dagen | Feedback verzoek | Na oplevering |
| +14 dagen | NPS Survey | Na oplevering |
| +90 dagen | Reactivatie email | Lead inactief |

### 6.3 Contactpersoon in Emails

Wanneer een offerte wordt verzonden, wordt de **toegewezen Projectleider** automatisch vermeld als contactpersoon:

```
┌─────────────────────────────────────────────────────┐
│ 📧 Uw contactpersoon                                │
│                                                     │
│ Femke Broersma                                      │
│ femke@broersma-bouwadvies.nl                        │
│                                                     │
│ Voor al uw vragen over dit project kunt u           │
│ rechtstreeks contact opnemen met Femke.             │
└─────────────────────────────────────────────────────┘
```

---

## 7. Documenten & Communicatie

### 7.1 Document Categorieën

| Categorie | Beschrijving |
|-----------|--------------|
| `tekening` | Constructieve tekeningen |
| `offerte` | Offerte documenten (PDF) |
| `foto` | Foto's van locatie/project |
| `vergunning` | Vergunningsdocumenten |
| `correspondentie` | Email/brief correspondentie |
| `overig` | Overige documenten |

### 7.2 Communicatie Log

Alle communicatie met klanten wordt gelogd:
- **Email** - Verzonden/ontvangen emails
- **Telefoongesprek** - Gespreksnotities met duur
- **WhatsApp** - Berichten

### 7.3 Notities & @Mentions

- Teamleden kunnen notities toevoegen aan projecten
- Met **@mentions** kun je collega's taggen
- Emoji reacties mogelijk op notities
- @Mentioned personen krijgen een notificatie

---

## 8. Navigatie per Rol

### 8.1 Admin

| Menu-item | Functie |
|-----------|---------|
| 🏠 Home | Admin dashboard met overzicht |
| ➕ Nieuw Project | Handmatig project aanmaken |
| 📥 Inbox | Nieuwe aanvragen verwerken |
| 📊 Pipeline | Kanban overzicht alle projecten |
| 🔔 Meldingen | @-mentions en notificaties |

### 8.2 Projectleider

| Menu-item | Functie |
|-----------|---------|
| 🏠 Home | Dashboard met eigen projecten |
| ➕ Nieuw Project | Handmatig project aanmaken |
| 📊 Pipeline | Kanban overzicht eigen projecten |
| 🔔 Meldingen | @-mentions en notificaties |

### 8.3 Engineer (Rekenaar/Tekenaar)

| Menu-item | Functie |
|-----------|---------|
| 🏠 Home | Werkvoorraad (alleen "aan zet" projecten) |
| 🔔 Meldingen | @-mentions en notificaties |

---

## Appendix A: Project Types

Het systeem ondersteunt de volgende projecttypes:

| Type | Beschrijving |
|------|--------------|
| Dakkapel | Dakkapel plaatsen |
| Uitbouw | Uitbouw aan woning |
| Aanbouw | Aanbouw aan woning |
| Draagmuur verwijderen | Constructieve aanpassing |
| Kozijn vergroten | Kozijn aanpassing |
| Fundering herstel | Funderingswerkzaamheden |
| VvE constructie | VvE gerelateerd werk |
| Overig | Overige projecten |

---

## Appendix B: Prioriteiten

| Prioriteit | Beschrijving | Visueel |
|------------|--------------|---------|
| `normal` | Standaard prioriteit | Geen indicator |
| `high` | Hoge prioriteit | Oranje indicator |
| `urgent` | Urgent - directe aandacht nodig | Rode indicator |

---

## Appendix C: Urenregistratie

Engineers kunnen uren registreren per project:

| Categorie | Beschrijving |
|-----------|--------------|
| `calculatie` | Berekeningen maken |
| `overleg` | Intern overleg |
| `administratie` | Administratieve taken |
| `site-bezoek` | Locatiebezoek |
| `overig` | Overige werkzaamheden |

---

## Appendix D: Permissie Matrix

### Volledige Permissie Overzicht

| Permissie | Admin | Projectleider | Engineer |
|-----------|:-----:|:-------------:|:--------:|
| `quotes:approve` | ✅ | ❌ | ❌ |
| `quotes:reject` | ✅ | ❌ | ❌ |
| `quotes:submit` | ✅ | ✅ | ❌ |
| `quotes:view` | ✅ | ✅ | ✅ |
| `quotes:feedback` | ✅ | ✅ | ❌ |
| `leads:create` | ✅ | ✅ | ❌ |
| `leads:assign` | ✅ | ✅ | ❌ |
| `leads:view-all` | ✅ | ❌ | ❌ |
| `leads:view-own` | ✅ | ✅ | ✅ |
| `leads:view-offerte` | ✅ | ✅ | ❌ |
| `leads:edit` | ✅ | ✅ | ❌ |
| `leads:delete` | ✅ | ❌ | ❌ |
| `leads:set-aan-zet` | ✅ | ✅ | ❌ |
| `admin:access` | ✅ | ❌ | ❌ |
| `admin:manage-users` | ✅ | ❌ | ❌ |
| `admin:manage-pricing` | ✅ | ❌ | ❌ |
| `settings:view` | ✅ | ✅ | ✅ |
| `settings:edit` | ✅ | ❌ | ❌ |

---

## Contact

Bij vragen over dit systeem:
- **Technisch:** Martijn (ontwikkelaar)
- **Functioneel:** Fred/Pim (admins)

---

*Versie 1.0 - januari 2026*
