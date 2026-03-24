import { buildApp } from './app.js'
import { scheduleUsageCleanup } from './jobs/usageCleanup.js'

const app = await buildApp()

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`AnonDoc backend running at http://${host}:${port}`)
  scheduleUsageCleanup(app.prisma, app.log)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
