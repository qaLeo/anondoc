import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  registerUser,
  loginUser,
  findOrCreateOAuthUser,
  buildTokenPayload,
} from '../services/authService.js'
import { isDisposableEmail } from '../utils/emailValidator.js'

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string(),
})

const ACCESS_TTL = '15m'
const REFRESH_TTL = '30d'
const REFRESH_TTL_SEC = 30 * 24 * 60 * 60 // 30 days in seconds

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/auth/refresh',
  maxAge: 60 * 60 * 24 * 30,
}

async function issueTokens(
  app: FastifyInstance,
  payload: { sub: string; email: string; plan: string },
) {
  const jti = randomUUID()
  const accessToken = app.jwt.sign(payload, { expiresIn: ACCESS_TTL })
  const refreshToken = app.jwt.sign({ ...payload, jti }, { expiresIn: REFRESH_TTL })
  if (app.redis) {
    await app.redis.set(`refresh:jti:${jti}`, '1', 'EX', REFRESH_TTL_SEC)
  }
  return { accessToken, refreshToken, jti }
}

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/register', async (req, reply) => {
    let body: z.infer<typeof RegisterBody>
    try {
      body = RegisterBody.parse(req.body)
    } catch {
      return reply.status(400).send({ error: 'Invalid input' })
    }
    if (isDisposableEmail(body.email)) {
      return reply.status(400).send({ error: 'DISPOSABLE_EMAIL' })
    }
    try {
      const user = await registerUser(body.email, body.password, body.name)
      const { accessToken, refreshToken } = await issueTokens(app, buildTokenPayload(user))
      reply
        .setCookie('refreshToken', refreshToken, COOKIE_OPTS)
        .send({ accessToken, user: { id: user.id, email: user.email, plan: user.plan } })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg === 'EMAIL_TAKEN') return reply.status(409).send({ error: 'EMAIL_TAKEN' })
      throw e
    }
  })

  // POST /auth/login — brute-force protection: 5 attempts per 15 min per IP
  app.post('/login', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes', keyGenerator: (req) => req.ip } },
  }, async (req, reply) => {
    let body: z.infer<typeof LoginBody>
    try {
      body = LoginBody.parse(req.body)
    } catch {
      return reply.status(400).send({ error: 'Invalid input' })
    }
    try {
      const user = await loginUser(body.email, body.password)
      const { accessToken, refreshToken } = await issueTokens(app, buildTokenPayload(user))
      reply
        .setCookie('refreshToken', refreshToken, COOKIE_OPTS)
        .send({ accessToken, user: { id: user.id, email: user.email, plan: user.plan } })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg === 'INVALID_CREDENTIALS') return reply.status(401).send({ error: 'INVALID_CREDENTIALS' })
      throw e
    }
  })

  // POST /auth/refresh — validate jti, rotate refresh token
  app.post('/refresh', async (req, reply) => {
    const token = req.cookies?.refreshToken
    if (!token) return reply.status(401).send({ error: 'No refresh token' })

    try {
      const decoded = app.jwt.verify<{ sub: string; email: string; plan: string; jti?: string }>(token)

      // Validate jti against Redis (token replay protection)
      if (app.redis) {
        if (!decoded.jti) return reply.status(401).send({ error: 'Invalid refresh token' })
        const exists = await app.redis.get(`refresh:jti:${decoded.jti}`)
        if (!exists) return reply.status(401).send({ error: 'Token revoked' })
        await app.redis.del(`refresh:jti:${decoded.jti}`)
      }

      const { accessToken, refreshToken } = await issueTokens(app, {
        sub: decoded.sub,
        email: decoded.email,
        plan: decoded.plan,
      })

      reply
        .setCookie('refreshToken', refreshToken, COOKIE_OPTS)
        .send({ accessToken })
    } catch {
      reply.status(401).send({ error: 'Invalid refresh token' })
    }
  })

  // POST /auth/logout
  app.post('/logout', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    // Revoke the refresh token jti from Redis
    const token = req.cookies?.refreshToken
    if (token && app.redis) {
      try {
        const decoded = app.jwt.verify<{ jti?: string }>(token)
        if (decoded.jti) await app.redis.del(`refresh:jti:${decoded.jti}`)
      } catch {
        // token may already be expired — that's fine
      }
    }
    reply
      .clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none', path: '/auth/refresh' })
      .send({ ok: true })
  })

  // GET /auth/google/callback — handled by @fastify/oauth2 if configured
  // POST /auth/oauth — unified OAuth token exchange
  app.post('/oauth', async (req, reply) => {
    const { provider, accessToken: oauthToken } = req.body as {
      provider: 'google' | 'microsoft'
      accessToken: string
    }

    // Fetch user info from provider
    const userInfoUrl = provider === 'google'
      ? 'https://www.googleapis.com/oauth2/v3/userinfo'
      : 'https://graph.microsoft.com/v1.0/me'

    const res = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${oauthToken}` },
    })
    if (!res.ok) return reply.status(401).send({ error: 'Invalid OAuth token' })

    const info = await res.json() as {
      sub?: string
      id?: string
      email?: string
      mail?: string
      name?: string
      picture?: string
    }

    const email = info.email ?? info.mail
    const providerId = info.sub ?? info.id

    if (!email || !providerId) {
      return reply.status(400).send({ error: 'Could not extract user info from provider' })
    }

    const user = await findOrCreateOAuthUser({
      email,
      provider,
      providerId,
      name: info.name,
      avatarUrl: info.picture,
    })

    const { accessToken: appAccessToken, refreshToken } = await issueTokens(app, buildTokenPayload(user))

    reply
      .setCookie('refreshToken', refreshToken, COOKIE_OPTS)
      .send({
        accessToken: appAccessToken,
        user: { id: user.id, email: user.email, plan: user.plan },
      })
  })
}
