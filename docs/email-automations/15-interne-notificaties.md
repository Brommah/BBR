# 📧 E-mail Automatisering: Interne Notificaties

## Overzicht
Interne e-mails voor team leden bij belangrijke events in het systeem.

---

## 1. Nieuwe Lead Notificatie

**Trigger:** Nieuwe lead aangemaakt  
**Ontvanger:** Team lead + beschikbare engineers  
**Timing:** Direct

**Onderwerp:**
```
🆕 Nieuwe lead: {{project_type}} in {{city}} (€{{estimated_value}})
```

**Body:**
```
Nieuwe lead binnengekomen!

📋 Details:
• Klant: {{client_name}}
• Project: {{project_type}}
• Locatie: {{address}}, {{city}}
• Geschatte waarde: €{{estimated_value}}
• Urgentie: {{is_urgent ? "⚠️ SPOED" : "Normaal"}}
• Bron: {{lead_source}}

📊 Huidige workload team:
• Angelo: {{angelo_workload}} leads
• Venka: {{venka_workload}} leads
• Roina: {{roina_workload}} leads

[OPEN IN BACKOFFICE]({{lead_url}})
[TOEWIJZEN AAN MIJZELF]({{quick_assign_url}})
```

---

## 2. Offerte Goedkeuring Vereist

**Trigger:** Engineer submit offerte voor goedkeuring  
**Ontvanger:** Admin/Manager  
**Timing:** Direct

**Onderwerp:**
```
⏳ Offerte ter goedkeuring: {{client_name}} – {{project_type}} (€{{quote_value}})
```

**Body:**
```
Een offerte wacht op jouw goedkeuring.

📋 Offerte details:
• Klant: {{client_name}}
• Project: {{project_type}}
• Locatie: {{city}}
• Offertebedrag: €{{quote_value}} (excl. BTW)
• Ingediend door: {{engineer_name}}
• Ingediend op: {{submitted_at}}

📊 Calculatie breakdown:
• Basisprijs template: €{{base_price}}
• Toeslagen: €{{surcharges}}
• Korting: -€{{discount}}
• Totaal: €{{quote_value}}

💬 Notitie van engineer:
"{{engineer_note}}"

[GOEDKEUREN ✅]({{approve_url}}) [AFWIJZEN ❌]({{reject_url}}) [BEKIJKEN]({{quote_url}})
```

---

## 3. Offerte Goedgekeurd/Afgewezen

**Trigger:** Manager keurt offerte goed of af  
**Ontvanger:** Ingediende engineer  
**Timing:** Direct

**Onderwerp (goedgekeurd):**
```
✅ Offerte goedgekeurd: {{client_name}} – {{project_type}}
```

**Onderwerp (afgewezen):**
```
❌ Offerte afgewezen: {{client_name}} – wijziging nodig
```

**Body (afgewezen):**
```
Je offerte is afgewezen door {{manager_name}}.

📋 Reden:
"{{rejection_reason}}"

📝 Gevraagde aanpassingen:
{{rejection_feedback}}

[OFFERTE AANPASSEN]({{edit_quote_url}})
```

---

## 4. Betaling Ontvangen

**Trigger:** Betaling geregistreerd  
**Ontvanger:** Engineer + Administratie  
**Timing:** Direct

**Onderwerp:**
```
💰 Betaling ontvangen: {{client_name}} – €{{amount}}
```

**Body:**
```
Goed nieuws! Betaling ontvangen.

📋 Details:
• Klant: {{client_name}}
• Factuurnummer: {{invoice_number}}
• Bedrag: €{{amount}}
• Betaalmethode: {{payment_method}}
• Project: {{project_type}}

⏱️ Actie vereist:
De klant verwacht oplevering binnen {{delivery_sla}} werkdagen.

[START BEREKENING]({{lead_url}})
```

---

## 5. Deadline Alert

**Trigger:** Lead in Calculatie > X dagen zonder voortgang  
**Ontvanger:** Toegewezen engineer + manager  
**Timing:** Dagelijks om 09:00

**Onderwerp:**
```
⚠️ Deadline alert: {{count}} projecten vereisen aandacht
```

