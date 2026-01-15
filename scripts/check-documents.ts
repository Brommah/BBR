import 'dotenv/config'
import prisma from '../lib/db'

async function main() {
  const docs = await prisma.document.findMany({
    select: {
      id: true,
      name: true,
      url: true,
      leadId: true
    },
    take: 20
  })
  
  console.log('Documents in database:', docs.length)
  docs.forEach(d => {
    const isPlaceholder = d.url.startsWith('/documents/') || !d.url.includes('supabase')
    console.log(`${isPlaceholder ? '❌' : '✅'} ${d.name}`)
    console.log(`   URL: ${d.url.substring(0, 80)}...`)
  })
  
  // Count placeholder vs real URLs
  const allDocs = await prisma.document.findMany({ select: { url: true } })
  const placeholders = allDocs.filter(d => d.url.startsWith('/documents/') || !d.url.includes('supabase'))
  console.log(`\nTotal: ${allDocs.length} documents`)
  console.log(`Placeholder URLs: ${placeholders.length}`)
  console.log(`Real Supabase URLs: ${allDocs.length - placeholders.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
