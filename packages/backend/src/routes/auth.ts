import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  registerUser,
  loginUser,
  findOrCreateOAuthUser,
  buildTokenPayload,
} from '../services/authService.js'

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

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/register', async (req, reply) => {
    let body: z.infer<typeof RegisterBody>
    try {
      body = RegisterBody.parse(req.body)
    } catch {
      return reply.status(400).send({ error: 'Invalid input' })
    }
    try {
      const user = await registerUser(body.email, body.password, body.name)
      const payload = buildTokenPayload(user)
      const accessToken = app.jwt.sign(payload, { expiresIn: ACCESS_TTL })
      const refreshToken = app.jwt.sign(payload, { expiresIn: REFRESH_TTL })
      reply
        .setCookie('refreshToken', refreshToken, {
          httpOnly: true, secure: true, sameSite: 'strict', path: '/auth/refresh',
        })
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
      const payload = buildTokenPayload(user)
      const accessToken = app.jwt.sign(payload, { expiresIn: ACCESS_TTL })
      const refreshToken = app.jwt.sign(payload, { expiresIn: REFRESH_TTL })
      reply
        .setCookie('refreshToken', refreshToken, {
          httpOnly: true, secure: true, sameSite: 'strict', path: '/auth/refresh',
        })
        .send({ accessToken, user: { id: user.id, email: user.email, plan: user.plan } })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg === 'INVALID_CREDENTIALS') return reply.status(401).send({ error: 'INVALID_CREDENTIALS' })
      throw e
    }
  })

  // POST /auth/refresh
  app.post('/refresh', async (req, reply) => {
    const token = req.cookies?.refreshToken
    if (!token) return reply.status(401).send({ error: 'No refresh token' })

    try {
      const payload = app.jwt.verify<{ sub: string; email: string; plan: string }>(token)
      const accessToken = app.jwt.sign(
        { sub: payload.sub, email: payload.email, plan: payload.plan },
        { expiresIn: ACCESS_TTL },
      )
      reply.send({ accessToken })
    } catch {
      reply.status(401).send({ error: 'Invalid refresh token' })
    }
  })

  // POST /auth/logout
  app.post('/logout', {
    preHandler: [app.authenticate],
  }, async (_req, reply) => {
    reply
      .clearCookie('refreshToken', { path: '/auth/refresh' })
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

    const payload = buildTokenPayload(user)
    const appAccessToken = app.jwt.sign(payload, { expiresIn: ACCESS_TTL })
    const refreshToken = app.jwt.sign(payload, { expiresIn: REFRESH_TTL })

    reply
      .setCookie('refreshToken', refreshToken, {
        httpOnly: true, secure: true, sameSite: 'strict', path: '/auth/refresh',
      })
      .send({
        accessToken: appAccessToken,
        user: { id: user.id, email: user.email, plan: user.plan },
      })
  })
}
