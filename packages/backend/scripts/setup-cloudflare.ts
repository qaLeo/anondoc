#!/usr/bin/env tsx
/**
 * setup-cloudflare.ts
 * Автоматическая настройка Cloudflare для anondoc.app
 *
 * Использование:
 *   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_EMAIL=yyy npx tsx scripts/setup-cloudflare.ts
 *
 * Создать токен: https://dash.cloudflare.com/profile/api-tokens
 *   → Create Token → Edit zone DNS (All zones) → Create Token
 */

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const EMAIL     = process.env.CLOUDFLARE_EMAIL
const DOMAIN    = 'anondoc.app'
const CF_API    = 'https://api.cloudflare.com/client/v4'

if (!API_TOKEN || !EMAIL) {
  console.error('\n✗ Нужны переменные окружения:')
  console.error('    CLOUDFLARE_API_TOKEN=...')
  console.error('    CLOUDFLARE_EMAIL=...\n')
  console.error('Создать токен: https://dash.cloudflare.com/profile/api-tokens')
  console.error('  → Create Token → Edit zone DNS → All zones → Create Token\n')
  process.exit(1)
}

// ─── Cloudflare API helper ─────────────────────────────────────────────────

interface CfResponse<T> {
  success: boolean
  errors: Array<{ code: number; message: string }>
  result: T
}

async function cfFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${CF_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'X-Auth-Email': EMAIL!,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  })
  const json = (await res.json()) as CfResponse<T>
  if (!json.success) {
    throw new Error(json.errors.map(e => `[${e.code}] ${e.message}`).join(', '))
  }
  return json.result
}

// ─── Types ────────────────────────────────────────────────────────────────

interface Zone {
  id: string
  name: string
  status: string
  name_servers: string[]
}

interface DnsRecord {
  id: string
  type: string
  name: string
  content: string
  proxied: boolean
}

// ─── DNS records to create ────────────────────────────────────────────────

const DNS_RECORDS: Array<{
  type: string
  name: string
  content: string
  proxied?: boolean
  priority?: number
}> = [
  // Vercel — apex domain (76.76.21.21 — Vercel anycast IP)
  { type: 'A',     name: '@',   content: '76.76.21.21',                         proxied: true  },
  // Vercel — www (project-specific CNAME)
  { type: 'CNAME', name: 'www', content: '0e4d048e041481e7.vercel-dns-017.com', proxied: true  },
  // Railway — API подоминен (без проксирования — Railway нужен оригинальный IP)
  { type: 'CNAME', name: 'api', content: '332l4p1b.up.railway.app',             proxied: false },
  // Email forwarding — SPF (Namecheap forwarding, сохраняем)
  { type: 'TXT',   name: '@',   content: 'v=spf1 include:spf.efwd.registrar-servers.com ~all' },
  // Email forwarding — MX (Namecheap forwarding, сохраняем)
  { type: 'MX',    name: '@',   content: 'eforward1.registrar-servers.com', priority: 10 },
  { type: 'MX',    name: '@',   content: 'eforward2.registrar-servers.com', priority: 10 },
  { type: 'MX',    name: '@',   content: 'eforward3.registrar-servers.com', priority: 10 },
  { type: 'MX',    name: '@',   content: 'eforward4.registrar-servers.com', priority: 15 },
  { type: 'MX',    name: '@',   content: 'eforward5.registrar-servers.com', priority: 20 },
]

// ─── Zone settings ────────────────────────────────────────────────────────

