import 'dotenv/config'
import prisma from '../lib/db'

async function main() {
  // Names to keep
  const keepNames = ['Jan de Vries', 'Catharina Geusau']
  
  // Get all leads
  const allLeads = await prisma.lead.findMany({ 
    select: { id: true, clientName: true },
    where: { deletedAt: null }
  })
  console.log('Total leads:', allLeads.length)
  
  // Filter leads to delete
  const toDelete = allLeads.filter(l => !keepNames.includes(l.clientName))
  const toKeep = allLeads.filter(l => keepNames.includes(l.clientName))
  
  console.log('Keeping:', toKeep.map(l => l.clientName))
  console.log('Deleting:', toDelete.length, 'leads')
  
  // Delete leads (cascade will handle related records)
  for (const lead of toDelete) {
    await prisma.lead.delete({ where: { id: lead.id } })
    console.log('  Deleted:', lead.clientName)
  }
  
  console.log('\nDone! Remaining leads:', toKeep.length)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
