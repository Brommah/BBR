/**
 * Script to:
 * 1. Set Roina (Rohina) and Femke as projectleiders
 * 2. Clean up test data (Rate Limit Test, E2E Test User leads)
 * 3. Assign projectleiders to all remaining leads
 * 
 * Run with: npx tsx scripts/setup-projectleiders.ts
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

async function setupProjectleiders() {
  console.log('🔧 Setting up Projectleiders...\n')

  // Step 1: Update users to be projectleiders
  console.log('1️⃣ Updating user roles...')
  
  // Find and update Roina (spelled Rohina in conversation)
  const roina = await prisma.user.findFirst({
    where: { name: { contains: 'Roina', mode: 'insensitive' } }
  })
  
  if (roina) {
    await prisma.user.update({
      where: { id: roina.id },
      data: { role: 'projectleider' }
    })
    console.log(`  ✓ Updated ${roina.name} to Projectleider`)
  } else {
    console.log('  ⚠ Could not find Roina in database')
  }
  
  // Find and update Femke
  const femke = await prisma.user.findFirst({
    where: { name: { contains: 'Femke', mode: 'insensitive' } }
  })
  
  if (femke) {
    await prisma.user.update({
      where: { id: femke.id },
      data: { role: 'projectleider' }
    })
    console.log(`  ✓ Updated ${femke.name} to Projectleider`)
  } else {
    // Create Femke if she doesn't exist
    console.log('  ℹ Femke not found, creating...')
    await prisma.user.create({
      data: {
        name: 'Femke',
        email: 'femke@broersmabouwadvies.nl',
        role: 'projectleider'
      }
    })
    console.log('  ✓ Created Femke as Projectleider')
  }

  // Step 2: Clean up test data
  console.log('\n2️⃣ Cleaning up test data...')
  
  const testLeads = await prisma.lead.findMany({
    where: {
      OR: [
        { clientName: { contains: 'Rate Limit Test' } },
        { clientName: { contains: 'E2E Test' } }
      ],
      deletedAt: null
    }
  })
  
  console.log(`  Found ${testLeads.length} test leads to remove`)
  
  if (testLeads.length > 0) {
    // Soft delete test leads
    await prisma.lead.updateMany({
      where: {
        id: { in: testLeads.map(l => l.id) }
      },
      data: {
        deletedAt: new Date()
      }
    })
    console.log(`  ✓ Soft-deleted ${testLeads.length} test leads`)
  }

  // Step 3: Get projectleiders and assign to leads
  console.log('\n3️⃣ Assigning projectleiders to leads...')
  
  const projectleiders = await prisma.user.findMany({
    where: { 
      role: 'projectleider',
      deletedAt: null 
    },
    select: { id: true, name: true }
  })
  
  console.log(`  Found ${projectleiders.length} projectleiders: ${projectleiders.map(p => p.name).join(', ')}`)
  
  if (projectleiders.length === 0) {
    console.log('  ❌ No projectleiders found!')
    return
  }
  
  // Get all leads without projectleider
  const leadsWithoutPL = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      assignedProjectleider: null
    },
    select: { id: true, clientName: true }
  })
  
  console.log(`  Found ${leadsWithoutPL.length} leads without projectleider`)
  
  // Assign round-robin
  let plIndex = 0
  for (const lead of leadsWithoutPL) {
    const pl = projectleiders[plIndex % projectleiders.length]
    
    await prisma.lead.update({
      where: { id: lead.id },
      data: { assignedProjectleider: pl.name }
    })
    
    console.log(`  ✓ ${lead.clientName} → ${pl.name}`)
    plIndex++
  }

  // Step 4: Show final summary
  console.log('\n📊 Final Summary:\n')
  
  // Show all users with roles
  const allUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { name: true, email: true, role: true },
    orderBy: { role: 'asc' }
  })
  
  console.log('Users:')
  allUsers.forEach(u => {
    console.log(`  ${u.name} (${u.email}) - ${u.role}`)
  })
  
  // Show all active leads with team
  const allLeads = await prisma.lead.findMany({
    where: { deletedAt: null },
    select: {
      clientName: true,
      assignedProjectleider: true,
      assignedRekenaar: true,
      assignedTekenaar: true,
      status: true
    }
  })
  
  console.log(`\nLeads (${allLeads.length} active):`)
  allLeads.forEach(l => {
    console.log(`  ${l.clientName}: PL=${l.assignedProjectleider || '❌'}, R=${l.assignedRekenaar || '❌'}, T=${l.assignedTekenaar || '❌'}`)
  })
}

setupProjectleiders()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
