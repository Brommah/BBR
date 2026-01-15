import 'dotenv/config'
import prisma from '../lib/db'

async function main() {
  // Check exact email match
  const email = 'cathleen.broersma@gmail.com'
  console.log('Looking for:', email)
  console.log('Lowercase:', email.toLowerCase())
  
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })
  
  console.log('\nFound user:', user ? JSON.stringify(user, null, 2) : 'NOT FOUND')
  
  // Also list all users
  const allUsers = await prisma.user.findMany({
    select: { email: true, name: true, role: true }
  })
  console.log('\nAll users in DB:')
  allUsers.forEach(u => console.log(`  ${u.email} -> ${u.name} (${u.role})`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
