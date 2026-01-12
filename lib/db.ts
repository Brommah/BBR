import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var pool: Pool | undefined
}

// Create connection pool (reuse in development)
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = globalThis.pool || new Pool({ connectionString })

if (process.env.NODE_ENV !== 'production') {
  globalThis.pool = pool
}

// Create Prisma adapter
const adapter = new PrismaPg(pool)

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma
