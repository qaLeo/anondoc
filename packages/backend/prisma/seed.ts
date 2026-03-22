/**
 * Production seed — idempotent, safe to run multiple times.
 * Creates an admin user if ADMIN_EMAIL + ADMIN_PASSWORD are set and the user doesn't exist yet.
 *
 * Run: pnpm db:seed
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (!existing) {
      const passwordHash = await hash(adminPassword, 12)
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: 'Admin',
          plan: 'ENTERPRISE',
        },
      })
      console.log(`✓ Admin user created: ${adminEmail}`)
    } else {
      console.log(`⏭  Admin user already exists: ${adminEmail}`)
    }
  } else {
    console.log('⏭  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user creation')
  }

  console.log('✓ Seed complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
