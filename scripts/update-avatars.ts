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
  console.log('🖼️  Updating user avatars...')

  const avatarUpdates = [
    {
      email: 'cathleen.broersma@gmail.com',
      avatar: '/avatars/cathleen.png'
    },
    {
      email: 'cfbroersma@gmail.com',
      avatar: '/avatars/cees.png'
    }
  ]

  for (const update of avatarUpdates) {
    try {
      const result = await prisma.user.update({
        where: { email: update.email },
        data: { avatar: update.avatar }
      })
      console.log(`✅ Updated avatar for ${result.name} (${update.email})`)
    } catch (error) {
      console.log(`⚠️  User ${update.email} not found, skipping...`)
    }
  }

  // List all users with avatars
  const allUsers = await prisma.user.findMany({
    select: { name: true, email: true, avatar: true }
  })
  
  console.log('\n📋 All users with avatars:')
  allUsers.forEach(u => console.log(`   - ${u.name}: ${u.avatar || '(no avatar)'}`))

  console.log('\n🎉 Done!')
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
