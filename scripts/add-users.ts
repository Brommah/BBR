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
  console.log('👥 Adding new users...')

  const newUsers = [
    {
      name: 'Cathleen Broersma',
      email: 'cathleen.broersma@gmail.com',
      role: 'admin'
    },
    {
      name: 'CF Broersma',
      email: 'cfbroersma@gmail.com',
      role: 'engineer'
    },
    {
      name: 'Martijn Broersma',
      email: 'martijn.broersma@gmail.com',
      role: 'admin'
    }
  ]

  for (const user of newUsers) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (existing) {
      console.log(`⚠️  User ${user.email} already exists, updating role to ${user.role}...`)
      await prisma.user.update({
        where: { email: user.email },
        data: { name: user.name, role: user.role }
      })
    } else {
      await prisma.user.create({ data: user })
      console.log(`✅ Created user: ${user.name} (${user.email}) - ${user.role}`)
    }
  }

  // List all users
  const allUsers = await prisma.user.findMany({
    select: { name: true, email: true, role: true }
  })
  
  console.log('\n📋 All users in database:')
  allUsers.forEach(u => console.log(`   - ${u.name} (${u.email}) [${u.role}]`))

  console.log('\n🎉 Done!')
  console.log('\n⚠️  IMPORTANT: You still need to add these users to Supabase Auth!')
  console.log('   Go to: https://supabase.com/dashboard → Your Project → Authentication → Users')
  console.log('   Click "Add user" for each:')
  console.log('   1. cathleen.broersma@gmail.com (set a password)')
  console.log('   2. cfbroersma@gmail.com (set a password)')
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
    await prisma.$disconnect()
  })
