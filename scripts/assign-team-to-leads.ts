/**
 * Script to assign Rekenaar and Tekenaar to all leads that don't have them assigned
 * Run with: npx tsx scripts/assign-team-to-leads.ts
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

async function assignTeamToLeads() {
  console.log('🔍 Fetching engineers from database...')
  
  // Get all engineers
  const engineers = await prisma.user.findMany({
    where: { 
      role: 'engineer',
      deletedAt: null 
    },
    select: {
      id: true,
      name: true,
      engineerType: true
    }
  })
  
  console.log(`Found ${engineers.length} engineers:`)
  engineers.forEach(e => console.log(`  - ${e.name} (${e.engineerType || 'no type'})`))
  
  // Separate by type
  const rekenaars = engineers.filter(e => e.engineerType === 'rekenaar')
  const tekenaars = engineers.filter(e => e.engineerType === 'tekenaar')
  
  // If no specific types, use all engineers for both roles
  const availableRekenaars = rekenaars.length > 0 ? rekenaars : engineers
  const availableTekenaars = tekenaars.length > 0 ? tekenaars : engineers
  
  console.log(`\n📊 Available for assignment:`)
  console.log(`  Rekenaars: ${availableRekenaars.map(e => e.name).join(', ') || 'None'}`)
  console.log(`  Tekenaars: ${availableTekenaars.map(e => e.name).join(', ') || 'None'}`)
  
  if (availableRekenaars.length === 0 && availableTekenaars.length === 0) {
    console.log('\n❌ No engineers found to assign. Please add engineers first.')
    return
  }
  
  // Get all leads without team assignments
  const leadsWithoutTeam = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      OR: [
        { assignedRekenaar: null },
        { assignedTekenaar: null }
      ]
    },
    select: {
      id: true,
      clientName: true,
      assignedRekenaar: true,
      assignedTekenaar: true,
      status: true
    }
  })
  
  console.log(`\n📋 Found ${leadsWithoutTeam.length} leads needing team assignment`)
  
  if (leadsWithoutTeam.length === 0) {
    console.log('✅ All leads already have team members assigned!')
    return
  }
  
  // Assign team members round-robin style
  let rekenaarIndex = 0
  let tekenaarIndex = 0
  let updatedCount = 0
  
  for (const lead of leadsWithoutTeam) {
    const updates: { assignedRekenaar?: string; assignedTekenaar?: string } = {}
    
    // Assign rekenaar if missing
    if (!lead.assignedRekenaar && availableRekenaars.length > 0) {
      updates.assignedRekenaar = availableRekenaars[rekenaarIndex % availableRekenaars.length].name
      rekenaarIndex++
    }
    
    // Assign tekenaar if missing
    if (!lead.assignedTekenaar && availableTekenaars.length > 0) {
      updates.assignedTekenaar = availableTekenaars[tekenaarIndex % availableTekenaars.length].name
      tekenaarIndex++
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: updates
      })
      
      console.log(`  ✓ ${lead.clientName}: Rekenaar=${updates.assignedRekenaar || lead.assignedRekenaar || 'unchanged'}, Tekenaar=${updates.assignedTekenaar || lead.assignedTekenaar || 'unchanged'}`)
      updatedCount++
    }
  }
  
  console.log(`\n✅ Updated ${updatedCount} leads with team assignments`)
  
  // Show final summary
  const allLeads = await prisma.lead.findMany({
    where: { deletedAt: null },
    select: {
      clientName: true,
      assignedRekenaar: true,
      assignedTekenaar: true,
      status: true
    }
  })
  
  console.log('\n📊 Final Summary:')
  allLeads.forEach(l => {
    console.log(`  ${l.clientName}: R=${l.assignedRekenaar || '❌'}, T=${l.assignedTekenaar || '❌'}, Status=${l.status}`)
  })
}

assignTeamToLeads()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
