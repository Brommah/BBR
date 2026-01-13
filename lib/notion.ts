import { Client } from "@notionhq/client"

export const notion = new Client({
  auth: process.env.NOTION_API_KEY || "",
})

export const DATABASES = {
  ROADMAP: "2e64aa9e-dbb9-806a-a134-ea8b9e6529a2",
  // Placeholder IDs until discovered/needed
  CONTENT_BLOCKS: "2dcd8000-83d6-811e-a818-d42841fe8368", 
  GENERATED: "2ded8000-83d6-811f-a5d5-c16144ff8277",
}

// Main Notion page IDs
export const NOTION_PAGES = {
  // Broersma Projects Hub - main parent page
  PROJECTS_HUB: "2e64aa9e-dbb9-8086-9198-d0a79a18c877",
  // Simple Backoffice Wiki page
  SIMPLE_BACKOFFICE_WIKI: "2e64aa9e-dbb9-8042-bc62-d32ab9516461",
}
