import { PrismaClient, Plan } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [email, planArg] = process.argv.slice(2)

  if (!email || !planArg) {
    console.error('Usage: tsx scripts/set-plan.ts <email> <plan>')
    console.error('  Plans: free | pro | business | enterprise')
    process.exit(1)
  }

  const planMap: Record<string, Plan> = {
    free: Plan.FREE,
    pro: Plan.PRO,
    business: Plan.BUSINESS,
    enterprise: Plan.ENTERPRISE,
  }

  const plan = planMap[planArg.toLowerCase()]
  if (!plan) {
    console.error(`Unknown plan "${planArg}". Valid: free, pro, business, enterprise`)
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`✗ User not found: ${email}`)
    process.exit(1)
  }

  await prisma.user.update({
    where: { email },
    data: { plan },
  })

  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { trialEndsAt: null },
  })

  const planLabel = plan.charAt(0) + plan.slice(1).toLowerCase()
  console.log(`✓ User ${email} upgraded to ${planLabel}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
