import { PrismaClient, type User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from './emailService.js'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

export async function registerUser(email: string, password: string, name?: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('EMAIL_TAKEN')

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: { email, passwordHash, name, provider: 'local' },
  })

  // Send welcome email (non-blocking)
  sendWelcomeEmail(email, name).catch((e) =>
    console.error('[email] Failed to send welcome email:', e),
  )

  return user
}

export async function loginUser(email: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) throw new Error('INVALID_CREDENTIALS')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  return user
}

export async function findOrCreateOAuthUser(params: {
  email: string
  provider: string
  providerId: string
  name?: string
  avatarUrl?: string
}): Promise<User> {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: params.email },
        { provider: params.provider, providerId: params.providerId },
      ],
    },
  })

  if (existing) {
    if (!existing.providerId) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          provider: params.provider,
          providerId: params.providerId,
          avatarUrl: params.avatarUrl ?? existing.avatarUrl,
        },
      })
    }
    return existing
  }

  const user = await prisma.user.create({
    data: {
      email: params.email,
      provider: params.provider,
      providerId: params.providerId,
      name: params.name,
      avatarUrl: params.avatarUrl,
    },
  })

  sendWelcomeEmail(params.email, params.name).catch((e) =>
    console.error('[email] Failed to send welcome email:', e),
  )

  return user
}

export function buildTokenPayload(user: User) {
  return { sub: user.id, email: user.email, plan: user.plan }
}
