/**
 * Cleanup script to delete all leads except "Jan de Vries"
 * Run with: npx tsx scripts/cleanup-leads.ts
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

async function main() {
    console.log('🔍 Finding leads to delete...')
    
    // Find all leads NOT named "Jan de Vries"
    const leadsToDelete = await prisma.lead.findMany({
        where: {
            NOT: {
                clientName: {
                    contains: 'Jan de Vries',
                    mode: 'insensitive'
                }
            }
        },
        select: {
            id: true,
            clientName: true,
            projectType: true,
            city: true
        }
    })

    console.log(`📋 Found ${leadsToDelete.length} leads to delete:`)
    leadsToDelete.forEach(lead => {
        console.log(`   - ${lead.clientName} (${lead.projectType}, ${lead.city})`)
    })

    if (leadsToDelete.length === 0) {
        console.log('✅ No leads to delete. Only Jan de Vries remains.')
        return
    }

    // Delete all related records first (cascade should handle this, but let's be explicit)
    const leadIds = leadsToDelete.map(l => l.id)

    console.log('\n🗑️ Deleting leads and related records...')

    // Delete leads (cascade will handle related records)
    const result = await prisma.lead.deleteMany({
        where: {
            id: {
                in: leadIds
            }
        }
    })

    console.log(`✅ Deleted ${result.count} leads successfully!`)

    // Verify what remains
    const remaining = await prisma.lead.findMany({
        select: {
            clientName: true,
            projectType: true,
            city: true,
            status: true
        }
    })

    console.log('\n📌 Remaining leads:')
    remaining.forEach(lead => {
        console.log(`   - ${lead.clientName} (${lead.projectType}, ${lead.city}) - ${lead.status}`)
    })
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