const ZONE_SETTINGS: Array<{ id: string; value: unknown; label: string }> = [
  { id: 'ssl',               value: 'full',   label: 'SSL = Full'            },
  { id: 'always_use_https',  value: 'on',     label: 'Always HTTPS = on'     },
  { id: 'min_tls_version',   value: '1.2',    label: 'Min TLS = 1.2'         },
  { id: 'brotli',            value: 'on',     label: 'Brotli = on'           },
  { id: 'browser_cache_ttl', value: 14400,    label: 'Browser cache TTL = 4h' },
  { id: 'security_level',    value: 'medium', label: 'Security level = medium'},
  { id: 'email_obfuscation', value: 'on',     label: 'Email obfuscation = on' },
  { id: 'rocket_loader',     value: 'off',    label: 'Rocket Loader = off'   }, // отключаем — ломает React
]

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`🌐  Настройка Cloudflare для ${DOMAIN}`)
  console.log(`${'─'.repeat(60)}\n`)

  // ── Шаг 1: Добавить зону ──────────────────────────────────────────────
  console.log('1/4  Добавляем домен в Cloudflare...')
  let zone: Zone

  try {
    zone = await cfFetch<Zone>('/zones', {
      method: 'POST',
      body: JSON.stringify({ name: DOMAIN, jump_start: false }),
    })
    console.log(`     ✓ Зона создана  (id: ${zone.id})`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!msg.includes('already exists')) throw err
    // Зона уже добавлена — найдём по имени
    const zones = await cfFetch<Zone[]>(`/zones?name=${DOMAIN}`)
    if (!zones.length) throw new Error(`Зона ${DOMAIN} не найдена в аккаунте`)
    zone = zones[0]
    console.log(`     ↩ Зона уже существует  (id: ${zone.id})`)
  }

  const zoneId = zone.id

  // ── Шаг 2: DNS записи ────────────────────────────────────────────────
  console.log('\n2/4  Настраиваем DNS записи...')

  // Получим существующие записи чтобы не дублировать
  const existing = await cfFetch<DnsRecord[]>(`/zones/${zoneId}/dns_records?per_page=100`)
  const existingKeys = new Set(
    existing.map(r => `${r.type}:${r.name}:${r.content}`.toLowerCase())
  )

  for (const rec of DNS_RECORDS) {
    const fqdn = rec.name === '@' ? DOMAIN : `${rec.name}.${DOMAIN}`
    const key  = `${rec.type}:${fqdn}:${rec.content}`.toLowerCase()

    if (existingKeys.has(key)) {
      console.log(`     ↩  ${rec.type.padEnd(5)} ${rec.name.padEnd(5)} (уже есть)`)
      continue
    }

    const body: Record<string, unknown> = {
      type:    rec.type,
      name:    rec.name,
      content: rec.content,
      ttl:     1, // auto
    }
    if (rec.proxied !== undefined) body.proxied  = rec.proxied
    if (rec.priority !== undefined) body.priority = rec.priority

    await cfFetch<DnsRecord>(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    const proxy = rec.proxied === true ? ' 🟠 proxied' : rec.proxied === false ? ' ☁  dns-only' : ''
    const pri   = rec.priority != null ? ` pri=${rec.priority}` : ''
    console.log(`     ✓  ${rec.type.padEnd(5)} ${rec.name.padEnd(5)}${proxy}${pri}`)
  }

  // ── Шаг 3: Настройки зоны ────────────────────────────────────────────
  console.log('\n3/4  Настраиваем SSL, кэш, безопасность...')

  for (const s of ZONE_SETTINGS) {
    try {
      await cfFetch(`/zones/${zoneId}/settings/${s.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ value: s.value }),
      })
      console.log(`     ✓  ${s.label}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`     ⚠  ${s.label} — ${msg}`)
    }
  }

  // Auto Minify — отдельный endpoint
  try {
    await cfFetch(`/zones/${zoneId}/settings/minify`, {
      method: 'PATCH',
      body: JSON.stringify({ value: { css: 'on', html: 'on', js: 'on' } }),
    })
    console.log(`     ✓  Auto Minify = JS + CSS + HTML`)
  } catch {
    console.log(`     ⚠  Auto Minify — пропущено`)
  }

  // ── Шаг 4: Получить NS серверы ────────────────────────────────────────
  const freshZone = await cfFetch<Zone>(`/zones/${zoneId}`)
  const [ns1, ns2] = freshZone.name_servers

  // ── Итог ──────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`✅  Cloudflare полностью настроен!\n`)
  console.log(`Осталось одно ручное действие — сменить NS в Namecheap.`)
  console.log(`Это занимает 2 минуты:\n`)
  console.log(`  1. namecheap.com → Domain List → anondoc.app → Manage`)
  console.log(`  2. Вкладка Domain → Nameservers → Custom DNS`)
  console.log(`  3. Вставить:\n`)
  console.log(`        ${ns1}`)
  console.log(`        ${ns2}\n`)
  console.log(`  4. Нажать ✓ → Confirm`)
  console.log(`\nПосле этого DNS обновится за 5–30 минут.`)
  console.log(`Статус: https://dash.cloudflare.com/zones/${zoneId}`)
  console.log(`\nПроверить доступность из РФ:`)
  console.log(`  curl -I --resolve "anondoc.app:443:104.21.0.1" https://anondoc.app`)
  console.log(`${'═'.repeat(60)}\n`)
}

main().catch(err => {
  console.error('\n✗', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
