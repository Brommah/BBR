import 'dotenv/config'
import prisma from '../lib/db'

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      engineerType: true
    },
    orderBy: { email: 'asc' }
  })
  console.log('Users in database:')
  users.forEach(u => {
    console.log(`- ${u.email}: role=${u.role}, engineerType=${u.engineerType || 'null'}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
