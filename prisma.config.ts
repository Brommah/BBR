// Prisma 7 configuration
// See: https://pris.ly/d/config-datasource
import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Main connection URL for Prisma Client
    url: process.env.DATABASE_URL,
    // Direct URL bypasses connection pooling (for migrations)
    directUrl: process.env.DIRECT_URL,
  },
})
