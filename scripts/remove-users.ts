/**
 * Script to remove specific users from the database
 * 
 * Usage: npx tsx scripts/remove-users.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Users to remove (by name or email)
const USERS_TO_REMOVE = [
  'Fred',
  'Pim',
  // Add more names/emails here if needed
]

async function removeUsers() {
  console.log('🔍 Zoeken naar gebruikers om te verwijderen...\n')

  for (const identifier of USERS_TO_REMOVE) {
    // Find user by name or email (case insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: identifier, mode: 'insensitive' } },
          { email: { contains: identifier, mode: 'insensitive' } },
        ],
        deletedAt: null, // Only active users
      },
    })

    if (user) {
      console.log(`👤 Gevonden: ${user.name} (${user.email})`)
      
      // Soft delete the user
      await prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      })
      
      console.log(`   ✅ Verwijderd (soft delete)\n`)
    } else {
      console.log(`⚠️  Gebruiker "${identifier}" niet gevonden of al verwijderd\n`)
    }
  }

  console.log('✅ Klaar!')
}

removeUsers()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
    await prisma.$disconnect()
  })
