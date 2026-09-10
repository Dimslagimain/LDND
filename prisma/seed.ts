import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const connectionString = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/ldnd'
const adapter = new PrismaMariaDb(connectionString)
const prisma = new PrismaClient({ adapter })

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID()
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `${salt}:${hashHex}`
}

const SEED_USERS = [
  { username: 'superadmin', password: 'superadmin123', role: 'SUPERADMIN' as const },
  { username: 'admin', password: 'admin123', role: 'ADMIN' as const },
  { username: 'user', password: 'user123', role: 'USER' as const },
]

async function main() {
  console.log('🌱 Seeding users...')

  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } })
    if (existing) {
      console.log(`  ⏭️  User "${u.username}" already exists, skipping.`)
      continue
    }

    const hashedPassword = await hashPassword(u.password)
    await prisma.user.create({
      data: {
        username: u.username,
        password: hashedPassword,
        role: u.role,
      },
    })
    console.log(`  ✅ Created user "${u.username}" with role ${u.role}`)
  }

  console.log('🎉 Seeding complete!')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