**Body:**
```
De volgende projecten hebben aandacht nodig:

{{#each overdue_leads}}
🔴 {{this.client_name}} – {{this.project_type}}
   Status: {{this.status}} | Dagen open: {{this.days_open}}
   [OPENEN]({{this.url}})
{{/each}}

{{#each approaching_deadline_leads}}
🟡 {{this.client_name}} – {{this.project_type}}
   Deadline: {{this.deadline}} (over {{this.days_remaining}} dagen)
   [OPENEN]({{this.url}})
{{/each}}

---

Totaal openstaand: {{total_overdue}} projecten
```

---

## 6. Negatieve Feedback Alert

**Trigger:** NPS score 0-6 of negatieve review  
**Ontvanger:** Manager + betrokken engineer  
**Timing:** Direct (URGENT)

**Onderwerp:**
```
🚨 URGENT: Negatieve feedback ontvangen – {{client_name}}
```

**Body:**
```
⚠️ ACTIE VEREIST BINNEN 24 UUR

Een klant heeft negatieve feedback gegeven.

📋 Details:
• Klant: {{client_name}}
• Project: {{project_type}}
• Engineer: {{engineer_name}}
• Opleverdatum: {{delivery_date}}

📊 Feedback:
• NPS Score: {{nps_score}}/10
• Toelichting: "{{feedback_text}}"

📞 Contact:
• Telefoon: {{client_phone}}
• E-mail: {{client_email}}

[BEL KLANT NU](tel:{{client_phone}}) [BEKIJK VOLLEDIGE FEEDBACK]({{feedback_url}})

---

Escalatieprotocol:
1. Manager belt klant binnen 24 uur
2. Documenteer gesprek in CRM
3. Bied oplossing aan
4. Follow-up na 1 week
```

---

## 7. Wekelijkse Performance Samenvatting

**Trigger:** Cron job  
**Ontvanger:** Alle engineers + management  
**Timing:** Maandag 08:00

**Onderwerp:**
```
📊 Weekoverzicht {{week_number}}: {{total_revenue}} omzet, {{conversion_rate}}% conversie
```

**Body:**
```
Goedemorgen team! Hier is het overzicht van vorige week.

---

## 📈 KPI's Week {{week_number}}

| Metric | Deze week | Vorige week | Trend |
|--------|-----------|-------------|-------|
| Nieuwe leads | {{new_leads}} | {{prev_new_leads}} | {{new_leads_trend}} |
| Verstuurde offertes | {{quotes_sent}} | {{prev_quotes_sent}} | {{quotes_trend}} |
| Geaccepteerde offertes | {{quotes_accepted}} | {{prev_quotes_accepted}} | {{accepted_trend}} |
| Conversieratio | {{conversion_rate}}% | {{prev_conversion}}% | {{conversion_trend}} |
| Omzet | €{{total_revenue}} | €{{prev_revenue}} | {{revenue_trend}} |
| Gem. doorlooptijd | {{avg_lead_time}} dagen | {{prev_lead_time}} dagen | {{lead_time_trend}} |

---

## 🏆 Top performers

1. {{top_performer_1}} – {{top_performer_1_revenue}} omzet
2. {{top_performer_2}} – {{top_performer_2_revenue}} omzet
3. {{top_performer_3}} – {{top_performer_3_revenue}} omzet

---

## ⚠️ Aandachtspunten

• {{attention_point_1}}
• {{attention_point_2}}

---

## 📅 Deze week

• Leads in pipeline: {{pipeline_value}}
• Verwachte opleveringen: {{expected_deliveries}}

[OPEN DASHBOARD]({{dashboard_url}})

---

Fijne week! 💪
```

---

## Configuratie

| Notificatie | Slack | E-mail | Push |
|-------------|-------|--------|------|
| Nieuwe lead | ✅ | ✅ | ✅ |
| Offerte goedkeuring | ✅ | ✅ | ❌ |
| Betaling ontvangen | ✅ | ✅ | ❌ |
| Deadline alert | ✅ | ✅ | ✅ |
| Negatieve feedback | ✅ | ✅ | ✅ |
| Wekelijks overzicht | ❌ | ✅ | ❌ |
