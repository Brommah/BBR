"use server"

import { notion, DATABASES } from "@/lib/notion"

export async function getKnowledgeBaseArticles() {
  return []
}

const PROJECT_TASKS = [
    { title: "Project Initialization (Next.js/TS)", status: "Klaar", priority: "Hoog" },
    { title: "Design System & Theme (Bureau Broersma)", status: "Klaar", priority: "Hoog" },
    { title: "Mission Control Dashboard", status: "Klaar", priority: "Hoog" },
    { title: "Lead Pipeline (Kanban)", status: "Klaar", priority: "Hoog" },
    { title: "Workstation (Detail View)", status: "Klaar", priority: "Hoog" },
    { title: "Quote Approval Workflow", status: "Klaar", priority: "Hoog" },
    { title: "Notion CRM Sync", status: "Klaar", priority: "Hoog" },
    { title: "Email Template Engine", status: "Klaar", priority: "Gemiddeld" },
    { title: "Resource Planning Calendar", status: "Klaar", priority: "Gemiddeld" },
    { title: "RBAC User Permissions", status: "Klaar", priority: "Gemiddeld" },
    { title: "NPS Feedback Dashboard", status: "Klaar", priority: "Laag" },
    { title: "Financial Roadmap View", status: "Klaar", priority: "Hoog" },
]

export async function syncRoadmapToNotion() {
    console.log("Syncing to Notion Roadmap:", DATABASES.ROADMAP)
    
    let count = 0;
    for (const task of PROJECT_TASKS) {
        try {
            await notion.pages.create({
                parent: { database_id: DATABASES.ROADMAP },
                properties: {
                    "Taaknaam": {
                        title: [
                            { text: { content: task.title } }
                        ]
                    },
                    "Status": {
                        status: { name: task.status }
                    },
                    "Stroom": {
                        select: { name: "Backoffice / CRM" }
                    },
                    "Prioriteit": {
                        select: { name: task.priority }
                    }
                }
            })
            count++;
        } catch (error) {
            console.error(`Failed to sync task ${task.title}:`, error)
        }
    }
    return { success: true, count }
}

export async function getRoadmapItems() {
    try {
        const response = await notion.databases.query({
            database_id: DATABASES.ROADMAP,
            sorts: [
                {
                    property: "Status",
                    direction: "ascending"
                }
            ]
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.results.map((page: any) => {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const props = page.properties as any;
             return {
                id: page.id,
                title: props.Taaknaam?.title[0]?.plain_text || "Untitled",
                status: props.Status?.status?.name || "Unknown",
                stream: props.Stroom?.select?.name || "Other"
            }
        })
    } catch (error) {
        console.error("Failed to fetch roadmap:", error)
        return []
    }
}

interface LeadToSync {
    id: string
    clientName: string
    projectType: string
    city: string
    status: string
    value: number
    assignee?: string
}

export async function syncLeadsToNotion(leads: LeadToSync[]) {
    console.log("Syncing leads to Notion CRM:", leads.length)
    
    let count = 0;
    for (const lead of leads) {
        try {
            await notion.pages.create({
                parent: { database_id: DATABASES.ROADMAP },
                properties: {
                    "Taaknaam": {
                        title: [
                            { text: { content: `[CRM] ${lead.clientName} - ${lead.projectType}` } }
                        ]
                    },
                    "Status": {
                        status: { 
                            name: lead.status === "Opdracht" ? "Klaar" : 
                                  lead.status === "Archief" ? "Niet gestart" : "Mee bezig" 
                        }
                    },
                    "Stroom": {
                        select: { name: "Backoffice / CRM" }
                    },
                    "Gerelateerde Documenten": {
                        rich_text: [
                            { text: { content: `${lead.city} | € ${lead.value} | Assigned: ${lead.assignee || 'Unassigned'}` } }
                        ]
                    }
                }
            })
            count++;
        } catch (error) {
            console.error(`Failed to sync lead ${lead.clientName}:`, error)
        }
    }
    return { success: true, count }
}

// System capabilities summary for Notion sync
const SYSTEM_CAPABILITIES = `
# Broersma Engineer OS - System Capabilities

## Implemented Features
1. **Mission Control Dashboard** - Engineer-focused view with active projects and incoming requests
2. **Lead Pipeline** - Kanban board with drag-drop, time decay indicators
3. **Workstation** - 3-column detail view (Context, Notes, Quote)
4. **Quote Builder** - Dynamic pricing with approval workflow
5. **Admin Quote Approval** - Mandatory approval before client send
6. **Email Template Engine** - Variable injection templates
7. **Resource Calendar** - Team planning visualization
8. **RBAC** - Role-based access control
9. **NPS Feedback** - Customer satisfaction tracking
10. **Financial Roadmap** - KPIs and strategic planning

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Shadcn UI
- Zustand (State)
- Notion API (CRM Sync)
- Recharts (Visualization)
`

export async function syncSystemOverviewToNotion() {
    try {
        // Create a page in the Hub with system overview
        const page = await notion.pages.create({
            parent: { page_id: "2e64aa9e-dbb9-8086-9198-d0a79a18c877" },
            properties: {
                title: {
                    title: [{ text: { content: "Engineer OS - System Overview" } }]
                }
            },
            children: [
                {
                    object: "block",
                    type: "heading_2",
                    heading_2: {
                        rich_text: [{ text: { content: "Implemented Features" } }]
                    }
                },
                {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [{ text: { content: SYSTEM_CAPABILITIES } }]
                    }
                }
            ]
        })
        return { success: true, pageId: page.id }
    } catch (error) {
        console.error("Failed to sync system overview:", error)
        return { success: false }
    }
}
